import React, { useState } from 'react';
import { AI_ENGINES } from '../../data/enginesData';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useAIJobs } from '../../context/AIJobContext';
import {
  Sparkles,
  Bot,
  Code2,
  Github,
  Share2,
  FileText,
  FileSearch,
  BookOpen,
  Milestone,
  Briefcase,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Search,
  RefreshCw,
} from 'lucide-react';

interface EngineHubProps {
  onSelectEngine: (engineId: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Bot,
  Sparkles,
  Code2,
  Github,
  Share2,
  FileText,
  FileSearch,
  BookOpen,
  Milestone,
  Briefcase,
  Compass,
};

export const EngineHub: React.FC<EngineHubProps> = ({ onSelectEngine }) => {
  const { profile, isDemoMode, skills, projects } = useStudentTwin();
  const { jobs } = useAIJobs();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    'all',
    'Advisory & Strategy',
    'Portfolio & Brand',
    'Audits & Code',
    'Academic & Career Planning',
  ];

  const filteredEngines = selectedCategory === 'all'
    ? AI_ENGINES
    : AI_ENGINES.filter((e) => e.category === selectedCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>AI Career OS • Phase 2 Fully Active</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>11 of 11 AI Engines Live</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                AI Career Operating System
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A deterministic, twin-grounded intelligence suite. Every engine operates strictly on your verified Student Digital Twin metrics to guide your placement readiness.
              </p>
            </div>

            {/* Context Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0 space-y-1">
              <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Active Twin Profile</div>
              <div className="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>{profile?.fullName}</span>
              </div>
              <div className="text-[10px] text-blue-600 dark:text-cyan-400 font-mono">
                {profile?.readinessScore}% Readiness • {skills.length} Skills • {projects.length} Repos
              </div>
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-2 pt-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {cat === 'all' ? 'All 11 Engines' : cat}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Grid of 11 AI Engines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEngines.map((eng) => {
          const IconComp = ICON_MAP[eng.icon] || Sparkles;

          return (
            <div
              key={eng.id}
              onClick={() => onSelectEngine(eng.id)}
              className="p-6 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-md hover:border-blue-500/50 dark:hover:border-cyan-500/50 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group space-y-4 relative overflow-hidden"
            >
              {/* Background gradient accent on hover */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-cyan-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform pointer-events-none" />

              <div className="space-y-3 relative">
                {/* Engine Header */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <IconComp className="w-5 h-5" />
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400">
                    Engine {eng.number} of 11
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                    {eng.name}
                  </h3>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {eng.category}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {eng.shortDesc}
                </p>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs relative">
                {jobs[eng.id]?.status === 'running' ? (
                  <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Stage {jobs[eng.id].currentStageIndex + 1}/{jobs[eng.id].stages.length} Running</span>
                  </span>
                ) : jobs[eng.id]?.status === 'completed' ? (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Output Ready
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Ready
                  </span>
                )}

                <span className="text-blue-600 dark:text-cyan-400 font-bold font-mono flex items-center gap-1 group-hover:translate-x-1 transition-transform text-xs">
                  <span>{jobs[eng.id]?.status === 'running' ? 'View Live' : jobs[eng.id]?.status === 'completed' ? 'View Result' : 'Launch'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
