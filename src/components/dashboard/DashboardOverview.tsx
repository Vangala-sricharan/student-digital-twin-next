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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Student Digital Twin Editorial Hero Surface */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm relative overflow-hidden transition-all">
        
        {/* Soft atmospheric gradient accent */}
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gradient-to-bl from-blue-600/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          
          {/* Avatar & Student Credentials */}
          <div className="flex items-start sm:items-center gap-5 sm:gap-6 flex-1">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/10">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName || 'Student Twin'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-[14px] object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-[14px] bg-slate-50 dark:bg-[#02040a] flex items-center justify-center text-blue-600 dark:text-cyan-300 font-mono font-bold text-2xl sm:text-3xl select-none">
                    {profile?.fullName?.charAt(0) || 'S'}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 text-white rounded-full shadow-sm ring-4 ring-white dark:ring-[#0d1117]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profile?.fullName || 'Student Twin'}
                </h1>
                <span className="text-[10px] font-mono px-3 py-1 rounded-md bg-blue-500/10 dark:bg-white/5 border border-blue-500/20 dark:border-white/10 text-blue-600 dark:text-cyan-300 font-bold uppercase tracking-wider">
                  {isDemoMode ? 'Creator Showcase' : 'Verified Twin'}
                </span>
              </div>

              <div className="text-sm sm:text-base font-semibold text-blue-600 dark:text-cyan-400">
                {profile?.targetRole || 'Engineering Candidate'} {profile?.degree && <span className="text-slate-700 dark:text-slate-300 font-medium">• {profile.degree} {profile.branch ? `(${profile.branch})` : ''}</span>}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 flex-wrap pt-0.5">
                {profile?.university && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    {profile.university}
                  </span>
                )}
                {(profile?.year || profile?.yearOfStudy) && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>{profile.year ? `Year ${profile.year}` : profile.yearOfStudy} {profile?.semester ? `(Sem ${profile.semester})` : ''}</span>
                  </>
                )}
                {Boolean(profile?.cgpa && Number(profile.cgpa) > 0) && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                      CGPA: {profile.cgpa}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Prominent Readiness Score Surface */}
          <div className="shrink-0 w-full lg:w-auto p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 flex items-center justify-between sm:justify-start gap-6 shadow-sm">
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                Twin Placement Readiness
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-cyan-400" />
                <span>{profile?.readinessScore ?? 0}%</span>
              </div>
              <div className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold">
                <span className={`w-2 h-2 rounded-full ${(profile?.readinessScore ?? 0) > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={(profile?.readinessScore ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}>
                  {(profile?.readinessScore ?? 0) > 0
                    ? (profile!.readinessScore >= 80 ? 'Top Placement Readiness' : 'Calibration Active')
                    : '0% • Awaiting Evidence'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('readiness')}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider font-mono shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Full Audit</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* Bio / Career Narrative */}
        {profile?.bio && (
          <div className="mt-5 pt-5 border-t border-slate-200/80 dark:border-white/5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-4xl font-normal">
            {profile.bio}
          </div>
        )}
      </div>

      {/* 2. Asymmetric & Flowing Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric 1: Verified Skills Ontology */}
        <div
          onClick={() => onNavigateTab('skills')}
          className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm hover:border-blue-500/40 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Skills Ontology
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/5 text-blue-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
            {skills.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified across languages, frameworks & system design
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-cyan-400 font-mono">
            <span>Explore Skills</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Metric 2: Proof-of-Work Repositories */}
        <div
          onClick={() => onNavigateTab('projects')}
          className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm hover:border-indigo-500/40 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Proof-of-Work Repos
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-white/5 border border-indigo-100 dark:border-white/5 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
            {projects.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            AST verified code entropy and depth proofs
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
            <span>View Architecture</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Metric 3: Academic & Milestone Distinctions */}
        <div
          onClick={() => onNavigateTab('achievements')}
          className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm hover:border-amber-500/40 transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              Honors & Certifications
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-white/5 border border-amber-100 dark:border-white/5 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
            {achievements.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Competitive distinctions and accredited credentials
          </p>
          <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 font-mono">
            <span>Inspect Proofs</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

      </div>

      {/* 3. Main Workspace Editorial Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column: Skills & Proof-of-Work Projects */}
        <div className="lg:col-span-8 space-y-7">
          
          {/* Living Skills Ontology Section */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Living Skills Ontology
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time proficiency graph dynamically anchored to your verified repositories
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('skills')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-blue-600 dark:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>View All ({skills.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {skills.slice(0, 6).map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </span>
                    <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 font-bold">
                      {s.proficiency}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${s.proficiency}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{s.category}</span>
                    {s.verified && (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Verified Proof
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proof-of-Work Architecture Repositories */}
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-5 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Proof-of-Work Architecture Repositories
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verified code entropy, AST depth, and commit telemetry proofs
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('projects')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-blue-600 dark:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>All Repos ({projects.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5 pt-1">
              {projects.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 space-y-3 hover:border-blue-500/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                        <Code2 className="w-4 h-4" />
                      </div>
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
                          className="p-2 rounded-lg bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-white/10 transition-colors"
                          title="View Repository"
                        >
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {p.liveUrl && (
                        <a
                          href={p.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-white/10 transition-colors"
                          title="Live Deployment"
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
                          className="px-2.5 py-0.5 rounded-md bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {p.astDepth && (
                      <span className="text-blue-600 dark:text-cyan-400 font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
                        AST Depth: {p.astDepth}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: AI Intelligence & Roadmap */}
        <div className="lg:col-span-4 space-y-7">
          
          {/* AI Career Intelligence Surface */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/10 via-slate-50 dark:via-[#0d1117] to-white dark:to-[#0d1117] border border-blue-500/20 dark:border-blue-500/30 text-slate-800 dark:text-white space-y-4 shadow-sm transition-all">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wider">
                AI Career Intelligence
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Student digital replica exhibits strong algorithmic fundamentals with exceptional proof-of-work entropy in distributed systems and agentic AI architectures.
            </p>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-[#02040a]/60 border border-blue-200 dark:border-blue-500/20 space-y-1.5">
              <div className="text-[10px] font-mono text-blue-700 dark:text-cyan-300 font-bold uppercase">
                Recommended Sprint
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                Publish a technical whitepaper or distributed benchmark for your Multi-Agent Orchestration framework to solidify top 1% placement calibration.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('engines')}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch 11 AI Engines</span>
            </button>
          </div>

          {/* Career Milestones & Roadmap */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-4 transition-all">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Career Goals & Roadmap
              </h3>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5">
                {careerGoals.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {careerGoals.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {g.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-cyan-400">
                      {g.progress}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/5 overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
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

          {/* Institutional Affiliation */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200/90 dark:border-white/10 shadow-sm space-y-3 transition-all">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Institutional Affiliation
            </h3>
            
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-white text-sm">
                {profile?.university}
              </div>
              <div>Faculty of Engineering & Technology</div>
              <div className="text-blue-600 dark:text-cyan-400 font-medium">
                {profile?.degree} in {profile?.branch}
              </div>
              <div className="pt-2 font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                Enrollment: Verified Academic Scholar
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
