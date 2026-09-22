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
          0%, 100% { 
            filter: drop-shadow(0 0 20px rgba(168,85,247,0.52)) drop-shadow(0 0 36px rgba(56,189,248,0.36)) drop-shadow(0 0 8px rgba(56,189,248,0.78)); 
            transform: translateY(0px) scale(1); 
          }
          50% { 
            filter: drop-shadow(0 0 28px rgba(168,85,247,0.68)) drop-shadow(0 0 46px rgba(56,189,248,0.48)) drop-shadow(0 0 12px rgba(56,189,248,0.92)); 
            transform: translateY(-3px) scale(1.015); 
          }
        }
        @keyframes labelFloatA {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes labelFloatB {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes labelFloatC {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes neonRailPulse {
          0%, 100% { opacity: 0.90; }
          50% { opacity: 1.0; }
        }
        @keyframes nodeGlowPulse {
          0%, 100% { transform: scale(0.95); opacity: 0.88; }
          50% { transform: scale(1.25); opacity: 1.0; }
        }
        @keyframes starTwinkleGlow {
          0%, 100% { opacity: 0.35; transform: scale(0.9); }
          50% { opacity: 0.95; transform: scale(1.15); }
        }
        .anim-twin-presence { animation: twinBreathingGlow 6.5s ease-in-out infinite; }
        .anim-label-a { animation: labelFloatA 5.5s ease-in-out infinite; }
        .anim-label-b { animation: labelFloatB 6.2s ease-in-out infinite 0.8s; }
        .anim-label-c { animation: labelFloatC 7.0s ease-in-out infinite 1.6s; }
        .anim-rail-pulse { animation: neonRailPulse 5s ease-in-out infinite; }
        .anim-node-pulse { animation: nodeGlowPulse 4s ease-in-out infinite; transform-origin: center; }
        .anim-star-twinkle { animation: starTwinkleGlow 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .anim-twin-presence, .anim-label-a, .anim-label-b, .anim-label-c, .anim-rail-pulse, .anim-node-pulse, .anim-star-twinkle {
            animation: none !important;
          }
        }
      `}</style>

      {/* Cinematic Orbital Intelligence Hub Stage (Expanded Dimensions for Dominant Presence) */}
      <div className="relative w-full max-w-[430px] sm:max-w-[480px] lg:max-w-[450px] xl:max-w-[500px] aspect-[500/500] mx-auto flex items-center justify-center">
        
        {/* Multi-Tier Dimensional Atmospheric Nebula Aura Behind Digital Twin (Deep Purple, Indigo & Electric Blue) */}
        <div 
          className="absolute inset-4 sm:inset-6 rounded-full blur-[42px] pointer-events-none opacity-45 dark:opacity-50 z-[1]"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.45) 0%, rgba(126, 34, 206, 0.32) 32%, rgba(79, 70, 229, 0.22) 55%, rgba(56, 189, 248, 0.12) 72%, transparent 85%)'
          }}
        />
        <div 
          className="absolute inset-10 sm:inset-12 rounded-full blur-[24px] pointer-events-none opacity-35 dark:opacity-40 z-[2]"
          style={{
            background: 'radial-gradient(circle, rgba(126, 34, 206, 0.45) 0%, rgba(59, 130, 246, 0.20) 60%, transparent 80%)'
          }}
        />

        {/* =========================================================================
            CINEMATIC NEON RAILS & CONNECTED INTELLIGENCE ORBIT SYSTEM (IMAGE B STYLE)
            - Clearly visible at first glance
            - Thin, crisp, and elegant with electric blue + violet + bright purple neon
            - Naturally curving around the Digital Twin
            - Intentional docking nodes physically connecting each of the 5 feature tags
            - Positioned behind tags (z-20) and Digital Twin (z-10), yet clearly above space bg (z-[5])
           ========================================================================= */}
        <svg
          viewBox="0 0 500 500"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-[5]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Controlled Neon Bloom Filter for Rails */}
            <filter id="neonBloomRail" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.2" result="glow1" />
              <feGaussianBlur stdDeviation="5.5" result="glow2" />
              <feMerge>
                <feMergeNode in="glow2" />
                <feMergeNode in="glow1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* High-Contrast Neon Rail Gradient (Electric Blue -> Violet -> Bright Purple -> Cyan) */}
            <linearGradient id="primaryRailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.96" />
              <stop offset="22%" stopColor="#818cf8" stopOpacity="0.94" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.98" />
              <stop offset="78%" stopColor="#8b5cf6" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.96" />
            </linearGradient>

            {/* Secondary Harmonic Rail Gradient */}
            <linearGradient id="secondaryRailGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.80" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.82" />
            </linearGradient>

            {/* Radial Glow for Electric Blue / Cyan Docking Nodes */}
            <radialGradient id="nodeGlowCyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#818cf8" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>

            {/* Radial Glow for Purple / Violet Docking Nodes */}
            <radialGradient id="nodeGlowPurple" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#a855f7" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#c084fc" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Outer Auxiliary Orbit Track (Celestial Atmosphere) */}
          <g className="opacity-55">
            <ellipse
              cx="250"
              cy="250"
              rx="242"
              ry="185"
              transform="rotate(-18 250 250)"
              stroke="url(#secondaryRailGrad)"
              strokeWidth="1.2"
              strokeDasharray="4 8"
              fill="none"
            />
          </g>

          {/* 2. THE CINEMATIC NEON RAILS (Connecting all 5 feature tags in an intentional circuit) */}
          <g className="anim-rail-pulse">
            {/* Ambient rail glow halo under-stroke (soft diffuse neon bloom) */}
            <path
              d="M 250,40 C 160,40 75,85 75,135 C 75,230 135,355 250,460 C 355,395 425,350 425,315 C 425,245 425,160 425,100 C 425,60 340,40 250,40 Z"
              stroke="url(#primaryRailGrad)"
              strokeWidth="4.2"
              strokeOpacity="0.45"
              filter="url(#neonBloomRail)"
              fill="none"
            />

            {/* Vibrant luminous primary rail line */}
            <path
              d="M 250,40 C 160,40 75,85 75,135 C 75,230 135,355 250,460 C 355,395 425,350 425,315 C 425,245 425,160 425,100 C 425,60 340,40 250,40 Z"
              stroke="url(#primaryRailGrad)"
              strokeWidth="2.0"
              strokeOpacity="0.96"
              fill="none"
            />

            {/* Ultra-crisp thin core highlight (authentic glowing neon wire appearance) */}
            <path
              d="M 250,40 C 160,40 75,85 75,135 C 75,230 135,355 250,460 C 355,395 425,350 425,315 C 425,245 425,160 425,100 C 425,60 340,40 250,40 Z"
              stroke="#bae6fd"
              strokeWidth="0.7"
              strokeOpacity="0.70"
              fill="none"
            />

            {/* Inner secondary harmonic rail (layered dimensional depth) */}
            <path
              d="M 250,70 C 165,70 115,110 115,160 C 115,240 160,340 250,425 C 335,345 385,285 385,235 C 385,165 335,70 250,70 Z"
              stroke="url(#secondaryRailGrad)"
              strokeWidth="1.4"
              strokeDasharray="6 6"
              strokeOpacity="0.80"
              fill="none"
            />

            {/* Intentional Docking Rails / Neon Spoke Connectors to Tag Mounts */}
            {/* Top Docking Spoke to Skills Analysis */}
            <line x1="250" y1="40" x2="250" y2="14" stroke="#38bdf8" strokeWidth="2.0" strokeLinecap="round" />
            <line x1="250" y1="40" x2="250" y2="14" stroke="#e0f2fe" strokeWidth="0.7" strokeLinecap="round" />

            {/* Left Upper-Middle Docking Spoke to Real-time Insights */}
            <path d="M 75,135 L 35,135" stroke="#38bdf8" strokeWidth="2.0" strokeLinecap="round" />
            <path d="M 75,135 L 35,135" stroke="#e0f2fe" strokeWidth="0.7" strokeLinecap="round" />

            {/* Upper-Right Docking Spoke to Projects */}
            <path d="M 425,100 L 465,100" stroke="#38bdf8" strokeWidth="2.0" strokeLinecap="round" />
            <path d="M 425,100 L 465,100" stroke="#e0f2fe" strokeWidth="0.7" strokeLinecap="round" />

            {/* Mid-Right Docking Spoke to Career Growth */}
            <path d="M 425,315 L 465,315" stroke="#a855f7" strokeWidth="2.0" strokeLinecap="round" />
            <path d="M 425,315 L 465,315" stroke="#f3e8ff" strokeWidth="0.7" strokeLinecap="round" />

            {/* Bottom Docking Spoke to AI Guidance */}
            <line x1="250" y1="460" x2="250" y2="486" stroke="#38bdf8" strokeWidth="2.0" strokeLinecap="round" />
            <line x1="250" y1="460" x2="250" y2="486" stroke="#e0f2fe" strokeWidth="0.7" strokeLinecap="round" />
          </g>

          {/* 3. LUMINOUS RAIL CONNECTION NODES (Image B Connection Points) */}
          <g>
            {/* Node 1: Skills Analysis Dock (TOP: 250, 40) */}
            <circle cx="250" cy="40" r="10" fill="url(#nodeGlowCyan)" className="anim-node-pulse" />
            <circle cx="250" cy="40" r="4.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
            <circle cx="250" cy="40" r="1.8" fill="#ffffff" />

            {/* Node 2: Real-time Insights Dock (LEFT UPPER-MIDDLE: 75, 135) */}
            <circle cx="75" cy="135" r="10" fill="url(#nodeGlowCyan)" className="anim-node-pulse" />
            <circle cx="75" cy="135" r="4.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
            <circle cx="75" cy="135" r="1.8" fill="#ffffff" />

            {/* Node 3: Projects Dock (UPPER-RIGHT: 425, 100) */}
            <circle cx="425" cy="100" r="10" fill="url(#nodeGlowCyan)" className="anim-node-pulse" />
            <circle cx="425" cy="100" r="4.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
            <circle cx="425" cy="100" r="1.8" fill="#ffffff" />

            {/* Node 4: Career Growth Dock (MID-RIGHT: 425, 315) */}
            <circle cx="425" cy="315" r="10" fill="url(#nodeGlowPurple)" className="anim-node-pulse" />
            <circle cx="425" cy="315" r="4.2" fill="#a855f7" stroke="#ffffff" strokeWidth="1" />
            <circle cx="425" cy="315" r="1.8" fill="#ffffff" />

            {/* Node 5: AI Guidance Dock (LOWER: 250, 460) */}
            <circle cx="250" cy="460" r="10" fill="url(#nodeGlowCyan)" className="anim-node-pulse" />
            <circle cx="250" cy="460" r="4.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
            <circle cx="250" cy="460" r="1.8" fill="#ffffff" />
          </g>

          {/* 4. Deep Space Micro-Star Nodes */}
          <g className="anim-star-twinkle opacity-75">
            <circle cx="58" cy="85" r="1.5" fill="#ffffff" />
            <circle cx="205" cy="24" r="1.6" fill="#e9d5ff" />
            <circle cx="448" cy="145" r="1.5" fill="#38bdf8" />
            <circle cx="462" cy="335" r="1.6" fill="#c084fc" />
            <circle cx="55" cy="370" r="1.3" fill="#a5f3fc" />
            <circle cx="370" cy="485" r="1.5" fill="#818cf8" />
          </g>
        </svg>

        {/* The Dominant Student Digital Twin Centerpiece (Dimensional Illumination) */}
        <div className="relative w-[82%] h-[82%] max-w-[370px] sm:max-w-[390px] aspect-square flex items-center justify-center p-1 z-10 anim-twin-presence">
          <img
            id="center-digital-twin-logo"
            src="/assets/digital-twin.svg"
            alt="Student Digital Twin"
            className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(147,51,234,0.48)] drop-shadow-[0_0_36px_rgba(59,130,246,0.32)] drop-shadow-[0_0_6px_rgba(56,189,248,0.65)] transition-all"
            draggable={false}
          />
        </div>

        {/* =========================================================================
            FIVE FEATURE TAGS — TARGET B CINEMATIC "NIGHT RAIL" TREATMENT
            - Dark glass/navy interior
            - Purple luminous border
            - Subtle blue/cyan secondary glow
            - Controlled purple neon outer glow
            - Crisp white text
            - Clean icon
            - Premium glass depth
            - Subtle shadow
            - Consistent visual language across ALL 5 TAGS
           ========================================================================= */}

        {/* 1. TOP: Skills Analysis */}
        <div 
          id="badge-skills-analysis"
          className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#020514]/92 dark:bg-[#020514]/92 backdrop-blur-md border border-purple-500/50 hover:border-purple-400/80 text-white shadow-[0_0_16px_rgba(168,85,247,0.36),0_0_6px_rgba(56,189,248,0.24),inset_0_1px_1px_rgba(255,255,255,0.18)] flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold whitespace-nowrap z-20 anim-label-a hover:scale-105 transition-all group cursor-default"
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          <span className="tracking-wide text-white">Skills Analysis</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
        </div>

        {/* 2. LEFT / UPPER-MIDDLE: Real-time Insights (Farther out, cleanly clear of twin & headline) */}
        <div 
          id="badge-realtime-insights"
          className="absolute top-[19%] sm:top-[20%] -left-1 sm:left-0 md:-left-1 lg:left-0 xl:left-0.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#020514]/92 dark:bg-[#020514]/92 backdrop-blur-md border border-purple-500/50 hover:border-purple-400/80 text-white shadow-[0_0_16px_rgba(168,85,247,0.36),0_0_6px_rgba(56,189,248,0.24),inset_0_1px_1px_rgba(255,255,255,0.18)] flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold whitespace-nowrap z-20 anim-label-b hover:scale-105 transition-all group cursor-default"
        >
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          <span className="tracking-wide text-white">Real-time Insights</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
        </div>

        {/* 3. UPPER-RIGHT: Projects (Diagonally above forehead, spacious) */}
        <div 
          id="badge-projects"
          className="absolute top-[11%] sm:top-[12%] right-1 sm:right-2 md:right-1 lg:right-2 xl:right-2.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#020514]/92 dark:bg-[#020514]/92 backdrop-blur-md border border-purple-500/50 hover:border-purple-400/80 text-white shadow-[0_0_16px_rgba(168,85,247,0.36),0_0_6px_rgba(56,189,248,0.24),inset_0_1px_1px_rgba(255,255,255,0.18)] flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold whitespace-nowrap z-20 anim-label-c hover:scale-105 transition-all group cursor-default"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          <span className="tracking-wide text-white">Projects</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
        </div>

        {/* 4. RIGHT / MID-RIGHT: Career Growth (Spaced well below Projects) */}
        <div 
          id="badge-career-growth"
          className="absolute top-[60%] sm:top-[62%] right-1 sm:right-2 md:right-1 lg:right-2 xl:right-2.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#020514]/92 dark:bg-[#020514]/92 backdrop-blur-md border border-purple-500/50 hover:border-purple-400/80 text-white shadow-[0_0_16px_rgba(168,85,247,0.36),0_0_6px_rgba(56,189,248,0.24),inset_0_1px_1px_rgba(255,255,255,0.18)] flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold whitespace-nowrap z-20 anim-label-a hover:scale-105 transition-all group cursor-default"
        >
          <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          <span className="tracking-wide text-white">Career Growth</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
        </div>

        {/* 5. LOWER: AI Guidance (Centered below neck) */}
        <div 
          id="badge-ai-guidance"
          className="absolute -bottom-2.5 sm:-bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#020514]/92 dark:bg-[#020514]/92 backdrop-blur-md border border-purple-500/50 hover:border-purple-400/80 text-white shadow-[0_0_16px_rgba(168,85,247,0.36),0_0_6px_rgba(56,189,248,0.24),inset_0_1px_1px_rgba(255,255,255,0.18)] flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold whitespace-nowrap z-20 anim-label-b hover:scale-105 transition-all group cursor-default"
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          <span className="tracking-wide text-white">AI Guidance</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />
        </div>

      </div>
    </div>
  );
};

