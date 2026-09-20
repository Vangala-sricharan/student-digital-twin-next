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

        {/* Subtle Celestial Orbit Tracks & Star Nodes (Preserved for Space Integration) */}
        <svg
          viewBox="0 0 512 512"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g className="anim-orbit-line">
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
            <circle cx="65" cy="180" r="4.5" fill="#38bdf8" />
            <circle cx="450" cy="160" r="3.5" fill="#c084fc" />
            <circle cx="420" cy="420" r="4.5" fill="#38bdf8" />
            <circle cx="95" cy="390" r="3.5" fill="#818cf8" />
          </g>
          <g className="anim-star-twinkle opacity-85">
            <circle cx="60" cy="100" r="1.5" fill="#ffffff" />
            <circle cx="190" cy="35" r="1.8" fill="#e9d5ff" />
            <circle cx="450" cy="120" r="1.5" fill="#38bdf8" />
            <circle cx="475" cy="280" r="1.8" fill="#c084fc" />
            <circle cx="80" cy="460" r="1.4" fill="#a5f3fc" />
            <circle cx="370" cy="500" r="1.6" fill="#818cf8" />
          </g>
        </svg>

        {/* The Exact Original Student Digital Twin Logo Centerpiece */}
        <div className="relative w-full h-full flex items-center justify-center p-2 z-10 anim-twin-presence">
          <img
            id="center-digital-twin-logo"
            src="/assets/digital-twin.png"
            alt="Student Digital Twin"
            className="w-full h-full object-contain filter drop-shadow-[0_0_35px_rgba(168,85,247,0.65)] drop-shadow-[0_0_75px_rgba(56,189,248,0.4)] transition-all"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};
