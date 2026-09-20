import React from 'react';
import { BarChart3, TrendingUp, FolderGit2, Target, Bot } from 'lucide-react';

interface CentralDigitalTwinProps {
  className?: string;
}

export const CentralDigitalTwin: React.FC<CentralDigitalTwinProps> = ({ className = '' }) => {
  return (
    <div 
      className={`relative w-full select-none ${className}`} 
      id="central-digital-twin-container"
    >
      <style>{`
        @keyframes twinBreathingGlow {
          0%, 100% { filter: drop-shadow(0 0 35px rgba(168,85,247,0.45)) drop-shadow(0 0 70px rgba(56,189,248,0.25)); transform: translateY(0px); }
          50% { filter: drop-shadow(0 0 50px rgba(168,85,247,0.65)) drop-shadow(0 0 90px rgba(56,189,248,0.4)); transform: translateY(-7px); }
        }
        @keyframes labelFloatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes labelFloatFast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes orbitSubtlePulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.65; }
        }
        .anim-twin-presence { animation: twinBreathingGlow 7s ease-in-out infinite; }
        .anim-label-a { animation: labelFloatSlow 5.5s ease-in-out infinite; }
        .anim-label-b { animation: labelFloatFast 6.5s ease-in-out infinite 1.2s; }
        .anim-label-c { animation: labelFloatSlow 7.5s ease-in-out infinite 2.4s; }
        .anim-orbit-line { animation: orbitSubtlePulse 5s ease-in-out infinite; }
      `}</style>

      {/* Massive Visual Focal Point Stage */}
      <div className="relative w-full max-w-[500px] sm:max-w-[560px] lg:max-w-[520px] xl:max-w-[620px] 2xl:max-w-[680px] mx-auto aspect-[520/540] flex items-center justify-center">
        
        {/* Deep Volumetric Blue-Cyan Nebula Core Behind Head (Harmonized with Blue Galaxy) */}
        <div 
          className="absolute inset-4 sm:inset-6 rounded-full blur-[90px] pointer-events-none opacity-65 dark:opacity-85"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.55) 0%, rgba(37, 99, 235, 0.45) 35%, rgba(147, 51, 234, 0.2) 65%, transparent 80%)'
          }}
        />

        {/* Secondary Frontal Electric Cyan Edge Glow */}
        <div 
          className="absolute right-2 top-10 w-[340px] h-[340px] rounded-full blur-[75px] pointer-events-none opacity-40 dark:opacity-65"
          style={{
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.55) 0%, rgba(37, 99, 235, 0.3) 50%, transparent 75%)'
          }}
        />

        {/* The Dominant Solid Dimensional Digital Twin Centerpiece */}
        <svg
          viewBox="0 0 520 540"
          className="w-full h-full overflow-visible anim-twin-presence"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Solid Volumetric 3D Material Gradient for Head: Violet to Royal Purple to Indigo */}
            <linearGradient id="solidHeadBodyGrad" x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#d8b4fe" />
              <stop offset="18%" stopColor="#c084fc" />
              <stop offset="42%" stopColor="#9333ea" />
              <stop offset="70%" stopColor="#6b21a8" />
              <stop offset="90%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#2e1065" />
            </linearGradient>

            {/* Rear Twin Shadow Profile (Creates iconic dual-depth) */}
            <linearGradient id="twinDepthRearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#4338ca" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.85" />
            </linearGradient>

            {/* Dimensional 3D Spherical Catchlight Shader */}
            <radialGradient id="cranialSpecularGlow" cx="42%" cy="28%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="25%" stopColor="#e9d5ff" stopOpacity="0.3" />
              <stop offset="65%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>

            {/* Brilliant Neon Cyan-to-White Razor Facial Rim Light */}
            <linearGradient id="facialProfileRimLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="25%" stopColor="#a5f3fc" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Circuit Cutout Trench Shader: Deep Recessed Depth */}
            <linearGradient id="circuitTrenchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e1035" />
              <stop offset="60%" stopColor="#2e1065" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>

            {/* Glowing Circuit Core Filament */}
            <linearGradient id="circuitCoreGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="75%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#a5f3fc" />
            </linearGradient>

            {/* Neon Bloom Filter */}
            <filter id="neonRimBloom" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Heavy Monolithic Dimensional Shadow */}
            <filter id="heavyMonolithShadow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="-6" dy="16" stdDeviation="22" floodColor="#0a051d" floodOpacity="0.85" />
            </filter>
          </defs>

          {/* 1. Orbit Ellipses & Constellation Tracers */}
          <g className="anim-orbit-line pointer-events-none">
            {/* Outer Orbit Path */}
            <ellipse
              cx="285"
              cy="270"
              rx="240"
              ry="195"
              transform="rotate(-18 285 270)"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeOpacity="0.45"
              strokeDasharray="5 7"
              fill="none"
            />
            {/* Inner Concentric Orbit Path */}
            <ellipse
              cx="275"
              cy="275"
              rx="205"
              ry="155"
              transform="rotate(22 275 275)"
              stroke="#c084fc"
              strokeWidth="1.2"
              strokeOpacity="0.4"
              strokeDasharray="4 6"
              fill="none"
            />
            {/* Orbit Satellite Nodes */}
            <circle cx="85" cy="190" r="4.5" fill="#38bdf8" filter="url(#neonRimBloom)" />
            <circle cx="455" cy="170" r="3.5" fill="#c084fc" />
            <circle cx="420" cy="425" r="4.5" fill="#38bdf8" filter="url(#neonRimBloom)" />
            <circle cx="125" cy="395" r="3.5" fill="#818cf8" />
          </g>

          {/* 2. Constellation Connecting Lines to Floating Badges */}
          {/* Connector to "Skills Analysis" (Top) */}
          <path
            d="M 290 65 L 260 18"
            stroke="#c084fc"
            strokeWidth="1.8"
            strokeDasharray="3 3"
            strokeOpacity="0.8"
          />
          <circle cx="290" cy="65" r="4" fill="#e9d5ff" filter="url(#neonRimBloom)" />

          {/* Connector to "Real-time Insights" (Upper Left) */}
          <path
            d="M 120 125 L 30 80"
            stroke="#38bdf8"
            strokeWidth="1.8"
            strokeDasharray="3 3"
            strokeOpacity="0.8"
          />
          <circle cx="120" cy="125" r="4" fill="#38bdf8" filter="url(#neonRimBloom)" />

          {/* Connector to "Projects" (Upper Right) */}
          <path
            d="M 380 150 L 450 90"
            stroke="#a855f7"
            strokeWidth="1.8"
            strokeDasharray="3 3"
            strokeOpacity="0.8"
          />
          <circle cx="380" cy="150" r="4" fill="#a855f7" filter="url(#neonRimBloom)" />

          {/* Connector to "Career Growth" (Far Upper Right) */}
          <path
            d="M 415 220 L 490 170"
            stroke="#818cf8"
            strokeWidth="1.8"
            strokeDasharray="3 3"
            strokeOpacity="0.7"
          />
          <circle cx="415" cy="220" r="4" fill="#818cf8" filter="url(#neonRimBloom)" />

          {/* Connector to "AI Guidance" (Bottom Left) */}
          <path
            d="M 165 375 L 70 380"
            stroke="#c084fc"
            strokeWidth="1.8"
            strokeDasharray="3 3"
            strokeOpacity="0.8"
          />
          <circle cx="165" cy="375" r="4" fill="#c084fc" filter="url(#neonRimBloom)" />

          {/* 3. Rear Head Silhouette (Offset 3D Twin Depth) */}
          <path
            d="M 345 55 
               C 260 55, 190 115, 190 205 
               C 190 275, 215 320, 245 345 
               L 245 475 
               L 375 475 
               L 375 400 
               C 390 395, 404 380, 410 355 
               C 415 345, 404 336, 414 322 
               C 422 312, 396 284, 402 258 
               C 410 222, 420 165, 402 125 
               C 382 82, 365 55, 345 55 Z"
            fill="url(#twinDepthRearGrad)"
            stroke="#818cf8"
            strokeWidth="2.5"
            strokeOpacity="0.4"
          />

          {/* 4. PRIMARY SOLID HEAD MONOLITH (Heavy Visual Weight, Solid Opaque Mass) */}
          <g filter="url(#heavyMonolithShadow)">
            {/* Solid Head Base Silhouette */}
            <path
              d="M 265 55 
                 C 175 55, 105 115, 105 205 
                 C 105 275, 132 320, 162 345 
                 L 162 475 
                 L 295 475 
                 L 295 400 
                 C 310 395, 324 380, 330 355 
                 C 335 345, 324 336, 334 322 
                 C 342 312, 316 284, 322 258 
                 C 330 222, 340 165, 322 125 
                 C 302 82, 285 55, 265 55 Z"
              fill="url(#solidHeadBodyGrad)"
            />

            {/* Volumetric 3D Spherical Cranial Catchlight Overlay */}
            <path
              d="M 265 55 
                 C 175 55, 105 115, 105 205 
                 C 105 275, 132 320, 162 345 
                 L 162 475 
                 L 295 475 
                 L 295 400 
                 C 310 395, 324 380, 330 355 
                 C 335 345, 324 336, 334 322 
                 C 342 312, 316 284, 322 258 
                 C 330 222, 340 165, 322 125 
                 C 302 82, 285 55, 265 55 Z"
              fill="url(#cranialSpecularGlow)"
              style={{ mixBlendMode: 'screen' }}
            />

            {/* Specular Highlight Streak along Upper Cranium */}
            <path
              d="M 135 185 C 135 125, 195 72, 265 65"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeOpacity="0.6"
              fill="none"
            />
          </g>

          {/* 5. FOUR SOLID EMBEDDED CIRCUIT CUTOUTS WITH GLOWING TERMINAL NODES */}
          
          {/* Circuit 1: Top cranial circuit - turns UP 90 degrees */}
          <g>
            {/* Recessed Trench Background */}
            <path
              d="M 105 165 L 215 165 L 215 115"
              stroke="url(#circuitTrenchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Glowing Core Filament */}
            <path
              d="M 105 165 L 215 165 L 215 115"
              stroke="url(#circuitCoreGlow)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonRimBloom)"
            />
            {/* Outer Terminal Pad Ring */}
            <circle 
              cx="215" 
              cy="115" 
              r="20" 
              fill="url(#solidHeadBodyGrad)" 
              stroke="#38bdf8" 
              strokeWidth="5" 
              filter="url(#neonRimBloom)" 
            />
            {/* Inner Glowing Aperture */}
            <circle cx="215" cy="115" r="7.5" fill="#ffffff" filter="url(#neonRimBloom)" />
          </g>

          {/* Circuit 2: Mid-cranial major horizontal circuit */}
          <g>
            <path
              d="M 105 225 L 265 225"
              stroke="url(#circuitTrenchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M 105 225 L 265 225"
              stroke="url(#circuitCoreGlow)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#neonRimBloom)"
            />
            <circle 
              cx="265" 
              cy="225" 
              r="20" 
              fill="url(#solidHeadBodyGrad)" 
              stroke="#38bdf8" 
              strokeWidth="5" 
              filter="url(#neonRimBloom)" 
            />
            <circle cx="265" cy="225" r="7.5" fill="#ffffff" filter="url(#neonRimBloom)" />
          </g>

          {/* Circuit 3: Cheek horizontal circuit */}
          <g>
            <path
              d="M 107 285 L 215 285"
              stroke="url(#circuitTrenchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M 107 285 L 215 285"
              stroke="url(#circuitCoreGlow)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#neonRimBloom)"
            />
            <circle 
              cx="215" 
              cy="285" 
              r="20" 
              fill="url(#solidHeadBodyGrad)" 
              stroke="#38bdf8" 
              strokeWidth="5" 
              filter="url(#neonRimBloom)" 
            />
            <circle cx="215" cy="285" r="7.5" fill="#ffffff" filter="url(#neonRimBloom)" />
          </g>

          {/* Circuit 4: Lower cheek/jaw horizontal circuit */}
          <g>
            <path
              d="M 118 345 L 255 345"
              stroke="url(#circuitTrenchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M 118 345 L 255 345"
              stroke="url(#circuitCoreGlow)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#neonRimBloom)"
            />
            <circle 
              cx="255" 
              cy="345" 
              r="20" 
              fill="url(#solidHeadBodyGrad)" 
              stroke="#38bdf8" 
              strokeWidth="5" 
              filter="url(#neonRimBloom)" 
            />
            <circle cx="255" cy="345" r="7.5" fill="#ffffff" filter="url(#neonRimBloom)" />
          </g>

          {/* Circuit 5: Neck descending circuit */}
          <g>
            <path
              d="M 162 405 L 210 405 L 210 445"
              stroke="url(#circuitTrenchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 162 405 L 210 405 L 210 445"
              stroke="url(#circuitCoreGlow)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonRimBloom)"
            />
            <circle 
              cx="210" 
              cy="445" 
              r="20" 
              fill="url(#solidHeadBodyGrad)" 
              stroke="#38bdf8" 
              strokeWidth="5" 
              filter="url(#neonRimBloom)" 
            />
            <circle cx="210" cy="445" r="7.5" fill="#ffffff" filter="url(#neonRimBloom)" />
          </g>

          {/* 6. GLOWING FACIAL PROFILE RIM LIGHT (Razor-Sharp Neon Cyan-White Edge) */}
          <path
            d="M 265 55
               C 285 55, 302 82, 322 125 
               C 340 165, 330 222, 322 258 
               C 316 284, 342 312, 334 322 
               C 324 336, 335 345, 330 355 
               C 324 380, 310 395, 295 400 
               L 295 475"
            stroke="url(#facialProfileRimLight)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#neonRimBloom)"
          />

          {/* Inner Cyan Glow Contour along Face */}
          <path
            d="M 265 60
               C 283 60, 298 85, 318 126 
               C 334 164, 326 218, 318 254 
               C 313 278, 337 308, 330 318 
               C 322 330, 331 340, 326 350 
               C 320 372, 308 388, 295 395"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.6"
            fill="none"
          />
        </svg>

        {/* 7. Repositioned Floating Intelligence Badges Orbiting Around the Heavy Visual Centerpiece */}
        
        {/* Label 1: Skills Analysis (Top Center) */}
        <div 
          id="badge-skills-analysis"
          className="anim-label-a absolute -top-5 sm:-top-7 left-1/2 -translate-x-1/2 z-30"
        >
          <div className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white/95 dark:bg-[#060c24]/95 backdrop-blur-md border border-slate-200/90 dark:border-blue-500/50 text-slate-900 dark:text-white shadow-xl dark:shadow-[0_0_25px_rgba(37,99,235,0.45)] flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span className="tracking-wide">Skills Analysis</span>
          </div>
        </div>

        {/* Label 2: Real-time Insights (Upper Left Flank) */}
        <div 
          id="badge-realtime-insights"
          className="anim-label-b absolute top-[9%] -left-4 sm:-left-7 lg:-left-9 xl:-left-12 z-30"
        >
          <div className="px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-white/95 dark:bg-[#060c24]/95 backdrop-blur-md border border-slate-200/90 dark:border-cyan-500/50 text-slate-900 dark:text-white shadow-xl dark:shadow-[0_0_24px_rgba(6,182,212,0.45)] flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-cyan-300 shrink-0" />
            <span className="tracking-wide">Real-time Insights</span>
          </div>
        </div>

        {/* Label 3: Projects (Upper Right Flank) */}
        <div 
          id="badge-projects"
          className="anim-label-c absolute top-[3%] right-1 sm:-right-4 lg:-right-2 xl:-right-8 z-30"
        >
          <div className="px-4 py-2 sm:px-4.5 sm:py-2 rounded-xl bg-white/95 dark:bg-[#060c24]/95 backdrop-blur-md border border-slate-200/90 dark:border-sky-500/50 text-slate-900 dark:text-white shadow-xl dark:shadow-[0_0_24px_rgba(14,165,233,0.45)] flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all">
            <FolderGit2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="tracking-wide">Projects</span>
          </div>
        </div>

        {/* Label 4: Career Growth (Far Upper Right) */}
        <div 
          id="badge-career-growth"
          className="anim-label-a absolute top-[14%] right-[-14%] sm:right-[-18%] xl:right-[-28%] hidden sm:flex z-30"
        >
          <div className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white/95 dark:bg-[#060c24]/95 backdrop-blur-md border border-slate-200/90 dark:border-indigo-500/50 text-slate-900 dark:text-white shadow-xl dark:shadow-[0_0_25px_rgba(99,102,241,0.45)] flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all">
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="tracking-wide">Career Growth</span>
          </div>
        </div>

        {/* Label 5: AI Guidance (Bottom Left Flank) */}
        <div 
          id="badge-ai-guidance"
          className="anim-label-b absolute bottom-[27%] -left-4 sm:-left-7 lg:-left-9 xl:-left-12 z-30"
        >
          <div className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white/95 dark:bg-[#060c24]/95 backdrop-blur-md border border-slate-200/90 dark:border-blue-500/50 text-slate-900 dark:text-white shadow-xl dark:shadow-[0_0_25px_rgba(37,99,235,0.45)] flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-all">
            <Bot className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
            <span className="tracking-wide">AI Guidance</span>
          </div>
        </div>

      </div>
    </div>
  );
};
