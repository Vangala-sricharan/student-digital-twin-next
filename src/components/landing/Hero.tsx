import React from 'react';
import { Play, Sparkles, ArrowRight, BarChart3, TrendingUp, FolderGit2, Target, Bot } from 'lucide-react';
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
      className="relative isolate overflow-hidden pt-10 sm:pt-14 lg:pt-16 pb-24 sm:pb-28 lg:pb-32 border-b border-slate-200/80 dark:border-white/10 bg-[#f8fafc] dark:bg-[#02050e] text-slate-900 dark:text-white transition-colors"
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
        
        {/* Top Centered Block: Horizontal Row of All 5 Labels + Eyebrow Badge */}
        <div className="flex flex-col items-center justify-center text-center mb-6 sm:mb-8 lg:mb-10">
          
          {/* Horizontal Row of 5 Labels: Skills Analysis | Real-time Insights | Projects | Career Growth | AI Guidance */}
          <div className="w-full overflow-x-auto no-scrollbar py-1.5 flex items-center justify-center">
            <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 md:gap-4 lg:gap-5 shrink-0">
              {/* 1. Skills Analysis */}
              <div 
                id="badge-skills-analysis"
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/95 dark:bg-[#060c24]/95 backdrop-blur-md border border-slate-200/90 dark:border-blue-500/50 text-slate-900 dark:text-white shadow-xl dark:shadow-[0_0_25px_rgba(37,99,235,0.45)] flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-transform hover:-translate-y-0.5"
              >
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                <span className="tracking-wide">Skills Analysis</span>
              </div>

              {/* 2. Real-time Insights */}
              <div 
                id="badge-realtime-insights"
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/95 dark:bg-[#060c24]/95 backdrop-blur-md border border-slate-200/90 dark:border-cyan-500/50 text-slate-900 dark:text-white shadow-xl dark:shadow-[0_0_24px_rgba(6,182,212,0.45)] flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-transform hover:-translate-y-0.5"
              >
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-cyan-300 shrink-0" />
                <span className="tracking-wide">Real-time Insights</span>
              </div>

              {/* 3. Projects */}
              <div 
                id="badge-projects"
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/95 dark:bg-[#060c24]/95 backdrop-blur-md border border-slate-200/90 dark:border-sky-500/50 text-slate-900 dark:text-white shadow-xl dark:shadow-[0_0_24px_rgba(14,165,233,0.45)] flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-transform hover:-translate-y-0.5"
              >
                <FolderGit2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="tracking-wide">Projects</span>
              </div>

              {/* 4. Career Growth */}
              <div 
                id="badge-career-growth"
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/95 dark:bg-[#060c24]/95 backdrop-blur-md border border-slate-200/90 dark:border-indigo-500/50 text-slate-900 dark:text-white shadow-xl dark:shadow-[0_0_25px_rgba(99,102,241,0.45)] flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-transform hover:-translate-y-0.5"
              >
                <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="tracking-wide">Career Growth</span>
              </div>

              {/* 5. AI Guidance */}
              <div 
                id="badge-ai-guidance"
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/95 dark:bg-[#060c24]/95 backdrop-blur-md border border-slate-200/90 dark:border-blue-500/50 text-slate-900 dark:text-white shadow-xl dark:shadow-[0_0_25px_rgba(37,99,235,0.45)] flex items-center gap-2 text-xs sm:text-sm font-bold whitespace-nowrap transition-transform hover:-translate-y-0.5"
              >
                <Bot className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                <span className="tracking-wide">AI Guidance</span>
              </div>
            </div>
          </div>

          {/* Small gap */}
          <div className="mt-3.5 sm:mt-4">
            {/* Eyebrow Badge (Matching Reference) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-950/80 border border-blue-500/30 dark:border-cyan-400/40 text-blue-600 dark:text-cyan-400 text-xs font-mono font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 shrink-0" />
              <span>AI-Powered • Built for Students • Driven by Your Growth</span>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-6 xl:gap-8 items-center">
          
          {/* 1. Left Column: Hero Copy, CTAs & Statistics */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left z-20">

            {/* Headline with Dual Cyan/White Gradient (Matching Reference) */}
            <h1 className="text-3xl sm:text-5xl lg:text-[44px] xl:text-[54px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08] break-words">
              Your AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-cyan-400 dark:via-sky-400 dark:to-blue-400">
                Student Career
              </span> <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-cyan-400 dark:via-sky-400 dark:to-blue-400">
                Readiness OS
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base xl:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Construct your professional digital replica. Analyze evolving abilities, project proof-of-work, and identify readiness gaps with AI intelligence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1">
              <button
                id="btn-hero-build-twin"
                onClick={() => onNavigate('/signup')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-7 sm:px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(37,99,235,0.45)] group cursor-pointer whitespace-nowrap"
              >
                <span>Build Your Student Twin</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                id="btn-hero-try-demo"
                onClick={() => onNavigate('/demo')}
                className="w-full sm:w-auto bg-white/90 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/15 px-7 sm:px-8 py-3.5 rounded-xl font-bold text-sm text-slate-900 dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs backdrop-blur-sm whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current text-blue-600 dark:text-cyan-400" />
                <span>Try Demo</span>
              </button>
            </div>

            {/* Statistics Row (Preserving INR and Real Metrics) */}
            <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-wrap sm:flex-nowrap items-center justify-center lg:justify-start gap-4 sm:gap-6 xl:gap-8">
              <div className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">94%</div>
                <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider font-mono">AVG READINESS SCORE</div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">11</div>
                <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider font-mono">AI ENGINES READY</div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div className="text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">₹1,499</div>
                <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider font-mono">STUDENT PRO PLAN</div>
              </div>
            </div>

          </div>

          {/* 2 & 3. Center-Right Staging Area: Centered Digital Twin & Right Profile Card */}
          <div className="lg:col-span-7 xl:col-span-7 relative flex flex-col lg:flex-row items-center justify-center lg:justify-end min-h-[480px] sm:min-h-[540px] xl:min-h-[600px]">
            
            {/* The Dominant Central Digital Twin Visual (Centered in hero visual area, fully visible and readable) */}
            <div className="w-full max-w-[440px] sm:max-w-[490px] lg:max-w-[440px] xl:max-w-[500px] 2xl:max-w-[550px] lg:absolute lg:left-[-32%] xl:left-[-26%] 2xl:left-[-20%] lg:top-1/2 lg:-translate-y-1/2 z-20 my-6 lg:my-0">
              <CentralDigitalTwin />
            </div>

            {/* Right Profile Showcase Card (Kept in current position on the right) */}
            <div className="relative z-10 shrink-0 w-full max-w-[370px] sm:max-w-[390px] xl:max-w-[410px] mt-6 lg:mt-0 flex justify-center lg:justify-end lg:ml-auto">
              <CreatorShowcaseCard onExploreDemo={() => onNavigate('/demo')} />
            </div>

          </div>

        </div>
      </div>

    </section>
  );
};
