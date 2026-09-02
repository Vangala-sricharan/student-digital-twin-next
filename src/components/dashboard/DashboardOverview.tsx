import React from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import {
  TrendingUp,
  Cpu,
  FolderGit2,
  Award,
  Sparkles,
  ExternalLink,
  Github,
  CheckCircle2,
  GraduationCap,
  Calendar,
  Layers,
  ArrowUpRight,
  Code2,
} from 'lucide-react';

interface DashboardOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigateTab }) => {
  const { profile, skills, projects, achievements, careerGoals, isDemoMode } = useStudentTwin();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Student Profile Hero Card (V2-Style) */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
        
        {/* Background gradient accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 via-cyan-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Avatar & Student Credentials */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md">
                <div className="w-full h-full rounded-[14px] bg-slate-100 dark:bg-[#02040a] flex items-center justify-center text-blue-600 dark:text-white font-mono font-bold text-xl sm:text-2xl">
                  {profile?.fullName.charAt(0) || 'S'}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-blue-600 text-white rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {profile?.fullName}
                </h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 text-blue-600 dark:text-cyan-300 font-semibold uppercase tracking-wider">
                  {isDemoMode ? 'Creator Showcase' : 'Verified Twin'}
                </span>
              </div>

              <div className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-cyan-400">
                {profile?.targetRole} • <span className="text-slate-700 dark:text-slate-300 font-medium">{profile?.degree} ({profile?.branch})</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 flex-wrap pt-0.5">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  {profile?.university}
                </span>
                <span>•</span>
                <span>{profile?.year} Year (Sem {profile?.semester})</span>
                <span>•</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">CGPA: {profile?.cgpa}</span>
              </div>
            </div>
          </div>

          {/* Readiness Score Card Ring */}
          <div className="shrink-0 w-full md:w-auto p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center gap-4 justify-between md:justify-start">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">Overall Readiness</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span>{profile?.readinessScore}%</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                Tier-1 Benchmark Ready
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('readiness')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Audit</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Bio snippet */}
        {profile?.bio && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl">
            {profile.bio}
          </div>
        )}
      </div>

      {/* 2. Key Metrics Grid (4 Blocks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-[1.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Readiness Score</span>
            <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-white/5 border border-blue-500/10 dark:border-white/5 text-blue-600 dark:text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {profile?.readinessScore}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Top 5% placement percentile
          </div>
        </div>

        <div className="p-5 rounded-[1.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Skills Verified</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-white/5 border border-indigo-500/10 dark:border-white/5 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {skills.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Across 5 technical domains
          </div>
        </div>

        <div className="p-5 rounded-[1.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Projects Index</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-white/5 border border-emerald-500/10 dark:border-white/5 text-emerald-600 dark:text-emerald-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {projects.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            AST verified codebases
          </div>
        </div>

        <div className="p-5 rounded-[1.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg space-y-2 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Milestones</span>
            <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-white/5 border border-amber-500/10 dark:border-white/5 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {achievements.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Honors & certifications
          </div>
        </div>

      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Skills & Projects */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Skills Preview */}
          <div className="p-6 sm:p-7 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Living Skills Ontology
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time proficiency index based on coursework and verified repositories
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('skills')}
                className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>All Skills ({skills.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {skills.slice(0, 6).map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </span>
                    <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-bold">
                      {s.proficiency}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      style={{ width: `${s.proficiency}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{s.category}</span>
                    {s.verified && (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proof-of-Work Projects Preview */}
          <div className="p-6 sm:p-7 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Proof-of-Work Architecture Repositories
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verified code entropy and Abstract Syntax Tree depth metrics
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('projects')}
                className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All Repos ({projects.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 pt-2">
              {projects.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2 hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {p.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.githubUrl && (
                        <a
                          href={p.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
                        >
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {p.liveUrl && (
                        <a
                          href={p.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2 text-[10px] font-mono">
                    <div className="flex flex-wrap gap-1.5">
                      {p.techStack.map((tech, ti) => (
                        <span
                          key={ti}
                          className="px-2 py-0.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {p.astDepth && (
                      <span className="text-blue-600 dark:text-cyan-400 font-semibold">
                        AST Depth: {p.astDepth}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: AI Insights & Career Goals */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Insight Card */}
          <div className="p-6 sm:p-7 rounded-[2rem] bg-gradient-to-br from-blue-900/10 sm:dark:from-blue-900/30 via-slate-50 dark:via-slate-900 to-white dark:to-[#0d1117] border border-blue-500/20 dark:border-blue-500/30 text-slate-800 dark:text-white space-y-4 shadow-sm dark:shadow-xl transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                AI Career Intelligence
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Student digital replica exhibits strong algorithmic fundamentals with exceptional proof-of-work entropy in distributed systems and agentic AI architectures.
            </p>

            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-[#02040a]/60 border border-blue-200 dark:border-blue-500/20 space-y-1.5">
              <div className="text-[10px] font-mono text-blue-700 dark:text-cyan-300 font-bold uppercase">
                Recommended Sprint
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                Publish a technical whitepaper or distributed benchmark for your Multi-Agent Orchestration framework to solidify top 1% placement calibration.
              </p>
            </div>
          </div>

          {/* Career Milestones & Goals */}
          <div className="p-6 sm:p-7 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Career Goals & Roadmap
              </h3>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold uppercase">
                {careerGoals.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {careerGoals.map((g) => (
                <div
                  key={g.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {g.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400">
                      {g.progress}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>Target: {g.targetDate}</span>
                    <span className="capitalize">{g.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Academic & University Profile */}
          <div className="p-6 sm:p-7 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-lg space-y-3 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Institutional Affiliation
            </h3>
            
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-white">
                {profile?.university}
              </div>
              <div>Faculty of Engineering & Technology</div>
              <div className="text-blue-600 dark:text-cyan-400 font-medium">
                {profile?.degree} in {profile?.branch}
              </div>
              <div className="pt-1 font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                Enrollment: Verified Academic Scholar
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
