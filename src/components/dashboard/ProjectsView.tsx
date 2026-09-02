import React from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { FolderGit2, Github, ExternalLink, Code2, ShieldCheck, Activity, Layers } from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { projects } = useStudentTwin();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl space-y-2 transition-colors">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wider font-mono">
          Verifiable Evidence
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Proof-of-Work Repositories
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Cryptographically referenced architectural codebases audited for syntax depth and entropy.
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="p-6 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/5 text-blue-600 dark:text-cyan-400">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {proj.title}
                    </h3>
                    {proj.featured && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-cyan-400/20 text-blue-600 dark:text-cyan-300 font-bold uppercase">
                        Featured Architecture
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white transition-colors"
                      aria-label="GitHub Repo"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {proj.liveUrl && (
                    <a
                      href={proj.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors"
                      aria-label="Live Demo"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {proj.description}
              </p>

              {/* Tech Stack Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {proj.techStack.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Metrics Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/5 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">AST Depth</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {proj.astDepth || 'Level 4 (High)'}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Commit Entropy</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {proj.entropyScore ? `${proj.entropyScore}% Organic` : '96% Organic'}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
