import React from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { Award, Trophy, BookmarkCheck, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';

export const AchievementsView: React.FC = () => {
  const { achievements } = useStudentTwin();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl space-y-2 transition-colors">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wider font-mono">
          Milestones & Proof
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Verified Honors & Milestones
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Cryptographically recorded academic distinctions, hackathon victories, and research fellowships.
        </p>
      </div>

      {/* Grid of Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((a) => (
          <div
            key={a.id}
            className="p-6 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-white/5 border border-amber-200 dark:border-white/5 text-amber-500 dark:text-amber-400">
                  <Trophy className="w-5 h-5" />
                </div>

                <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-semibold uppercase">
                  {a.category}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {a.title}
              </h3>

              <div className="text-xs font-semibold text-blue-600 dark:text-cyan-400">
                Issued by {a.issuer}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {a.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{a.date}</span>
              </span>

              {a.verified && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Distinction</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
