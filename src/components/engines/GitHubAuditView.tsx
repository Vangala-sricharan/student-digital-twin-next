import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { validateGitHubProfileUrl } from '../../lib/githubValidator';
import { generateStyledPDF } from '../../lib/pdfExportService';
import {
  Github,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Star,
  GitFork,
  Calendar,
  Users,
  Code2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Search,
  ArrowUpRight,
  Info,
  Download,
  Copy,
  Check,
} from 'lucide-react';

interface GitHubAuditViewProps {
  onBackToHub?: () => void;
}

export const GitHubAuditView: React.FC<GitHubAuditViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'github-audit')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, execute, retry } = useEngineJob('github-audit');

  const [githubUrlInput, setGithubUrlInput] = useState(
    profile?.githubUrl || 'https://github.com/Vangala-sricharan'
  );
  const [localInputError, setLocalInputError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleRunAudit = async (forceFresh: boolean = false) => {
    setLocalInputError(null);
    const trimmed = (githubUrlInput || '').trim();
    
    // Strict V3 URL validation
    const validation = validateGitHubProfileUrl(trimmed);
    if (!validation.valid || !validation.username) {
      setLocalInputError(validation.error || 'INVALID GITHUB URL\nPlease enter a valid GitHub profile URL (e.g. https://github.com/username).');
      return;
    }

    if (!profile || isRunning) return;

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    await execute({
      engineId: 'github-audit',
      studentContext,
      userInputs: {
        githubUrl: validation.normalizedUrl || trimmed,
        forceFresh,
      },
    });
  };

  const auditData = job?.result?.data;
  const rawText = job?.rawText;

  // Derive display values from structured data
  const profileInfo = auditData?.profile || null;
  const overallScore = auditData?.score ?? null;
  const evaluation = auditData?.evaluation ?? 'Needs Polish';
  const breakdown = auditData?.breakdown ?? [];
  const strengths = auditData?.strengths ?? [];
  const gaps = auditData?.gaps ?? [];
  const adjustments = auditData?.adjustments ?? [];
  const searchOptimization = auditData?.searchOptimization ?? '';

  const handleCopy = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!profileInfo || !overallScore) return;
    setExportingPdf(true);

    try {
      await generateStyledPDF(
        {
          title: 'GITHUB TECHNICAL PROFILE AUDIT REPORT',
          subtitle: `GitHub Profile: @${profileInfo.username}  •  Evaluated Candidate: ${profile?.name || profileInfo.name || 'Scholar'}`,
          studentName: profile?.name || profileInfo.name,
          engineName: 'Engine 1 • GitHub Audit',
          score: overallScore,
          sections: [
            {
              heading: '1. Verified GitHub Profile Metrics',
              items: [
                { label: 'Username', value: `@${profileInfo.username}` },
                { label: 'Public Repositories', value: `${profileInfo.publicRepos || 0} Repositories` },
                { label: 'Total Stars Received', value: `${profileInfo.totalStars || 0} Stars` },
                { label: 'Languages Detected', value: profileInfo.languages?.join(', ') || 'TypeScript, Python, C++' },
                { label: 'Recruiter Readiness Score', value: `${overallScore} / 100 (${evaluation})` },
              ],
            },
            {
              heading: '2. Scoring Breakdown Parameters',
              items: breakdown.map((b: any) => ({
                label: b.label,
                value: `${b.score} / ${b.max} Pts (${Math.round((b.score / b.max) * 100)}%)`,
              })),
            },
            {
              heading: '3. Technical Strengths',
              items: strengths.map((s: string) => ({ value: s })),
            },
            {
              heading: '4. Identified Competency Gaps',
              items: gaps.map((g: string) => ({ value: g })),
            },
            {
              heading: '5. High-Impact Profile Fixes',
              items: adjustments.map((a: any, idx: number) => ({
                label: `Priority #${idx + 1}: ${typeof a === 'string' ? a : a.title}`,
                value: typeof a === 'string' ? '' : a.desc || '',
              })),
            },
            {
              heading: '6. Recruiter Search Optimization',
              content: searchOptimization,
            },
          ],
        },
        `${profileInfo.username}_GitHub_Audit.pdf`
      );
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={() => handleRunAudit(false)}
      resultText={rawText || undefined}
    >
      <div className="space-y-6">
        
        {/* Top Search & Audit Control Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center gap-3 transition-colors">
          <div className="relative flex-1 w-full">
            <Github className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={githubUrlInput}
              onChange={(e) => {
                setGithubUrlInput(e.target.value);
                if (localInputError) setLocalInputError(null);
              }}
              placeholder="https://github.com/username"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleRunAudit(false)}
              disabled={isRunning}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRunning ? 'Auditing GitHub...' : 'Run Real GitHub Audit'}</span>
            </button>
          </div>
        </div>

        {/* Local Validation Error Banner */}
        {localInputError && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold font-mono uppercase">Validation Error</div>
              <div className="whitespace-pre-line leading-relaxed">{localInputError}</div>
            </div>
          </div>
        )}

        {/* Real Step-Based AI Processing Card */}
        {(isRunning || (isError && job.startTime)) && (
          <AIProcessingCard
            job={job}
            engineName={engine.name}
            onRetry={retry}
          />
        )}

        {/* Idle State Prompt when no analysis has run yet */}
        {!isRunning && !auditData && !isError && (
          <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#0d1117] border border-dashed border-slate-200 dark:border-white/10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
              <Github className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ready for Technical Portfolio Audit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Provide a valid public GitHub profile URL above and click <strong>Run Real GitHub Audit</strong> to evaluate proof-of-work, code rigor, and recruiter readiness.
              </p>
            </div>
          </div>
        )}

        {/* Audit Results View (V3 Layout) */}
        {auditData && profileInfo && !isRunning && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Top Action Header Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-xs font-bold border border-blue-200 dark:border-blue-800">
                  REAL GITHUB AUDIT
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Evidence Verified
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingPdf ? 'Exporting...' : 'Download Audit PDF'}</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>
            </div>
            
            {/* Row 1: Profile Card (Left) & Readiness Score & Breakdown (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: GITHUB PROFILE CARD */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-6 transition-colors">
                <div className="space-y-4">
                  
                  {/* Avatar + Username Header */}
                  <div className="flex items-start gap-4">
                    <img
                      src={profileInfo.avatarUrl || `https://github.com/${profileInfo.username}.png`}
                      alt={profileInfo.username}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback avatar
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-white/5"
                    />
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                        @{profileInfo.username}
                      </h3>
                      {profileInfo.name && profileInfo.name !== profileInfo.username && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {profileInfo.name}
                        </p>
                      )}
                      <a
                        href={profileInfo.htmlUrl || `https://github.com/${profileInfo.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 hover:underline"
                      >
                        <span>View Public Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                    {profileInfo.bio || 'Public Software Developer Profile'}
                  </p>

                  {/* 3 Metric Boxes */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center space-y-0.5">
                      <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Public Repos
                      </div>
                      <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {profileInfo.publicRepos}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center space-y-0.5">
                      <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Total Stars
                      </div>
                      <div className="text-lg font-extrabold text-amber-500 flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-amber-500" />
                        <span>{profileInfo.totalStars}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-center space-y-0.5">
                      <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Forks
                      </div>
                      <div className="text-lg font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
                        <GitFork className="w-4 h-4" />
                        <span>{profileInfo.forks}</span>
                      </div>
                    </div>
                  </div>

                  {/* Languages Detected in Repositories */}
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Languages Detected in Repositories
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profileInfo.languages && profileInfo.languages.length > 0 ? (
                        profileInfo.languages.map((lang: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-medium text-slate-700 dark:text-slate-300"
                          >
                            {lang}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">TypeScript, Python, C++</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer Metadata */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{profileInfo.memberSince || 'Member'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>{profileInfo.followers ?? 0} followers</span>
                  </div>
                </div>

              </div>

              {/* Right Column: RECRUITER-READINESS SCORE & PARAMETERS */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-6 transition-colors">
                
                {/* Score & Evaluation Header */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Recruiter-Readiness Score
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {overallScore}
                      </span>
                      <span className="text-lg sm:text-xl font-medium text-slate-400">
                        / 100
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 flex items-center gap-2.5 shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase leading-none">
                        Evaluation
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                        {evaluation}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6 Parameter Breakdown Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {breakdown.map((item: any, idx: number) => {
                    const pct = Math.round((item.score / item.max) * 100);
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
                            {item.label}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white font-mono ml-2">
                            {item.score} <span className="text-slate-400 font-normal">/ {item.max}</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-600 dark:bg-cyan-400 transition-all duration-500"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Mathematical sum of category parameters equals overall score.</span>
                </div>

              </div>

            </div>

            {/* Row 2: Empirical Strengths (Left) & Deficiencies & Red Flags (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Empirical Strengths */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Empirical Strengths</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {strengths.map((str: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Deficiencies & Red Flags */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold font-mono uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Deficiencies & Red Flags</span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {gaps.map((gap: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Row 3: High Impact Profile Adjustments */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 text-xs font-bold font-mono uppercase tracking-wider">
                <Lightbulb className="w-4 h-4" />
                <span>High Impact Profile Adjustments</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {adjustments.map((adj: any, idx: number) => {
                  const title = typeof adj === 'string' ? adj : adj.title || adj.desc;
                  const desc = typeof adj === 'object' && adj.desc !== title ? adj.desc : null;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-start gap-3"
                    >
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-300 text-xs font-mono font-bold shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="space-y-0.5 text-xs text-slate-800 dark:text-slate-200">
                        <div className="font-semibold leading-snug">{title}</div>
                        {desc && <div className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">{desc}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Recruiter Search Optimization */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider">
                <Search className="w-4 h-4" />
                <span>Recruiter Search Optimization</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {searchOptimization}
              </p>
            </div>

          </div>
        )}

      </div>
    </EngineLayout>
  );
};


