import React from 'react';
import { CREATOR_INFO } from '../../data/demoData';
import { Github, Linkedin, ExternalLink, GraduationCap, Code2, Award, Sparkles } from 'lucide-react';

export const AboutFounder: React.FC = () => {
  return (
    <section id="about" className="py-20 lg:py-28 bg-slate-50 dark:bg-[#02040a] border-b border-slate-200 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest font-mono">
            Founder & Architect
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Built by a Student Engineer, For Student Engineers
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            The Student Digital Twin OS is engineered by a computer science undergraduate solving real placement readiness challenges from the ground up.
          </p>
        </div>

        {/* Founder Bio Card */}
        <div className="mt-14 max-w-4xl mx-auto rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl overflow-hidden transition-colors">
          <div className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left: Avatar & Identity badge */}
            <div className="md:col-span-4 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-1 shadow-xl">
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white font-mono font-bold text-3xl">
                    SV
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {CREATOR_INFO.name}
                </h3>
                <div className="text-xs font-mono font-semibold text-blue-600 dark:text-cyan-400 mt-0.5">
                  ({CREATOR_INFO.displayName})
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {CREATOR_INFO.role}
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={CREATOR_INFO.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>

                <a
                  href={CREATOR_INFO.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>

            {/* Right: Detailed Credentials */}
            <div className="md:col-span-8 space-y-5 border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10 pt-6 md:pt-0 md:pl-8">
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                  <GraduationCap className="w-4 h-4" />
                  <span>Academic Standing</span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  {CREATOR_INFO.academicProgram}
                </h4>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {CREATOR_INFO.university}
                </p>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <Code2 className="w-4 h-4" />
                  <span>Career & Technical Focus</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {CREATOR_INFO.careerFocus} — {CREATOR_INFO.specialty}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Focusing on distributed intelligence, agentic consensus architectures, neural semantic indexing, and cryptographic proof-of-work verification models for engineering education.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono">
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 text-blue-700 dark:text-cyan-300 font-semibold uppercase">
                  Marwadi University Scholar
                </span>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 text-blue-700 dark:text-blue-300 font-semibold uppercase">
                  Generative AI Specialist
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-white/5 border border-emerald-500/20 dark:border-white/10 text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                  Distributed Systems
                </span>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

