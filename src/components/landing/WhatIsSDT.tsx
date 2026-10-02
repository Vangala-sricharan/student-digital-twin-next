import React from 'react';
import { Network, BarChart3, Database, FileCheck, Layers, GitFork, Award, Brain, Github, Linkedin, FileText, Compass, Sparkles } from 'lucide-react';

export const WhatIsSDT: React.FC = () => {
  return (
    <section id="features" className="py-20 lg:py-28 bg-white dark:bg-[#02040a] border-b border-slate-200 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Section Header */}
        <header className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest font-mono">
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            What is Student Digital Twin OS?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Student Digital Twin OS is an AI-powered career readiness platform that helps students build, analyze, and improve their professional profile. Operating on actual student records, it connects coursework, GitHub repositories, certifications, and technical projects into unified student career intelligence.
          </p>
        </header>

        {/* Core Capabilities Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <article className="p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-xs dark:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Student Profile Intelligence
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Consolidates academic standing, coursework, target career tracks, and verified skills into an evolving digital student twin.
            </p>
          </article>

          <article className="p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-xs dark:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-white/5 border border-cyan-500/20 dark:border-white/10 flex items-center justify-center text-cyan-600 dark:text-cyan-300">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Student Skills Analysis
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Maps programming languages, frameworks, system design concepts, and database proficiencies to pinpoint high-demand competencies.
            </p>
          </article>

          <article className="p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-xs dark:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-white/5 border border-emerald-500/20 dark:border-white/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Project Portfolio Analysis
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Evaluates code depth, technical architecture, and implementation quality to construct genuine project proof-of-work.
            </p>
          </article>

          <article className="p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-xs dark:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 dark:bg-white/5 border border-slate-500/20 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Github className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              GitHub & Code Diagnostics
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Analyzes repository velocity, commit structure, and full-stack implementations directly from public GitHub profiles.
            </p>
          </article>

          <article className="p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-xs dark:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Linkedin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              LinkedIn & Certifications
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Extracts and verifies accredited certificates, job simulations, programs, and credential milestones from LinkedIn profile records.
            </p>
          </article>

          <article className="p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-xs dark:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-white/5 border border-indigo-500/20 dark:border-white/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              1-Page ATS Resume Builder
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Generates deterministic 1-page ATS technical resumes formatted directly from the student's authentic and verified projects.
            </p>
          </article>

          <article className="p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-xs dark:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-white/5 border border-amber-500/20 dark:border-white/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Career Guidance & Planning
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Personalized career guidance for students with structured milestones and semester-by-semester learning roadmaps.
            </p>
          </article>

          <article className="p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all space-y-3 shadow-xs dark:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-white/5 border border-purple-500/20 dark:border-white/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              AI Career Readiness Scoring
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Provides real-time student career intelligence and readiness diagnostics across academic, technical, and practical pillars.
            </p>
          </article>

        </div>

        {/* Highlight Focus: Living Student Graph & Industry Benchmarking */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <article className="p-8 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white space-y-4 relative overflow-hidden group shadow-xs dark:shadow-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold uppercase tracking-widest">
              <GitFork className="w-3 h-3" />
              <span>Core Graph</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">The Living Student Graph</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Unlike static resumes that are updated once a semester, your Student Digital Twin operates as a living computational graph. Every repository commit, verified certification, and completed project continuously updates your career readiness trajectory in real time.
            </p>
          </article>

          <article className="p-8 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white space-y-4 relative overflow-hidden group shadow-xs dark:shadow-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-widest">
              <BarChart3 className="w-3 h-3" />
              <span>Calibrated Analytics</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Calibrated Industry Benchmarking</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Evaluates student readiness against practical engineering rubrics, identifying specific architectural, algorithmic, and portfolio gaps to help students achieve meaningful professional development.
            </p>
          </article>

        </div>

      </div>
    </section>
  );
};

