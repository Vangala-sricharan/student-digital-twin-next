import React from 'react';
import { EngineMeta } from '../../types/engines';
import { Sparkles, ArrowLeft, RefreshCw, Copy, Check, ShieldCheck } from 'lucide-react';
import { useStudentTwin } from '../../context/StudentTwinContext';

interface EngineLayoutProps {
  engine: EngineMeta;
  children: React.ReactNode;
  isRunning?: boolean;
  onRunEngine?: () => void;
  onBackToHub?: () => void;
  onNavigateEngine?: (engineId: string) => void;
  resultText?: string;
}

export const EngineLayout: React.FC<EngineLayoutProps> = ({
  engine,
  children,
  isRunning = false,
  onRunEngine,
  onBackToHub,
  resultText,
}) => {
  const { profile, isDemoMode } = useStudentTwin();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Engine Header Card */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-600/10 via-cyan-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative space-y-4">
          
          {/* Top Bar: Breadcrumb & Twin Context Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {onBackToHub && (
                <button
                  onClick={onBackToHub}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 transition-colors flex items-center gap-1 text-xs font-mono font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All 11 Engines</span>
                </button>
              )}

              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 text-blue-600 dark:text-cyan-300">
                Engine {engine.number} of 11 • {engine.category}
              </span>
            </div>

            {/* Twin Context Sync Indicator */}
            <div className="inline-flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Twin: <strong>{profile?.fullName}</strong> ({isDemoMode ? 'Showcase' : 'Verified'})</span>
            </div>
          </div>

          {/* Engine Title & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div className="space-y-1 max-w-3xl">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <span>{engine.name}</span>
                {engine.badge && (
                  <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-700/50">
                    {engine.badge}
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {engine.fullDesc}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              {resultText && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Output'}</span>
                </button>
              )}

              {onRunEngine && (
                <button
                  onClick={onRunEngine}
                  disabled={isRunning}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing Twin...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Execute Engine</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Body */}
      {children}
    </div>
  );
};
