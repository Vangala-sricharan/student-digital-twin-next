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
  ShieldCheck,
  Github,
  Linkedin,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface InternshipReadyViewProps {
  onBackToHub?: () => void;
}

export const InternshipReadyView: React.FC<InternshipReadyViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'internship-ready')!;
  const { profile, skills, projects, achievements, careerGoals, certifications, isDemoMode, isTwinHydrating } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('internship-ready');
  const { job: githubJob } = useEngineJob('github-audit');
  const { job: linkedinJob } = useEngineJob('linkedin-audit');

  const initialTargetRole =
    profile?.targetRole ||
    profile?.careerFocus ||
    careerGoals[0]?.targetRole ||
    careerGoals[0]?.title ||
    '';

  const [targetDomain, setTargetDomain] = useState(initialTargetRole || 'Tier-1 Software Engineering Internship');
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  React.useEffect(() => {
    if (initialTargetRole && (targetDomain === 'Tier-1 Software Engineering Internship' || !targetDomain)) {
      setTargetDomain(initialTargetRole);
    }
  }, [initialTargetRole]);

  // Safe string extractor to guarantee no raw object is ever rendered as a React child (React Error #31)
  const getSafeString = (item: any, defaultText = ''): string => {
    if (typeof item === 'string') return item;
    if (typeof item === 'number' || typeof item === 'boolean') return String(item);
    if (!item) return defaultText;
    if (typeof item.action === 'string') return item.action;
    if (item.title && item.desc) return `${item.title}: ${item.desc}`;
    if (typeof item.desc === 'string') return item.desc;
    if (typeof item.title === 'string') return item.title;
    if (typeof item.text === 'string') return item.text;
    if (typeof item.message === 'string') return item.message;
    return defaultText;
  };

  const handleRunDiagnostic = async () => {
    if (!profile || isRunning) return;

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0],
      certifications
    );

    await execute({
      engineId: 'internship-ready',
      studentContext,
      userInputs: {
        targetRole: targetDomain,
      },
    });
  };

  // Diagnostic data comes strictly from the active job result, or structuredData if in demo mode
  const diagnosticData = job?.result?.data || (isDemoMode ? structuredData : null);
  const candidateName = profile?.fullName || profile?.name || 'Student Candidate';

  // Determine if a real diagnostic has been completed or exists
  const hasDiagnostic = Boolean(
    !isError &&
    diagnosticData &&
    (
      typeof diagnosticData.readinessScore === 'number' ||
      typeof diagnosticData.score === 'number'
    ) &&
    Array.isArray(diagnosticData.breakdown) &&
    diagnosticData.breakdown.length > 0
  );

  // Real authenticated Twin metrics (no hardcoded fallback numbers)
  const realReadiness = typeof profile?.readinessScore === 'number' ? profile.readinessScore : 0;
  const totalSkillsCount = skills.length;
  const verifiedSkillsCount = skills.filter((s) => Boolean(s.verified)).length;
  const totalProjectsCount = projects.length;
  const liveProjectsCount = projects.filter((p) => Boolean(p.liveUrl && String(p.liveUrl).trim())).length;

  const hasAuthenticGithub = Boolean(
    profile?.githubUrl &&
    profile.githubUrl.includes('github.com') &&
    !profile.githubUrl.includes('username') &&
    profile.githubUrl.trim().length > 12
  );
  const isGithubAudited = !isDemoMode && githubJob?.status === 'completed' && githubJob.result?.data;
  const githubAuditScore = isGithubAudited
    ? (githubJob.result.data.score ?? githubJob.result.data.overallScore)
    : null;

  const githubDisplayStatus = isGithubAudited && typeof githubAuditScore === 'number'
    ? `Audited (${githubAuditScore}/100)`
    : hasAuthenticGithub
    ? 'Connected (Unaudited)'
    : 'Unavailable';

  const hasAuthenticLinkedin = Boolean(
    profile?.linkedinUrl &&
    profile.linkedinUrl.includes('linkedin.com') &&
    !profile.linkedinUrl.includes('username') &&
    profile.linkedinUrl.trim().length > 12
  );
  const isLinkedinAudited = !isDemoMode && linkedinJob?.status === 'completed' && linkedinJob.result?.data;
  const linkedinAuditScore = isLinkedinAudited
    ? (linkedinJob.result.data.score ?? linkedinJob.result.data.overallScore)
    : null;

  const linkedinDisplayStatus = isLinkedinAudited && typeof linkedinAuditScore === 'number'
    ? `Audited (${linkedinAuditScore}/100)`
    : hasAuthenticLinkedin
    ? 'Connected (Unaudited)'
    : 'Unavailable';

  const targetRoleDisplay =
    profile?.targetRole ||
    profile?.careerFocus ||
    careerGoals[0]?.targetRole ||
    careerGoals[0]?.title ||
    'Not Specified';

  const readinessScore = diagnosticData?.readinessScore ?? diagnosticData?.score ?? 0;
  const verdict = getSafeString(
    diagnosticData?.verdict || diagnosticData?.evaluation,
    readinessScore >= 80
      ? 'Competitive for Tier-1 Internships'
      : readinessScore >= 50
      ? 'Approaching Readiness with Minor Gaps'
      : 'Foundational Phase • Baseline Evaluated'
  );

  const pillars = Array.isArray(diagnosticData?.breakdown)
    ? diagnosticData.breakdown.map((p: any) => ({
        label: getSafeString(p.label, 'Dimension'),
        score: Math.max(0, Number(p.score || 0)),
        max: Math.max(1, Number(p.max || 25)),
      }))
    : [];

  const readySignals: string[] = Array.isArray(diagnosticData?.strengths)
    ? diagnosticData.strengths.map((s: any) => getSafeString(s)).filter(Boolean)
    : [];

  const blockers: string[] = Array.isArray(diagnosticData?.gaps)
    ? diagnosticData.gaps.map((g: any) => getSafeString(g)).filter(Boolean)
    : [];

  const sprintActions = Array.isArray(diagnosticData?.recommendations)
    ? diagnosticData.recommendations.map((r: any, idx: number) => ({
        priority: Number(r.priority) || idx + 1,
        title: getSafeString(r.title, `Action ${idx + 1}`),
        desc: getSafeString(r.desc),
        action: getSafeString(r.action || r.desc || r.title, `Action ${idx + 1}`),
      }))
    : [];

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
        recommendations: sprintActions.map((s) => s.action || s.title || getSafeString(s)),
      }, `${candidateName.replace(/\s+/g, '_')}_Internship_Readiness_Report.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const isIncompleteTwin = !isDemoMode && skills.length === 0 && projects.length === 0;

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

            {/* Baseline Preview from Real Twin Data */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">Twin Readiness</span>
                <strong className="text-blue-600 dark:text-cyan-400">{realReadiness}%</strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">Recorded Skills</span>
                <strong className="text-slate-900 dark:text-white">
                  {totalSkillsCount > 0
                    ? `${totalSkillsCount} Skills${verifiedSkillsCount > 0 ? ` (${verifiedSkillsCount} Verified)` : ' (0 Verified)'}`
                    : '0 Skills'}
                </strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">Code Repositories</span>
                <strong className="text-slate-900 dark:text-white">
                  {totalProjectsCount > 0
                    ? `${totalProjectsCount} Repositories${liveProjectsCount > 0 ? ` (${liveProjectsCount} Live)` : ''}`
                    : '0 Repositories'}
                </strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">GitHub Status</span>
                <strong className={hasAuthenticGithub || isGithubAudited ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}>
                  {githubDisplayStatus}
                </strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">LinkedIn Status</span>
                <strong className={hasAuthenticLinkedin || isLinkedinAudited ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}>
                  {linkedinDisplayStatus}
                </strong>
              </div>
              <div className="flex items-center justify-between font-mono pt-1 border-t border-slate-200/50 dark:border-white/5">
                <span className="text-slate-500">Target Role</span>
                <strong className="text-slate-800 dark:text-slate-200 max-w-[140px] truncate text-right" title={targetRoleDisplay}>
                  {targetRoleDisplay}
                </strong>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-500">Proof Records</span>
                <strong className="text-slate-800 dark:text-slate-200">
                  {certifications.length + achievements.length > 0
                    ? `${certifications.length} Certs • ${achievements.length} Milestones`
                    : '0 Logged'}
                </strong>
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

          {/* Incomplete Twin Guidance Card (if applicable) */}
          {isIncompleteTwin && (
            <div className="p-5 rounded-[1.5rem] bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs font-mono uppercase">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Student Twin Incomplete</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200/80 leading-relaxed">
                Your Student Twin does not have any skills or project repositories logged yet. You can still run the diagnostic now to identify your foundational gaps and see what Tier-1 recruiters require.
              </p>
            </div>
          )}

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

          {/* Idle Prompt View when diagnostic has not been run yet */}
          {!isRunning && !hasDiagnostic && !isError && (
            <div className="p-8 sm:p-12 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-dashed border-slate-200 dark:border-white/10 text-center space-y-5 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-sm">
                <Briefcase className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Ready for Tier-1 Internship Diagnostic
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Evaluate your proof-of-work, ATS alignment, codebase depth, and recruiter discoverability against real Tier-1 software engineering hiring benchmarks.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRunDiagnostic}
                  disabled={isRunning}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Run Internship Diagnostic</span>
                </button>
              </div>
            </div>
          )}

          {/* Top Scorecard Card (when diagnostic has run or demo mode) */}
          {hasDiagnostic && !isRunning && (
            <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-6 transition-colors animate-in fade-in duration-300">
              
              {/* Header & Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                      INTERNSHIP READINESS DIAGNOSTIC
                    </span>
                    <span className="text-xs font-mono text-slate-400">Tier-1 Benchmark</span>
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
                          className="h-full bg-blue-600 dark:bg-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((pil.score / pil.max) * 100))}%` }}
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
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Verified Strengths & Ready Signals</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {readySignals.map((sig, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>{getSafeString(sig)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                  <h4 className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Critical Blockers & Evidence Gaps</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {blockers.map((blk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{getSafeString(blk)}</span>
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
                  {sprintActions.map((actionItem, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {actionItem.priority || idx + 1}
                      </span>
                      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {actionItem.action || actionItem.title || getSafeString(actionItem)}
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
          )}

        </div>

      </div>
    </EngineLayout>
  );
};
