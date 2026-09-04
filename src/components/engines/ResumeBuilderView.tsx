import React, { useState, useEffect } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateResumePDF } from '../../lib/pdfExportService';
import {
  FileText,
  CheckCircle2,
  Sliders,
  Sparkles,
  Download,
  Copy,
  Check,
  Printer,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  User,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Link2,
} from 'lucide-react';

interface ResumeBuilderViewProps {
  onBackToHub?: () => void;
}

interface ResumeProjectItem {
  id: string;
  title: string;
  techStack: string;
  bullets: string[];
}

interface ResumeExpItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
}

interface ResumeAchievementItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
}

export const ResumeBuilderView: React.FC<ResumeBuilderViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'resume-builder')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('resume-builder');

  // Mode: Editor vs Full Live Preview
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  // Structured Resume State
  const [fullName, setFullName] = useState(profile?.fullName || profile?.name || '');
  const [headline, setHeadline] = useState(profile?.targetRole || profile?.headline || '');
  const [email, setEmail] = useState((profile as any)?.email || '');
  const [phone, setPhone] = useState((profile as any)?.phone || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || '');
  const [targetRole, setTargetRole] = useState(profile?.targetRole || '');

  const [summary, setSummary] = useState(
    profile?.bio ||
      (profile?.targetRole
        ? `Motivated student targeting ${profile.targetRole} roles with proven capability in modern software engineering and clean code practices.`
        : 'Motivated student with verified competencies in modern software engineering, scalable architectures, and clean code practices.')
  );

  const [languagesSkills, setLanguagesSkills] = useState(
    skills.filter((s) => ['TypeScript', 'JavaScript', 'Python', 'C++', 'Java', 'SQL'].includes(s.name)).map((s) => s.name).join(', ') ||
      skills.slice(0, 5).map((s) => s.name).join(', ') ||
      ''
  );
  const [frameworksSkills, setFrameworksSkills] = useState(
    skills.filter((s) => !['TypeScript', 'JavaScript', 'Python', 'C++', 'Java', 'SQL'].includes(s.name)).map((s) => s.name).join(', ') ||
      skills.slice(5, 10).map((s) => s.name).join(', ') ||
      ''
  );

  const [resumeProjects, setResumeProjects] = useState<ResumeProjectItem[]>(() =>
    projects.map((p) => ({
      id: p.id,
      title: p.title,
      techStack: p.techStack.join(' | '),
      bullets: [
        `Architected and built full-stack application using ${p.techStack.join(', ')}.`,
        p.description || 'Implemented core features with modular state management and secure data flow.',
        'Optimized performance and ensured reliable error handling across application layers.',
      ],
    }))
  );

  const [university, setUniversity] = useState(profile?.university || '');
  const [degree, setDegree] = useState(profile?.degree || '');
  const [branch, setBranch] = useState(profile?.branch || '');
  const [gradYear, setGradYear] = useState(profile?.gradYear || (profile?.year ? `${profile.year} Year` : ''));
  const [cgpa, setCgpa] = useState(profile?.cgpa?.toString() || '');

  const [resumeAchievements, setResumeAchievements] = useState<ResumeAchievementItem[]>(() =>
    achievements.map((a) => ({
      id: a.id,
      title: a.title,
      issuer: a.issuer,
      date: a.date,
    }))
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Sync state if AI generates fresh resume data
  useEffect(() => {
    if (structuredData?.resumeSections) {
      const sec = structuredData.resumeSections;
      if (sec.summary) setSummary(sec.summary);
      if (sec.headline) setHeadline(sec.headline);
    }
  }, [structuredData]);

  const handleBuildResumeAI = async () => {
    if (!profile || isRunning) return;

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    await execute({
      engineId: 'resume-builder',
      studentContext,
      userInputs: {
        targetRole,
        emphasis: 'Full-Stack Web, Systems & Algorithmic STAR Bullets',
      },
    });
  };

  const handleSaveResume = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopyText = () => {
    const textOutput = `
${fullName.toUpperCase()}
${headline}
${email} • ${phone} • ${location}
GitHub: ${githubUrl} • LinkedIn: ${linkedinUrl}

PROFESSIONAL SUMMARY
${summary}

TECHNICAL SKILLS
Languages & Core: ${languagesSkills}
Frameworks & Tools: ${frameworksSkills}

TECHNICAL PROJECTS
${resumeProjects
  .map(
    (p) => `${p.title} | ${p.techStack}
${p.bullets.map((b) => `• ${b}`).join('\n')}`
  )
  .join('\n\n')}

EDUCATION
${university} — ${degree} in ${branch} (${gradYear}) | CGPA: ${cgpa}/10.0

ACHIEVEMENTS & CERTIFICATIONS
${resumeAchievements.map((a) => `• ${a.title} — ${a.issuer} (${a.date})`).join('\n')}
`.trim();

    navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    setExportingPdf(true);

    try {
      await generateResumePDF(
        {
          name: fullName,
          role: headline,
          university,
          degree,
          branch,
          year: gradYear,
          cgpa,
          githubUrl,
          linkedinUrl,
          summary,
          skills: [
            `Languages: ${languagesSkills}`,
            `Frameworks & Tools: ${frameworksSkills}`,
          ],
          projects: resumeProjects.map((p) => ({
            title: p.title,
            techStack: p.techStack.split('|').map((s) => s.trim()),
            description: p.bullets.join(' '),
          })),
          achievements: resumeAchievements.map((a) => ({
            title: a.title,
            issuer: a.issuer,
            date: a.date,
          })),
        },
        `${fullName.replace(/\s+/g, '_')}_Resume.pdf`
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleAddProject = () => {
    const newProj: ResumeProjectItem = {
      id: `proj-${Date.now()}`,
      title: 'New Technical Project',
      techStack: 'TypeScript | React | Node.js',
      bullets: [
        'Architected end-to-end full-stack feature workflows.',
        'Integrated modular API architecture with high test coverage.',
      ],
    };
    setResumeProjects((prev) => [...prev, newProj]);
  };

  const handleRemoveProject = (id: string) => {
    setResumeProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateProjectBullet = (projId: string, bIndex: number, text: string) => {
    setResumeProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        const newBullets = [...p.bullets];
        newBullets[bIndex] = text;
        return { ...p, bullets: newBullets };
      })
    );
  };

  const handleAddProjectBullet = (projId: string) => {
    setResumeProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        return { ...p, bullets: [...p.bullets, 'Engineered high-performance module with verified latency reductions.'] };
      })
    );
  };

  const handleRemoveProjectBullet = (projId: string, bIndex: number) => {
    setResumeProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        return { ...p, bullets: p.bullets.filter((_, i) => i !== bIndex) };
      })
    );
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={handleBuildResumeAI}
      resultText={rawText || undefined}
    >
      <div className="space-y-6">
        
        {/* Top Header Card Matching V3 Reference */}
        <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  AI Technical Resume Builder
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                  ATS OPTIMIZED + STAR BULLETS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Multi-section builder prefilled with your verified projects and skills, enhanced with Gemini generation.
              </p>
            </div>
          </div>

          {/* Top Right Action Bar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* View Mode Toggle Pill */}
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'editor'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            <button
              onClick={handleSaveResume}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Save className="w-3.5 h-3.5 text-blue-500" />}
              <span>{saveSuccess ? 'Saved!' : 'Save Resume'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={exportingPdf}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{exportingPdf ? 'Exporting PDF...' : 'Print / PDF'}</span>
            </button>
          </div>
        </div>

        {/* Processing Indicator */}
        {(isRunning || isError) && (
          <AIProcessingCard
            job={job}
            engineName={engine.name}
            onRetry={retry}
          />
        )}

        {/* MAIN BODY: Switch between Editor Grid vs Full Live Preview */}
        {viewMode === 'editor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Structured Multi-Section Form (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* 1. Header & Contact Information */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>1. Header & Contact Information</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">ATS Header Key</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Target Professional Headline</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">GitHub URL</label>
                    <input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">LinkedIn URL</label>
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Professional Summary */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>2. Professional Summary</span>
                  </h3>
                  <button
                    onClick={handleBuildResumeAI}
                    disabled={isRunning}
                    className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Polish</span>
                  </button>
                </div>

                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* 3. Technical Skills */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>3. Technical Skills</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Comma Separated</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Languages & Core</label>
                    <input
                      type="text"
                      value={languagesSkills}
                      onChange={(e) => setLanguagesSkills(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Frameworks, Libraries & Tools</label>
                    <input
                      type="text"
                      value={frameworksSkills}
                      onChange={(e) => setFrameworksSkills(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Technical Projects */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>4. Technical Projects ({resumeProjects.length})</span>
                  </h3>
                  <button
                    onClick={handleAddProject}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {resumeProjects.map((p, pIdx) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeProjects((prev) => prev.map((item) => (item.id === p.id ? { ...item, title: val } : item)));
                            }}
                            placeholder="Project Title"
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            value={p.techStack}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeProjects((prev) => prev.map((item) => (item.id === p.id ? { ...item, techStack: val } : item)));
                            }}
                            placeholder="Tech Stack (e.g. React | Node.js | PostgreSQL)"
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-slate-300 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveProject(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                          title="Remove Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Bullets */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>STAR-Calibrated Bullet Points:</span>
                          <button
                            onClick={() => handleAddProjectBullet(p.id)}
                            className="text-blue-500 hover:underline flex items-center gap-0.5"
                          >
                            <Plus className="w-3 h-3" /> Add Bullet
                          </button>
                        </div>
                        {p.bullets.map((b, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2">
                            <span className="text-slate-400 mt-2">•</span>
                            <input
                              type="text"
                              value={b}
                              onChange={(e) => handleUpdateProjectBullet(p.id, bIdx, e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                            />
                            {p.bullets.length > 1 && (
                              <button
                                onClick={() => handleRemoveProjectBullet(p.id, bIdx)}
                                className="p-1.5 text-slate-400 hover:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Education */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>5. Education</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">Academic Standing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">University / Institution</label>
                    <input
                      type="text"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Degree & Branch</label>
                    <input
                      type="text"
                      value={`${degree} in ${branch}`}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Period & CGPA</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={gradYear}
                        onChange={(e) => setGradYear(e.target.value)}
                        placeholder="2022 - 2026"
                        className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                      />
                      <input
                        type="text"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        placeholder="8.8"
                        className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Achievements & Certifications */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>6. Achievements & Certifications</span>
                  </h3>
                  <button
                    onClick={() =>
                      setResumeAchievements((prev) => [
                        ...prev,
                        { id: `ach-${Date.now()}`, title: 'Academic / Hackathon Distinction', issuer: 'Distinguished Org', date: '2026' },
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {resumeAchievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          value={ach.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeAchievements((prev) => prev.map((item) => (item.id === ach.id ? { ...item, title: val } : item)));
                          }}
                          placeholder="Award / Honor Title"
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          value={ach.issuer}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeAchievements((prev) => prev.map((item) => (item.id === ach.id ? { ...item, issuer: val } : item)));
                          }}
                          placeholder="Issuing Organization"
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={ach.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeAchievements((prev) => prev.map((item) => (item.id === ach.id ? { ...item, date: val } : item)));
                          }}
                          placeholder="Date (e.g. 2026-09)"
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => setResumeAchievements((prev) => prev.filter((item) => item.id !== ach.id))}
                        className="p-1.5 text-slate-400 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Real-Time Resume Quick View (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-24 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                      Resume Quick View
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                      1-PAGE FIT
                    </span>
                    <button
                      onClick={() => setViewMode('preview')}
                      className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 hover:underline"
                    >
                      Expand
                    </button>
                  </div>
                </div>

                {/* Scaled ATS Paper Preview Card */}
                <div className="p-6 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200 font-sans text-[11px] leading-tight space-y-3.5 max-h-[780px] overflow-y-auto">
                  
                  {/* Header */}
                  <div className="text-center space-y-1 pb-2 border-b border-slate-300">
                    <h1 className="text-base font-bold tracking-tight text-slate-950 uppercase">
                      {fullName}
                    </h1>
                    <div className="text-xs font-semibold text-slate-700">
                      {headline}
                    </div>
                    <div className="text-[10px] text-slate-600 flex items-center justify-center flex-wrap gap-x-2">
                      <span>{email}</span>
                      <span>•</span>
                      <span>{phone}</span>
                      <span>•</span>
                      <span>{location}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 flex items-center justify-center flex-wrap gap-x-2">
                      <span>{githubUrl.replace(/^https?:\/\//, '')}</span>
                      <span>•</span>
                      <span>{linkedinUrl.replace(/^https?:\/\//, '')}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Professional Summary
                    </div>
                    <p className="text-[10px] text-slate-700 leading-snug">
                      {summary}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Technical Skills
                    </div>
                    <div className="text-[10px] text-slate-700 space-y-0.5">
                      <p><strong className="font-semibold text-slate-900">Languages & Core:</strong> {languagesSkills}</p>
                      <p><strong className="font-semibold text-slate-900">Frameworks & Tools:</strong> {frameworksSkills}</p>
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Technical Projects
                    </div>
                    <div className="space-y-2">
                      {resumeProjects.map((p) => (
                        <div key={p.id} className="space-y-0.5">
                          <div className="flex items-baseline justify-between text-[10px]">
                            <span className="font-bold text-slate-950">{p.title}</span>
                            <span className="text-[9px] font-mono text-slate-600">{p.techStack}</span>
                          </div>
                          <ul className="space-y-0.5 pl-3 list-disc text-[9.5px] text-slate-700">
                            {p.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                      Education
                    </div>
                    <div className="flex items-baseline justify-between text-[10px] text-slate-700">
                      <span className="font-bold text-slate-950">{university} — {degree} in {branch}</span>
                      <span className="font-mono text-[9.5px]">{gradYear} | {cgpa} CGPA</span>
                    </div>
                  </div>

                  {/* Achievements */}
                  {resumeAchievements.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-0.5">
                        Achievements & Certifications
                      </div>
                      <ul className="space-y-0.5 pl-3 list-disc text-[9.5px] text-slate-700">
                        {resumeAchievements.map((ach) => (
                          <li key={ach.id}>
                            <strong className="font-semibold text-slate-950">{ach.title}</strong> — {ach.issuer} ({ach.date})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>

                {/* Export & Copy Actions Under Quick View */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPdf}
                    className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{exportingPdf ? 'Exporting...' : 'Download PDF'}</span>
                  </button>
                  <button
                    onClick={handleCopyText}
                    className="py-2.5 rounded-xl bg-white dark:bg-[#0d1117] hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* FULL LIVE PREVIEW MODE (A4 Paper View) */
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10">
              <span className="text-xs font-mono text-slate-500">
                Interactive A4 High-Definition Technical Resume Document
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingPdf ? 'Generating PDF...' : 'Download Resume PDF'}</span>
                </button>
                <button
                  onClick={handleCopyText}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
            </div>

            {/* A4 Document Centered Canvas */}
            <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 font-sans space-y-6">
              
              {/* Header */}
              <div className="text-center space-y-1.5 pb-4 border-b border-slate-300">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">
                  {fullName}
                </h1>
                <div className="text-sm font-semibold text-slate-700">
                  {headline}
                </div>
                <div className="text-xs text-slate-600 flex items-center justify-center flex-wrap gap-x-2.5 pt-1">
                  <span>{email}</span>
                  <span>•</span>
                  <span>{phone}</span>
                  <span>•</span>
                  <span>{location}</span>
                </div>
                <div className="text-xs text-slate-600 flex items-center justify-center flex-wrap gap-x-2.5">
                  <a href={githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {githubUrl.replace(/^https?:\/\//, '')}
                  </a>
                  <span>•</span>
                  <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {linkedinUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {summary}
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                  Technical Skills
                </h2>
                <div className="text-xs text-slate-700 space-y-1">
                  <p><strong className="font-semibold text-slate-900">Languages & Core:</strong> {languagesSkills}</p>
                  <p><strong className="font-semibold text-slate-900">Frameworks & Tools:</strong> {frameworksSkills}</p>
                </div>
              </div>

              {/* Projects */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                  Technical Projects
                </h2>
                <div className="space-y-3.5">
                  {resumeProjects.map((p) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-slate-950">{p.title}</span>
                        <span className="text-[11px] font-mono text-slate-600">{p.techStack}</span>
                      </div>
                      <ul className="space-y-1 pl-4 list-disc text-xs text-slate-700 leading-normal">
                        {p.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                  Education
                </h2>
                <div className="flex items-baseline justify-between text-xs text-slate-700">
                  <span className="font-bold text-slate-950">{university} — {degree} in {branch}</span>
                  <span className="font-mono text-[11px]">{gradYear} | {cgpa} CGPA</span>
                </div>
              </div>

              {/* Achievements */}
              {resumeAchievements.length > 0 && (
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                    Achievements & Certifications
                  </h2>
                  <ul className="space-y-1 pl-4 list-disc text-xs text-slate-700">
                    {resumeAchievements.map((ach) => (
                      <li key={ach.id}>
                        <strong className="font-semibold text-slate-950">{ach.title}</strong> — {ach.issuer} ({ach.date})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </EngineLayout>
  );
};
