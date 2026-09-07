import React from 'react';
import { Cpu, Network, Compass, Activity, ArrowUpRight, CheckCircle, Sparkles } from 'lucide-react';

export const AiCareerEngine: React.FC = () => {
  const enginePillars = [
    {
      title: 'Adaptive Role Intelligence & Market Calibration',
      description: 'Continuous semantic evaluation against evolving Tier-1 technical requirements in distributed systems, AI/ML, and cloud engineering.',
      icon: Compass,
    },
    {
      title: 'Career Vector Model',
      description: 'Mathematical projection of student skill trajectories across multi-dimensional axes, calculating readiness acceleration vectors.',
      icon: Activity,
    },
    {
      title: 'Semantic Skill Ontologies',
      description: 'Hierarchical categorization connecting theoretical computer science foundations with concrete industry tooling and design patterns.',
      icon: Network,
    },
    {
      title: 'Live Hiring Signals',
      description: 'Real-time calibration based on active engineering job specifications, interview rubrics, and recruiter search patterns.',
      icon: Sparkles,
    },
    {
      title: 'Actionable Gap Remediation',
      description: 'Deterministic generation of targeted proof-of-work project milestones and algorithmic exercises to eliminate readiness deficiencies.',
      icon: ArrowUpRight,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white dark:bg-[#02040a] border-b border-slate-200 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest font-mono">
            Intelligence Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AI Career Intelligence Engine
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            The mathematical intelligence framework powering student career acceleration and readiness vector calibration.
          </p>
        </div>

        {/* Presentation Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enginePillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="p-7 rounded-[2rem] bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-4 shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-cyan-400">
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {pillar.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {pillar.description}
                </p>

                <div className="pt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-cyan-400 font-mono">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Architecture Specification Verified</span>
                </div>
              </div>
            );
          })}

          {/* Engine Concept Callout */}
          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/30 dark:via-slate-900 dark:to-[#0d1117] border border-blue-500/30 text-slate-900 dark:text-white shadow-xl space-y-4 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-white/10 border border-blue-500/20 dark:border-white/10 text-blue-700 dark:text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                <Cpu className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                <span>11 Core Engines</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">
                Full 11-Engine Suite Active
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Production architecture provides clean data contracts for Career Assistant, AI Portfolio, Project Auditor, ATS Parser, and Career Simulator engines.
              </p>
            </div>

            <div className="text-xs font-mono text-blue-600 dark:text-cyan-300 font-semibold flex items-center gap-1 pt-4">
              <span>All 11 Career Engines Active</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

