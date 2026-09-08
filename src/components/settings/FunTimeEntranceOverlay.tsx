import React, { useEffect, useState } from 'react';

interface FunTimeEntranceOverlayProps {
  onComplete: () => void;
}

interface FloatingEmoji {
  id: number;
  char: string;
  left: number; // percentage
  bottom: number; // percentage
  size: number; // rem
  delay: number; // seconds
  duration: number; // seconds
}

const EMOJIS = ['😂', '🥳', '😆', '✨', '🎉', '😄', '🌟', '🚀', '🎈', '🤣'];

export const FunTimeEntranceOverlay: React.FC<FunTimeEntranceOverlayProps> = ({ onComplete }) => {
  const [particles] = useState<FloatingEmoji[]>(() => {
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      char: EMOJIS[i % EMOJIS.length],
      left: 8 + Math.floor((i * 5.8) % 84),
      bottom: 10 + Math.floor((i * 7) % 60),
      size: 1.5 + (i % 3) * 0.5,
      delay: (i * 0.06),
      duration: 0.9 + (i % 3) * 0.2,
    }));
  });

  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fadeout at 1000ms, complete at 1300ms
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 950);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1250);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      id="fun-time-entrance-overlay"
      className={`fixed inset-0 z-[100005] overflow-hidden select-none pointer-events-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Colourful Animated Mesh Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#180829] via-[#0d1230] to-[#250d24] animate-pulse [animation-duration:3s]" />

      {/* Radiant ambient glow orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-purple-600/25 blur-3xl animate-blob pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-500/25 blur-3xl animate-blob [animation-delay:1s] pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

      {/* Floating Emojis */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute transition-transform animate-float-fun"
          style={{
            left: `${p.left}%`,
            bottom: `${p.bottom}%`,
            fontSize: `${p.size}rem`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.char}
        </div>
      ))}

      {/* Centered Polished Entrance Card */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-6">
        <div className="transform animate-bounce-subtle flex flex-col items-center">
          {/* Laughing hero emoji badge */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-400 p-1 shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center justify-center mb-4">
            <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-4xl sm:text-5xl">
              😂
            </div>
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-mono text-[10px] font-bold tracking-widest uppercase shadow-sm">
              ✨ UNLOCKING ENTERTAINMENT
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-200 to-cyan-200 tracking-tight drop-shadow-md">
              Fun Time!
            </h1>
            <p className="text-xs sm:text-sm font-mono text-purple-200/90 tracking-wider">
              Take a break, laugh, and play
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
