import React, { useMemo } from 'react';

export const CinematicDaylightBackground: React.FC = () => {
  // Deterministic atmospheric luminescence particles (daylight motes / micro-reflections)
  const particles = useMemo(() => {
    let seed = 2024;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const particleColors = [
      '#38bdf8', // Sky blue
      '#60a5fa', // Soft blue
      '#818cf8', // Indigo/violet tint
      '#ffffff', // Pure white catchlight
      '#bae6fd', // Pale cyan
      '#fef08a', // Sunlight glimmer
    ];

    const list: Array<{
      x: number;
      y: number;
      size: number;
      opacity: number;
      color: string;
      tier: 'far' | 'near';
    }> = [];

    for (let i = 0; i < 65; i++) {
      const x = random() * 100;
      const y = random() * 85;

      if (x > 5 && x < 45 && y > 20 && y < 65 && random() > 0.35) {
        continue;
      }

      const isNear = random() > 0.75;
      const size = isNear ? 0.9 + random() * 0.5 : 0.45 + random() * 0.4;
      const opacity = isNear ? 0.25 + random() * 0.35 : 0.12 + random() * 0.28;
      const color = particleColors[Math.floor(random() * particleColors.length)];

      list.push({ x, y, size, opacity, color, tier: isNear ? 'near' : 'far' });
    }

    return list;
  }, []);

  const farParticles = particles.filter((p) => p.tier === 'far');
  const nearParticles = particles.filter((p) => p.tier === 'near');

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      <style>{`
        @keyframes daylightDriftFar {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-5px) translateX(2px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        @keyframes daylightDriftNear {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-8px) translateX(4px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        @keyframes daylightFlarePulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        .anim-daylight-far {
          animation: daylightDriftFar 80s ease-in-out infinite;
          will-change: transform;
        }
        .anim-daylight-near {
          animation: daylightDriftNear 55s ease-in-out infinite;
          will-change: transform;
        }
        .anim-daylight-flare {
          animation: daylightFlarePulse 6s ease-in-out infinite;
        }
      `}</style>

      {/* 1. Base Luminous Daylight Canvas */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f8fafc] via-[#f0f6ff] to-[#e0f2fe]" />

      {/* 2. Soft Daylight Clouds & Refraction Glow */}
      <div
        className="absolute -top-32 right-[-5%] w-[750px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(224, 231, 255, 0.8) 0%, rgba(186, 230, 253, 0.5) 45%, transparent 75%)'
        }}
      />

      <div
        className="absolute top-[15%] left-[45%] -translate-x-1/2 w-[650px] h-[550px] rounded-full blur-[130px] pointer-events-none opacity-45"
        style={{
          background: 'radial-gradient(circle, rgba(216, 180, 254, 0.4) 0%, rgba(186, 230, 253, 0.4) 50%, transparent 75%)'
        }}
      />

      {/* 3. Daylight Atmospheric Particles */}
      <svg className="absolute inset-0 w-full h-full anim-daylight-far" xmlns="http://www.w3.org/2000/svg">
        {farParticles.map((pt, idx) => (
          <circle
            key={`dl-far-${idx}`}
            cx={`${pt.x}%`}
            cy={`${pt.y}%`}
            r={pt.size}
            fill={pt.color}
            opacity={pt.opacity}
          />
        ))}
      </svg>

      <svg className="absolute inset-0 w-full h-full anim-daylight-near" xmlns="http://www.w3.org/2000/svg">
        {nearParticles.map((pt, idx) => (
          <circle
            key={`dl-near-${idx}`}
            cx={`${pt.x}%`}
            cy={`${pt.y}%`}
            r={pt.size}
            fill={pt.color}
            opacity={pt.opacity}
          />
        ))}
      </svg>

      {/* 4. Daylight Earth Horizon with Radiant Sun Flare */}
      <div className="absolute bottom-0 left-0 right-0 h-[180px] sm:h-[220px] pointer-events-none overflow-hidden z-[2]">
        <svg
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[160%] sm:w-[130%] h-full overflow-visible"
          viewBox="0 0 1440 280"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="dlAtmoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
              <stop offset="30%" stopColor="#60a5fa" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#818cf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="dlHorizonRim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="35%" stopColor="#60a5fa" stopOpacity="0.7" />
              <stop offset="62%" stopColor="#0284c7" stopOpacity="0.85" />
              <stop offset="85%" stopColor="#6366f1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="dlEarthSurface" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.5" />
              <stop offset="35%" stopColor="#e0f2fe" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.95" />
            </linearGradient>

            <radialGradient id="dlSunFlareCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor="#fef08a" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#60a5fa" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="dlAnamorphicStreak" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
              <stop offset="45%" stopColor="#bae6fd" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#bae6fd" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
            </linearGradient>

            <filter id="dlLimbGlow" x="-10%" y="-150%" width="120%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="16" />
            </filter>
          </defs>

          {/* Broad diffuse skyward airglow along curve */}
          <path
            d="M -100 280 Q 720 95 1540 280"
            stroke="url(#dlAtmoGrad)"
            strokeWidth="38"
            filter="url(#dlLimbGlow)"
            opacity="0.75"
          />

          {/* Crisp daylight horizon rim line */}
          <path
            d="M -100 280 Q 720 95 1540 280"
            stroke="url(#dlHorizonRim)"
            strokeWidth="1.8"
            opacity="0.85"
          />

          {/* Daylight surface curvature */}
          <path
            d="M -100 280 Q 720 95 1540 280 L 1540 320 L -100 320 Z"
            fill="url(#dlEarthSurface)"
          />

          {/* Daylight Sunburst Solar Flare at 65% width */}
          <g className="anim-daylight-flare">
            <ellipse
              cx="910"
              cy="165"
              rx="170"
              ry="4"
              fill="url(#dlAnamorphicStreak)"
            />
            <circle
              cx="910"
              cy="165"
              r="30"
              fill="url(#dlSunFlareCore)"
            />
          </g>
        </svg>
      </div>

      {/* 5. Contrast Vignette for Left Copy */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-6/12 bg-gradient-to-r from-white/80 via-white/50 to-transparent pointer-events-none z-[3]" />

      {/* 6. Bottom Planetary Tagline Overlays */}
      <div className="absolute bottom-2.5 sm:bottom-3.5 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pointer-events-none z-[10]">
        
        {/* Bottom Left: SAME YOU. BUT MORE POSSIBILITIES. */}
        <div className="flex items-start gap-2 sm:gap-2.5 text-slate-700 font-mono select-none">
          <div className="w-0.5 h-8 sm:h-9 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)] shrink-0" />
          <div className="leading-tight">
            <div className="text-[9.5px] sm:text-[10px] font-extrabold tracking-widest text-slate-900">
              SAME YOU.
            </div>
            <div className="text-[9.5px] sm:text-[10px] font-semibold tracking-wider text-slate-700">
              BUT MORE POSSIBILITIES.
            </div>
            <div className="text-[8.5px] sm:text-[9px] text-slate-500 mt-0.5 font-normal tracking-wide">
              Powered by AI. Built for what's next.
            </div>
          </div>
        </div>

        {/* Bottom Right: LEARN BUILD GROW SUCCEED */}
        <div className="text-[8.5px] sm:text-[9.5px] tracking-[0.25em] sm:tracking-[0.3em] font-mono font-bold text-slate-500 uppercase select-none flex items-center gap-1.5">
          <span className="text-blue-600 text-xs">✦</span>
          <span>LEARN BUILD GROW SUCCEED</span>
        </div>

      </div>

      {/* Edge Blends */}
      <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-white/70 to-transparent pointer-events-none z-[4]" />
      <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-slate-200/50 to-transparent pointer-events-none z-[4]" />
    </div>
  );
};
