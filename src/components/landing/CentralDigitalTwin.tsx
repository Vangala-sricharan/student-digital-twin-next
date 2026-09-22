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

        /* Orbital Rails CSS - Organic Sweeping Asymmetric Arcs */
        @keyframes orbitalRailLuminescence {
          0%, 100% { 
            opacity: 0.88;
            filter: drop-shadow(0 0 4px rgba(56,189,248,0.45)) drop-shadow(0 0 10px rgba(168,85,247,0.32));
          }
          50% { 
            opacity: 1.0;
            filter: drop-shadow(0 0 7px rgba(56,189,248,0.72)) drop-shadow(0 0 16px rgba(168,85,247,0.52));
          }
        }
        @keyframes orbitalStreamFlow {
          from { stroke-dashoffset: 240; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes orbitalStreamFlowReverse {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 240; }
        }
        @keyframes orbitalFeederGaze {
          0%, 100% { 
            opacity: 0.72;
            stroke-width: 1.3px;
          }
          50% { 
            opacity: 1.0;
            stroke-width: 1.8px;
            filter: drop-shadow(0 0 6px rgba(56,189,248,0.85));
          }
        }
        @keyframes nodeGlowPulse {
          0%, 100% { transform: scale(0.92); opacity: 0.85; }
          50% { transform: scale(1.22); opacity: 1.0; }
        }
        @keyframes starTwinkleGlow {
          0%, 100% { opacity: 0.35; transform: scale(0.9); }
          50% { opacity: 0.95; transform: scale(1.15); }
        }

        .anim-twin-presence { animation: twinBreathingGlow 6.5s ease-in-out infinite; }
        .anim-label-a { animation: labelFloatA 5.5s ease-in-out infinite; }
        .anim-label-b { animation: labelFloatB 6.2s ease-in-out infinite 0.8s; }
        .anim-label-c { animation: labelFloatC 7.0s ease-in-out infinite 1.6s; }

        .orbital-rail-primary { animation: orbitalRailLuminescence 5.5s ease-in-out infinite; }
        .orbital-rail-secondary { animation: orbitalRailLuminescence 6.5s ease-in-out infinite 1.2s; }
        .orbital-rail-stream { 
          stroke-dasharray: 6 18; 
          animation: orbitalStreamFlow 16s linear infinite; 
        }
        .orbital-rail-stream-rev { 
          stroke-dasharray: 5 16; 
          animation: orbitalStreamFlowReverse 19s linear infinite; 
        }
        .orbital-feeder-branch { animation: orbitalFeederGaze 4.2s ease-in-out infinite; }
        .orbital-node-pulse { 
          animation: nodeGlowPulse 3.8s ease-in-out infinite; 
          transform-box: fill-box; 
          transform-origin: center; 
        }
        .anim-star-twinkle { animation: starTwinkleGlow 4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .anim-twin-presence, .anim-label-a, .anim-label-b, .anim-label-c, 
          .orbital-rail-primary, .orbital-rail-secondary, .orbital-rail-stream, 
          .orbital-rail-stream-rev, .orbital-feeder-branch, .orbital-node-pulse, 
          .anim-star-twinkle {
            animation: none !important;
          }
        }
      `}</style>

      {/* Cinematic Orbital Intelligence Hub Stage (Expanded Dimensions for Dominant Presence) */}
      <div className="relative w-full max-w-[430px] sm:max-w-[480px] lg:max-w-[450px] xl:max-w-[500px] aspect-[500/500] mx-auto flex items-center justify-center">
        
        {/* Multi-Tier Dimensional Atmospheric Nebula Aura Behind Digital Twin (Rich Purple & Midnight Indigo, Controlled to Avoid Central Wash) */}
        <div 
          className="absolute inset-8 sm:inset-10 rounded-full blur-[32px] pointer-events-none opacity-20 dark:opacity-25 z-[1]"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.35) 0%, rgba(126, 34, 206, 0.25) 35%, rgba(88, 28, 135, 0.15) 58%, transparent 85%)'
          }}
        />
        <div 
          className="absolute inset-12 sm:inset-14 rounded-full blur-[20px] pointer-events-none opacity-20 dark:opacity-22 z-[2]"
          style={{
            background: 'radial-gradient(circle, rgba(126, 34, 206, 0.32) 0%, rgba(99, 102, 241, 0.12) 55%, transparent 80%)'
          }}
        />

        {/* =========================================================================
            CINEMATIC NEON RAILS & CONNECTED INTELLIGENCE ORBIT SYSTEM
            - Organic asymmetric sweeping arcs wrapping gracefully around the Digital Twin
            - Thin, luminous, and elegant with electric blue, violet, and bright purple neon
            - Dedicated curved feeder arcs visually guiding the eye directly toward feature tags
            - Free of overlap with Digital Twin face, internal circuits, or badge content
            - Positioned behind tags (z-20) and Digital Twin (z-10), yet clearly above space bg (z-[5])
           ========================================================================= */}
        <svg
          viewBox="0 0 500 500"
          className="orbital-rails-container"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Calibrated Neon Bloom Filter: Thin, crisp, and high-luminosity */}
            <filter id="neonBloomRail" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="1.8" result="glow1" />
              <feGaussianBlur stdDeviation="4.2" result="glow2" />
              <feMerge>
                <feMergeNode in="glow2" />
                <feMergeNode in="glow1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Primary Sweeping Arc Gradient (Electric Cyan -> Royal Violet -> Vivid Purple -> Neon Cyan) */}
            <linearGradient id="primaryRailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.96" />
              <stop offset="22%" stopColor="#818cf8" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.98" />
              <stop offset="78%" stopColor="#c084fc" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.96" />
            </linearGradient>

            {/* Secondary Counter Arc Gradient (Vivid Purple -> Electric Blue -> Deep Violet) */}
            <linearGradient id="secondaryRailGrad" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.92" />
              <stop offset="42%" stopColor="#38bdf8" stopOpacity="0.88" />
              <stop offset="82%" stopColor="#818cf8" stopOpacity="0.90" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.92" />
            </linearGradient>

            {/* Tapered Perspective Filament Gradient (Fades into deep space at endpoints) */}
            <linearGradient id="outerFilamentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="20%" stopColor="#818cf8" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.75" />
              <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
            </linearGradient>

            {/* Feeder Branch Gradients for Smooth Directional Eye Guidance */}
            <linearGradient id="feederGradTop" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="feederGradRight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="feederGradLeft" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.98" />
            </linearGradient>

            {/* Radial Glow for Electric Cyan Docking Nodes */}
            <radialGradient id="nodeGlowCyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="26%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="58%" stopColor="#0284c7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>

            {/* Radial Glow for Purple / Violet Docking Nodes */}
            <radialGradient id="nodeGlowPurple" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="26%" stopColor="#c084fc" stopOpacity="0.95" />
              <stop offset="58%" stopColor="#9333ea" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. OUTER ASYMMETRIC PERSPECTIVE FILAMENT (Open sweeping trajectory, fades at endpoints) */}
          <g>
            <path
              d="M 105,75 C 190,32 360,46 430,125 C 475,182 465,268 435,335 C 388,435 285,468 205,450 C 138,432 82,368 72,285"
              stroke="url(#outerFilamentGrad)"
              strokeWidth="1.1"
              strokeDasharray="4 8"
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* 2. THE ORGANIC CINEMATIC NEON RAIL SYSTEM: ASYMMETRIC SWEEPING ARCS */}
          <g>
            {/* -------------------------------------------------------------------
                MASTER ARC ALPHA: Sweeps in from left, wraps over head past Skills Analysis,
                swoops down past Projects and Career Growth, framing the twin with zero face overlap
               ------------------------------------------------------------------- */}
            {/* Ambient Bloom Under-Stroke */}
            <path
              d="M 54,155 C 64,98 135,42 225,35 C 242,34 258,34 275,36 C 352,44 420,70 432,102 C 446,145 442,240 432,312 C 420,380 376,432 315,455"
              stroke="url(#primaryRailGrad)"
              strokeWidth="3.2"
              strokeOpacity="0.34"
              filter="url(#neonBloomRail)"
              fill="none"
              strokeLinecap="round"
            />

            {/* Primary Thin Luminous Rail Line */}
            <path
              d="M 54,155 C 64,98 135,42 225,35 C 242,34 258,34 275,36 C 352,44 420,70 432,102 C 446,145 442,240 432,312 C 420,380 376,432 315,455"
              stroke="url(#primaryRailGrad)"
              strokeWidth="1.5"
              strokeOpacity="0.96"
              className="orbital-rail-primary"
              fill="none"
              strokeLinecap="round"
            />

            {/* Razor-Sharp Incandescent Core Highlight */}
            <path
              d="M 54,155 C 64,98 135,42 225,35 C 242,34 258,34 275,36 C 352,44 420,70 432,102 C 446,145 442,240 432,312 C 420,380 376,432 315,455"
              stroke="#ffffff"
              strokeWidth="0.5"
              strokeOpacity="0.82"
              fill="none"
              strokeLinecap="round"
            />

            {/* Live Data Pulse Stream (Flows along Arc Alpha) */}
            <path
              d="M 54,155 C 64,98 135,42 225,35 C 242,34 258,34 275,36 C 352,44 420,70 432,102 C 446,145 442,240 432,312 C 420,380 376,432 315,455"
              stroke="#7dd3fc"
              strokeWidth="1.2"
              strokeOpacity="0.85"
              className="orbital-rail-stream"
              fill="none"
              strokeLinecap="round"
            />

            {/* -------------------------------------------------------------------
                MASTER ARC BETA: Complementary Counter-Arc swooping from upper right,
                descending along Career Growth, wrapping under the torso at AI Guidance,
                and climbing up the left flank to Real-time Insights
               ------------------------------------------------------------------- */}
            {/* Ambient Bloom Under-Stroke */}
            <path
              d="M 445,68 C 468,135 458,225 428,302 C 395,385 330,458 250,465 C 185,471 122,442 88,382 C 58,322 55,215 70,132 C 78,92 108,52 148,34"
              stroke="url(#secondaryRailGrad)"
              strokeWidth="2.8"
              strokeOpacity="0.28"
              filter="url(#neonBloomRail)"
              fill="none"
              strokeLinecap="round"
            />

            {/* Secondary Thin Luminous Rail Line */}
            <path
              d="M 445,68 C 468,135 458,225 428,302 C 395,385 330,458 250,465 C 185,471 122,442 88,382 C 58,322 55,215 70,132 C 78,92 108,52 148,34"
              stroke="url(#secondaryRailGrad)"
              strokeWidth="1.3"
              strokeOpacity="0.90"
              className="orbital-rail-secondary"
              fill="none"
              strokeLinecap="round"
            />

            {/* Razor Highlight */}
            <path
              d="M 445,68 C 468,135 458,225 428,302 C 395,385 330,458 250,465 C 185,471 122,442 88,382 C 58,322 55,215 70,132 C 78,92 108,52 148,34"
              stroke="#f5f3ff"
              strokeWidth="0.45"
              strokeOpacity="0.75"
              fill="none"
              strokeLinecap="round"
            />

            {/* Live Data Pulse Counter-Stream (Flows along Arc Beta) */}
            <path
              d="M 445,68 C 468,135 458,225 428,302 C 395,385 330,458 250,465 C 185,471 122,442 88,382 C 58,322 55,215 70,132 C 78,92 108,52 148,34"
              stroke="#c084fc"
              strokeWidth="1.1"
              strokeOpacity="0.80"
              className="orbital-rail-stream-rev"
              fill="none"
              strokeLinecap="round"
            />

            {/* -------------------------------------------------------------------
                3. DIRECTIONAL ORGANIC FEEDER CURVES (VISUALLY GUIDING EYE TOWARD TAGS)
                Subtle curves that emerge tangentially from the arcs and glide smoothly
                directly into each feature tag badge without covering text or badges.
               ------------------------------------------------------------------- */}
            {/* Feeder 1: Top Guide to Skills Analysis */}
            <g className="orbital-feeder-branch">
              <path d="M 250,36 C 250,28 250,22 250,14" stroke="url(#feederGradTop)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 250,36 C 250,28 250,22 250,14" stroke="#ffffff" strokeWidth="0.5" strokeLinecap="round" />
            </g>

            {/* Feeder 2: Left Guide to Real-time Insights */}
            <g className="orbital-feeder-branch">
              <path d="M 72,130 C 58,130 45,130 32,130" stroke="url(#feederGradLeft)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 72,130 C 58,130 45,130 32,130" stroke="#ffffff" strokeWidth="0.5" strokeLinecap="round" />
            </g>

            {/* Feeder 3: Upper-Right Guide to Projects */}
            <g className="orbital-feeder-branch">
              <path d="M 430,95 C 444,95 456,95 468,95" stroke="url(#feederGradRight)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 430,95 C 444,95 456,95 468,95" stroke="#ffffff" strokeWidth="0.5" strokeLinecap="round" />
            </g>

            {/* Feeder 4: Mid-Right Guide to Career Growth */}
            <g className="orbital-feeder-branch">
              <path d="M 430,315 C 444,315 456,315 468,315" stroke="url(#feederGradRight)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 430,315 C 444,315 456,315 468,315" stroke="#ffffff" strokeWidth="0.5" strokeLinecap="round" />
            </g>

            {/* Feeder 5: Bottom Guide to AI Guidance */}
            <g className="orbital-feeder-branch">
              <path d="M 250,465 C 250,473 250,480 250,488" stroke="url(#feederGradTop)" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 250,465 C 250,473 250,480 250,488" stroke="#ffffff" strokeWidth="0.5" strokeLinecap="round" />
            </g>
          </g>

          {/* 4. STRONGER LUMINOUS RAIL CONNECTION NODES (Cyan, Violet, Electric Blue) */}
          <g>
            {/* Node 1: Skills Analysis Dock (TOP: 250, 36) */}
            <circle cx="250" cy="36" r="10" fill="url(#nodeGlowCyan)" className="orbital-node-pulse" />
            <circle cx="250" cy="36" r="4.0" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="250" cy="36" r="1.6" fill="#ffffff" />
            {/* Micro Satellite Data Pips */}
            <circle cx="242" cy="36" r="1.0" fill="#7dd3fc" />
            <circle cx="258" cy="36" r="1.0" fill="#7dd3fc" />

            {/* Node 2: Real-time Insights Dock (LEFT UPPER-MIDDLE: 72, 130) */}
            <circle cx="72" cy="130" r="10" fill="url(#nodeGlowCyan)" className="orbital-node-pulse" />
            <circle cx="72" cy="130" r="4.0" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="72" cy="130" r="1.6" fill="#ffffff" />
            {/* Micro Satellite Data Pips */}
            <circle cx="72" cy="122" r="1.0" fill="#7dd3fc" />
            <circle cx="72" cy="138" r="1.0" fill="#7dd3fc" />

            {/* Node 3: Projects Dock (UPPER-RIGHT: 430, 95) */}
            <circle cx="430" cy="95" r="10" fill="url(#nodeGlowCyan)" className="orbital-node-pulse" />
            <circle cx="430" cy="95" r="4.0" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="430" cy="95" r="1.6" fill="#ffffff" />
            {/* Micro Satellite Data Pips */}
            <circle cx="423" cy="90" r="1.0" fill="#7dd3fc" />
            <circle cx="437" cy="100" r="1.0" fill="#7dd3fc" />

            {/* Node 4: Career Growth Dock (MID-RIGHT: 430, 315) */}
            <circle cx="430" cy="315" r="10" fill="url(#nodeGlowPurple)" className="orbital-node-pulse" />
            <circle cx="430" cy="315" r="4.0" fill="#7e22ce" stroke="#c084fc" strokeWidth="1.5" />
            <circle cx="430" cy="315" r="1.6" fill="#ffffff" />
            {/* Micro Satellite Data Pips */}
            <circle cx="424" cy="322" r="1.0" fill="#e9d5ff" />
            <circle cx="436" cy="308" r="1.0" fill="#e9d5ff" />

            {/* Node 5: AI Guidance Dock (LOWER: 250, 465) */}
            <circle cx="250" cy="465" r="10" fill="url(#nodeGlowCyan)" className="orbital-node-pulse" />
            <circle cx="250" cy="465" r="4.0" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="250" cy="465" r="1.6" fill="#ffffff" />
            {/* Micro Satellite Data Pips */}
            <circle cx="242" cy="465" r="1.0" fill="#7dd3fc" />
            <circle cx="258" cy="465" r="1.0" fill="#7dd3fc" />
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
            className="w-full h-full object-contain filter drop-shadow-[0_0_24px_rgba(147,51,234,0.55)] drop-shadow-[0_0_42px_rgba(107,33,168,0.35)] drop-shadow-[0_0_6px_rgba(56,189,248,0.40)] transition-all"
            draggable={false}
          />
        </div>

        {/* =========================================================================
            FIVE FEATURE TAGS — STRONGER PURPLE NEON BORDERS & DARK GLASS INTERIOR
            - Dark glass/navy interior (#030718/95)
            - Clearly visible purple border (stronger neon definition)
            - Subtle violet glow & secondary cyan accent
            - Crisp white text & clean icons
            - Strict position and size preservation
           ========================================================================= */}

        {/* 1. TOP: Skills Analysis */}
        <div 
          id="badge-skills-analysis"
          className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#030718]/95 dark:bg-[#030718]/95 backdrop-blur-md border-[1.5px] border-purple-500/80 hover:border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.52),0_0_8px_rgba(56,189,248,0.28),inset_0_0_12px_rgba(147,51,234,0.22),inset_0_1px_1px_rgba(255,255,255,0.22)] flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold whitespace-nowrap z-20 anim-label-a hover:scale-105 transition-all group cursor-default"
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          <span className="tracking-wide text-white">Skills Analysis</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
        </div>

        {/* 2. LEFT / UPPER-MIDDLE: Real-time Insights (Farther out, cleanly clear of twin & headline) */}
        <div 
          id="badge-realtime-insights"
          className="absolute top-[19%] sm:top-[20%] -left-1 sm:left-0 md:-left-1 lg:left-0 xl:left-0.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#030718]/95 dark:bg-[#030718]/95 backdrop-blur-md border-[1.5px] border-purple-500/80 hover:border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.52),0_0_8px_rgba(56,189,248,0.28),inset_0_0_12px_rgba(147,51,234,0.22),inset_0_1px_1px_rgba(255,255,255,0.22)] flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold whitespace-nowrap z-20 anim-label-b hover:scale-105 transition-all group cursor-default"
        >
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          <span className="tracking-wide text-white">Real-time Insights</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
        </div>

        {/* 3. UPPER-RIGHT: Projects (Diagonally above forehead, spacious) */}
        <div 
          id="badge-projects"
          className="absolute top-[11%] sm:top-[12%] right-1 sm:right-2 md:right-1 lg:right-2 xl:right-2.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#030718]/95 dark:bg-[#030718]/95 backdrop-blur-md border-[1.5px] border-purple-500/80 hover:border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.52),0_0_8px_rgba(56,189,248,0.28),inset_0_0_12px_rgba(147,51,234,0.22),inset_0_1px_1px_rgba(255,255,255,0.22)] flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold whitespace-nowrap z-20 anim-label-c hover:scale-105 transition-all group cursor-default"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          <span className="tracking-wide text-white">Projects</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
        </div>

        {/* 4. RIGHT / MID-RIGHT: Career Growth (Spaced well below Projects) */}
        <div 
          id="badge-career-growth"
          className="absolute top-[60%] sm:top-[62%] right-1 sm:right-2 md:right-1 lg:right-2 xl:right-2.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#030718]/95 dark:bg-[#030718]/95 backdrop-blur-md border-[1.5px] border-purple-500/80 hover:border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.52),0_0_8px_rgba(56,189,248,0.28),inset_0_0_12px_rgba(147,51,234,0.22),inset_0_1px_1px_rgba(255,255,255,0.22)] flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold whitespace-nowrap z-20 anim-label-a hover:scale-105 transition-all group cursor-default"
        >
          <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          <span className="tracking-wide text-white">Career Growth</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
        </div>

        {/* 5. LOWER: AI Guidance (Centered below neck) */}
        <div 
          id="badge-ai-guidance"
          className="absolute -bottom-2.5 sm:-bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#030718]/95 dark:bg-[#030718]/95 backdrop-blur-md border-[1.5px] border-purple-500/80 hover:border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.52),0_0_8px_rgba(56,189,248,0.28),inset_0_0_12px_rgba(147,51,234,0.22),inset_0_1px_1px_rgba(255,255,255,0.22)] flex items-center gap-1.5 sm:gap-2 text-[10.5px] sm:text-[11.5px] font-semibold whitespace-nowrap z-20 anim-label-b hover:scale-105 transition-all group cursor-default"
        >
          <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0 drop-shadow-[0_0_6px_rgba(34,211,238,0.85)]" />
          <span className="tracking-wide text-white">AI Guidance</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
        </div>

      </div>
    </div>
  );
};

