import React from 'react';
import { CREATOR_INFO, DEMO_STUDENT_PROFILE, DEMO_SKILLS, DEMO_PROJECTS } from '../../data/demoData';
import {
  Github,
  Linkedin,
  Globe,
  ExternalLink,
  Sparkles,
  Cpu,
  FolderGit2,
  TrendingUp,
} from 'lucide-react';

interface CreatorShowcaseCardProps {
  onExploreDemo: () => void;
}

export const CreatorShowcaseCard: React.FC<CreatorShowcaseCardProps> = ({ onExploreDemo }) => {
  const readinessScore = DEMO_STUDENT_PROFILE.readinessScore || 94;
  const skillsCount = DEMO_SKILLS.length;
  const projectsCount = DEMO_PROJECTS.length;

  return (
    <div id="creator-showcase-card" className="w-full max-w-[460px] relative group">
      {/* Outer Glow Halo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000" />
      
      {/* Container Card */}
      <div className="relative bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 sm:p-7 shadow-xl dark:shadow-2xl space-y-5 transition-colors">
        
        {/* Card Header & Avatar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 border border-slate-200 dark:border-white/10 flex items-center justify-center relative shrink-0">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white font-mono font-bold text-sm shadow-inner">
                SV
              </div>
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0d1117] shadow-sm flex items-center justify-center">
                <span className="w-1 h-1 bg-white rounded-full animate-ping opacity-75" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {CREATOR_INFO.name}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider">
                  DEMO
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-cyan-400 font-medium mt-0.5">
                {CREATOR_INFO.role}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {CREATOR_INFO.university}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1 text-sm sm:text-base font-bold text-blue-600 dark:text-cyan-400 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{readinessScore}%</span>
            </div>
            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider font-mono">
              Readiness
            </div>
          </div>
        </div>

        {/* Readiness Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
              Career Readiness Score
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Optimal (Tier-1 Aligned)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-700"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex justify-between">
            <span>{CREATOR_INFO.academicProgram}</span>
            <span>4 Evidence Pillars</span>
          </div>
        </div>

        {/* 2-Column Metrics (Deriving directly from demo dataset) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider font-mono">
                Skills Verified
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white leading-none font-mono mt-0.5">
                {skillsCount} Skills
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/15 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider font-mono">
                Proof of Work
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white leading-none font-mono mt-0.5">
                {projectsCount} Projects
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Row (Actual verified links only) */}
        <div className="space-y-2 pt-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
            Verified Creator Links
          </div>
          <div className="grid grid-cols-3 gap-2">
            {/* Demo Portfolio */}
            <a
              id="link-demo-portfolio"
              href="https://vangala-sricharan-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center justify-center gap-1.5 transition-colors"
              title="Open Vangala Sricharan's Live Portfolio"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span className="truncate">Portfolio ↗</span>
            </a>

            {/* GitHub Profile */}
            <a
              id="link-demo-github"
              href={CREATOR_INFO.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
              title="Open GitHub Profile"
            >
              <Github className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">GitHub ↗</span>
            </a>

            {/* LinkedIn Profile */}
            <a
              id="link-demo-linkedin"
              href={CREATOR_INFO.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center justify-center gap-1.5 transition-colors"
              title="Open LinkedIn Profile"
            >
              <Linkedin className="w-3.5 h-3.5 text-[#0a66c2] shrink-0" />
              <span className="truncate">LinkedIn ↗</span>
            </a>
          </div>
        </div>

        {/* Card Footer: Explore Demo Twin CTA */}
        <div className="pt-2 border-t border-slate-200 dark:border-white/10">
          <button
            id="btn-explore-demo-twin"
            type="button"
            onClick={onExploreDemo}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span>Explore Demo Twin</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>

      </div>
    </div>
  );
};
