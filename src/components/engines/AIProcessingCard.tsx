import React from 'react';
import { AIJob } from '../../types/aiJobs';
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle, RotateCcw, Cpu } from 'lucide-react';

interface AIProcessingCardProps {
  job: AIJob;
  engineName?: string;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const AIProcessingCard: React.FC<AIProcessingCardProps> = ({
  job,
  engineName,
  onRetry,
}) => {
  const { stages, currentStageIndex, progress, status, error } = job;
  const currentStage = stages[currentStageIndex] || stages[0] || {
    id: 'running',
    label: 'Analyzing profile content & evidence...',
    badge: 'Running Audit',
  };

  const totalSteps = stages.length || 4;
  const currentStepNumber = Math.min(currentStageIndex + 1, totalSteps);

  // If Error State
  if (status === 'error') {
    return (
      <div className="p-6 sm:p-8 rounded-[2rem] bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-sm dark:shadow-xl space-y-4 transition-all animate-in fade-in duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Analysis Interrupted
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5 max-w-xl leading-relaxed">
                {error || 'The analysis took longer than expected or encountered a connectivity timeout.'}
              </p>
            </div>
          </div>

          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl space-y-6 relative overflow-hidden transition-all animate-in fade-in duration-200">
      
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-600/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row: Step Counter & Stage Badge */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-cyan-400 animate-ping" />
          <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
            Step {currentStepNumber} of {totalSteps}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-white/5 border border-blue-200/80 dark:border-white/10 text-blue-700 dark:text-cyan-300 font-mono text-[11px] font-semibold uppercase tracking-wider shadow-sm">
          <RefreshCw className="w-3 h-3 animate-spin text-blue-600 dark:text-cyan-400" />
          <span>{currentStage.badge || 'Running Audit'}</span>
        </div>
      </div>

      {/* Middle Headline: Active Stage Label */}
      <div className="space-y-1 relative z-10">
        <div className="flex items-center gap-3">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
            {currentStage.label}
          </h3>
        </div>
        {engineName && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Operating AI OS Engine: <strong className="text-slate-700 dark:text-slate-300">{engineName}</strong>
          </p>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-2 relative z-10">
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${Math.max(8, Math.min(100, progress))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>AI Inference Pipeline Active</span>
          <span className="font-semibold text-blue-600 dark:text-cyan-400">{progress}%</span>
        </div>
      </div>

      {/* Multi-Step Stages Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-white/5 relative z-10">
        {stages.map((stg, idx) => {
          const isDone = idx < currentStageIndex;
          const isActive = idx === currentStageIndex;
          const isPending = idx > currentStageIndex;

          return (
            <div
              key={stg.id}
              className={`p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                isDone
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/70 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300'
                  : isActive
                  ? 'bg-blue-50/60 dark:bg-white/10 border-blue-300 dark:border-cyan-500/40 text-blue-900 dark:text-white shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 text-slate-400 dark:text-slate-500 opacity-60'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : isActive ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 dark:border-cyan-400 border-t-transparent animate-spin" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-white/10 text-[9px] font-mono font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">
                    {idx + 1}
                  </span>
                )}
              </div>

              <div className="space-y-0.5 overflow-hidden">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider truncate">
                  {stg.badge || `Stage ${idx + 1}`}
                </div>
                <div className="text-[11px] leading-tight truncate">
                  {stg.label.replace(/\.\.\.$/, '')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
