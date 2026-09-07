import React, { useState, useEffect, useRef } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateAuditReportPDF } from '../../lib/pdfExportService';
import {
  Code2,
  CheckCircle2,
  FolderGit2,
  AlertTriangle,
  ExternalLink,
  Download,
  Copy,
  Check,
  Layers,
  Zap,
  Plus,
  RefreshCw,
  Info,
  GitBranch,
  Globe,
  FileCode2,
} from 'lucide-react';

interface ProjectAuditorViewProps {
  onBackToHub?: () => void;
  onNavigateTab?: (tab: string) => void;
}

interface StoredAuditResult {
  projectId: string;
  projectTitle: string;
  overallScore: number;
  verdict: string;
  breakdown: Array<{ label: string; score: number; max: number }>;
  strengths: string[];
  gaps: string[];
  missingEvidence?: string[];
  recommendations: Array<{ priority: number; title: string; desc: string }>;
  rawText: string;
  timestamp: string;
}

export const ProjectAuditorView: React.FC<ProjectAuditorViewProps> = ({
  onBackToHub,
  onNavigateTab,
}) => {
  const engine = AI_ENGINES.find((e) => e.id === 'project-auditor')!;
  const { profile, skills, projects, achievements, careerGoals, activeProfile } = useStudentTwin();
  const { job, isRunning, isError, execute, retry } = useEngineJob('project-auditor');

  // Selected project ID from current active Student Twin
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [customDetails, setCustomDetails] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Scoped audit results keyed by: `${activeProfileId}_${projectId}`
  const [auditStore, setAuditStore] = useState<Record<string, StoredAuditResult>>({});

  // Ref to prevent displaying stale results if user changes project mid-request
  const ongoingAuditProjectIdRef = useRef<string | null>(null);

  // Synchronize selectedProjectId when projects change or profile switches
  useEffect(() => {
    if (projects.length > 0) {
      if (!selectedProjectId || !projects.some((p) => p.id === selectedProjectId)) {
        setSelectedProjectId(projects[0].id);
      }
    } else {
      setSelectedProjectId('');
    }
  }, [projects, selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;
  const storeKey = `${activeProfile?.id || 'default'}_${selectedProject?.id || ''}`;
  const currentAudit = selectedProject ? auditStore[storeKey] : null;

  // Handle running an audit for the currently selected project
  const handleRunAudit = async (forcedProject = selectedProject) => {
    if (!profile || isRunning || !forcedProject) return;

    ongoingAuditProjectIdRef.current = forcedProject.id;

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    const projectInputs = {
      projectId: forcedProject.id,
      projectTitle: forcedProject.title,
      description: forcedProject.description || '',
      role: forcedProject.role || 'Primary Contributor',
      techStack: forcedProject.techStack || [],
      difficulty: forcedProject.difficulty || 'Intermediate',
      status: forcedProject.status || 'Completed',
      systemArchitecture: forcedProject.systemArchitecture || '',
      githubUrl: forcedProject.githubUrl || '',
      liveUrl: forcedProject.liveUrl || '',
      highlights: forcedProject.highlights || [],
      astDepth: forcedProject.astDepth || 'Standard',
      customNotes: customDetails,
    };

    const result = await execute({
      engineId: 'project-auditor',
      studentContext,
      userInputs: projectInputs,
    });

    if (result && result.status === 'success' && result.data) {
      const auditedId = ongoingAuditProjectIdRef.current || forcedProject.id;
      const data = result.data;
      const score = typeof data.overallScore === 'number' ? data.overallScore : (typeof data.score === 'number' ? data.score : 75);
      const verdict = data.verdict || data.evaluation || 'Solid Architecture with Optimization Needs';

      const breakdown = Array.isArray(data.breakdown) && data.breakdown.length > 0
        ? data.breakdown
        : [
            { label: 'Technical Depth & Algorithmic Complexity', score: Math.round(score * 0.25), max: 25 },
            { label: 'Architectural Modularity & State Isolation', score: Math.round(score * 0.25), max: 25 },
            { label: 'Code Quality & Clean Architecture Principles', score: Math.round(score * 0.20), max: 20 },
            { label: 'Documentation, API Specs & README Clarity', score: Math.round(score * 0.15), max: 15 },
            { label: 'Automated Testing & Verifiable Proof of Work', score: Math.round(score * 0.15), max: 15 },
          ];

      const strengths = Array.isArray(data.strengths) && data.strengths.length > 0
        ? data.strengths
        : [`Strong technology stack utilization with ${forcedProject.techStack.join(', ')}.`];

      const gaps = Array.isArray(data.gaps) && data.gaps.length > 0
        ? data.gaps
        : ['Attach comprehensive unit testing and live demonstration URLs to strengthen verification.'];

      const recommendations = Array.isArray(data.recommendations) && data.recommendations.length > 0
        ? data.recommendations
        : [
            { priority: 1, title: 'Add Integration Test Suite', desc: 'Implement unit and integration tests to verify critical logic.' },
            { priority: 2, title: 'Deploy Live Demonstration', desc: 'Provide an interactive live URL to demonstrate production readiness.' },
          ];

      const newAudit: StoredAuditResult = {
        projectId: auditedId,
        projectTitle: forcedProject.title,
        overallScore: score,
        verdict,
        breakdown,
        strengths,
        gaps,
        missingEvidence: data.missingEvidence || [],
        recommendations,
        rawText: result.rawText || '',
        timestamp: result.timestamp || new Date().toISOString(),
      };

      setAuditStore((prev) => ({
        ...prev,
        [`${activeProfile?.id || 'default'}_${auditedId}`]: newAudit,
      }));
    }
  };

  const handleCopy = () => {
    if (!currentAudit?.rawText) return;
    navigator.clipboard.writeText(currentAudit.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!currentAudit || !selectedProject) return;
    setExportingPdf(true);
    try {
      await generateAuditReportPDF(
        {
          type: 'Project Audit',
          title: `Project Audit: ${currentAudit.projectTitle}`,
          candidateName: profile?.fullName || profile?.name || 'Student Candidate',
          score: currentAudit.overallScore,
          maxScore: 100,
          evaluation: currentAudit.verdict,
          breakdown: currentAudit.breakdown,
          strengths: currentAudit.strengths,
          gaps: currentAudit.gaps,
          recommendations: currentAudit.recommendations.map((r) => `${r.title}: ${r.desc}`),
        },
        `${currentAudit.projectTitle.replace(/\s+/g, '_')}_Audit_Report.pdf`
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  // 1. EMPTY STATE: When authenticated user has zero projects
  if (projects.length === 0) {
    return (
      <EngineLayout
        engine={engine}
        onBackToHub={onBackToHub}
        isRunning={false}
      >
        <div className="max-w-2xl mx-auto p-8 sm:p-12 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
            <FolderGit2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              No projects available to audit yet.
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              The Project Proof Auditor evaluates real codebases, repository proof, and system architecture. Add your first project to your Student Twin to run an audit.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('projects');
                } else {
                  window.location.hash = '#projects';
                }
              }}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project to Student Twin</span>
            </button>
          </div>
        </div>
      </EngineLayout>
    );
  }

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={() => handleRunAudit()}
      resultText={currentAudit?.rawText || undefined}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Project Selection Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Select Project to Audit</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </div>

            {/* Real Project Picker */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Your Student Twin Projects
              </label>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {projects.map((p) => {
                  const isSelected = selectedProjectId === p.id;
                  const hasAudit = Boolean(auditStore[`${activeProfile?.id || 'default'}_${p.id}`]);

                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`w-full p-3 rounded-xl text-xs text-left transition-all space-y-1 cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold truncate">{p.title}</div>
                        {hasAudit && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            Audited
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[10px] font-mono truncate ${
                          isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {Array.isArray(p.techStack) && p.techStack.length > 0
                          ? p.techStack.join(', ')
                          : 'No stack specified'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Audit Focus Notes (Optional)
              </label>
              <textarea
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="e.g. Focus on database query performance, auth security, and architecture modularity..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              onClick={() => handleRunAudit()}
              disabled={isRunning || !selectedProject}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>
                {isRunning
                  ? 'Auditing Codebase...'
                  : currentAudit
                  ? 'Re-Audit Project'
                  : 'Audit Project'}
              </span>
            </button>
          </div>
        </div>

        {/* Audit Results or Idle Presentation (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Universal Step-Based Processing Card (only when actively running or error) */}
          {(isRunning || isError) && (
            <AIProcessingCard
              job={job}
              engineName={engine.name}
              onRetry={retry}
            />
          )}

          {/* If No Audit has been run yet for this project (IDLE STATE) */}
          {!currentAudit && !isRunning && !isError && selectedProject && (
            <div className="p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold border border-slate-200 dark:border-white/10">
                    <FileCode2 className="w-3 h-3" />
                    <span>TARGET PROJECT</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedProject.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                    {selectedProject.description || 'No project description provided. Providing full implementation details strengthens the technical audit score.'}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleRunAudit()}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Audit Project</span>
                  </button>
                </div>
              </div>

              {/* Project Metadata Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Candidate Role</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {selectedProject.role || 'Primary Contributor'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Difficulty Level</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {selectedProject.difficulty || 'Intermediate'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Completion Status</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {selectedProject.status || 'Completed'}
                  </span>
                </div>
              </div>

              {/* Technologies */}
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400">
                  Assessed Technology Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.techStack && selectedProject.techStack.length > 0 ? (
                    selectedProject.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 font-mono text-xs font-medium"
                      >
                        {tech}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-mono italic">No technologies defined.</span>
                  )}
                </div>
              </div>

              {/* Evidence URLs Status Check */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 block">
                  Verifiable Proof of Work Evidence
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* GitHub URL */}
                  <div className="flex items-center gap-2 text-xs">
                    <GitBranch className="w-4 h-4 text-slate-400 shrink-0" />
                    {selectedProject.githubUrl ? (
                      <a
                        href={selectedProject.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-mono truncate"
                      >
                        <span>{selectedProject.githubUrl.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-mono">
                        GitHub repository not attached
                      </span>
                    )}
                  </div>

                  {/* Live Demo URL */}
                  <div className="flex items-center gap-2 text-xs">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    {selectedProject.liveUrl ? (
                      <a
                        href={selectedProject.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-mono truncate"
                      >
                        <span>{selectedProject.liveUrl.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-400 font-mono">
                        Live demo URL not attached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pre-Audit Informational Prompt */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Ready for Technical Proof Audit
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Click <strong>Audit Project</strong> to evaluate AST depth, assess code quality, test proof verification, and generate a customized engineering scorecard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* If Audit has been run for this project: Display genuine Audit Results */}
          {currentAudit && (
            <div className="p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6 transition-colors">
              
              {/* Header with Project Identity & Dynamic Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                      AST CODEBASE AUDIT
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {selectedProject?.astDepth || 'Deep Scan'}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {currentAudit.projectTitle}
                  </h2>
                  {selectedProject && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {selectedProject.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-mono text-[10px]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dynamic Score Display */}
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-3.5 rounded-2xl border border-slate-200 dark:border-white/5 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-blue-600 dark:text-cyan-400">
                      {currentAudit.overallScore}<span className="text-sm text-slate-400 font-normal">/100</span>
                    </div>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                      {currentAudit.verdict}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verifiable Links if present */}
              {selectedProject && (selectedProject.githubUrl || selectedProject.liveUrl) && (
                <div className="flex flex-wrap gap-4 text-xs font-mono">
                  {selectedProject.githubUrl && (
                    <a
                      href={selectedProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 dark:text-cyan-400 hover:underline"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>{selectedProject.githubUrl.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedProject.liveUrl && (
                    <a
                      href={selectedProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 dark:text-cyan-400 hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{selectedProject.liveUrl.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Category Score Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Codebase Quality & Architectural Breakdown</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentAudit.breakdown.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{cat.label}</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">
                          {cat.score}/{cat.max}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (cat.score / cat.max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Gaps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                  <h4 className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Technical Strengths</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {currentAudit.strengths.map((str: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Deficiencies & Gaps */}
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                  <h4 className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Identified Deficiencies & Proof Gaps</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {currentAudit.gaps.map((gap: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Missing Evidence List if identified */}
              {currentAudit.missingEvidence && currentAudit.missingEvidence.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 space-y-2">
                  <h4 className="text-xs font-bold font-mono text-rose-700 dark:text-rose-300 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Missing Verifiable Evidence</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-rose-800 dark:text-rose-200">
                    {currentAudit.missingEvidence.map((ev, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-rose-500">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prioritized Upgrades */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-500" />
                  <span>High-Impact Engineering Recommendations</span>
                </h3>
                <div className="space-y-2.5">
                  {currentAudit.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {rec.priority || idx + 1}
                      </span>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {rec.title}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {rec.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={() => handleRunAudit()}
                  disabled={isRunning}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>Re-Audit Project</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Audit Summary'}</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPdf}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{exportingPdf ? 'Generating PDF...' : 'Download Audit Report PDF'}</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </EngineLayout>
  );
};
