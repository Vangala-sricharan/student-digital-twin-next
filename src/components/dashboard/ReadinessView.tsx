import React from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import {
  TrendingUp,
  Target,
  Code2,
  Milestone,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const ReadinessView: React.FC = () => {
  const { profile, digitalTwinReport, readinessBreakdown, skills, projects, achievements, isDemoMode } = useStudentTwin();

  const currentScore = isDemoMode
    ? 94
    : Math.min(100, Math.max(0, readinessBreakdown?.overallScore ?? profile?.readinessScore ?? digitalTwinReport?.overallScore ?? 0));

  const diagnosticVectors = isDemoMode ? [
    {
      title: 'Skills Coverage',
      pillarTag: 'Pillar A • 25% Weight',
      score: 95,
      benchmark: 80,
      icon: Target,
      status: 'Exceptional',
      desc: 'Evaluates breadth, depth, and verification of student technical competencies.',
      details: [
        { label: 'PyTorch / Distributed AI', match: '98% coverage' },
        { label: 'LLM Orchestration', match: '96% coverage' },
        { label: 'Systems Programming (Rust)', match: '92% coverage' },
      ],
    },
    {
      title: 'Project Portfolio',
      pillarTag: 'Pillar B • 30% Weight',
      score: 96,
      benchmark: 75,
      icon: Code2,
      status: 'Exceptional',
      desc: 'Evaluates codebase authenticity, multi-file modularity, tech stack breadth, and live links.',
      details: [
        { label: 'Repositories Indexed', match: '3 production repos' },
        { label: 'Live Proof URLs', match: 'All verified' },
        { label: 'Code Architecture', match: '99% Clean' },
      ],
    },
    {
      title: 'Industry Alignment',
      pillarTag: 'Pillar C • 25% Weight',
      score: 94,
      benchmark: 82,
      icon: TrendingUp,
      status: 'Exceptional',
      desc: 'Evaluates targeted career role, industry company tiers, and role-specific skill alignment.',
      details: [
        { label: 'Target Career Role', match: 'AI Systems Engineer' },
        { label: 'Company Tier Target', match: 'Tier-1 Tech Giants' },
        { label: 'Role Fit Probability', match: 'Top 1% Tier' },
      ],
    },
    {
      title: 'Verifications',
      pillarTag: 'Pillar D • 20% Weight',
      score: 92,
      benchmark: 70,
      icon: ShieldCheck,
      status: 'Ahead of Track',
      desc: 'Evaluates verified external profiles (GitHub, LinkedIn), distinctions, and academic standing.',
      details: [
        { label: 'External Presence', match: 'GitHub & LinkedIn verified' },
        { label: 'Logged Distinctions', match: 'Top 1% Hackathon Win' },
        { label: 'Academic Standing', match: 'CGPA 9.15 (Verified)' },
      ],
    },
  ] : [
    {
      title: 'Skills Coverage',
      pillarTag: 'Pillar A • 25% Weight',
      score: Math.min(100, Math.max(0, readinessBreakdown?.skillsCoverage ?? 0)),
      benchmark: 80,
      icon: Target,
      status: (readinessBreakdown?.skillsCoverage ?? 0) >= 75
        ? 'Optimal'
        : (readinessBreakdown?.skillsCoverage ?? 0) > 0
        ? 'Calibrated'
        : 'Needs Evidence',
      desc: 'Evaluates breadth, depth, and verification of student technical competencies.',
      details: [
        { label: 'Skills Indexed', match: `${skills.length} skills recorded` },
        { label: 'Verified Skills', match: `${skills.filter((s) => s.verified).length} verified` },
        { label: 'Pillar Weight', match: '25% of Readiness' },
      ],
    },
    {
      title: 'Project Portfolio',
      pillarTag: 'Pillar B • 30% Weight',
      score: Math.min(100, Math.max(0, readinessBreakdown?.projectPortfolio ?? 0)),
      benchmark: 75,
      icon: Code2,
      status: (readinessBreakdown?.projectPortfolio ?? 0) >= 75
        ? 'Optimal'
        : (readinessBreakdown?.projectPortfolio ?? 0) > 0
        ? 'Calibrated'
        : 'Needs Evidence',
      desc: 'Evaluates codebase authenticity, multi-file modularity, tech stack breadth, and live links.',
      details: [
        { label: 'Proof Repositories', match: `${projects.length} recorded` },
        { label: 'Live Proof URLs', match: `${projects.filter((p) => p.githubUrl || p.liveUrl).length} active links` },
        { label: 'Pillar Weight', match: '30% of Readiness' },
      ],
    },
    {
      title: 'Industry Alignment',
      pillarTag: 'Pillar C • 25% Weight',
      score: Math.min(100, Math.max(0, readinessBreakdown?.industryAlignment ?? 0)),
      benchmark: 82,
      icon: TrendingUp,
      status: (readinessBreakdown?.industryAlignment ?? 0) >= 75
        ? 'Optimal'
        : (readinessBreakdown?.industryAlignment ?? 0) > 0
        ? 'Calibrated'
        : 'Needs Evidence',
      desc: 'Evaluates targeted career role, industry company tiers, and role-specific skill alignment.',
      details: [
        { label: 'Target Career Role', match: profile?.targetRole || 'Not configured' },
        { label: 'Target Company Tier', match: profile?.targetCompanyTier || 'Unspecified' },
        { label: 'Pillar Weight', match: '25% of Readiness' },
      ],
    },
    {
      title: 'Verifications',
      pillarTag: 'Pillar D • 20% Weight',
      score: Math.min(100, Math.max(0, readinessBreakdown?.verifications ?? 0)),
      benchmark: 70,
      icon: ShieldCheck,
      status: (readinessBreakdown?.verifications ?? 0) >= 75
        ? 'Optimal'
        : (readinessBreakdown?.verifications ?? 0) > 0
        ? 'Calibrated'
        : 'Needs Evidence',
      desc: 'Evaluates verified external profiles (GitHub, LinkedIn), distinctions, and academic standing.',
      details: [
        { label: 'Profiles Connected', match: `${profile?.githubUrl ? 'GitHub' : 'No GitHub'} • ${profile?.linkedinUrl ? 'LinkedIn' : 'No LinkedIn'}` },
        { label: 'Distinctions Logged', match: `${achievements.length} recorded` },
        { label: 'Pillar Weight', match: '20% of Readiness' },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-2 transition-colors">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wider font-mono">
          Deterministic Telemetry
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Multi-Vector Readiness Diagnostics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Mathematical decomposition of placement readiness calibrated strictly against verified student evidence.
        </p>
      </div>

      {/* Main Readiness Gauge Card */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentScore > 0 ? 'Placement Calibration Active' : 'Start Building Career Evidence'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {currentScore > 0 ? `Overall Placement Probability: ${currentScore}%` : '0% READINESS — Awaiting Evidence'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            {currentScore > 0
              ? 'Your Student Digital Twin telemetry is computed against benchmark criteria for campus placement and engineering fellowship eligibility.'
              : 'Your readiness score will grow as you build your Student Twin. Add your technical skills, verified proof projects, and distinctions in My Profile or execute AI Career Engines to calibrate your score.'}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center shrink-0 w-full sm:w-56">
          <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">Readiness Score</div>
          <div className="text-4xl font-black text-blue-600 dark:text-cyan-400 font-mono mt-1">
            {currentScore}%
          </div>
          <div className="text-[11px] text-blue-600 dark:text-cyan-400 font-mono mt-0.5 font-semibold">
            {currentScore > 0 ? (currentScore >= 80 ? 'Tier-1 Ready' : 'In Progress') : '0% • Empty Baseline'}
          </div>
        </div>
      </div>

      {/* 4 Detailed Vector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
        {diagnosticVectors.map((vec, i) => {
          const Icon = vec.icon;
          return (
            <div
              key={i}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 flex flex-col justify-between hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/5 text-blue-600 dark:text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                      {vec.score}%
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">
                      vs {vec.benchmark}% avg
                    </div>
                  </div>
                </div>

                <div>
                  <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-white/5 text-blue-600 dark:text-cyan-400 border border-slate-200 dark:border-white/10 mb-1">
                    {vec.pillarTag}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {vec.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {vec.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-bold">
                  Vector Calibration
                </div>
                {vec.details.map((d, di) => (
                  <div key={di} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                    <span className="truncate max-w-[170px]">{d.label}</span>
                    <span className="font-mono text-blue-600 dark:text-cyan-400 font-semibold text-[11px]">
                      {d.match}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
