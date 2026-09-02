import React from 'react';
import { Target, Code2, Milestone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ReadinessDiagnostics: React.FC = () => {
  const diagnostics = [
    {
      title: 'Role Alignment Score',
      score: '95%',
      benchmark: '82% avg',
      desc: 'Quantifies match percentage between verified skills, coursework, and target role ontologies.',
      icon: Target,
      metrics: ['Tier-1 Job Spec Alignment', 'Prerequisite Coverage', 'Specialty Calibration'],
    },
    {
      title: 'Code & Proof Health',
      score: '96%',
      benchmark: '75% avg',
      desc: 'Evaluates codebase authenticity, commit entropy, architectural hygiene, and algorithmic rigor.',
      icon: Code2,
      metrics: ['Abstract Syntax Tree Depth', 'Commit Frequency & Entropy', 'Architecture Hygiene'],
    },
    {
      title: 'Adaptive Milestones',
      score: '93%',
      benchmark: '70% avg',
      desc: 'Tracks sprint velocity across hackathons, research fellowships, and pre-placement goals.',
      icon: Milestone,
      metrics: ['Sprint Velocity Index', 'Proof-of-Work Verification', 'Pre-Placement Trajectory'],
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-slate-50 dark:bg-[#02040a] border-b border-slate-200 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest font-mono">
            Deterministic Metrics
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Multi-Vector Readiness Diagnostics
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Multi-dimensional evaluation framework providing comprehensive visibility into placement preparedness.
          </p>
        </div>

        {/* Diagnostics 3-column cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {diagnostics.map((diag, index) => {
            const Icon = diag.icon;
            return (
              <div
                key={index}
                className="p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-5 flex flex-col justify-between shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-cyan-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                        {diag.score}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                        vs. {diag.benchmark}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {diag.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {diag.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-white/5 space-y-2">
                  <div className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
                    Diagnostic Vectors
                  </div>
                  {diag.metrics.map((m, mi) => (
                    <div key={mi} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

