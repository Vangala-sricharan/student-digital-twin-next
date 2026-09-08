import React from 'react';

export const FunTimeExitOverlay: React.FC = () => {
  return (
    <div
      id="fun-time-exit-overlay"
      className="fixed inset-0 z-[100005] bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none transition-opacity duration-300 animate-fade-in"
    >
      <div className="flex flex-col items-center justify-center text-center space-y-2 transform transition-transform animate-scale-up">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-lg">
          👋
        </div>
        <p className="text-xs font-mono font-bold text-white tracking-widest uppercase">
          Returning to Career OS...
        </p>
      </div>
    </div>
  );
};
