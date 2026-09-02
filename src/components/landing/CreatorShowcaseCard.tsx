import React from 'react';
import { CREATOR_INFO, DEMO_STUDENT_PROFILE } from '../../data/demoData';
import {
  Github,
  Linkedin,
  ExternalLink,
} from 'lucide-react';

interface CreatorShowcaseCardProps {
  onExploreDemo: () => void;
}

export const CreatorShowcaseCard: React.FC<CreatorShowcaseCardProps> = ({ onExploreDemo }) => {
  return (
    <div className="w-full max-w-[440px] relative group">
      {/* Outer Glow Halo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000" />
      
      {/* Container */}
      <div className="relative bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-[2rem] p-7 sm:p-8 shadow-xl dark:shadow-2xl space-y-6 transition-colors">
        
        {/* Card Header & Avatar */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 border border-slate-200 dark:border-white/10 flex items-center justify-center relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white font-mono font-bold text-base shadow-inner">
                SV
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0d1117] shadow-sm flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75" />
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {CREATOR_INFO.name}
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Founder, Student Digital Twin OS
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-mono">
                {CREATOR_INFO.university}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-bold text-blue-600 dark:text-cyan-400 font-mono">94.8%</div>
            <div className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">Readiness</div>
          </div>
        </div>

        {/* Academic Foundation & Specialty */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                Academic Foundation
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold font-mono">
                Verified (9.42 CGPA)
              </span>
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
              {CREATOR_INFO.academicProgram}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 space-y-1">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
              Specialty Focus
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-200 leading-snug">
              {CREATOR_INFO.specialty}
            </div>
          </div>

          {/* Metrics 2-column Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-mono mb-1">
                Skills Verified
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white leading-none font-mono">
                {DEMO_STUDENT_PROFILE.skillsVerifiedCount}+
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
              <div className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider font-mono mb-1">
                Proof of Work
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white leading-none font-mono">
                {DEMO_STUDENT_PROFILE.projectIndexCount} Repos
              </div>
            </div>
          </div>
        </div>

        {/* Social Links & Live Indicator Footer */}
        <div className="pt-5 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href={CREATOR_INFO.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href={CREATOR_INFO.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors p-1"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>

          <button
            onClick={onExploreDemo}
            className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 bg-blue-500 dark:bg-cyan-400 rounded-full animate-pulse" />
            <span>Explore Demo Twin</span>
            <ExternalLink className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
          </button>
        </div>

      </div>
    </div>
  );
};

