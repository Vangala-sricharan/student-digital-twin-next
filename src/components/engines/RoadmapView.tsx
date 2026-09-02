import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateRoadmapPDF } from '../../lib/pdfExportService';
import {
  Milestone,
  CheckCircle2,
  Sliders,
  Calendar,
  Sparkles,
  Download,
  Copy,
  Check,
  Target,
  Clock,
  ArrowRight,
  Flame,
  Layers,
  Award,
} from 'lucide-react';

interface RoadmapViewProps {
  onBackToHub?: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'roadmap-30-60-90')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('roadmap-30-60-90');

  const [targetRole, setTargetRole] = useState(profile?.targetRole || 'Software Development Engineer');
  const [weeklyCommitment, setWeeklyCommitment] = useState<'15h' | '25h' | '40h'>('25h');
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleGenerateRoadmap = async () => {
    if (!profile || isRunning) return;

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    await execute({
      engineId: 'roadmap-30-60-90',
      studentContext,
      userInputs: {
        targetRole,
        weeklyCommitment: weeklyCommitment === '15h' ? '15 Hours/Week (Part-Time Academic Sprint)' : weeklyCommitment === '25h' ? '25 Hours/Week (Intensive Career Acceleration)' : '40 Hours/Week (Full-Time Placement Blitz)',
      },
    });
  };

  const roadmapData = job?.result?.data || structuredData;
  const candidateName = profile?.fullName || profile?.name || 'Student Candidate';

  const defaultPhases = [
    {
      phase: 'Days 1–30',
      theme: 'Core Competency & Algorithmic Foundations',
      focus: 'Data Structures, Core Systems, Clean Architecture & Git Discipline',
      milestones: [
        'Master 50+ Top Tier LeetCode patterns (Sliding Window, Two Pointers, Trees, Graphs, DP)',
        'Refactor existing repositories with strict TypeScript types and comprehensive modular tests',
        'Audit and benchmark database query performance on existing portfolio project',
      ],
      deliverables: [
        '50+ Verified DSA Submissions on LeetCode / CodeForces',
        'Clean, modular, and documented GitHub repository with CI/CD passing',
      ],
    },
    {
      phase: 'Days 31–60',
      theme: 'Systems Architecture & Production Proof of Work',
      focus: 'Distributed Systems, High-Throughput APIs, Caching & Cloud Infrastructure',
      milestones: [
        'Architect a high-concurrency microservice utilizing Redis caching and PostgreSQL indexes',
        'Implement rate limiting, JWT/OAuth2 authentication, and Docker containerization',
        'Deploy production system to Cloud Run / Kubernetes with health telemetry and logging',
      ],
      deliverables: [
        'Live deployed production service with verified latency benchmark graphs',
        'Technical architecture whitepaper and OpenAPI 3.0 specification in repo',
      ],
    },
    {
      phase: 'Days 61–90',
      theme: 'Technical Interview Mastery & Placement Blitz',
      focus: 'Mock System Design, Behavioral STAR Stories & Targeted Applications',
      milestones: [
        'Complete 15+ Live Mock Interviews (DSA + LLD/HLD Systems Architecture)',
        'Calibrate ATS Resume and LinkedIn Profile with quantifiable metrics and STAR bullets',
        'Execute targeted outreach and referral applications to 40+ Tier-1 tech companies',
      ],
      deliverables: [
        'Verified 90%+ ATS Score on target job descriptions',
        'Scheduled interview pipeline with leading product engineering firms',
      ],
    },
  ];

  const phases = roadmapData?.phases || defaultPhases;

  const handleCopy = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      await generateRoadmapPDF({
        targetRole,
        candidateName,
        timeline: '90-Day Placement & Career Sprint',
        phases: phases.map((p: any) => ({
          phase: p.phase,
          theme: p.theme,
          focus: p.focus,
          milestones: p.milestones,
          deliverables: p.deliverables,
        })),
      }, `${candidateName.replace(/\s+/g, '_')}_30_60_90_Roadmap.pdf`);
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
      onRunEngine={handleGenerateRoadmap}
      resultText={rawText || undefined}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sprint Configuration (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Milestone className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Sprint Horizons Config</span>
            </h3>

            {/* Target Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Placement Target
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Distributed Systems Engineer"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Commitment */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Weekly Time Commitment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '15h', label: '15h / wk' },
                  { id: '25h', label: '25h / wk' },
                  { id: '40h', label: '40h / wk' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setWeeklyCommitment(c.id as any)}
                    className={`py-2 text-center rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                      weeklyCommitment === c.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Roadmap Highlights */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <strong className="font-mono text-[10px] uppercase block">Days 1–30</strong>
                <span>Core Competency & Algorithmic Foundations</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                <strong className="font-mono text-[10px] uppercase block">Days 31–60</strong>
                <span>Systems Architecture & Production Projects</span>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300">
                <strong className="font-mono text-[10px] uppercase block">Days 61–90</strong>
                <span>Technical Interview Mastery & Placement Blitz</span>
              </div>
            </div>

            <button
              onClick={handleGenerateRoadmap}
              disabled={isRunning}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRunning ? 'Calculating Sprint...' : 'Generate 90-Day Plan'}</span>
            </button>
          </div>

        </div>

        {/* Structured Roadmap Timeline (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Universal Step-Based Processing Card */}
          {(isRunning || isError) && (
            <AIProcessingCard
              job={job}
              engineName={engine.name}
              onRetry={retry}
            />
          )}

          {/* Top Roadmap Header Card */}
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                    CALIBRATED SPRINT ROADMAP
                  </span>
                  <span className="text-xs font-mono text-slate-400">{weeklyCommitment} commitment</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  90-Day Accelerated Placement Plan
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tailored specifically for <strong className="text-slate-800 dark:text-slate-200">{targetRole}</strong> targeting Tier-1 tech standards.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Plan'}</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingPdf ? 'Exporting...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>

            {/* 3 Horizon Phase Cards */}
            <div className="space-y-4">
              {phases.map((phase: any, pIdx: number) => {
                const isFirst = pIdx === 0;
                const isSecond = pIdx === 1;
                const badgeColor = isFirst ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : isSecond ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';

                return (
                  <div
                    key={pIdx}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${badgeColor}`}>
                          {phase.phase}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {phase.theme}
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {phase.focus}
                      </span>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-blue-500" />
                        <span>Key Weekly Milestones</span>
                      </h4>
                      <ul className="space-y-1.5 pl-2 text-xs text-slate-700 dark:text-slate-300">
                        {phase.milestones.map((m: string, mIdx: number) => (
                          <li key={mIdx} className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold shrink-0">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Deliverables / Proof of Work */}
                    {phase.deliverables && (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 space-y-1.5">
                        <h4 className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          <span>Verifiable Proof of Work Deliverables</span>
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                          {phase.deliverables.map((del: string, dIdx: number) => (
                            <li key={dIdx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{del}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </EngineLayout>
  );
};
