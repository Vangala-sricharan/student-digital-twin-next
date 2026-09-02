import React from 'react';
import { Sparkles, UserPlus, LogOut, ExternalLink } from 'lucide-react';
import { CREATOR_INFO } from '../../data/demoData';

interface DemoBannerProps {
  onExitDemo: () => void;
  onCreateAccount: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onExitDemo, onCreateAccount }) => {
  return (
    <div className="w-full bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-b border-blue-500/30 text-white py-2.5 px-4 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left Indicator */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center md:justify-start">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 font-mono font-bold tracking-wider border border-blue-400/40 text-[11px] animate-pulse">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            DEMO MODE — CREATOR SHOWCASE
          </span>
          <span className="text-slate-200 font-medium text-center sm:text-left">
            Previewing Creator Twin: <strong className="text-white font-semibold">{CREATOR_INFO.displayName}</strong> — Demo ({CREATOR_INFO.university})
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onCreateAccount}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-sm hover:shadow-blue-500/25 cursor-pointer text-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Real Account</span>
          </button>

          <button
            onClick={onExitDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold transition-all cursor-pointer text-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Exit Demo</span>
          </button>
        </div>

      </div>
    </div>
  );
};
