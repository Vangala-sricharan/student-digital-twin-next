import React from 'react';

interface SDTLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SDTLogo: React.FC<SDTLogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Immersive UI Gradient Emblem with Soft Squircle Geometry */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-400 text-white font-bold font-mono shadow-sm border border-white/20 overflow-hidden shrink-0`}
      >
        <span className="leading-none drop-shadow">S</span>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight uppercase text-slate-900 dark:text-white font-sans">
            Student Digital Twin <span className="text-blue-600 dark:text-blue-400 font-extrabold">OS</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Career Readiness OS
          </span>
        </div>
      )}
    </div>
  );
};

