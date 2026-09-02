import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateAuditReportPDF } from '../../lib/pdfExportService';
import {
  Briefcase,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Award,
  Layers,
  Zap,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface InternshipReadyViewProps {
  onBackToHub?: () => void;
}

export const InternshipReadyView: React.FC<InternshipReadyViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'internship-ready')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('internship-ready');

  const [targetDomain, setTargetDomain] = useState(profile?.targetRole || 'Tier-1 Software Engineering Internship');
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleRunDiagnostic = async () => {
    if (!profile || isRunning) return;

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    await execute({
      engineId: 'internship-ready',
      studentContext,
      userInputs: {
        targetRole: targetDomain,
      },
    });
  };

  const diagnosticData = job?.result?.data || structuredData;
  const candidateName = profile?.fullName || profile?.name || 'Student Candidate';
  const readinessScore = diagnosticData?.readinessScore ?? profile?.readinessScore ?? 84;
  const verdict = diagnosticData?.verdict ?? (readinessScore >= 80 ? 'Competitive for Tier-1 Internships' : 'Approaching Readiness with Minor Gaps');

  const pillars = diagnosticData?.breakdown ?? [
    { label: 'Resume & ATS Compliance', score: 17, max: 20 },
    { label: 'Project Portfolio Depth & Code Verification', score: 22, max: 25 },
    { label: 'GitHub Activity & Proof of Work', score: 16, max: 20 },
    { label: 'LinkedIn & Recruiter Discoverability', score: 12, max: 15 },
    { label: 'Core Computer Science & DSA Foundation', score: 17, max: 20 },
  ];

  const readySignals = diagnosticData?.strengths ?? [
    `Strong technical foundation in ${skills.slice(0, 3).map((s) => s.name).join(', ')} with verified projects.`,
    'Active GitHub repository presence with clear modular project structure and clean commit history.',
    'Clear academic standing with verified coursework and graduation timeline.',
  ];

  const blockers = diagnosticData?.gaps ?? [
    'System design / low-level design artifacts are under-documented in top repositories.',
    'Lack of live deployment links with verifiable status badges on 2 key projects.',
    'LinkedIn profile search discoverability needs keyword density tuning.',
  ];

  const sprintActions = diagnosticData?.recommendations ?? [
    { priority: 1, action: 'Deploy live demo of flagship full-stack project on Cloud Run / Vercel with a public link.' },
    { priority: 2, action: 'Add 15 high-frequency LeetCode Medium problem solutions to a public DSA portfolio repo.' },
    { priority: 3, action: 'Update LinkedIn headline using the calibrated AI-optimized headline variants.' },
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
        type: 'Internship Readiness Diagnostic',
        title: `Internship Readiness Report: ${targetDomain}`,
        candidateName,
        score: readinessScore,
        maxScore: 100,
        evaluation: verdict,
        breakdown: pillars,
        strengths: readySignals,
        gaps: blockers,
        recommendations: sprintActions.map((s: any) => s.action),
      }, `${candidateName.replace(/\s+/g, '_')}_Internship_Readiness_Report.pdf`);
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
      onRunEngine={handleRunDiagnostic}
      resultText={rawText || undefined}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Diagnostic Parameters (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Internship Benchmark Targets</span>
            </h3>

            {/* Target Domain Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Internship Target Specification
              </label>
              <input
                type="text"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                placeholder="e.g. Tier-1 Product Company SDE Intern"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Baseline Preview */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">Twin Readiness</span>
                <strong className="text-blue-600 dark:text-cyan-400">{readinessScore}%</strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">Verified Skills</span>
                <strong className="text-slate-900 dark:text-white">{skills.length} Skills</strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">Codebase Proof</span>
                <strong className="text-slate-900 dark:text-white">{projects.length} Repositories</strong>
              </div>
            </div>

            <button
              onClick={handleRunDiagnostic}
              disabled={isRunning}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRunning ? 'Analyzing Twin Credentials...' : 'Run Internship Diagnostic'}</span>
            </button>
          </div>

        </div>

        {/* Diagnostic Results Presentation (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Universal Step-Based Processing Card */}
          {(isRunning || isError) && (
            <AIProcessingCard
              job={job}
              engineName={engine.name}
              onRetry={retry}
            />
          )}

          {/* Top Scorecard Card */}
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6 transition-colors">
            
            {/* Header & Score */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                    INTERNSHIP READINESS DIAGNOSTIC
                  </span>
                  <span className="text-xs font-mono text-slate-400">Target: Tier-1 SDE</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {candidateName}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target Domain: <strong className="text-slate-800 dark:text-slate-200">{targetDomain}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-3.5 rounded-2xl border border-slate-200 dark:border-white/5 shrink-0">
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-blue-600 dark:text-cyan-400">
                    {readinessScore}<span className="text-sm text-slate-400 font-normal">/100</span>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                    {verdict}
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Pillar Scorecard Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>5-Pillar Benchmark Analysis</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pillars.map((pil, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{pil.label}</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">
                        {pil.score}/{pil.max}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-cyan-400 rounded-full"
                        style={{ width: `${(pil.score / pil.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ready Signals & Blockers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                <h4 className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Strengths & Ready Signals</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {readySignals.map((sig: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                <h4 className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Critical Blockers & Evidence Gaps</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {blockers.map((blk: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{blk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 14-Day Sprint Actions */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-blue-500" />
                <span>Immediate 14-Day Action Checklist</span>
              </h3>
              <div className="space-y-2.5">
                {sprintActions.map((actionItem: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {actionItem.priority || idx + 1}
                    </span>
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {actionItem.action || actionItem}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Diagnostic'}</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportingPdf}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingPdf ? 'Exporting...' : 'Download Report PDF'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </EngineLayout>
  );
};
