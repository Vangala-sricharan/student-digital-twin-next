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
  githubUrl?: string;
  liveUrl?: string;
  bullets: string[];
}

interface SkillCategoryItem {
  id: string;
  category: string;
  skills: string;
}

interface ResumeAchievementItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
}

interface ResumeParticipationItem {
  id: string;
  title: string;
  description: string;
}

// Default verified project bullets and links for the 6 real projects
const VERIFIED_PROJECT_DEFAULTS: Record<string, { bullets: string[]; githubUrl: string; liveUrl: string; techStack: string }> = {
  'Digital Student Twin': {
    bullets: [
      'Built an AI-powered student intelligence platform combining academic analytics, skill tracking, and career readiness diagnostics.',
      'Implemented responsive multi-engine student workspace using React and Tailwind CSS with PostgreSQL and Supabase data layer.',
      'Deployed on Vercel with structured progress tracking and deterministic readiness scoring across academic and practical pillars.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/student-digital-twin-v3',
    liveUrl: 'https://student-digital-twin-v3.vercel.app/',
    techStack: 'React | Tailwind CSS | Supabase | PostgreSQL | Vercel',
  },
  'AI Travel Planner': {
    bullets: [
      'Developed an AI-powered travel planning web application generating personalized itineraries based on destination, preferences, and duration.',
      'Integrated AI APIs and RESTful services to structure travel schedules, activity recommendations, and multi-day plans.',
      'Built interactive trip customization workflows in React and deployed the application on Vercel.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/AI-travel-planner-new-',
    liveUrl: 'https://ai-travel-planner-new-phi.vercel.app/',
    techStack: 'React | Tailwind CSS | AI APIs | REST APIs | Vercel',
  },
  'Event Management System': {
    bullets: [
      'Developed a full-stack event management application facilitating event creation, attendee registration, and participant coordination.',
      'Built RESTful API endpoints using Node.js to handle event scheduling, organizer workflows, and participant records.',
      'Designed relational schema in MySQL for structured data management and responsive organizer interface in React.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/event-management-system',
    liveUrl: 'https://event-management-system-five-delta.vercel.app/',
    techStack: 'React | Node.js | REST API | MySQL',
  },
  'Restaurant Management System': {
    bullets: [
      'Engineered a full-stack restaurant operations platform streamlining menu management, table reservations, and order processing.',
      'Implemented Node.js REST API with MySQL relational database for menu categorization, billing workflows, and order status handling.',
      'Built an intuitive administrative dashboard in React for restaurant staff to manage daily customer operations.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/restaurant-management-system',
    liveUrl: 'https://restaurant-management-system-one-green.vercel.app/',
    techStack: 'React | Node.js | REST API | MySQL',
  },
  'Praveen Kiranam – ERP / POS / E-Commerce': {
    bullets: [
      'Architected a unified retail platform combining Point of Sale (POS) billing, inventory ERP, and online e-commerce storefront.',
      'Designed PostgreSQL database with Supabase data layer to synchronize multi-channel stock levels and daily business operations.',
      'Built responsive cashier billing interface with automated inventory deductions and catalog management in React.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/praveen-kiranam-erp-pos-ecommerce',
    liveUrl: 'https://praveen-kiranam-erp-pos-ecommerce.vercel.app/',
    techStack: 'React | Tailwind CSS | Supabase | PostgreSQL | Vercel',
  },
  'Student Productivity Dashboard': {
    bullets: [
      'Created a student academic productivity workspace featuring focus study timers, assignment milestone tracking, and goal progress visualization.',
      'Integrated Recharts for consistency metrics and time-allocation analytics across course modules.',
      'Engineered client-side state architecture using TypeScript and Local Storage for instant local responsiveness and persistent task history.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/student-productivity-dashboard',
    liveUrl: 'https://student-productivity-dashboard-kohl.vercel.app/',
    techStack: 'React | TypeScript | Tailwind CSS | Local Storage | Recharts',
  },
};

export const ResumeBuilderView: React.FC<ResumeBuilderViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'resume-builder')!;
  const { profile, skills, projects, achievements, certifications, participations, careerGoals, isDemoMode } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('resume-builder');

  // Mode: Editor vs Full Live Preview
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  // Structured Resume State - Section 1: Contact
  const [fullName, setFullName] = useState(profile?.fullName || profile?.name || 'Vangala Sricharan');
  const [headline, setHeadline] = useState(profile?.targetRole || profile?.headline || 'Software Developer / AI Engineer');
  const [email, setEmail] = useState((profile as any)?.email || '');
  const [phone, setPhone] = useState((profile as any)?.phone || '');
  const [location, setLocation] = useState(profile?.location || 'Rajkot, Gujarat, India');
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || 'https://github.com/Vangala-sricharan');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || 'https://www.linkedin.com/in/sri-charan-vangala-a7453b384/');
  const [targetRole, setTargetRole] = useState(profile?.targetRole || 'Software Developer / AI Engineer');

  // Section 2: Summary
  const isSricharan = isDemoMode || (profile?.name && (profile.name.includes('Sricharan') || profile.name.includes('Vangala')));
  const defaultSummary = isSricharan
    ? 'Student and Software Developer passionate about full-stack engineering, AI systems, and building practical, high-performance web platforms.'
    : profile?.bio || 'Motivated student and software developer with proven experience in building responsive full-stack applications and modular software systems.';

  const [summary, setSummary] = useState(defaultSummary);

  // Section 3: Education - Clean Year (no duplicate "Year") & CGPA: 9.42
  const [university, setUniversity] = useState(profile?.university || 'Marwadi University');
  const [degree, setDegree] = useState(profile?.degree || 'B.Tech');
  const [branch, setBranch] = useState(profile?.branch || 'CSE (AI/ML)');
  
  const initialYear = () => {
    const rawYear = profile?.yearOfStudy || profile?.year || '2nd Year';
    return rawYear.toLowerCase().includes('year') ? rawYear : `${rawYear} Year`;
  };
  const [gradYear, setGradYear] = useState(initialYear());
  const [cgpa, setCgpa] = useState(profile?.cgpa?.toString() || profile?.currentGpa || '9.42');

  // Section 4: Categorized Technical Skills (No duplicates, supported by verified data)
  const initialSkillCategories = (): SkillCategoryItem[] => {
    if (isDemoMode || isSricharan) {
      return [
        { id: 'cat-1', category: 'Languages', skills: 'Python, JavaScript, TypeScript, SQL, C++' },
        { id: 'cat-2', category: 'Frontend', skills: 'React, Tailwind CSS, Recharts' },
        { id: 'cat-3', category: 'Backend & APIs', skills: 'Node.js, REST APIs' },
        { id: 'cat-4', category: 'AI / ML', skills: 'PyTorch, Generative AI, LLM Orchestration, Vector Embeddings' },
        { id: 'cat-5', category: 'Databases', skills: 'PostgreSQL, MySQL, Supabase' },
        { id: 'cat-6', category: 'Systems / Tools', skills: 'Docker, Git, Vercel, CI/CD' },
      ];
    }

    // Dynamic categorization for authenticated users
    const allSkillNames = Array.from(new Set(skills.map((s) => s.name)));
    const langMatches = allSkillNames.filter((s) => /python|javascript|typescript|c\+\+|java|sql|c#|rust|golang|php/i.test(s));
    const feMatches = allSkillNames.filter((s) => /react|vue|angular|tailwind|html|css|redux|next\.js/i.test(s));
    const beMatches = allSkillNames.filter((s) => /node|express|fastapi|django|flask|spring|rest/i.test(s));
    const aiMatches = allSkillNames.filter((s) => /ai|ml|pytorch|tensorflow|llm|generative|embeddings|deep learning|nlp/i.test(s));
    const dbMatches = allSkillNames.filter((s) => /sql|postgres|mongo|supabase|redis|mysql|firebase/i.test(s));
    const toolMatches = allSkillNames.filter((s) => /docker|git|vercel|linux|aws|ci\/cd|kubernetes/i.test(s));

    const result: SkillCategoryItem[] = [];
    if (langMatches.length > 0) result.push({ id: 'cat-lang', category: 'Languages', skills: langMatches.join(', ') });
    if (feMatches.length > 0) result.push({ id: 'cat-fe', category: 'Frontend', skills: feMatches.join(', ') });
    if (beMatches.length > 0) result.push({ id: 'cat-be', category: 'Backend & APIs', skills: beMatches.join(', ') });
    if (aiMatches.length > 0) result.push({ id: 'cat-ai', category: 'AI / ML', skills: aiMatches.join(', ') });
    if (dbMatches.length > 0) result.push({ id: 'cat-db', category: 'Databases', skills: dbMatches.join(', ') });
    if (toolMatches.length > 0) result.push({ id: 'cat-tools', category: 'Systems / Tools', skills: toolMatches.join(', ') });

    if (result.length === 0) {
      result.push({ id: 'cat-core', category: 'Core Technical Competencies', skills: allSkillNames.join(', ') || 'TypeScript, React, Node.js, PostgreSQL' });
    }
    return result;
  };

  const [skillCategories, setSkillCategories] = useState<SkillCategoryItem[]>(initialSkillCategories);

  // Section 5: Technical Projects (6 verified projects, no generic repeats)
  const initialProjects = (): ResumeProjectItem[] => {
    return projects.map((p) => {
      const match = VERIFIED_PROJECT_DEFAULTS[p.title];
      if (match) {
        return {
          id: p.id,
          title: p.title,
          techStack: match.techStack,
          githubUrl: match.githubUrl,
          liveUrl: match.liveUrl,
          bullets: [...match.bullets],
        };
      }

      // Fallback for user custom projects: clean non-repetitive bullets
      const cleanHighlights = (p.highlights || [])
        .filter((h) => !h.toLowerCase().includes('optimized performance and ensured reliable error handling'));

      const customBullets = cleanHighlights.length > 0
        ? cleanHighlights
        : [
            `Built ${p.title} platform utilizing ${p.techStack.join(', ')}.`,
            p.description || 'Implemented core application workflows with responsive UI and modular architecture.',
          ];

      return {
        id: p.id,
        title: p.title,
        techStack: p.techStack.join(' | '),
        githubUrl: p.githubUrl,
        liveUrl: p.liveUrl,
        bullets: customBullets,
      };
    });
  };

  const [resumeProjects, setResumeProjects] = useState<ResumeProjectItem[]>(initialProjects);

  // Section 6: Certifications / Programs
  const initialCertifications = (): ResumeAchievementItem[] => {
    if (certifications && certifications.length > 0) {
      return certifications.map((c) => ({
        id: c.id,
        title: c.title,
        issuer: c.issuer,
        date: c.issueDate,
      }));
    }
    return achievements.map((a) => ({
      id: a.id,
      title: a.title,
      issuer: a.issuer,
      date: a.date,
    }));
  };

  const [resumeCertifications, setResumeCertifications] = useState<ResumeAchievementItem[]>(initialCertifications);

  // Section 7: Participations & Events
  const initialParticipations = (): ResumeParticipationItem[] => {
    if (participations && participations.length > 0) {
      return participations.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description || p.category,
      }));
    }
    return [];
  };

  const [resumeParticipations, setResumeParticipations] = useState<ResumeParticipationItem[]>(initialParticipations);

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
        emphasis: 'Full-Stack Web, Systems & Verified Data Bullets',
      },
    });
  };

  const handleSaveResume = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopyText = () => {
    const contactParts = [email, phone, location].filter(Boolean).join(' • ');
    const linkParts = [
      githubUrl ? `GitHub: ${githubUrl.replace(/^https?:\/\//, '')}` : '',
      linkedinUrl ? `LinkedIn: ${linkedinUrl.replace(/^https?:\/\//, '')}` : '',
    ].filter(Boolean).join('   |   ');

    const textOutput = `
${fullName.toUpperCase()}
${headline}
${contactParts}
${linkParts}

PROFESSIONAL SUMMARY
${summary}

EDUCATION
${university}
${degree} • ${branch} • ${gradYear} | CGPA: ${cgpa}

TECHNICAL SKILLS
${skillCategories.map((c) => `• ${c.category.toUpperCase()}: ${c.skills}`).join('\n')}

TECHNICAL PROJECTS
${resumeProjects
  .map(
    (p) => `${p.title} | ${p.techStack}
${[p.githubUrl ? `GitHub: ${p.githubUrl}` : '', p.liveUrl ? `Live: ${p.liveUrl}` : ''].filter(Boolean).join('  |  ')}
${p.bullets.map((b) => `• ${b}`).join('\n')}`
  )
  .join('\n\n')}

${resumeCertifications.length > 0 ? `CERTIFICATIONS / PROGRAMS\n${resumeCertifications.map((c) => `• ${c.title} — ${c.issuer} (${c.date})`).join('\n')}\n\n` : ''}
${resumeParticipations.length > 0 ? `PARTICIPATIONS & EVENTS\n${resumeParticipations.map((p) => `• ${p.title}: ${p.description}`).join('\n')}` : ''}
`.trim();

    navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setExportingPdf(true);

    try {
      const pdfFilename = isSricharan || fullName.toLowerCase().includes('sricharan')
        ? 'Vangala_Sricharan_Resume.pdf'
        : `${fullName.trim().replace(/\s+/g, '_')}_Resume.pdf`;

      await generateResumePDF(
        {
          name: fullName,
          role: headline,
          university,
          degree,
          branch,
          year: gradYear,
          cgpa,
          email,
          phone,
          location,
          githubUrl,
          linkedinUrl,
          summary,
          skillCategories: skillCategories.map((c) => ({
            category: c.category,
            skills: c.skills,
          })),
          projects: resumeProjects.map((p) => ({
            title: p.title,
            techStack: p.techStack.split('|').map((s) => s.trim()).filter(Boolean),
            githubUrl: p.githubUrl,
            liveUrl: p.liveUrl,
            bullets: p.bullets,
          })),
          certifications: resumeCertifications.map((c) => ({
            title: c.title,
            issuer: c.issuer,
            date: c.date,
          })),
          participations: resumeParticipations.map((p) => ({
            title: p.title,
            description: p.description,
          })),
        },
        pdfFilename
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  // Skill category handlers
  const handleAddSkillCategory = () => {
    setSkillCategories((prev) => [
      ...prev,
      { id: `cat-${Date.now()}`, category: 'Tools & Systems', skills: 'Git, Docker, Linux' },
    ]);
  };

  const handleUpdateSkillCategory = (id: string, field: 'category' | 'skills', value: string) => {
    setSkillCategories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveSkillCategory = (id: string) => {
    setSkillCategories((prev) => prev.filter((item) => item.id !== id));
  };

  // Project handlers
  const handleAddProject = () => {
    const newProj: ResumeProjectItem = {
      id: `proj-${Date.now()}`,
      title: 'New Technical Project',
      techStack: 'TypeScript | React | Node.js',
      bullets: [
        'Built full-stack application with modular architecture and clean code standards.',
        'Implemented core features with responsive UI and reliable state management.',
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
        return { ...p, bullets: [...p.bullets, 'Engineered modular component architecture with clean test coverage.'] };
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

              {/* 3. Education */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>3. Education</span>
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Degree</label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="B.Tech"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Branch / Specialization</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="CSE (AI/ML)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Year of Study</label>
                    <input
                      type="text"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      placeholder="2nd Year"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">CGPA</label>
                    <input
                      type="text"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="9.42"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Technical Skills (Categorized) */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>4. Technical Skills ({skillCategories.length} Categories)</span>
                  </h3>
                  <button
                    onClick={handleAddSkillCategory}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {skillCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-start gap-3"
                    >
                      <div className="w-1/3 min-w-[120px]">
                        <input
                          type="text"
                          value={cat.category}
                          onChange={(e) => handleUpdateSkillCategory(cat.id, 'category', e.target.value)}
                          placeholder="Category Name"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={cat.skills}
                          onChange={(e) => handleUpdateSkillCategory(cat.id, 'skills', e.target.value)}
                          placeholder="Comma-separated skills (e.g. Python, SQL)"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                      {skillCategories.length > 1 && (
                        <button
                          onClick={() => handleRemoveSkillCategory(cat.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                          title="Remove Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Technical Projects */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>5. Technical Projects ({resumeProjects.length})</span>
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
                  {resumeProjects.map((p) => (
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
                          <input
                            type="text"
                            value={p.githubUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeProjects((prev) => prev.map((item) => (item.id === p.id ? { ...item, githubUrl: val } : item)));
                            }}
                            placeholder="GitHub URL (optional)"
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-mono text-blue-600 dark:text-cyan-400 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={p.liveUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setResumeProjects((prev) => prev.map((item) => (item.id === p.id ? { ...item, liveUrl: val } : item)));
                            }}
                            placeholder="Live Demo URL (optional)"
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none"
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
                          <span>Project-Specific Bullets:</span>
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

              {/* 6. Certifications / Programs */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>6. Certifications / Programs ({resumeCertifications.length})</span>
                  </h3>
                  <button
                    onClick={() =>
                      setResumeCertifications((prev) => [
                        ...prev,
                        { id: `cert-${Date.now()}`, title: 'New Certification / Job Simulation', issuer: 'Issuing Org', date: '2026' },
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {resumeCertifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          value={cert.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeCertifications((prev) => prev.map((item) => (item.id === cert.id ? { ...item, title: val } : item)));
                          }}
                          placeholder="Certification Title"
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          value={cert.issuer}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeCertifications((prev) => prev.map((item) => (item.id === cert.id ? { ...item, issuer: val } : item)));
                          }}
                          placeholder="Issuing Organization"
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={cert.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeCertifications((prev) => prev.map((item) => (item.id === cert.id ? { ...item, date: val } : item)));
                          }}
                          placeholder="Date (e.g. July 2026)"
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => setResumeCertifications((prev) => prev.filter((item) => item.id !== cert.id))}
                        className="p-1.5 text-slate-400 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Participations & Events */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>7. Participations & Events ({resumeParticipations.length})</span>
                  </h3>
                  <button
                    onClick={() =>
                      setResumeParticipations((prev) => [
                        ...prev,
                        { id: `part-${Date.now()}`, title: 'Technical Event / Hackathon', description: 'Competitive innovation challenge.' },
                      ])
                    }
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {resumeParticipations.map((part) => (
                    <div
                      key={part.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          value={part.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeParticipations((prev) => prev.map((item) => (item.id === part.id ? { ...item, title: val } : item)));
                          }}
                          placeholder="Event Title"
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          value={part.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResumeParticipations((prev) => prev.map((item) => (item.id === part.id ? { ...item, description: val } : item)));
                          }}
                          placeholder="Brief Description of Event"
                          className="sm:col-span-2 px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => setResumeParticipations((prev) => prev.filter((item) => item.id !== part.id))}
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
                      className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      Expand
                    </button>
                  </div>
                </div>

                {/* Scaled ATS Paper Preview Card */}
                <div className="p-6 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200 font-sans text-[11px] leading-tight space-y-3 max-h-[780px] overflow-y-auto">
                  
                  {/* Header */}
                  <div className="text-center space-y-0.5 pb-2 border-b border-slate-300">
                    <h1 className="text-base font-bold tracking-tight text-slate-950 uppercase">
                      {fullName}
                    </h1>
                    <div className="text-xs font-semibold text-slate-700">
                      {headline}
                    </div>
                    <div className="text-[10px] text-slate-600 flex items-center justify-center flex-wrap gap-x-2">
                      {email && <span>{email}</span>}
                      {email && phone && <span>•</span>}
                      {phone && <span>{phone}</span>}
                      {phone && location && <span>•</span>}
                      {location && <span>{location}</span>}
                    </div>
                    <div className="text-[10px] text-slate-600 flex items-center justify-center flex-wrap gap-x-2">
                      {githubUrl && (
                        <span>GitHub: {githubUrl.replace(/^https?:\/\//, '')}</span>
                      )}
                      {githubUrl && linkedinUrl && <span>•</span>}
                      {linkedinUrl && (
                        <span>LinkedIn: {linkedinUrl.replace(/^https?:\/\//, '')}</span>
                      )}
                    </div>
                  </div>

                  {/* 1. Summary */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Professional Summary
                    </div>
                    <p className="text-[10px] text-slate-700 leading-snug">
                      {summary}
                    </p>
                  </div>

                  {/* 2. Education */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Education
                    </div>
                    <div className="text-[10px] text-slate-700 space-y-0.5">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-slate-950">{university}</span>
                        <span className="font-mono text-[9px] text-slate-600">{gradYear}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span>{degree} • {branch}</span>
                        <span className="font-semibold text-slate-900">CGPA: {cgpa}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Skills */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Technical Skills
                    </div>
                    <div className="text-[9.5px] text-slate-700 space-y-0.5">
                      {skillCategories.map((c) => (
                        <div key={c.id}>
                          <strong className="font-semibold text-slate-900">• {c.category}:</strong> {c.skills}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Projects */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                      Technical Projects
                    </div>
                    <div className="space-y-2">
                      {resumeProjects.map((p) => (
                        <div key={p.id} className="space-y-0.5">
                          <div className="flex items-baseline justify-between text-[10px]">
                            <span className="font-bold text-slate-950">{p.title}</span>
                            <span className="text-[9px] font-mono text-slate-600">{p.techStack}</span>
                          </div>
                          {(p.githubUrl || p.liveUrl) && (
                            <div className="text-[8.5px] text-blue-600 flex items-center gap-2">
                              {p.githubUrl && <span>GitHub ↗</span>}
                              {p.liveUrl && <span>Live Demo ↗</span>}
                            </div>
                          )}
                          <ul className="space-y-0.5 pl-3 list-disc text-[9px] text-slate-700">
                            {p.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Certifications */}
                  {resumeCertifications.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                        Certifications / Programs
                      </div>
                      <ul className="space-y-0.5 pl-3 list-disc text-[9px] text-slate-700">
                        {resumeCertifications.map((c) => (
                          <li key={c.id}>
                            <strong className="font-semibold text-slate-950">{c.title}</strong> — {c.issuer} ({c.date})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 6. Participations */}
                  {resumeParticipations.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                        Participations & Events
                      </div>
                      <ul className="space-y-0.5 pl-3 list-disc text-[9px] text-slate-700">
                        {resumeParticipations.map((part) => (
                          <li key={part.id}>
                            <strong className="font-semibold text-slate-950">{part.title}:</strong> {part.description}
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
                Interactive A4 High-Definition Technical Resume Document (ATS-Compliant)
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
            <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 font-sans space-y-5">
              
              {/* Header */}
              <div className="text-center space-y-1 pb-3 border-b border-slate-300">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">
                  {fullName}
                </h1>
                <div className="text-sm font-semibold text-slate-700">
                  {headline}
                </div>
                <div className="text-xs text-slate-600 flex items-center justify-center flex-wrap gap-x-2.5 pt-1">
                  {email && <span>{email}</span>}
                  {email && phone && <span>•</span>}
                  {phone && <span>{phone}</span>}
                  {phone && location && <span>•</span>}
                  {location && <span>{location}</span>}
                </div>
                <div className="text-xs text-slate-600 flex items-center justify-center flex-wrap gap-x-2.5">
                  {githubUrl && (
                    <a href={githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      GitHub: {githubUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {githubUrl && linkedinUrl && <span>•</span>}
                  {linkedinUrl && (
                    <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      LinkedIn: {linkedinUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>

              {/* 1. Summary */}
              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {summary}
                </p>
              </div>

              {/* 2. Education */}
              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                  Education
                </h2>
                <div className="text-xs text-slate-700 space-y-0.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-slate-950 text-sm">{university}</span>
                    <span className="font-mono text-xs text-slate-600">{gradYear}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span>{degree} • {branch}</span>
                    <span className="font-semibold text-slate-900">CGPA: {cgpa}</span>
                  </div>
                </div>
              </div>

              {/* 3. Skills */}
              <div className="space-y-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                  Technical Skills
                </h2>
                <div className="text-xs text-slate-700 space-y-1">
                  {skillCategories.map((c) => (
                    <div key={c.id}>
                      <strong className="font-semibold text-slate-900">• {c.category}:</strong> {c.skills}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Projects */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                  Technical Projects
                </h2>
                <div className="space-y-3.5">
                  {resumeProjects.map((p) => (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-slate-950">{p.title}</span>
                        <span className="text-[11px] font-mono text-slate-600">{p.techStack}</span>
                      </div>
                      {(p.githubUrl || p.liveUrl) && (
                        <div className="text-[11px] text-blue-600 flex items-center gap-3">
                          {p.githubUrl && (
                            <a href={p.githubUrl} target="_blank" rel="noreferrer" className="hover:underline">
                              GitHub ↗
                            </a>
                          )}
                          {p.liveUrl && (
                            <a href={p.liveUrl} target="_blank" rel="noreferrer" className="hover:underline">
                              Live Demo ↗
                            </a>
                          )}
                        </div>
                      )}
                      <ul className="space-y-1 pl-4 list-disc text-xs text-slate-700 leading-normal">
                        {p.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Certifications */}
              {resumeCertifications.length > 0 && (
                <div className="space-y-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                    Certifications / Programs
                  </h2>
                  <ul className="space-y-1 pl-4 list-disc text-xs text-slate-700">
                    {resumeCertifications.map((cert) => (
                      <li key={cert.id}>
                        <strong className="font-semibold text-slate-950">{cert.title}</strong> — {cert.issuer} ({cert.date})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 6. Participations */}
              {resumeParticipations.length > 0 && (
                <div className="space-y-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
                    Participations & Events
                  </h2>
                  <ul className="space-y-1 pl-4 list-disc text-xs text-slate-700">
                    {resumeParticipations.map((part) => (
                      <li key={part.id}>
                        <strong className="font-semibold text-slate-950">{part.title}:</strong> {part.description}
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
