import React from 'react';
import { CREATOR_INFO, DEMO_STUDENT_PROFILE, DEMO_SKILLS, DEMO_PROJECTS } from '../../data/demoData';
import {
  Github,
  Linkedin,
  Globe,
  Sparkles,
  Cpu,
  FolderGit2,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

interface CreatorShowcaseCardProps {
  onExploreDemo: () => void;
}

export const CreatorShowcaseCard: React.FC<CreatorShowcaseCardProps> = ({ onExploreDemo }) => {
  const readinessScore = DEMO_STUDENT_PROFILE.readinessScore || 94;
  const skillsCount = DEMO_SKILLS.length;
  const projectsCount = DEMO_PROJECTS.length;

  return (
    <div id="creator-showcase-card" className="w-full max-w-[320px] sm:max-w-[350px] lg:max-w-[340px] xl:max-w-[370px] 2xl:max-w-[390px] relative group mx-auto lg:mx-0">
      {/* Outer Luminous Glow Halo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/35 via-indigo-600/25 to-cyan-400/35 rounded-2xl blur-lg opacity-60 group-hover:opacity-85 transition duration-700 pointer-events-none" />
      
      {/* Container Card with High-Gloss Cyber Glass Effect */}
      <div className="relative bg-white/95 dark:bg-[#070c1b]/85 backdrop-blur-2xl border border-slate-200/90 dark:border-blue-500/35 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 xl:p-4.5 shadow-2xl dark:shadow-[0_0_50px_rgba(14,165,233,0.15),0_20px_50px_rgba(0,0,0,0.6)] space-y-3 sm:space-y-3.5 transition-colors">
        
        {/* Card Header & Avatar */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar with Cybernetic Neon Rim */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 xl:w-12 xl:h-12 rounded-xl bg-gradient-to-br from-blue-500/25 to-cyan-400/25 border border-cyan-400/60 dark:border-cyan-400/60 p-0.5 shadow-[0_0_14px_rgba(34,211,238,0.35)] relative shrink-0">
              <div className="w-full h-full rounded-[8px] bg-slate-100 dark:bg-[#040816] flex items-center justify-center text-slate-900 dark:text-white font-mono font-extrabold text-xs sm:text-sm tracking-wider">
                SV
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#070c1b] shadow-[0_0_8px_#10b981] flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  {CREATOR_INFO.name}
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 dark:bg-blue-950/80 border border-blue-500/30 dark:border-cyan-500/40 text-[9px] sm:text-[9.5px] font-mono font-bold text-blue-600 dark:text-cyan-300 uppercase tracking-wider shrink-0">
                  DEMO
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-blue-600 dark:text-cyan-400 font-semibold truncate">
                {CREATOR_INFO.role}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {CREATOR_INFO.university}
              </p>
            </div>
          </div>

          {/* Readiness Top-Right Metric */}
          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1 text-base sm:text-lg xl:text-xl font-extrabold text-emerald-600 dark:text-cyan-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(34,211,238,0.45)]">
              <TrendingUp className="w-4 h-4" />
              <span>{readinessScore}%</span>
            </div>
            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider font-mono">
              READINESS
            </div>
          </div>
        </div>

        {/* Readiness Bar Container */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
              Career Readiness Score
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Optimal (Tier-1 Aligned)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 dark:from-cyan-400 dark:via-blue-500 dark:to-cyan-300 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(34,211,238,0.7)]"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
          <div className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 font-mono flex justify-between">
            <span>{CREATOR_INFO.academicProgram}</span>
            <span>4 Evidence Pillars</span>
          </div>
        </div>

        {/* 2-Column Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Box 1: Skills Verified */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/70 dark:bg-white/[0.03] border border-blue-200/70 dark:border-blue-500/25 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-blue-600 dark:text-cyan-400 uppercase tracking-wider font-mono">
                SKILLS VERIFIED
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight font-mono mt-0.5">
                {skillsCount} Skills
              </div>
            </div>
          </div>

          {/* Box 2: Proof of Work */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-cyan-50/70 dark:bg-white/[0.03] border border-cyan-200/70 dark:border-cyan-500/25 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[9px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider font-mono">
                PROOF OF WORK
              </div>
              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight font-mono mt-0.5">
                {projectsCount} Projects
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="space-y-1.5 pt-0.5">
          <div className="text-[9.5px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
            VERIFIED CREATOR LINKS
          </div>
          <div className="grid grid-cols-3 gap-2">
            <a
              id="link-demo-portfolio"
              href="https://vangala-sricharan-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.09] border border-slate-200 dark:border-white/10 text-[10px] sm:text-[10.5px] font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center justify-center gap-1.5 transition-colors min-w-0"
              title="Open Vangala Sricharan's Live Portfolio"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span className="truncate">Portfolio ↗</span>
            </a>

            <a
              id="link-demo-github"
              href={CREATOR_INFO.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.09] border border-slate-200 dark:border-white/10 text-[10px] sm:text-[10.5px] font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors min-w-0"
              title="Open GitHub Profile"
            >
              <Github className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">GitHub ↗</span>
            </a>

            <a
              id="link-demo-linkedin"
              href={CREATOR_INFO.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.09] border border-slate-200 dark:border-white/10 text-[10px] sm:text-[10.5px] font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 flex items-center justify-center gap-1.5 transition-colors min-w-0"
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
            className="w-full py-2.5 sm:py-3 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-[13px] font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
            <span>Explore Demo Twin</span>
            <ArrowUpRight className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};
