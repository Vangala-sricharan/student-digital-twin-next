import React from 'react';
import { Play, Sparkles, ArrowRight } from 'lucide-react';
import { CreatorShowcaseCard } from './CreatorShowcaseCard';
import { CentralDigitalTwin } from './CentralDigitalTwin';
import { CinematicSpaceBackground } from './CinematicSpaceBackground';
import { CinematicDaylightBackground } from './CinematicDaylightBackground';

interface HeroProps {
  onNavigate: (route: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section 
      id="hero-landing-section"
      className="relative isolate overflow-hidden pt-4 sm:pt-6 lg:pt-8 pb-12 sm:pb-14 lg:pb-16 border-b border-slate-200/80 dark:border-white/10 bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-white transition-colors"
    >
      {/* Light Theme: Cinematic Daylight Atmospheric Sky & Earth Horizon */}
      <div className="block dark:hidden">
        <CinematicDaylightBackground />
      </div>

      {/* Dark Theme: Cinematic Space Environment with Stars, Nebula, & Earth Horizon */}
      <div className="hidden dark:block">
        <CinematicSpaceBackground />
      </div>

      {/* Foreground Hero Canvas matching reference image composition */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* 3-Column Visual Layout: Left (Text & CTAs), Center (Orbital Digital Twin), Right (Showcase Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 xl:gap-6 items-center">
          
          {/* 1. Left Column: Eyebrow Badge, Hero Copy, CTAs & Statistics */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-4 sm:space-y-4.5 lg:space-y-5 text-center lg:text-left z-20">

            {/* Eyebrow Badge (Upper-Left Hero Composition) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-[#0b122f]/90 border border-blue-500/30 dark:border-cyan-400/40 text-blue-600 dark:text-cyan-300 text-[10.5px] sm:text-[11px] font-mono font-semibold backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Sparkles className="w-3 h-3 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span>AI-Powered • Built for Students • Driven by Your Growth</span>
            </div>

            {/* Headline with Dual Cyan/White Gradient */}
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] xl:text-[38px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.14] break-words drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
              Your AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-cyan-400 dark:via-sky-300 dark:to-blue-400">
                Student Career
              </span> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-cyan-400 dark:via-sky-300 dark:to-indigo-300">
                Readiness OS
              </span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm lg:text-[13px] xl:text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-md xl:max-w-lg mx-auto lg:mx-0 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              Construct your professional digital replica. Analyze evolving abilities, project proof-of-work, and identify readiness gaps with AI intelligence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-0.5">
              <button
                id="btn-hero-build-twin"
                onClick={() => onNavigate('/signup')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 sm:px-6 py-2.5 rounded-lg font-bold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 transition-all shadow-[0_0_22px_rgba(37,99,235,0.45)] hover:shadow-[0_0_30px_rgba(37,99,235,0.65)] group cursor-pointer whitespace-nowrap"
              >
                <span>Build Your Student Twin</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="btn-hero-try-demo"
                onClick={() => onNavigate('/demo')}
                className="w-full sm:w-auto bg-white/90 hover:bg-white dark:bg-[#070e24]/80 dark:hover:bg-[#0c1638] border border-slate-200 dark:border-white/15 px-5 sm:px-6 py-2.5 rounded-lg font-bold text-xs sm:text-[13px] text-slate-900 dark:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.15)] backdrop-blur-md whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current text-blue-600 dark:text-cyan-400" />
                <span>Try Demo</span>
              </button>
            </div>

            {/* Statistics Row (Preserving INR and Real Metrics) */}
            <div className="pt-3.5 sm:pt-4 border-t border-slate-200 dark:border-white/10 flex flex-wrap sm:flex-nowrap items-center justify-center lg:justify-start gap-3 sm:gap-5 xl:gap-6">
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">94%</div>
                <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider font-mono">AVG READINESS SCORE</div>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-white/10" />
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">11</div>
                <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider font-mono">AI ENGINES READY</div>
              </div>
              <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-white/10" />
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">₹1,499</div>
                <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider font-mono">STUDENT PRO PLAN</div>
              </div>
            </div>

          </div>

          {/* 2. Center Column: Dominant Central Digital Twin with Orbital Labels & Connection Lines */}
          <div className="lg:col-span-4 xl:col-span-4 relative flex items-center justify-center z-20 my-3 lg:my-0">
            <div className="w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[460px] xl:max-w-[500px]">
              <CentralDigitalTwin />
            </div>
          </div>

          {/* 3. Right Column: Creator Showcase / Readiness Card */}
          <div className="lg:col-span-4 xl:col-span-4 relative z-20 flex justify-center lg:justify-end">
            <div className="w-full max-w-[320px] sm:max-w-[350px] lg:max-w-[340px] xl:max-w-[370px]">
              <CreatorShowcaseCard onExploreDemo={() => onNavigate('/demo')} />
            </div>
          </div>

        </div>
      </div>

    </section>
  );
};
