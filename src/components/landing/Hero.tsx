import React from 'react';
import { ArrowRight, Play, Shield, Sparkles, Terminal } from 'lucide-react';
import { CreatorShowcaseCard } from './CreatorShowcaseCard';

interface HeroProps {
  onNavigate: (route: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#02040a] transition-colors">
      
      {/* Background radial highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[0.98] tracking-tighter text-slate-900 dark:text-white">
              Your AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">
                Student Career<br />Readiness OS
              </span>
            </h1>

            {/* Supporting Message */}
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Construct your professional digital replica. Analyze evolving abilities, project proof-of-work, and identify readiness gaps with AI intelligence.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => onNavigate('/signup')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.4)] group cursor-pointer"
              >
                <span>Build Your Student Twin</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <button
                onClick={() => onNavigate('/demo')}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 px-8 py-4 rounded-xl font-bold text-sm text-slate-800 dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current text-blue-600 dark:text-cyan-400" />
                <span>Try Demo</span>
              </button>
            </div>

            {/* Stats Ticker */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/5 flex items-center justify-center lg:justify-start gap-8 sm:gap-10">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">94%</div>
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Avg Readiness Score</div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/5" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">11</div>
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">AI Engines Ready</div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/5" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">₹1,499</div>
                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Student Pro Plan</div>
              </div>
            </div>

          </div>

          {/* Right Hero: Creator Showcase Card */}
          <div className="lg:col-span-5 flex justify-center">
            <CreatorShowcaseCard onExploreDemo={() => onNavigate('/demo')} />
          </div>

        </div>
      </div>
    </section>
  );
};

