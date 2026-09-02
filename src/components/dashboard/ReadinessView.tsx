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
  const { profile } = useStudentTwin();

  const diagnosticVectors = [
    {
      title: 'Role Alignment Vector',
      score: 95,
      benchmark: 82,
      icon: Target,
      status: 'Exceptional',
      desc: 'Matches student skill ontologies against active Tier-1 AI/ML and Systems Engineering roles.',
      details: [
        { label: 'PyTorch / Distributed AI Training', match: '98% match' },
        { label: 'Agentic Consensus & LLM Orchestration', match: '96% match' },
        { label: 'Systems Programming (Rust / C++)', match: '92% match' },
      ],
    },
    {
      title: 'Code & Proof Health Vector',
      score: 96,
      benchmark: 75,
      icon: Code2,
      status: 'Exceptional',
      desc: 'Evaluates codebase authenticity, multi-file architectural modularity, and organic commit frequency.',
      details: [
        { label: 'Abstract Syntax Tree (AST) Depth', match: 'Level 4 (High)' },
        { label: 'Organic Commit Graph Entropy', match: '96% Organic' },
        { label: 'Architectural Hygiene & Typings', match: '99% Clean' },
      ],
    },
    {
      title: 'Adaptive Milestones Vector',
      score: 93,
      benchmark: 70,
      icon: Milestone,
      status: 'Ahead of Track',
      desc: 'Tracks progress across competitive hackathons, research fellowships, and pre-placement velocity.',
      details: [
        { label: 'Competitive Hackathon Index', match: 'Top 1% Tier' },
        { label: 'Open-Source Pull Request Activity', match: 'High Velocity' },
        { label: 'Academic Standing (CGPA: 9.15)', match: 'Top 5% Cohort' },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl space-y-2 transition-colors">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wider font-mono">
          Deterministic Telemetry
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Multi-Vector Readiness Diagnostics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Mathematical decomposition of career readiness calibrated against industry rubrics.
        </p>
      </div>

      {/* Main Readiness Gauge Card */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white shadow-sm dark:shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Placement Calibration Tier-1</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Overall Placement Probability: {profile?.readinessScore}%
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            Your Student Digital Twin exceeds benchmark criteria for campus placement and Tier-1 engineering fellowship eligibility.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center shrink-0 w-full sm:w-auto">
          <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Readiness Score</div>
          <div className="text-4xl font-black text-blue-600 dark:text-cyan-400 font-mono mt-1">
            {profile?.readinessScore}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 font-semibold">
            Rank: Top 5% Percentile
          </div>
        </div>
      </div>

      {/* 3 Detailed Vector Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {diagnosticVectors.map((vec, i) => {
          const Icon = vec.icon;
          return (
            <div
              key={i}
              className="p-6 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg space-y-4 flex flex-col justify-between hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/5 text-blue-600 dark:text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                      {vec.score}%
                    </div>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      vs {vec.benchmark}% avg
                    </div>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {vec.title}
                </h3>

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
