import React from 'react';
import {
  LayoutGrid,
  Gauge,
  ScanEye,
  ShieldCheck,
  Zap,
  Lock,
} from 'lucide-react';

export const CoreBenefits: React.FC = () => {
  const benefits = [
    {
      icon: LayoutGrid,
      title: 'Unified Career Operating System',
      desc: 'Replaces fractured folders, scattered GitHub links, and disconnected resumes with one synchronized professional control plane.',
      tag: 'Centralization',
    },
    {
      icon: Gauge,
      title: 'Precision Readiness Scoring',
      desc: 'Deterministic 0–100 multi-vector score evaluating code entropy, DSA rigor, academic standing, and role calibration.',
      tag: 'Diagnostics',
    },
    {
      icon: ScanEye,
      title: 'Predictive Skill Void Detection',
      desc: 'Identifies missing prerequisite competencies before internship application deadlines and generates targeted bridging sprints.',
      tag: 'Gap Analysis',
    },
    {
      icon: ShieldCheck,
      title: 'Proof-of-Work Verification',
      desc: 'Transforms arbitrary resume claims into verifiable, commit-backed and architecture-checked engineering evidence.',
      tag: 'Authenticity',
    },
    {
      icon: Zap,
      title: 'Real-Time Career Intelligence',
      desc: 'Continuous market alignment analysis matching your student vector against live industry hiring signals.',
      tag: 'Market Match',
    },
    {
      icon: Lock,
      title: 'Deterministic Privacy & Security',
      desc: 'Supabase PostgreSQL Row Level Security (RLS) ensures complete data isolation. Your twin data is strictly yours.',
      tag: 'Tenancy',
    },
  ];

  return (
    <section id="benefits" className="py-20 lg:py-28 bg-slate-50 dark:bg-[#02040a] border-b border-slate-200 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest font-mono">
            Value Proposition
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Core Benefits
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Engineered to give student engineers an unfair competitive advantage during campus placements and international hiring rounds.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                className="group relative p-7 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 shadow-md space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    {b.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                  {b.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

