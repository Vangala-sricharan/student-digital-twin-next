import React from 'react';
import { SDTLogo } from './SDTLogo';
import { CREATOR_INFO } from '../../data/demoData';
import { Database, ShieldCheck, Terminal, Github, Linkedin, ExternalLink, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-slate-100 dark:bg-[#02040a] text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-white/5 pt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200 dark:border-white/5">
          
          {/* Col 1: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <SDTLogo size="md" />
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              The AI-Powered Student Career Readiness Operating System. Constructing living digital replicas that verify skills, proof-of-work, and market calibration.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={CREATOR_INFO.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors shadow-sm"
                aria-label="Founder GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href={CREATOR_INFO.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 border border-slate-200 dark:border-white/10 transition-colors shadow-sm"
                aria-label="Founder LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>

            {/* Founder badge */}
            <div className="pt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="text-slate-800 dark:text-slate-300 font-semibold">Architected by:</span> {CREATOR_INFO.name} ({CREATOR_INFO.university})
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 font-mono">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate('/')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">
                  Landing Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/demo')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5 text-blue-600 dark:text-cyan-300 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo Sandbox</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/signup')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">
                  Create Twin Account
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/login')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">
                  Student Sign In
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Foundation Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 font-mono">Telemetry & Specs</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Supabase PostgreSQL + RLS</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Isolated Demo Sandbox</span>
              </li>
              <li className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Deterministic Diagnostics</span>
              </li>
              <li className="pt-1">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-300 font-mono">
                  Default Plan: Free (₹0)
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Founder & University */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 font-mono">Creator Profile</h4>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <div className="font-semibold text-slate-800 dark:text-slate-200">{CREATOR_INFO.displayName}</div>
              <div>{CREATOR_INFO.role}</div>
              <div>{CREATOR_INFO.academicProgram}</div>
              <div className="text-blue-600 dark:text-cyan-400 font-medium">{CREATOR_INFO.university}</div>
              <div className="pt-1 flex gap-2">
                <a
                  href={CREATOR_INFO.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
                >
                  GitHub <ExternalLink className="w-3 h-3" />
                </a>
                <span>•</span>
                <a
                  href={CREATOR_INFO.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                >
                  LinkedIn <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Immersive Telemetry Ticker */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 text-[10px] font-medium text-slate-500 uppercase tracking-widest gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <span>System Telemetry: <span className="text-emerald-600 dark:text-emerald-400 font-bold">Optimal</span></span>
            <span>Engine Build: <span className="text-slate-700 dark:text-slate-400">Phase 1 v4.0</span></span>
            <span>Marwadi University Affiliate</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-slate-600 dark:text-slate-400">© 2026 Student Digital Twin OS</span>
            <span>Supabase Secure Auth Integrated</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

