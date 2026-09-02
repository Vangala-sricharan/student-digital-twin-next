import React, { useState } from 'react';
import { SDTLogo } from './SDTLogo';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, Play, ArrowRight, LogIn } from 'lucide-react';

interface HeaderProps {
  onNavigate: (route: string) => void;
  activeRoute?: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, activeRoute = '/' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      if (activeRoute !== '/') {
        onNavigate('/');
        setTimeout(() => {
          const elem = document.querySelector(href);
          elem?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const elem = document.querySelector(href);
        elem?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onNavigate(href);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/85 dark:bg-[#02040a]/80 border-b border-slate-200/80 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('/')}
          className="cursor-pointer flex items-center"
        >
          <SDTLogo size="md" />
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-widest">
          <button
            onClick={() => handleNavClick('#features')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick('#how-it-works')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => handleNavClick('#benefits')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Benefits
          </button>
          <button
            onClick={() => handleNavClick('#pricing')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span>Pricing</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-300 border border-blue-500/20 font-bold">
              ₹
            </span>
          </button>
          <button
            onClick={() => handleNavClick('#about')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => handleNavClick('#contact')}
            className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Contact
          </button>

          <span className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />

          {/* Try Demo Button in Nav */}
          <button
            onClick={() => handleNavClick('/demo')}
            className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-current text-blue-600 dark:text-cyan-400" />
            <span>Try Demo</span>
          </button>
        </nav>

        {/* Right CTA Area: Theme, Log In, Sign Up */}
        <div className="hidden sm:flex items-center gap-4">
          <ThemeToggle showLabel={false} />

          <button
            onClick={() => onNavigate('/login')}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium cursor-pointer flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5 opacity-70" />
            <span>Log In</span>
          </button>

          <button
            onClick={() => onNavigate('/signup')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-[0_4px_14px_rgba(37,99,235,0.4)] cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
          >
            <span>SIGN UP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#02040a]/95 backdrop-blur-xl px-6 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2 text-xs uppercase tracking-widest font-medium text-slate-700 dark:text-slate-300">
            <button
              onClick={() => handleNavClick('#features')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('#how-it-works')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick('#benefits')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              Benefits
            </button>
            <button
              onClick={() => handleNavClick('#pricing')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white flex items-center justify-between"
            >
              <span>Pricing (₹)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-300 font-mono font-bold">
                ₹0 - ₹12,999
              </span>
            </button>
            <button
              onClick={() => handleNavClick('#about')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              About the Founder
            </button>
            <button
              onClick={() => handleNavClick('#contact')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
            >
              Contact
            </button>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2.5">
            <button
              onClick={() => handleNavClick('/demo')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current text-blue-600 dark:text-cyan-400" />
              <span>Try Demo Mode</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleNavClick('/login')}
                className="py-2.5 px-3 rounded-xl text-xs font-semibold text-center border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Log In
              </button>
              <button
                onClick={() => handleNavClick('/signup')}
                className="py-2.5 px-3 rounded-xl text-xs font-bold text-center bg-blue-600 text-white hover:bg-blue-500 shadow-[0_4px_14px_rgba(37,99,235,0.4)] uppercase"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

