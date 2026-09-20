import React from 'react';

interface SDTLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const SDTLogo: React.FC<SDTLogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Exact Digital Twin Dual-Head Logo from IMAGE 2 */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-900/60 via-indigo-950/60 to-slate-950 p-0.5 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.25)] shrink-0 overflow-hidden group`}
      >
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-0.5"
        >
          <defs>
            {/* Smooth Violet-to-Purple-to-Blue Gradient */}
            <linearGradient id="sdtLogoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>

          {/* Rear Head (The Twin) - Offset to the right */}
          <path
            d="M 335 45 C 365 45, 392 75, 404 115 C 410 135, 414 155, 414 175 C 414 185, 406 188, 404 195 C 402 202, 422 218, 438 230 C 438 236, 428 244, 418 246 C 416 252, 422 255, 426 260 C 424 264, 416 266, 414 270 C 416 274, 422 277, 424 282 C 424 288, 416 292, 414 296 C 414 305, 426 312, 428 320 C 428 332, 412 348, 392 355 C 386 375, 385 415, 385 455 L 232 455 L 232 355 C 202 325, 175 275, 175 205 C 175 115, 245 45, 335 45 Z"
            fill="url(#sdtLogoGrad)"
          />

          {/* Front Head (Primary) */}
          <path
            d="M 255 45 C 285 45, 312 75, 324 115 C 330 135, 334 155, 334 175 C 334 185, 326 188, 324 195 C 322 202, 342 218, 358 230 C 358 236, 348 244, 338 246 C 336 252, 342 255, 346 260 C 344 264, 336 266, 334 270 C 336 274, 342 277, 344 282 C 344 288, 336 292, 334 296 C 334 305, 346 312, 348 320 C 348 332, 332 348, 312 355 C 306 375, 305 415, 305 455 L 152 455 L 152 355 C 122 325, 95 275, 95 205 C 95 115, 165 45, 255 45 Z"
            fill="url(#sdtLogoGrad)"
            stroke="#ffffff"
            strokeWidth="12"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 5 Circuit Traces with Terminal Ring Nodes (matching IMAGE 2) */}
          {/* Trace 1: Top cranial circuit - turns UP 90 degrees */}
          <path
            d="M 95 165 L 210 165 L 210 115"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="210" cy="115" r="16" fill="url(#sdtLogoGrad)" stroke="#ffffff" strokeWidth="12" />

          {/* Trace 2: Mid-cranial horizontal circuit */}
          <path
            d="M 95 220 L 255 220"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="255" cy="220" r="16" fill="url(#sdtLogoGrad)" stroke="#ffffff" strokeWidth="12" />

          {/* Trace 3: Cheek horizontal circuit */}
          <path
            d="M 97 275 L 205 275"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="205" cy="275" r="16" fill="url(#sdtLogoGrad)" stroke="#ffffff" strokeWidth="12" />

          {/* Trace 4: Lower cheek/jaw horizontal circuit */}
          <path
            d="M 108 330 L 245 330"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="245" cy="330" r="16" fill="url(#sdtLogoGrad)" stroke="#ffffff" strokeWidth="12" />

          {/* Trace 5: Neck circuit - turns DOWN 90 degrees */}
          <path
            d="M 152 385 L 200 385 L 200 425"
            stroke="#ffffff"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="200" cy="425" r="16" fill="url(#sdtLogoGrad)" stroke="#ffffff" strokeWidth="12" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-[13px] sm:text-[14px] font-extrabold tracking-tight uppercase text-slate-900 dark:text-white font-sans">
            Student Digital Twin <span className="text-blue-600 dark:text-cyan-400 font-extrabold">OS</span>
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 font-mono">
            Career Readiness OS
          </span>
        </div>
      )}
    </div>
  );
};
