import React from 'react';

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
            filter: drop-shadow(0 0 30px rgba(168,85,247,0.5)) drop-shadow(0 0 65px rgba(56,189,248,0.3)); 
            transform: translateY(0px); 
          }
          50% { 
            filter: drop-shadow(0 0 45px rgba(168,85,247,0.75)) drop-shadow(0 0 90px rgba(56,189,248,0.45)); 
            transform: translateY(-6px); 
          }
        }
        @keyframes labelFloatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes labelFloatFast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes orbitSubtlePulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        @keyframes starTwinkleGlow {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 0.95; transform: scale(1.2); }
        }
        .anim-twin-presence { animation: twinBreathingGlow 7s ease-in-out infinite; }
        .anim-label-a { animation: labelFloatSlow 5.5s ease-in-out infinite; }
        .anim-label-b { animation: labelFloatFast 6.5s ease-in-out infinite 1.2s; }
        .anim-label-c { animation: labelFloatSlow 7.5s ease-in-out infinite 2.4s; }
        .anim-orbit-line { animation: orbitSubtlePulse 5s ease-in-out infinite; }
        .anim-star-twinkle { animation: starTwinkleGlow 4s ease-in-out infinite; }
      `}</style>

      {/* Massive Visual Focal Point Stage */}
      <div className="relative w-full max-w-[480px] sm:max-w-[520px] lg:max-w-[460px] xl:max-w-[540px] 2xl:max-w-[580px] mx-auto aspect-[520/540] flex items-center justify-center">
        
        {/* Soft Volumetric Nebula Light Halo (Deep Space Cyan, Royal Blue & Galactic Violet) */}
        <div 
          className="absolute inset-2 sm:inset-4 rounded-full blur-[90px] pointer-events-none opacity-70 dark:opacity-90"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.6) 0%, rgba(59, 130, 246, 0.45) 30%, rgba(147, 51, 234, 0.35) 60%, transparent 80%)'
          }}
        />

        {/* Subtle Violet-Magenta Crown Rim Nebula Plume */}
        <div 
          className="absolute left-1/4 -top-8 w-[280px] h-[260px] rounded-full blur-[80px] pointer-events-none opacity-45 dark:opacity-65"
          style={{
            background: 'radial-gradient(circle, rgba(192, 132, 252, 0.55) 0%, rgba(147, 51, 234, 0.3) 50%, transparent 75%)'
          }}
        />

        {/* Secondary Frontal Electric Cyan Edge Aura */}
        <div 
          className="absolute right-4 top-12 w-[300px] h-[300px] rounded-full blur-[75px] pointer-events-none opacity-40 dark:opacity-65"
          style={{
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.55) 0%, rgba(37, 99, 235, 0.25) 50%, transparent 75%)'
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
            {/* Solid Volumetric 3D Material Gradient for Head: Lavender to Royal Amethyst to Midnight Indigo */}
            <linearGradient id="solidHeadBodyGrad" x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#e9d5ff" />
              <stop offset="15%" stopColor="#c084fc" />
              <stop offset="38%" stopColor="#9333ea" />
              <stop offset="65%" stopColor="#6b21a8" />
              <stop offset="85%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#2e1065" />
            </linearGradient>

            {/* Rear Twin Shadow Profile (Creates iconic stereoscopic 3D depth) */}
            <linearGradient id="twinDepthRearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
              <stop offset="45%" stopColor="#4f46e5" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.9" />
            </linearGradient>

            {/* Dimensional 3D Spherical Cranial Catchlight Shader */}
            <radialGradient id="cranialSpecularGlow" cx="42%" cy="28%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="25%" stopColor="#f3e8ff" stopOpacity="0.35" />
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

            {/* Subtle Neon Purple/Violet Cranial Crest Rim Light */}
            <linearGradient id="rearCranialRimLight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0abfc" />
              <stop offset="30%" stopColor="#c084fc" />
              <stop offset="70%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>

            {/* Circuit Cutout Trench Shader: Deep Recessed 3D Inset Depth */}
            <linearGradient id="circuitTrenchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#120726" />
              <stop offset="60%" stopColor="#240e4f" />
              <stop offset="100%" stopColor="#330a5c" />
            </linearGradient>

            {/* Glowing Circuit Core Filament */}
            <linearGradient id="circuitCoreGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="75%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#a5f3fc" />
            </linearGradient>

            {/* Neon Bloom Filter */}
            <filter id="neonRimBloom" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Heavy Monolithic Dimensional Space Shadow */}
            <filter id="heavyMonolithShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="-4" dy="16" stdDeviation="24" floodColor="#040212" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* 1. Orbit Ellipses & Constellation Night-Rail Tracks */}
          <g className="anim-orbit-line pointer-events-none">
            {/* Outer Celestial Night-Rail Path */}
            <ellipse
              cx="285"
              cy="270"
              rx="235"
              ry="190"
              transform="rotate(-18 285 270)"
              stroke="#38bdf8"
              strokeWidth="1.6"
              strokeOpacity="0.45"
              strokeDasharray="5 7"
              fill="none"
            />
            {/* Inner Concentric Orbit Night-Rail Path */}
            <ellipse
              cx="275"
              cy="275"
              rx="200"
              ry="150"
              transform="rotate(22 275 275)"
              stroke="#c084fc"
              strokeWidth="1.3"
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

          {/* Subtle Night-Sky Micro-Stars & Dust around Silhouette */}
          <g className="anim-star-twinkle pointer-events-none opacity-80">
            <circle cx="75" cy="110" r="1.5" fill="#ffffff" filter="url(#neonRimBloom)" />
            <circle cx="210" cy="45" r="1.8" fill="#e9d5ff" />
            <circle cx="450" cy="130" r="1.5" fill="#38bdf8" />
            <circle cx="475" cy="290" r="1.8" fill="#c084fc" filter="url(#neonRimBloom)" />
            <circle cx="95" cy="460" r="1.4" fill="#a5f3fc" />
            <circle cx="370" cy="505" r="1.6" fill="#818cf8" />
          </g>

          {/* 3. Rear Head Silhouette (Offset 3D Twin Depth with Neon Purple/Indigo Rim) */}
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
            stroke="url(#rearCranialRimLight)"
            strokeWidth="2.5"
            strokeOpacity="0.6"
            filter="url(#neonRimBloom)"
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
              strokeOpacity="0.65"
              fill="none"
            />
          </g>

          {/* 5. EMBEDDED CYBERNETIC CIRCUITS WITH GLOWING TERMINAL NODES */}
          
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

          {/* Inner Cyan Glow Contour along Facial Edge */}
          <path
            d="M 265 60
               C 283 60, 298 85, 318 126 
               C 334 164, 326 218, 318 254 
               C 313 278, 337 308, 330 318 
               C 322 330, 331 340, 326 350 
               C 320 372, 308 388, 295 395"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.75"
            fill="none"
          />

          {/* Rear Cranial Silhouette Neon Violet Rim Light */}
          <path
            d="M 265 55
               C 175 55, 105 115, 105 205 
               C 105 275, 132 320, 162 345 
               L 162 475"
            stroke="url(#rearCranialRimLight)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeOpacity="0.7"
            fill="none"
            filter="url(#neonRimBloom)"
          />
        </svg>
      </div>
    </div>
  );
};
