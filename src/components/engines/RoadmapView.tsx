import React, { useState, useEffect, useMemo } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useAuth } from '../../context/AuthContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateRoadmapPDF } from '../../lib/pdfExportService';
import { UserRoadmap, RoadmapPhase, RoadmapTask } from '../../types/roadmap';
import {
  loadUserRoadmaps,
  saveUserRoadmap,
  getDemoShowcaseRoadmap,
  updateTaskCompletion,
  deleteUserRoadmap,
  recalculateRoadmapProgress,
} from '../../lib/roadmapStorageService';
import {
  Milestone,
  CheckCircle2,
  Calendar,
  Sparkles,
  Download,
  Copy,
  Check,
  Target,
  Clock,
  ArrowRight,
  Layers,
  Award,
  Plus,
  Trash2,
  AlertCircle,
  BookOpen,
  Briefcase,
  Code2,
  CheckSquare,
  Square,
  ChevronDown,
  Compass,
  FolderGit2,
} from 'lucide-react';

interface RoadmapViewProps {
  onBackToHub?: () => void;
}

const DOMAIN_OPTIONS = [
  'Full-Stack Development',
  'AI & Machine Learning',
  'Data Science & Analytics',
  'Cloud & DevOps Engineering',
  'Cybersecurity & Defense',
  'Mobile App Development',
  'Backend & Distributed Systems',
  'Custom Domain',
];

const GOAL_OPTIONS = [
  'Placement in Tier-1 Product Companies',
  'Summer Engineering Internship Sprint',
  'Full-Time SDE Placement Blitz',
  'Transition from Student to Senior Contributor',
  'High-Impact Open Source & Portfolio Rigor',
  'Custom Goal',
];

export const RoadmapView: React.FC<RoadmapViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'roadmap-30-60-90')!;
  const { profile, skills, projects, achievements, careerGoals, isDemoMode } = useStudentTwin();
  const { user } = useAuth();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('roadmap-30-60-90');

  // Multi-Roadmap State
  const [roadmaps, setRoadmaps] = useState<UserRoadmap[]>([]);
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(null);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(true);

  // New Roadmap Form State
  const [isConfiguringNew, setIsConfiguringNew] = useState(false);
  const [domainSelection, setDomainSelection] = useState<string>(
    careerGoals?.[0]?.targetDomain || 'Full-Stack Development'
  );
  const [customDomain, setCustomDomain] = useState('');
  const [goalSelection, setGoalSelection] = useState<string>(
    'Placement in Tier-1 Product Companies'
  );
  const [customGoal, setCustomGoal] = useState('');
  const [durationDays, setDurationDays] = useState<30 | 60 | 90>(90);
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [weeklyCommitment, setWeeklyCommitment] = useState<'15h' | '25h' | '40h'>('25h');
  const [specificTopics, setSpecificTopics] = useState('');
  const [targetCompanies, setTargetCompanies] = useState(profile?.targetCompanyTier || '');

  // UI state
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Determine if student has sufficient twin information
  const hasTwinData = useMemo(() => {
    if (isDemoMode) return true;
    const hasSkills = Array.isArray(skills) && skills.length > 0;
    const hasProjects = Array.isArray(projects) && projects.length > 0;
    const hasTargetRole = Boolean(profile?.targetRole || profile?.headline);
    return hasSkills || hasProjects || hasTargetRole;
  }, [isDemoMode, skills, projects, profile]);

  // Load existing roadmaps on mount or when user changes
  useEffect(() => {
    let isMounted = true;

    async function fetchRoadmaps() {
      setIsLoadingRoadmaps(true);
      try {
        if (isDemoMode) {
          const demo = getDemoShowcaseRoadmap();
          if (isMounted) {
            setRoadmaps([demo]);
            setActiveRoadmapId(demo.id);
          }
        } else if (user?.id) {
          const userRoadmaps = await loadUserRoadmaps(user.id, profile?.id, false);
          if (isMounted) {
            setRoadmaps(userRoadmaps);
            if (userRoadmaps.length > 0) {
              setActiveRoadmapId(userRoadmaps[0].id);
            } else {
              setActiveRoadmapId(null);
              setIsConfiguringNew(true);
            }
          }
        } else {
          if (isMounted) {
            setRoadmaps([]);
            setActiveRoadmapId(null);
            setIsConfiguringNew(true);
          }
        }
      } catch (err) {
        console.error('Failed to load user roadmaps:', err);
      } finally {
        if (isMounted) {
          setIsLoadingRoadmaps(false);
        }
      }
    }

    fetchRoadmaps();

    return () => {
      isMounted = false;
    };
  }, [user?.id, profile?.id, isDemoMode]);

  // Find active roadmap
  const activeRoadmap = useMemo(() => {
    if (!activeRoadmapId) return roadmaps[0] || null;
    return roadmaps.find((r) => r.id === activeRoadmapId) || roadmaps[0] || null;
  }, [roadmaps, activeRoadmapId]);

  // Handle generation of new roadmap
  const handleGenerateRoadmap = async () => {
    if (!hasTwinData) return;
    if (isRunning) return;

    const chosenDomain = domainSelection === 'Custom Domain' ? (customDomain.trim() || 'Software Engineering') : domainSelection;
    const chosenGoal = goalSelection === 'Custom Goal' ? (customGoal.trim() || 'Career Acceleration') : goalSelection;
    const chosenHours = weeklyCommitment === '15h'
      ? '15 Hours/Week (Academic Sprint)'
      : weeklyCommitment === '25h'
      ? '25 Hours/Week (Intensive Career Acceleration)'
      : '40 Hours/Week (Full-Time Placement Blitz)';

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    const inputs = {
      domain: chosenDomain,
      goal: chosenGoal,
      durationDays,
      level,
      availableHours: chosenHours,
      targetRole: profile?.targetRole || `${chosenDomain} Specialist`,
      targetCompanies: targetCompanies.trim() || 'Tier-1 Engineering Teams',
      specificTopics: specificTopics.trim(),
    };

    const result = await execute({
      engineId: 'roadmap-30-60-90',
      studentContext,
      userInputs: inputs,
    });

    if (result && result.data) {
      const generated: UserRoadmap = {
        ...result.data,
        id: result.data.id || `roadmap-${Date.now()}`,
        userId: user?.id || 'guest',
        studentProfileId: profile?.id,
        isDemo: isDemoMode,
      };

      if (!isDemoMode && user?.id) {
        try {
          const saved = await saveUserRoadmap(generated, user.id, profile?.id);
          setRoadmaps((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
          setActiveRoadmapId(saved.id);
        } catch (e) {
          console.warn('Saved in local cache:', e);
          setRoadmaps((prev) => [generated, ...prev.filter((r) => r.id !== generated.id)]);
          setActiveRoadmapId(generated.id);
        }
      } else {
        setRoadmaps((prev) => [generated, ...prev.filter((r) => r.id !== generated.id)]);
        setActiveRoadmapId(generated.id);
      }

      setIsConfiguringNew(false);
      setSaveNotice('Roadmap generated and saved successfully!');
      setTimeout(() => setSaveNotice(null), 4000);
    }
  };

  // Handle toggling task completion
  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (!activeRoadmap) return;
    const newCompleted = !currentCompleted;

    // Calculate updated phases
    const updatedPhases = activeRoadmap.phases.map((phase) => ({
      ...phase,
      tasks: phase.tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            completed: newCompleted,
            completedAt: newCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      }),
    }));

    const { completedTasksCount, totalTasksCount, progress } = recalculateRoadmapProgress(updatedPhases);

    const updatedRoadmap: UserRoadmap = {
      ...activeRoadmap,
      phases: updatedPhases,
      completedTasksCount,
      totalTasksCount,
      progress,
      updatedAt: new Date().toISOString(),
    };

    // Update local state immediately for snappy UI
    setRoadmaps((prev) => prev.map((r) => (r.id === updatedRoadmap.id ? updatedRoadmap : r)));

    // Persist if authenticated
    if (!isDemoMode && user?.id) {
      try {
        await updateTaskCompletion(activeRoadmap.id, taskId, newCompleted, user.id);
      } catch (err) {
        console.error('Failed to persist task update:', err);
      }
    }
  };

  // Delete roadmap
  const handleDeleteRoadmap = async (roadmapId: string) => {
    if (isDemoMode) {
      alert('Demo showcase roadmap cannot be deleted.');
      return;
    }

    if (!confirm('Are you sure you want to delete this career sprint roadmap?')) {
      return;
    }

    if (user?.id) {
      await deleteUserRoadmap(roadmapId, user.id);
    }

    const remaining = roadmaps.filter((r) => r.id !== roadmapId);
    setRoadmaps(remaining);
    if (activeRoadmapId === roadmapId) {
      if (remaining.length > 0) {
        setActiveRoadmapId(remaining[0].id);
      } else {
        setActiveRoadmapId(null);
        setIsConfiguringNew(true);
      }
    }
  };

  const handleCopy = () => {
    if (!activeRoadmap) return;
    const textToCopy = rawText || `${activeRoadmap.title}\nDomain: ${activeRoadmap.domain}\nGoal: ${activeRoadmap.goal}\nDuration: ${activeRoadmap.durationDays} Days\nProgress: ${activeRoadmap.progress}%\n\nPhases:\n${activeRoadmap.phases.map((p) => `\n## ${p.name} (${p.days})\nFocus: ${p.focus}\nMilestones:\n${p.milestones.map((m) => `- ${m}`).join('\n')}\nTasks:\n${p.tasks.map((t) => `- [${t.completed ? 'X' : ' '}] (${t.type}) ${t.title} (${t.estimatedHours}h)`).join('\n')}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!activeRoadmap) return;
    setExportingPdf(true);
    const candidateName = profile?.fullName || profile?.name || (isDemoMode ? 'Alex Chen' : 'Student Candidate');

    try {
      await generateRoadmapPDF(
        {
          targetRole: activeRoadmap.targetRole || activeRoadmap.domain,
          candidateName,
          timeline: `${activeRoadmap.durationDays}-Day Sprint (${activeRoadmap.phases.length} Phase${activeRoadmap.phases.length > 1 ? 's' : ''})`,
          domain: activeRoadmap.domain,
          goal: activeRoadmap.goal,
          phases: activeRoadmap.phases.map((p) => ({
            phase: p.days || p.phase,
            theme: p.name,
            focus: p.focus,
            milestones: p.milestones,
            deliverables: p.deliverables,
            tasks: p.tasks.map((t) => ({
              title: t.title,
              description: t.description,
              completed: t.completed,
              type: t.type,
              estimatedHours: t.estimatedHours,
            })),
          })),
        },
        `${candidateName.replace(/\s+/g, '_')}_${activeRoadmap.domain.replace(/\s+/g, '_')}_${activeRoadmap.durationDays}d_Roadmap.pdf`
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const candidateName = profile?.fullName || profile?.name || (isDemoMode ? 'Alex Chen' : 'Scholar Candidate');

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={handleGenerateRoadmap}
      resultText={rawText || undefined}
    >
      <div className="space-y-6">

        {/* Save notice toast */}
        {saveNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between transition-all">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              {saveNotice}
            </span>
            <button
              onClick={() => setSaveNotice(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Insufficient Student Twin Notice */}
        {!hasTwinData && !isDemoMode && (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Insufficient Student Twin Evidence
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Add more Student Twin information to generate a personalized roadmap tailored to your actual skills and career goals.
                  We do not generate generic or placeholder roadmaps without verified student competencies.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {onBackToHub && (
                <button
                  onClick={onBackToHub}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Go to Student Twin Hub
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Control Bar: Multi-Roadmap Switcher & New Plan Button */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              Sprint Roadmaps:
            </span>

            {/* Roadmaps selector pills */}
            {roadmaps.map((r) => {
              const isActive = r.id === activeRoadmapId && !isConfiguringNew;
              return (
                <div key={r.id} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setActiveRoadmapId(r.id);
                      setIsConfiguringNew(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{r.domain}</span>
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'}`}>
                      {r.durationDays}d • {r.progress}%
                    </span>
                    {r.isDemo && (
                      <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Demo
                      </span>
                    )}
                  </button>

                  {!r.isDemo && !isDemoMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoadmap(r.id);
                      }}
                      title="Delete roadmap"
                      className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {roadmaps.length === 0 && !isLoadingRoadmaps && (
              <span className="text-xs text-slate-400 italic">No saved roadmaps yet.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfiguringNew((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isConfiguringNew
                  ? 'bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isConfiguringNew ? 'Close Creator' : 'Create New Sprint'}</span>
            </button>
          </div>
        </div>

        {/* Creator / Configuration Panel (when isConfiguringNew is active) */}
        {isConfiguringNew && (
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-blue-200 dark:border-blue-900/40 shadow-md space-y-6 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Configure Dynamic Career Sprint Roadmap</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  AI dynamically analyzes your Student Twin skills and gaps to generate achievable phase-by-phase action items.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                {candidateName}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* 1. Domain */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>1. Target Domain</span>
                </label>
                <select
                  value={domainSelection}
                  onChange={(e) => setDomainSelection(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {DOMAIN_OPTIONS.map((d) => (
                    <option key={d} value={d} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {d}
                    </option>
                  ))}
                </select>

                {domainSelection === 'Custom Domain' && (
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="Enter custom engineering domain..."
                    className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-blue-400 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                )}
              </div>

              {/* 2. Goal / Target */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-500" />
                  <span>2. Target Goal</span>
                </label>
                <select
                  value={goalSelection}
                  onChange={(e) => setGoalSelection(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {GOAL_OPTIONS.map((g) => (
                    <option key={g} value={g} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {g}
                    </option>
                  ))}
                </select>

                {goalSelection === 'Custom Goal' && (
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="Enter custom goal / horizon..."
                    className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-blue-400 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                )}
              </div>

              {/* 3. Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span>3. Sprint Duration</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { days: 30, label: '30 Days', phases: '1 Phase' },
                    { days: 60, label: '60 Days', phases: '2 Phases' },
                    { days: 90, label: '90 Days', phases: '3 Phases' },
                  ].map((d) => (
                    <button
                      key={d.days}
                      type="button"
                      onClick={() => setDurationDays(d.days as any)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-mono transition-all cursor-pointer ${
                        durationDays === d.days
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold">{d.label}</div>
                      <div className="text-[9px] opacity-80">{d.phases}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>4. Current Level</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`py-2 text-center rounded-xl text-xs font-mono transition-all cursor-pointer ${
                        level === l
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Weekly Commitment */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>5. Time Commitment</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '15h', label: '15h / wk' },
                    { id: '25h', label: '25h / wk' },
                    { id: '40h', label: '40h / wk' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setWeeklyCommitment(c.id as any)}
                      className={`py-2 text-center rounded-xl text-xs font-mono transition-all cursor-pointer ${
                        weeklyCommitment === c.id
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Target Companies */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                  <span>6. Target Companies</span>
                </label>
                <input
                  type="text"
                  value={targetCompanies}
                  onChange={(e) => setTargetCompanies(e.target.value)}
                  placeholder="e.g. Google, Stripe, Uber, Cloudflare"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* 7. Specific Focus Skills / Topics (Spans 3 cols on lg) */}
              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>7. Optional Specific Focus Skills or Tech Stack</span>
                </label>
                <input
                  type="text"
                  value={specificTopics}
                  onChange={(e) => setSpecificTopics(e.target.value)}
                  placeholder="e.g. Next.js App Router, Docker, PostgreSQL indexes, System Design, Microservices"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfiguringNew(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateRoadmap}
                disabled={isRunning || !hasTwinData}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRunning ? 'Synthesizing...' : `Generate ${durationDays}-Day Sprint Plan`}</span>
              </button>
            </div>
          </div>
        )}

        {/* AI Processing Card during generation */}
        {(isRunning || isError) && (
          <AIProcessingCard
            job={job}
            engineName={engine.name}
            onRetry={retry}
          />
        )}

        {/* Main Active Roadmap View */}
        {activeRoadmap ? (
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-6 transition-colors">

            {/* Header section with progress metric */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                    {activeRoadmap.durationDays}-DAY SPRINT ROADMAP
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {activeRoadmap.domain} • {activeRoadmap.availableHours || 'Dedicated Sprint'}
                  </span>
                  {activeRoadmap.isDemo && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      Demo Showcase (Read-Only)
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeRoadmap.title}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                  {activeRoadmap.summary || `Personalized execution blueprint calibrated for ${candidateName}, targeting ${activeRoadmap.goal}.`}
                </p>
              </div>

              {/* Progress and actions */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                {/* Progress block */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-right min-w-[140px]">
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Progress</div>
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="text-2xl font-bold font-mono text-blue-600 dark:text-cyan-400">
                      {activeRoadmap.progress}%
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ({activeRoadmap.completedTasksCount}/{activeRoadmap.totalTasksCount})
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${activeRoadmap.progress}%` }}
                    />
                  </div>
                </div>

                {/* Export actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPdf}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{exportingPdf ? 'Exporting...' : 'PDF'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Structured Phases with Tasks and Milestones */}
            <div className="space-y-6">
              {activeRoadmap.phases.map((phase: RoadmapPhase, pIdx: number) => {
                const isFirst = pIdx === 0;
                const isSecond = pIdx === 1;
                const badgeColor = isFirst
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : isSecond
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';

                return (
                  <div
                    key={phase.id || pIdx}
                    className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-5"
                  >
                    {/* Phase Title Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${badgeColor}`}>
                          {phase.days || phase.phase}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {phase.name}
                        </h3>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                        {phase.focus}
                      </span>
                    </div>

                    {/* Milestones */}
                    {phase.milestones && phase.milestones.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-blue-500" />
                          <span>Core Phase Milestones</span>
                        </h4>
                        <ul className="space-y-1.5 pl-1 text-xs text-slate-700 dark:text-slate-300">
                          {phase.milestones.map((m: string, mIdx: number) => (
                            <li key={mIdx} className="flex items-start gap-2">
                              <span className="text-blue-500 font-bold shrink-0">•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actionable Tasks List */}
                    <div className="space-y-2.5">
                      <h4 className="text-[11px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                          <span>Actionable Execution Tasks ({phase.tasks.filter((t) => t.completed).length}/{phase.tasks.length} Completed)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Click checkbox to mark done
                        </span>
                      </h4>

                      <div className="space-y-2">
                        {phase.tasks.map((task: RoadmapTask) => {
                          const isDone = task.completed;
                          return (
                            <div
                              key={task.id}
                              onClick={() => handleToggleTask(task.id, isDone)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                                isDone
                                  ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20'
                                  : 'bg-white dark:bg-[#0d1117] border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/50 shadow-xs'
                              }`}
                            >
                              <button
                                type="button"
                                className="shrink-0 mt-0.5 text-slate-400 hover:text-blue-500 transition-colors"
                              >
                                {isDone ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </button>

                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-xs font-semibold ${
                                      isDone
                                        ? 'line-through text-slate-400 dark:text-slate-500'
                                        : 'text-slate-900 dark:text-white'
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                                    {task.type}
                                  </span>
                                  {task.estimatedHours && (
                                    <span className="text-[10px] font-mono text-slate-400">
                                      ~{task.estimatedHours}h
                                    </span>
                                  )}
                                </div>
                                {task.description && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Deliverables / Proof of Work */}
                    {phase.deliverables && phase.deliverables.length > 0 && (
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 space-y-2">
                        <h4 className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          <span>Verifiable Proof of Work Deliverables</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pl-1">
                          {phase.deliverables.map((del: string, dIdx: number) => (
                            <li key={dIdx} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{del}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        ) : (
          /* Empty state */
          !isLoadingRoadmaps && !isConfiguringNew && (
            <div className="p-10 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-center space-y-4">
              <Compass className="w-10 h-10 text-blue-500 mx-auto opacity-75" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No Active Career Roadmap Found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Create your first personalized 30, 60, or 90-day learning sprint tailored to your verified Student Twin competencies and target roles.
                </p>
              </div>
              <button
                onClick={() => setIsConfiguringNew(true)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Configure New Sprint Plan</span>
              </button>
            </div>
          )
        )}

      </div>
    </EngineLayout>
  );
};
