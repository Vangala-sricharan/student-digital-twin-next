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

      {/* Visual Focal Point Stage — Substantially Enlarged, Broad & Solid Centerpiece */}
      <div className="relative w-full max-w-[380px] sm:max-w-[430px] lg:max-w-[420px] xl:max-w-[465px] 2xl:max-w-[500px] mx-auto aspect-[520/540] flex items-center justify-center">
        
        {/* Soft Volumetric Nebula Light Halo (Deep Space Cyan, Royal Blue & Galactic Violet) */}
        <div 
          className="absolute inset-0 sm:-inset-2 rounded-full blur-[95px] pointer-events-none opacity-80 dark:opacity-95"
          style={{
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.65) 0%, rgba(59, 130, 246, 0.5) 28%, rgba(147, 51, 234, 0.45) 55%, rgba(192, 132, 252, 0.25) 72%, transparent 85%)'
          }}
        />

        {/* Subtle Violet-Magenta Crown Rim Nebula Plume */}
        <div 
          className="absolute left-1/5 -top-10 w-[300px] h-[280px] rounded-full blur-[85px] pointer-events-none opacity-55 dark:opacity-75"
          style={{
            background: 'radial-gradient(circle, rgba(192, 132, 252, 0.6) 0%, rgba(147, 51, 234, 0.35) 50%, transparent 75%)'
          }}
        />

        {/* Secondary Frontal Electric Cyan Edge Aura */}
        <div 
          className="absolute right-2 top-10 w-[320px] h-[320px] rounded-full blur-[80px] pointer-events-none opacity-50 dark:opacity-75"
          style={{
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.6) 0%, rgba(37, 99, 235, 0.3) 50%, transparent 75%)'
          }}
        />

        {/* The Dominant Solid Dimensional Digital Twin Centerpiece */}
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full overflow-visible anim-twin-presence"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Solid Volumetric 3D Material Gradient for Head: Lavender to Royal Amethyst to Midnight Indigo */}
            <linearGradient id="solidHeadBodyGrad" x1="12%" y1="8%" x2="88%" y2="92%">
              <stop offset="0%" stopColor="#f3e8ff" />
              <stop offset="12%" stopColor="#d8b4fe" />
              <stop offset="28%" stopColor="#a855f7" />
              <stop offset="52%" stopColor="#7e22ce" />
              <stop offset="74%" stopColor="#581c87" />
              <stop offset="90%" stopColor="#3b0764" />
              <stop offset="100%" stopColor="#1e1035" />
            </linearGradient>

            {/* Rear Twin Shadow Profile (Creates iconic stereoscopic 3D depth) */}
            <linearGradient id="twinDepthRearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#6366f1" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#3730a3" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.95" />
            </linearGradient>

            {/* Dimensional 3D Spherical Cranial Catchlight Shader */}
            <radialGradient id="cranialSpecularGlow" cx="40%" cy="26%" r="58%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
              <stop offset="22%" stopColor="#f5d0fe" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#a855f7" stopOpacity="0" />
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
              <stop offset="0%" stopColor="#0f0521" />
              <stop offset="60%" stopColor="#1e0a42" />
              <stop offset="100%" stopColor="#2e0854" />
            </linearGradient>

            {/* Glowing Circuit Core Filament */}
            <linearGradient id="circuitCoreGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="70%" stopColor="#ffffff" />
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
              <feDropShadow dx="-6" dy="18" stdDeviation="26" floodColor="#02010a" floodOpacity="0.95" />
            </filter>
          </defs>

          {/* 1. Orbit Ellipses & Constellation Night-Rail Tracks */}
          <g className="anim-orbit-line pointer-events-none">
            {/* Outer Celestial Night-Rail Path */}
            <ellipse
              cx="256"
              cy="256"
              rx="235"
              ry="185"
              transform="rotate(-16 256 256)"
              stroke="#38bdf8"
              strokeWidth="1.6"
              strokeOpacity="0.45"
              strokeDasharray="5 7"
              fill="none"
            />
            {/* Inner Concentric Orbit Night-Rail Path */}
            <ellipse
              cx="256"
              cy="256"
              rx="195"
              ry="145"
              transform="rotate(22 256 256)"
              stroke="#c084fc"
              strokeWidth="1.3"
              strokeOpacity="0.4"
              strokeDasharray="4 6"
              fill="none"
            />
            {/* Orbit Satellite Nodes */}
            <circle cx="65" cy="180" r="4.5" fill="#38bdf8" filter="url(#neonRimBloom)" />
            <circle cx="450" cy="160" r="3.5" fill="#c084fc" />
            <circle cx="420" cy="420" r="4.5" fill="#38bdf8" filter="url(#neonRimBloom)" />
            <circle cx="95" cy="390" r="3.5" fill="#818cf8" />
          </g>

          {/* Subtle Night-Sky Micro-Stars & Dust around Silhouette */}
          <g className="anim-star-twinkle pointer-events-none opacity-85">
            <circle cx="60" cy="100" r="1.5" fill="#ffffff" filter="url(#neonRimBloom)" />
            <circle cx="190" cy="35" r="1.8" fill="#e9d5ff" />
            <circle cx="450" cy="120" r="1.5" fill="#38bdf8" />
            <circle cx="475" cy="280" r="1.8" fill="#c084fc" filter="url(#neonRimBloom)" />
            <circle cx="80" cy="460" r="1.4" fill="#a5f3fc" />
            <circle cx="370" cy="500" r="1.6" fill="#818cf8" />
          </g>

          {/* 3. Exact Rear Head Silhouette (The Twin from SDTLogo - Offset to the right) */}
          <path
            d="M 335 45 C 245 45, 175 115, 175 205 C 175 275, 202 320, 232 345 L 232 455 L 368 455 L 368 390 C 382 386, 396 372, 401 348 C 406 338, 395 330, 405 316 C 413 306, 388 278, 393 253 C 400 218, 410 162, 393 122 C 373 78, 355 45, 335 45 Z"
            fill="url(#twinDepthRearGrad)"
            stroke="url(#rearCranialRimLight)"
            strokeWidth="2.5"
            strokeOpacity="0.65"
            filter="url(#neonRimBloom)"
          />

          {/* 4. PRIMARY SOLID HEAD MONOLITH (Exact Original Front Head from SDTLogo) */}
          <g filter="url(#heavyMonolithShadow)">
            {/* Solid Head Base Silhouette */}
            <path
              d="M 255 45 C 165 45, 95 115, 95 205 C 95 275, 122 320, 152 345 L 152 455 L 288 455 L 288 390 C 302 386, 316 372, 321 348 C 326 338, 315 330, 325 316 C 333 306, 308 278, 313 253 C 320 218, 330 162, 313 122 C 293 78, 275 45, 255 45 Z"
              fill="url(#solidHeadBodyGrad)"
              stroke="#ffffff"
              strokeWidth="9"
              strokeLinejoin="round"
            />

            {/* Volumetric 3D Spherical Cranial Catchlight Overlay */}
            <path
              d="M 255 45 C 165 45, 95 115, 95 205 C 95 275, 122 320, 152 345 L 152 455 L 288 455 L 288 390 C 302 386, 316 372, 321 348 C 326 338, 315 330, 325 316 C 333 306, 308 278, 313 253 C 320 218, 330 162, 313 122 C 293 78, 275 45, 255 45 Z"
              fill="url(#cranialSpecularGlow)"
              style={{ mixBlendMode: 'screen' }}
            />

            {/* Specular Highlight Streak along Upper Cranium */}
            <path
              d="M 105 180 C 105 125, 175 60, 255 48"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              strokeOpacity="0.7"
              fill="none"
            />
          </g>

          {/* 5. EMBEDDED CYBERNETIC CIRCUITS (Exact Original 5 Traces & Terminal Nodes from SDTLogo) */}
          
          {/* Trace 1: Top cranial circuit - turns UP 90 degrees */}
          <g>
            {/* Recessed Trench Background */}
            <path
              d="M 95 165 L 210 165 L 210 115"
              stroke="url(#circuitTrenchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Glowing Core Filament */}
            <path
              d="M 95 165 L 210 165 L 210 115"
              stroke="url(#circuitCoreGlow)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonRimBloom)"
            />
            {/* Outer Terminal Pad Ring */}
            <circle 
              cx="210" 
              cy="115" 
              r="18" 
              fill="url(#solidHeadBodyGrad)" 
              stroke="#38bdf8" 
              strokeWidth="5" 
              filter="url(#neonRimBloom)" 
            />
            {/* Inner Glowing Aperture */}
            <circle cx="210" cy="115" r="7" fill="#ffffff" filter="url(#neonRimBloom)" />
          </g>

          {/* Trace 2: Mid-cranial horizontal circuit */}
          <g>
            <path
              d="M 95 220 L 255 220"
              stroke="url(#circuitTrenchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M 95 220 L 255 220"
              stroke="url(#circuitCoreGlow)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#neonRimBloom)"
            />
            <circle 
              cx="255" 
              cy="220" 
              r="18" 
              fill="url(#solidHeadBodyGrad)" 
              stroke="#38bdf8" 
              strokeWidth="5" 
              filter="url(#neonRimBloom)" 
            />
            <circle cx="255" cy="220" r="7" fill="#ffffff" filter="url(#neonRimBloom)" />
          </g>

          {/* Trace 3: Cheek horizontal circuit */}
          <g>
            <path
              d="M 97 275 L 205 275"
              stroke="url(#circuitTrenchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M 97 275 L 205 275"
              stroke="url(#circuitCoreGlow)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#neonRimBloom)"
            />
            <circle 
              cx="205" 
              cy="275" 
              r="18" 
              fill="url(#solidHeadBodyGrad)" 
              stroke="#38bdf8" 
              strokeWidth="5" 
              filter="url(#neonRimBloom)" 
            />
            <circle cx="205" cy="275" r="7" fill="#ffffff" filter="url(#neonRimBloom)" />
          </g>

          {/* Trace 4: Lower cheek/jaw horizontal circuit */}
          <g>
            <path
              d="M 108 330 L 245 330"
              stroke="url(#circuitTrenchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M 108 330 L 245 330"
              stroke="url(#circuitCoreGlow)"
              strokeWidth="8"
              strokeLinecap="round"
              filter="url(#neonRimBloom)"
            />
            <circle 
              cx="245" 
              cy="330" 
              r="18" 
              fill="url(#solidHeadBodyGrad)" 
              stroke="#38bdf8" 
              strokeWidth="5" 
              filter="url(#neonRimBloom)" 
            />
            <circle cx="245" cy="330" r="7" fill="#ffffff" filter="url(#neonRimBloom)" />
          </g>

          {/* Trace 5: Neck circuit - turns DOWN 90 degrees */}
          <g>
            <path
              d="M 152 385 L 200 385 L 200 425"
              stroke="url(#circuitTrenchGrad)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 152 385 L 200 385 L 200 425"
              stroke="url(#circuitCoreGlow)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonRimBloom)"
            />
            <circle 
              cx="200" 
              cy="425" 
              r="18" 
              fill="url(#solidHeadBodyGrad)" 
              stroke="#38bdf8" 
              strokeWidth="5" 
              filter="url(#neonRimBloom)" 
            />
            <circle cx="200" cy="425" r="7" fill="#ffffff" filter="url(#neonRimBloom)" />
          </g>

          {/* 6. GLOWING FACIAL PROFILE RIM LIGHT (Razor-Sharp Neon Cyan-White Edge along exact original profile) */}
          <path
            d="M 255 45 C 275 45, 293 78, 313 122 C 330 162, 320 218, 313 253 C 308 278, 333 306, 325 316 C 315 330, 326 338, 321 348 C 316 372, 302 386, 288 390 L 288 455"
            stroke="url(#facialProfileRimLight)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#neonRimBloom)"
          />

          {/* Inner Cyan Glow Contour along Facial Edge */}
          <path
            d="M 255 48 C 273 48, 290 80, 310 123 C 326 162, 317 216, 310 250 C 305 274, 329 302, 322 312 C 313 325, 322 334, 318 344 C 313 366, 300 380, 288 385"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.8"
            fill="none"
          />

          {/* Rear Cranial Silhouette Neon Violet Rim Light */}
          <path
            d="M 255 45 C 165 45, 95 115, 95 205 C 95 275, 122 320, 152 345 L 152 455"
            stroke="url(#rearCranialRimLight)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeOpacity="0.75"
            fill="none"
            filter="url(#neonRimBloom)"
          />
        </svg>
      </div>
    </div>
  );
};
