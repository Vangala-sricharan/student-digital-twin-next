import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateAuditReportPDF } from '../../lib/pdfExportService';
import {
  Code2,
  ShieldAlert,
  CheckCircle2,
  FolderGit2,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  FileCode,
  Layers,
  Award,
} from 'lucide-react';

interface ProjectAuditorViewProps {
  onBackToHub?: () => void;
}

export const ProjectAuditorView: React.FC<ProjectAuditorViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'project-auditor')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('project-auditor');

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'all');
  const [customDetails, setCustomDetails] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const handleRunAudit = async () => {
    if (!profile || isRunning) return;

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    await execute({
      engineId: 'project-auditor',
      studentContext,
      userInputs: {
        projectTitle: selectedProject ? selectedProject.title : 'All Student Twin Projects',
        projectDetails: selectedProject
          ? `Stack: ${selectedProject.techStack.join(', ')}. Description: ${selectedProject.description}. AST Depth: ${selectedProject.astDepth || 'Standard'}. ${customDetails}`
          : customDetails,
      },
    });
  };

  const auditData = job?.result?.data || structuredData;
  const projectTitle = selectedProject ? selectedProject.title : 'Full-Stack Distributed System Architecture';
  const overallScore = auditData?.overallScore ?? (selectedProject?.astDepth ? 88 : 84);
  const evaluation = auditData?.verdict ?? (overallScore >= 85 ? 'Production Caliber & AST Verified' : 'Solid Architecture with Optimization Needs');

  const breakdown = auditData?.breakdown ?? [
    { label: 'Technical Depth & Algorithmic Complexity', score: 22, max: 25 },
    { label: 'Architectural Modularity & State Isolation', score: 23, max: 25 },
    { label: 'Code Quality & Clean Architecture Principles', score: 17, max: 20 },
    { label: 'Documentation, API Specs & README Clarity', score: 13, max: 15 },
    { label: 'Automated Testing & Verifiable Proof of Work', score: 13, max: 15 },
  ];

  const strengths = auditData?.strengths ?? [
    `Strong separation of concerns utilizing ${selectedProject?.techStack.join(', ') || 'TypeScript, React, Node.js and PostgreSQL'}.`,
    'AST-verified codebase depth with concrete component tree modularity and type safety.',
    'Effective API route organization with sanitized input processing and defensive edge guards.',
  ];

  const gaps = auditData?.gaps ?? [
    'Unit and integration test suites can be expanded to achieve >80% branch coverage across state mutations.',
    'Missing comprehensive OpenAPI / Swagger specification documentation in the root repository.',
    'CI/CD pipeline configuration (GitHub Actions lint & build matrix) should be explicitly defined.',
  ];

  const recommendations = auditData?.recommendations ?? [
    {
      priority: 1,
      title: 'Introduce Automated Integration Tests',
      desc: 'Add Vitest or Playwright end-to-end regression tests to provide verifiable test coverage metrics to recruiters.',
    },
    {
      priority: 2,
      title: 'Publish Interactive Demo & Live Metrics',
      desc: 'Deploy on Cloud Run or Vercel with a public health-check endpoint showing real-time latency telemetry.',
    },
    {
      priority: 3,
      title: 'Standardize Architecture Documentation',
      desc: 'Include a Mermaid.js sequence diagram in the README illustrating backend dataflow and auth tokens.',
    },
  ];

  const handleCopy = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      await generateAuditReportPDF({
        type: 'Project Audit',
        title: `Project Audit: ${projectTitle}`,
        candidateName: profile?.fullName || profile?.name || 'Student Candidate',
        score: overallScore,
        maxScore: 100,
        evaluation,
        breakdown,
        strengths,
        gaps,
        recommendations: recommendations.map((r) => `${r.title}: ${r.desc}`),
      }, `${projectTitle.replace(/\s+/g, '_')}_Audit_Report.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={handleRunAudit}
      resultText={rawText || undefined}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Project Selection & Audit Inputs (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Select Codebase to Audit</span>
            </h3>

            {/* Project Picker */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Verified Repositories ({projects.length})
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedProjectId('all')}
                  className={`w-full p-2.5 rounded-xl text-xs text-left transition-all cursor-pointer ${
                    selectedProjectId === 'all'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                  }`}
                >
                  Audit Complete Repository Index
                </button>

                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`w-full p-2.5 rounded-xl text-xs text-left transition-all space-y-1 cursor-pointer ${
                      selectedProjectId === p.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold truncate">{p.title}</div>
                    <div className="text-[10px] font-mono opacity-80 truncate">
                      {p.techStack.join(', ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Specific Modules or Architecture Notes
              </label>
              <textarea
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="e.g. Focus on database query performance, auth middleware security, and modularity..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              onClick={handleRunAudit}
              disabled={isRunning}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Code2 className="w-4 h-4" />
              <span>{isRunning ? 'Auditing Codebase...' : 'Run Deep Codebase Audit'}</span>
            </button>
          </div>

        </div>

        {/* Audit Results Presentation (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Universal Step-Based Processing Card */}
          {(isRunning || isError) && (
            <AIProcessingCard
              job={job}
              engineName={engine.name}
              onRetry={retry}
            />
          )}

          {/* Top Scorecard & Verdict */}
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6 transition-colors">
            
            {/* Header with Project Identity & Score */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                    AST CODEBASE AUDIT
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedProject ? selectedProject.astDepth || 'Deep Scan' : 'Multi-Repo Scan'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {projectTitle}
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

              {/* Score Display */}
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-3.5 rounded-2xl border border-slate-200 dark:border-white/5 shrink-0">
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-blue-600 dark:text-cyan-400">
                    {overallScore}<span className="text-sm text-slate-400 font-normal">/100</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                    {evaluation}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Score Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Codebase Quality & Architectural Breakdown</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {breakdown.map((cat, idx) => (
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
                        className="h-full bg-blue-600 dark:bg-cyan-400 rounded-full"
                        style={{ width: `${(cat.score / cat.max) * 100}%` }}
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
                  {strengths.map((str: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Codebase Gaps */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                <h4 className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Identified Deficiencies & Gaps</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {gaps.map((gap: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Prioritized Upgrades */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                <span>High-Impact Engineering Recommendations</span>
              </h3>
              <div className="space-y-2.5">
                {recommendations.map((rec: any, idx: number) => (
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
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
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

      </div>
    </EngineLayout>
  );
};
