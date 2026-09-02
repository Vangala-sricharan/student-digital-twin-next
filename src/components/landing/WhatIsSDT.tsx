import React from 'react';
import { Network, BarChart3, Database, FileCheck, Layers, GitFork, Award, Brain } from 'lucide-react';

export const WhatIsSDT: React.FC = () => {
  return (
    <section id="features" className="py-20 lg:py-28 bg-white dark:bg-[#02040a] border-b border-slate-200 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest font-mono">
            System Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            What is Student Digital Twin?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            A dynamic, computational replica of a student engineer’s complete academic journey, technical abilities, verified project proof, and career readiness trajectory.
          </p>
        </div>

        {/* 6 Key Pillars Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Professional Digital Replica
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Consolidates academic performance, repository commits, coursework, and problem-solving velocity into an immutable digital entity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Academic Abilities
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Maps curriculum grades, semester GPA progression, and core theoretical fundamentals against structured domain matrices.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-white/5 border border-cyan-500/20 dark:border-white/10 flex items-center justify-center text-cyan-600 dark:text-cyan-300">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Technical Proficiency
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Evaluates algorithmic complexity, language depth, API patterns, and systems design across all validated code repositories.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-white/5 border border-emerald-500/20 dark:border-white/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Project Proof-of-Work
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Replaces static resume claims with verifiable Abstract Syntax Tree (AST) code depth analysis, commit hygiene, and architecture diagrams.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-white/5 border border-amber-500/20 dark:border-white/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Verified Milestones
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tracks hackathon wins, research fellowships, open-source pull requests, and accredited certifications with cryptographic integrity.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-white/5 border border-purple-500/20 dark:border-white/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Career Readiness
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Synthesizes real-time placement probabilities against live Tier-1 job requirements and highlights precise skill gaps for remediation.
            </p>
          </div>

        </div>

        {/* Highlight Focus: Living Student Graph & Industry Benchmarking */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white space-y-4 relative overflow-hidden group shadow-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold uppercase tracking-widest">
              <GitFork className="w-3 h-3" />
              <span>Core Graph</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">The Living Student Graph</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Unlike static resumes that are updated once a semester, your Student Digital Twin operates as a living computational graph. Every commit, solved DSA problem, and completed lab project continuously updates your readiness vectors in real time.
            </p>
          </div>

          <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white space-y-4 relative overflow-hidden group shadow-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-widest">
              <BarChart3 className="w-3 h-3" />
              <span>Calibrated Analytics</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Calibrated Industry Benchmarking</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Evaluates student readiness against strict engineering rubrics from top tech firms and research labs. Pinpoints exact algorithmic, architectural, and communicative gaps preventing high-tier offer acquisition.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

