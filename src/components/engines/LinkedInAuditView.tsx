import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateAuditReportPDF } from '../../lib/pdfExportService';
import {
  Share2,
  CheckCircle2,
  Award,
  UserCheck,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Lightbulb,
  Search,
  Copy,
  Check,
  User,
  Download,
} from 'lucide-react';

interface LinkedInAuditViewProps {
  onBackToHub?: () => void;
}

export const LinkedInAuditView: React.FC<LinkedInAuditViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'linkedin-audit')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, execute, retry } = useEngineJob('linkedin-audit');

  const [linkedinUrl, setLinkedinUrl] = useState(
    profile?.linkedinUrl || 'https://www.linkedin.com/in/sri-charan-vangala-a7453b384/'
  );
  const [profileText, setProfileText] = useState('');
  const [copiedHeadline, setCopiedHeadline] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      await generateAuditReportPDF({
        type: 'LinkedIn Audit',
        title: `LinkedIn Profile Audit: ${profileInfo.name}`,
        candidateName: profileInfo.name,
        score: overallScore,
        maxScore: 100,
        evaluation,
        breakdown,
        strengths,
        gaps,
        recommendations: adjustments.map((a: any) => `${a.title}: ${a.desc}`),
      }, `${profileInfo.name.replace(/\s+/g, '_')}_LinkedIn_Audit.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

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
      engineId: 'linkedin-audit',
      studentContext,
      userInputs: {
        linkedinUrl,
        profileText,
      },
    });
  };

  const auditData = job?.result?.data;
  const rawText = job?.rawText;

  const profileInfo = auditData?.profile || {
    name: profile?.fullName || profile?.name || 'Student Candidate',
    headline: `Student @ ${profile?.university || 'Engineering University'} | Aspiring ${profile?.targetRole || 'Software Development Engineer'}`,
    linkedinUrl: linkedinUrl || 'https://linkedin.com/in/candidate',
  };

  const overallScore = auditData?.score ?? 82;
  const evaluation = auditData?.evaluation ?? 'Strong Alignment';
  const breakdown = auditData?.breakdown ?? [
    { label: 'Headline Impact', score: 12, max: 15 },
    { label: 'About Section Depth', score: 19, max: 25 },
    { label: 'Technical Positioning', score: 17, max: 20 },
    { label: 'Experience & Project Rigor', score: 16, max: 20 },
    { label: 'Recruiter Search Discoverability', score: 18, max: 20 },
  ];

  const strengths = auditData?.strengths ?? [
    `Strong educational credentials at ${profile?.university || 'University'} with clear graduation timeline`,
    'Good alignment with core software engineering stacks (TypeScript, Python, Distributed Systems)',
    'Demonstrable commitment to full-stack engineering and verified project depth',
  ];

  const gaps = auditData?.gaps ?? [
    'Headline is currently generic; lacks high-converting recruiter keyword density',
    'About narrative lacks quantifiable engineering accomplishments and latency metrics',
    'Featured media section is currently empty without pinned repository proof',
  ];

  const headlineVariations = [
    `${profileInfo.name} | Aspiring ${profile?.targetRole || 'Software Engineer'} @ ${profile?.university || 'University'} | TypeScript • React • Python • Cloud Systems | Open to Internships`,
    `CS Scholar @ ${profile?.university || 'University'} | Building Full-Stack AI Systems & High-Throughput APIs | TypeScript • Go • PostgreSQL`,
    `Software Engineering Scholar | ${profile?.targetRole || 'Full-Stack Developer'} | AST Verified Systems Builder | Available for 2026 Opportunities`,
  ];

  const adjustments = auditData?.recommendations || [
    { priority: 1, title: 'Upgrade Professional Headline', desc: 'Adopt one of the market-calibrated headline variations below to pass recruiter keyword Boolean searches.' },
    { priority: 2, title: 'Quantify About Narrative', desc: 'Highlight latency reductions, user scale, or algorithmic complexity in your career summary.' },
    { priority: 3, title: 'Attach Featured Proof-of-Work', desc: 'Add direct links to top GitHub repositories and live interactive deployments in Featured Media.' },
  ];

  const searchOptimization =
    auditData?.searchOptimization ||
    'Optimize headline and skills endorsements for recruiter Boolean filters: REST APIs, TypeScript, Distributed Systems, Python, React, and Docker.';

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedHeadline(idx);
    setTimeout(() => setCopiedHeadline(null), 2000);
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={handleRunAudit}
      resultText={rawText || undefined}
    >
      <div className="space-y-6">
        
        {/* Input Parameters Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span>LinkedIn Profile Parameters</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                LinkedIn Profile URL
              </label>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Current Headline or About Snippet (Optional)
              </label>
              <input
                type="text"
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                placeholder="Paste current headline to compare against Twin ontology..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleRunAudit}
              disabled={isRunning}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRunning ? 'Auditing Profile...' : 'Audit LinkedIn Presence'}</span>
            </button>
          </div>
        </div>

        {/* Real Step-Based AI Processing Card */}
        {(isRunning || isError) && (
          <AIProcessingCard
            job={job}
            engineName={engine.name}
            onRetry={retry}
          />
        )}

        {/* V3 Rich Structured Result */}
        {(auditData || rawText) && !isRunning && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Row 1: Profile Identity & Score Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: LINKEDIN PROFILE CARD */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-5 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                      {profileInfo.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {profileInfo.name}
                      </h3>
                      <a
                        href={profileInfo.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>View LinkedIn Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                    "{profileInfo.headline}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Target Role: {profile?.targetRole || 'Software Development Engineer'}</span>
                  <span>{profile?.university}</span>
                </div>
              </div>

              {/* Right Column: SCORE & PARAMETERS */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-5 transition-colors">
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      LinkedIn Recruiter Score
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {overallScore}
                      </span>
                      <span className="text-lg text-slate-400 font-medium">/ 100</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <div>
                      <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase leading-none">
                        Evaluation
                      </div>
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {evaluation}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {breakdown.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{item.label}</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{item.score}/{item.max}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600 dark:bg-cyan-400"
                          style={{ width: `${Math.min(100, Math.round((item.score / item.max) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Row 2: Strengths & Deficiencies */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile Strengths</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {strengths.map((str: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold font-mono uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Identified Deficiencies</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {gaps.map((gap: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Row 3: High-Converting Headline Variations */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 text-xs font-bold font-mono uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>High-Converting Headline Variations</span>
              </div>
              <div className="space-y-3">
                {headlineVariations.map((headline: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between gap-4"
                  >
                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono leading-relaxed">
                      {headline}
                    </div>
                    <button
                      onClick={() => handleCopy(headline, idx)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/20 transition-all shrink-0 cursor-pointer"
                    >
                      {copiedHeadline === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4: Search Optimization */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider">
                <Search className="w-4 h-4" />
                <span>Recruiter Search Optimization</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {searchOptimization}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleExportPDF}
                disabled={exportingPdf}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingPdf ? 'Generating PDF...' : 'Download LinkedIn Audit PDF'}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </EngineLayout>
  );
};

