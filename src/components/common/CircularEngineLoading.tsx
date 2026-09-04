import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

interface CircularEngineLoadingProps {
  title?: string;
  subtitle?: string;
}

const ALL_ENGINES = [
  { id: 'career-assistant', name: 'Career Assistant', emoji: '🤖', tag: '01' },
  { id: 'ai-portfolio', name: 'AI Portfolio', emoji: '✨', tag: '02' },
  { id: 'project-auditor', name: 'Project Auditor', emoji: '💻', tag: '03' },
  { id: 'github-audit', name: 'GitHub Audit', emoji: '🐙', tag: '04' },
  { id: 'linkedin-audit', name: 'LinkedIn Audit', emoji: '🔗', tag: '05' },
  { id: 'resume-builder', name: 'Resume Builder', emoji: '📄', tag: '06' },
  { id: 'resume-ats', name: 'ATS Analyzer', emoji: '🔍', tag: '07' },
  { id: 'syllabus-prep', name: 'Syllabus Prep', emoji: '📚', tag: '08' },
  { id: 'roadmap-30-60-90', name: '30-60-90 Roadmap', emoji: '🗺️', tag: '09' },
  { id: 'internship-ready', name: 'Internship Ready', emoji: '🎯', tag: '10' },
  { id: 'career-simulator', name: 'Career Simulator', emoji: '🧭', tag: '11' },
];

export const CircularEngineLoading: React.FC<CircularEngineLoadingProps> = ({
  title = 'Hydrating Student Digital Twin',
  subtitle = 'Synchronizing verified academic records with 11 Career OS intelligence engines...',
}) => {
  // Active glowing index that cycles through the 11 engines
  const [activeEngineIndex, setActiveEngineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveEngineIndex((prev) => (prev + 1) % ALL_ENGINES.length);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const radius = 160;
  const centerX = 200;
  const centerY = 200;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#02040a] text-slate-900 dark:text-white transition-colors select-none overflow-hidden">
      
      {/* Top Header spacer / brand badge */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold font-mono text-sm shadow-sm">
            ST
          </div>
          <span className="text-xs font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300">
            STUDENT TWIN OS V4
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-[11px] font-mono text-blue-600 dark:text-cyan-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>REAL-TIME ENGINE TELEMETRY</span>
        </div>
      </div>

      {/* Main Center Stage: Circular Engine Visualization */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        {/* Circular Orbit Area */}
        <div className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] flex items-center justify-center">
          
          {/* Subtle SVG Orbital Tracks and Connectors */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
            {/* Outer Orbit Track */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-white/10"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Secondary Inner Orbit Track */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius * 0.55}
              fill="none"
              stroke="currentColor"
              className="text-slate-200 dark:text-white/5"
              strokeWidth="1"
            />
            {/* Radial Connector Rays to Each Engine Node */}
            {ALL_ENGINES.map((_, i) => {
              const angle = (i / ALL_ENGINES.length) * 2 * Math.PI - Math.PI / 2;
              const x2 = centerX + Math.cos(angle) * radius;
              const y2 = centerY + Math.sin(angle) * radius;
              const isActive = i === activeEngineIndex;
              return (
                <line
                  key={i}
                  x1={centerX}
                  y1={centerY}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  className={isActive ? 'text-blue-500 dark:text-cyan-400 transition-colors duration-300' : 'text-slate-200 dark:text-white/5'}
                  strokeWidth={isActive ? '1.5' : '0.75'}
                />
              );
            })}
          </svg>

          {/* Central Hub Core */}
          <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-[#0d1117] border border-blue-500/30 dark:border-cyan-500/30 shadow-lg shadow-blue-500/10 flex flex-col items-center justify-center p-2 text-center transition-transform duration-300">
            <div className="w-8 h-8 rounded-xl bg-blue-600 dark:bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-sm shadow-blue-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white uppercase tracking-tight">
              Twin Core
            </span>
            <span className="text-[9px] font-mono text-blue-600 dark:text-cyan-400 font-semibold">
              11 Engines
            </span>
          </div>

          {/* 11 Engine Nodes in Circular Orbit */}
          {ALL_ENGINES.map((eng, i) => {
            const angle = (i / ALL_ENGINES.length) * 2 * Math.PI - Math.PI / 2;
            const x = Math.cos(angle) * (radius * 0.95);
            const y = Math.sin(angle) * (radius * 0.95);
            const isActive = i === activeEngineIndex;

            return (
              <div
                key={eng.id}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
                className={`absolute z-20 flex flex-col items-center transition-all duration-300 ${
                  isActive ? 'scale-110' : 'scale-95 opacity-80 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm shadow-md transition-all cursor-default ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-blue-500/30 ring-2 ring-blue-400 dark:ring-cyan-400'
                      : 'bg-white dark:bg-[#161b22] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                  title={`${eng.name} (Engine #${eng.tag})`}
                >
                  <span>{eng.emoji}</span>
                </div>
                <span
                  className={`mt-1 text-[9px] sm:text-[10px] font-mono font-bold whitespace-nowrap px-1.5 py-0.5 rounded transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-blue-900/30'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {eng.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Status Text Details */}
        <div className="text-center mt-6 space-y-1.5 max-w-md px-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Scrolling Marquee of all 11 Engines */}
      <div className="border-t border-slate-200 dark:border-white/10 bg-white/50 dark:bg-[#080b10] py-2.5 overflow-hidden">
        <div className="animate-marquee flex items-center gap-8">
          {[...ALL_ENGINES, ...ALL_ENGINES].map((eng, idx) => (
            <div
              key={`${eng.id}-${idx}`}
              className="inline-flex items-center gap-2 text-xs font-mono shrink-0 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5"
            >
              <span>{eng.emoji}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{eng.name}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
