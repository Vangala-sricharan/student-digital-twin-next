import React, { useState, useEffect } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useAuth } from '../../context/AuthContext';
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
  ExternalLink,
} from 'lucide-react';
import { LinkedInCertificationsManager } from './resume/LinkedInCertificationsManager';
import { ResumeCertificationItem } from './resume/types';

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

type ResumeAchievementItem = ResumeCertificationItem;

interface ResumeParticipationItem {
  id: string;
  title: string;
  description: string;
}

/**
 * Robust formatting and data cleaning helpers for ATS Recruiter-Ready Resumes
 */
function cleanEducationYear(year?: string | null): string {
  if (!year) return '2nd Year';
  let y = year.replace(/\b2rd\b/gi, '2nd').replace(/\b1rd\b/gi, '1st').replace(/\b3st\b/gi, '3rd').trim();
  if (/^[1-4]$/.test(y)) {
    const suffixes: Record<string, string> = { '1': '1st', '2': '2nd', '3': '3rd', '4': '4th' };
    y = `${suffixes[y]} Year`;
  } else if (!y.toLowerCase().includes('year')) {
    y = `${y} Year`;
  }
  return y;
}

function cleanLocation(loc?: string | null): string {
  if (!loc) return '';
  return loc.split(',').map((p) => p.trim()).filter(Boolean).join(', ');
}

function isValidUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || ['!—', '—', '-', '#', 'none', 'n/a', 'not provided', 'null', 'undefined'].includes(trimmed.toLowerCase())) return false;
  if (trimmed.includes('candidate') || trimmed.includes('example.com')) return false;
  return /^https?:\/\//i.test(trimmed) || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(trimmed);
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatGitHubLabel(url: string): string {
  const norm = normalizeUrl(url);
  const clean = norm.replace(/^https?:\/\/(www\.)?github\.com\/?/i, '').replace(/\/$/, '');
  return clean ? `GitHub: ${clean}` : 'GitHub';
}

function getCleanCgpa(prof?: any): string {
  if (!prof) return '';
  if (typeof prof.cgpa === 'number' && prof.cgpa > 0) return prof.cgpa.toString();
  if (typeof prof.cgpa === 'string' && prof.cgpa.trim() && prof.cgpa.trim() !== '0') return prof.cgpa.trim();
  if (typeof prof.currentGpa === 'string' && prof.currentGpa.trim() && prof.currentGpa.trim() !== '0') return prof.currentGpa.trim();
  return '';
}

function buildInitialRecruiterSummary(
  prof: any,
  userSkills: Array<{ name: string }>,
  userProjects: any[],
  isDemo: boolean
): string {
  if (isDemo) {
    return 'B.Tech Computer Science student at Marwadi University focused on practical AI-powered and full-stack software. Hands-on experience with Python, C++, JavaScript/TypeScript, React, SQL, Supabase, AI APIs, Git/GitHub and Vercel. Built the Digital Student Twin intelligence platform for academic analytics and career-readiness diagnostics, alongside retail, event-management, travel-planning and student-productivity applications.';
  }

  // If authenticated user has saved a summary in their profile, use it
  if (prof?.summary && typeof prof.summary === 'string' && prof.summary.trim().length > 0) {
    return prof.summary.trim();
  }

  // Build factual summary ONLY from user's actual record
  const degreeStr = prof?.degree;
  const branchStr = prof?.branch || prof?.department;
  const uniStr = prof?.university;

  const parts: string[] = [];
  if (degreeStr && uniStr) {
    parts.push(`${degreeStr}${branchStr ? ` in ${branchStr}` : ''} student at ${uniStr}`);
  } else if (degreeStr) {
    parts.push(`${degreeStr}${branchStr ? ` in ${branchStr}` : ''} student`);
  } else if (uniStr) {
    parts.push(`Student at ${uniStr}`);
  }

  const allSkills = Array.from(
    new Set(userSkills.map((s) => s.name).concat(userProjects.flatMap((p) => (Array.isArray(p.techStack) ? p.techStack : []))))
  ).filter(Boolean);

  if (allSkills.length > 0) {
    const skillList = allSkills.slice(0, 6).join(', ');
    if (parts.length > 0) {
      parts[0] += ` focused on practical software development. Hands-on experience with ${skillList}.`;
    } else {
      parts.push(`Software developer with hands-on experience in ${skillList}.`);
    }
  }

  if (userProjects.length > 0) {
    const topProj = userProjects[0];
    parts.push(`Developed projects including ${topProj.title}${topProj.description ? ` (${topProj.description})` : ''}.`);
  }

  if (parts.length === 0) {
    return '';
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function buildInitialSkillCategories(
  userSkills: Array<{ name: string }>,
  userProjects: any[],
  isDemo: boolean
): SkillCategoryItem[] {
  const allSkillNames = Array.from(
    new Set(
      userSkills
        .map((s) => s.name?.trim())
        .concat(
          userProjects.flatMap((p) => {
            if (Array.isArray(p.techStack)) return p.techStack;
            if (typeof p.techStack === 'string') return p.techStack.split(/[|,•]/).map((s: string) => s.trim());
            return [];
          })
        )
        .filter(Boolean)
    )
  );

  if (allSkillNames.length === 0) {
    if (isDemo) {
      return [
        { id: 'cat-lang', category: 'LANGUAGES', skills: 'C, C++, Python, JavaScript, TypeScript, HTML, CSS' },
        { id: 'cat-fe', category: 'FRONTEND', skills: 'React, Tailwind CSS' },
        { id: 'cat-be', category: 'BACKEND & APIs', skills: 'Node.js, REST APIs' },
        { id: 'cat-ai', category: 'AI / ML', skills: 'AI APIs, Generative AI, Gemini AI' },
        { id: 'cat-db', category: 'DATABASES', skills: 'Supabase, PostgreSQL, MySQL' },
        { id: 'cat-tools', category: 'TOOLS & CLOUD', skills: 'Git, GitHub, Vercel, AWS' },
        { id: 'cat-other', category: 'OTHER', skills: 'Data Analytics, GitHub API, IoT, Data Structures & Algorithms, OOP' },
      ];
    }
    return [];
  }

  const assigned = new Set<string>();
  const matchCategory = (regex: RegExp) => {
    const matched = allSkillNames.filter((s) => !assigned.has(s.toLowerCase()) && regex.test(s));
    matched.forEach((s) => assigned.add(s.toLowerCase()));
    return matched;
  };

  const lang = matchCategory(/^(?:python|javascript|typescript|c\+\+|java|sql|c#|rust|golang|go|php|c|html|css|bash|r|kotlin|swift)$/i);
  const fe = matchCategory(/^(?:react|tailwind|tailwind css|next\.js|redux|recharts|vue|angular|vite|bootstrap|svelte|sass|less)$/i);
  const be = matchCategory(/^(?:node\.js|node|express|fastapi|django|flask|spring|rest apis?|graphql|grpc|nest\.js)$/i);
  const ai = matchCategory(/^(?:pytorch|tensorflow|generative ai|llm orchestration|vector embeddings|deep learning|nlp|machine learning|ai apis|gemini ai|opencv|langchain)$/i);
  const db = matchCategory(/^(?:postgresql|postgres|mysql|supabase|mongodb|redis|sqlite|firebase|prisma|drizzle|dynamodb)$/i);
  const tools = matchCategory(/^(?:docker|git|github|vercel|ci\/cd|linux|aws|postman|kubernetes|gcp|azure)$/i);

  const remaining = allSkillNames.filter((s) => !assigned.has(s.toLowerCase()));

  const result: SkillCategoryItem[] = [];
  if (lang.length > 0) result.push({ id: 'cat-lang', category: 'LANGUAGES', skills: lang.join(', ') });
  if (fe.length > 0) result.push({ id: 'cat-fe', category: 'FRONTEND', skills: fe.join(', ') });
  if (be.length > 0) result.push({ id: 'cat-be', category: 'BACKEND & APIs', skills: be.join(', ') });
  if (ai.length > 0) result.push({ id: 'cat-ai', category: 'AI / ML', skills: ai.join(', ') });
  if (db.length > 0) result.push({ id: 'cat-db', category: 'DATABASES', skills: db.join(', ') });
  if (tools.length > 0) result.push({ id: 'cat-tools', category: 'TOOLS & CLOUD', skills: tools.join(', ') });
  if (remaining.length > 0) {
    if (result.length > 0) {
      result.push({ id: 'cat-other', category: 'OTHER', skills: remaining.join(', ') });
    } else {
      result.push({ id: 'cat-all', category: 'TECHNICAL SKILLS', skills: remaining.join(', ') });
    }
  }

  return result;
}

// Default verified project bullets and links for the creator / demo showcase
const VERIFIED_PROJECT_DEFAULTS: Record<string, { bullets: string[]; githubUrl: string; liveUrl: string; techStack: string }> = {
  'Digital Student Twin': {
    bullets: [
      'Built an AI-powered student intelligence platform combining academic analytics, skill tracking, and career readiness diagnostics.',
      'Implemented responsive multi-engine student workspace using React and Tailwind CSS with PostgreSQL and Supabase data layer.',
      'Deployed on Vercel with structured progress tracking and deterministic readiness scoring across academic and practical pillars.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/student-digital-twin-v3',
    liveUrl: 'https://student-digital-twin-v3.vercel.app/',
    techStack: 'React • Tailwind CSS • Supabase • PostgreSQL • Vercel',
  },
  'AI Travel Planner': {
    bullets: [
      'Developed an AI-powered travel planning web application generating personalized itineraries based on destination, preferences, and duration.',
      'Integrated AI APIs and RESTful services to structure travel schedules, activity recommendations, and multi-day plans.',
      'Built interactive trip customization workflows in React and deployed the application on Vercel.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/AI-travel-planner-new-',
    liveUrl: 'https://ai-travel-planner-new-phi.vercel.app/',
    techStack: 'React • Tailwind CSS • AI APIs • REST APIs • Vercel',
  },
  'Event Management System': {
    bullets: [
      'Developed a full-stack event management application facilitating event creation, attendee registration, and participant coordination.',
      'Built RESTful API endpoints using Node.js to handle event scheduling, organizer workflows, and participant records.',
      'Designed relational schema in MySQL for structured data management and responsive organizer interface in React.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/event-management-system',
    liveUrl: 'https://event-management-system-five-delta.vercel.app/',
    techStack: 'React • Node.js • REST API • MySQL',
  },
  'Restaurant Management System': {
    bullets: [
      'Engineered a full-stack restaurant operations platform streamlining menu management, table reservations, and order processing.',
      'Implemented Node.js REST API with MySQL relational database for menu categorization, billing workflows, and order status handling.',
      'Built an intuitive administrative dashboard in React for restaurant staff to manage daily customer operations.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/restaurant-management-system',
    liveUrl: 'https://restaurant-management-system-one-green.vercel.app/',
    techStack: 'React • Node.js • REST API • MySQL',
  },
  'Praveen Kiranam – ERP / POS / E-Commerce': {
    bullets: [
      'Architected a unified retail platform combining Point of Sale (POS) billing, inventory ERP, and online e-commerce storefront.',
      'Designed PostgreSQL database with Supabase data layer to synchronize multi-channel stock levels and daily business operations.',
      'Built responsive cashier billing interface with automated inventory deductions and catalog management in React.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/praveen-kiranam-erp-pos-ecommerce',
    liveUrl: 'https://praveen-kiranam-erp-pos-ecommerce.vercel.app/',
    techStack: 'React • Tailwind CSS • Supabase • PostgreSQL • Vercel',
  },
  'Student Productivity Dashboard': {
    bullets: [
      'Created a student academic productivity workspace featuring focus study timers, assignment milestone tracking, and goal progress visualization.',
      'Integrated Recharts for consistency metrics and time-allocation analytics across course modules.',
      'Engineered client-side state architecture using TypeScript and Local Storage for instant local responsiveness and persistent task history.',
    ],
    githubUrl: 'https://github.com/Vangala-sricharan/student-productivity-dashboard',
    liveUrl: 'https://student-productivity-dashboard-kohl.vercel.app/',
    techStack: 'React • TypeScript • Tailwind CSS • Local Storage • Recharts',
  },
};

function buildInitialProjects(
  userProjects: any[],
  isDemo: boolean
): ResumeProjectItem[] {
  if ((!userProjects || userProjects.length === 0) && isDemo) {
    return Object.entries(VERIFIED_PROJECT_DEFAULTS).map(([title, val], i) => ({
      id: `demo-proj-${i}`,
      title,
      techStack: val.techStack,
      githubUrl: val.githubUrl,
      liveUrl: val.liveUrl,
      bullets: val.bullets,
    }));
  }

  if (!userProjects || userProjects.length === 0) {
    return [];
  }

  // Sort: Digital Student Twin first if exists
  const sorted = [...userProjects].sort((a, b) => {
    const aTwin = /student\s*twin/i.test(a.title);
    const bTwin = /student\s*twin/i.test(b.title);
    if (aTwin && !bTwin) return -1;
    if (!aTwin && bTwin) return 1;
    return 0;
  });

  return sorted.map((p) => {
    const match = isDemo ? VERIFIED_PROJECT_DEFAULTS[p.title] : undefined;

    // URLs: strictly real user URLs
    const gh = isValidUrl(p.githubUrl)
      ? p.githubUrl
      : isDemo && match ? match.githubUrl : '';
    const live = isValidUrl(p.liveUrl)
      ? p.liveUrl
      : isDemo && match ? match.liveUrl : '';

    // Tech Stack
    const stackStr = Array.isArray(p.techStack)
      ? p.techStack.join(' • ')
      : typeof p.techStack === 'string'
      ? p.techStack.replace(/\|/g, '•').trim()
      : (match?.techStack || '');

    // Bullets: concise bullets without generic filler
    let bullets: string[] = [];
    if (/student\s*twin/i.test(p.title) && isDemo) {
      bullets = [
        'Architected student intelligence platform combining academic analytics, skill tracking, and career readiness diagnostics.',
        'Implemented responsive multi-engine student workspace using React and Tailwind CSS with PostgreSQL and Supabase data layer.',
        'Deployed on Vercel with structured progress tracking and deterministic readiness scoring across academic and practical pillars.',
      ];
    } else if (match && isDemo) {
      bullets = [...match.bullets];
    } else {
      const cleanHighlights = (p.highlights || [])
        .filter((h: string) => typeof h === 'string' && !h.toLowerCase().includes('optimized performance and ensured reliable error handling'));

      if (cleanHighlights.length >= 1) {
        bullets = cleanHighlights.slice(0, 3);
      } else if (p.description) {
        bullets = [p.description];
      }
    }

    bullets = bullets
      .filter((b) => !b.toLowerCase().includes('optimized performance and ensured reliable error handling'))
      .slice(0, 3);

    return {
      id: p.id || `proj-${Math.random()}`,
      title: p.title,
      techStack: stackStr,
      githubUrl: gh || undefined,
      liveUrl: live || undefined,
      bullets,
    };
  });
}

export const ResumeBuilderView: React.FC<ResumeBuilderViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'resume-builder')!;
  const {
    profile,
    activeProfile,
    skills,
    projects,
    achievements,
    certifications,
    participations,
    careerGoals,
    isDemoMode,
    addCertification,
    updateCertification,
    removeCertification,
  } = useStudentTwin();
  const { user, userProfile } = useAuth();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('resume-builder');

  // Mode: Editor vs Full Live Preview
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  const isSricharan = isDemoMode || (profile?.name && (profile.name.includes('Sricharan') || profile.name.includes('Vangala')));

  // Structured Resume State - Section 1: Contact
  const [fullName, setFullName] = useState(
    profile?.fullName ||
      profile?.name ||
      userProfile?.fullName ||
      (user?.user_metadata?.full_name as string) ||
      (isDemoMode ? 'Vangala Sricharan' : (user?.email ? user.email.split('@')[0] : ''))
  );
  const [headline, setHeadline] = useState(
    profile?.targetRole ||
      profile?.headline ||
      (isDemoMode ? 'Software Engineering Student | AI/ML & Full-Stack Developer' : '')
  );
  const [email, setEmail] = useState((profile as any)?.email || user?.email || (isDemoMode ? 'sricharan.vangala135062@marwadiuniversity.ac.in' : ''));
  const [phone, setPhone] = useState((profile as any)?.phone || (isDemoMode ? '+91 8520981574' : ''));
  const [location, setLocation] = useState(cleanLocation(profile?.location || (isDemoMode ? 'Rajkot, Gujarat, India' : '')));
  const [githubUrl, setGithubUrl] = useState(
    isValidUrl(profile?.githubUrl) ? profile!.githubUrl! : (isDemoMode ? 'https://github.com/Vangala-sricharan' : '')
  );
  const [linkedinUrl, setLinkedinUrl] = useState(
    isValidUrl(profile?.linkedinUrl) ? profile!.linkedinUrl! : (isDemoMode ? 'https://www.linkedin.com/in/sri-charan-vangala-a7453b384/' : '')
  );
  const [targetRole, setTargetRole] = useState(
    profile?.targetRole || (isDemoMode ? 'Software Developer / AI Engineer' : '')
  );

  // Section 2: Summary
  const [summary, setSummary] = useState(
    buildInitialRecruiterSummary(profile, skills, projects, Boolean(isDemoMode))
  );

  // Section 3: Education - Clean Year (no "2rd Year") & Real CGPA only
  const [university, setUniversity] = useState(profile?.university || (isDemoMode ? 'Marwadi University' : ''));
  const [degree, setDegree] = useState(profile?.degree || (isDemoMode ? 'B.Tech' : ''));
  const [branch, setBranch] = useState(profile?.branch || profile?.academicProgram || (isDemoMode ? 'CSE (AI/ML)' : ''));
  const [gradYear, setGradYear] = useState(
    cleanEducationYear(profile?.yearOfStudy || profile?.year) || (isDemoMode ? '2025–2029 • Expected Graduation: 2029' : '')
  );
  const [cgpa, setCgpa] = useState(getCleanCgpa(profile) || (isDemoMode ? '9.1' : ''));

  // Section 4: Categorized Technical Skills (No duplicates, supported by verified data)
  const [skillCategories, setSkillCategories] = useState<SkillCategoryItem[]>(() =>
    buildInitialSkillCategories(skills, projects, Boolean(isDemoMode))
  );

  // Section 5: Technical Projects (Strongest first, real URLs only, clean bullets)
  const [resumeProjects, setResumeProjects] = useState<ResumeProjectItem[]>(() =>
    buildInitialProjects(projects, Boolean(isDemoMode))
  );

  // Section 6: Certifications / Programs (Strictly verified/approved certifications only)
  const initialCertifications = (): ResumeCertificationItem[] => {
    if (certifications && certifications.length > 0) {
      return certifications.map((c) => ({
        id: c.id,
        title: c.title,
        issuer: c.issuer,
        date: c.issueDate,
        issueYear: c.issueYear || undefined,
        credentialUrl: c.credentialUrl || undefined,
        credentialId: c.credentialId || undefined,
        source: c.source || 'manual',
        sourceEvidence: c.sourceEvidence,
        confidence: c.confidence,
        status: 'completed',
      }));
    }
    return [];
  };

  const [resumeCertifications, setResumeCertifications] = useState<ResumeCertificationItem[]>(initialCertifications);

  // Planned Certifications State (Separate from completed certifications)
  const [plannedCertifications, setPlannedCertifications] = useState<ResumeCertificationItem[]>(() => {
    try {
      const key = `sdt_user_planned_certifications_v4_${user?.id || 'guest'}_${activeProfile?.id || 'default'}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [includePlannedOnResume, setIncludePlannedOnResume] = useState<boolean>(false);

  useEffect(() => {
    try {
      const key = `sdt_user_planned_certifications_v4_${user?.id || 'guest'}_${activeProfile?.id || 'default'}`;
      localStorage.setItem(key, JSON.stringify(plannedCertifications));
    } catch {}
  }, [plannedCertifications, user?.id, activeProfile?.id]);

  const handleAddCertification = (cert: ResumeCertificationItem) => {
    setResumeCertifications((prev) => [...prev, cert]);
    if (!isDemoMode && addCertification) {
      addCertification({
        title: cert.title,
        issuer: cert.issuer,
        issueDate: cert.date,
        issueYear: cert.issueYear,
        credentialUrl: cert.credentialUrl,
        credentialId: cert.credentialId,
        source: cert.source || 'manual',
        sourceEvidence: cert.sourceEvidence,
        confidence: cert.confidence,
        status: 'completed',
      });
    }
  };

  const handleAddMultipleCertifications = (certs: ResumeCertificationItem[]) => {
    setResumeCertifications((prev) => [...prev, ...certs]);
    if (!isDemoMode && addCertification) {
      certs.forEach((cert) => {
        addCertification({
          title: cert.title,
          issuer: cert.issuer,
          issueDate: cert.date,
          issueYear: cert.issueYear,
          credentialUrl: cert.credentialUrl,
          credentialId: cert.credentialId,
          source: cert.source || 'linkedin_pdf',
          sourceEvidence: cert.sourceEvidence,
          confidence: cert.confidence,
          status: 'completed',
        });
      });
    }
  };

  const handleUpdateCertification = (id: string, updates: Partial<ResumeCertificationItem>) => {
    setResumeCertifications((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    if (!isDemoMode && updateCertification) {
      updateCertification(id, {
        title: updates.title,
        issuer: updates.issuer,
        issueDate: updates.date,
        issueYear: updates.issueYear,
        credentialUrl: updates.credentialUrl,
        credentialId: updates.credentialId,
      });
    }
  };

  const handleRemoveCertification = (id: string) => {
    setResumeCertifications((prev) => prev.filter((c) => c.id !== id));
    if (!isDemoMode && removeCertification) {
      removeCertification(id);
    }
  };

  const handleAddPlannedCertification = (cert: ResumeCertificationItem) => {
    setPlannedCertifications((prev) => [...prev, cert]);
  };

  const handleRemovePlannedCertification = (id: string) => {
    setPlannedCertifications((prev) => prev.filter((c) => c.id !== id));
  };

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

  // Hydrate profile data when user/profile loads or changes
  useEffect(() => {
    if (profile) {
      if (profile.fullName || profile.name) {
        setFullName(profile.fullName || profile.name);
      }
      if (profile.targetRole || profile.headline) {
        setHeadline(profile.targetRole || profile.headline);
      }
      if (profile.location) {
        setLocation(cleanLocation(profile.location));
      }
      if ((profile as any).email) {
        setEmail((profile as any).email);
      } else if (user?.email) {
        setEmail(user.email);
      }
      if (isValidUrl(profile.githubUrl)) {
        setGithubUrl(profile.githubUrl!);
      }
      if (isValidUrl(profile.linkedinUrl)) {
        setLinkedinUrl(profile.linkedinUrl!);
      }
      if (profile.university) {
        setUniversity(profile.university);
      }
      if (profile.degree) {
        setDegree(profile.degree);
      }
      if (profile.branch) {
        setBranch(profile.branch);
      }
      if (profile.yearOfStudy || profile.year) {
        setGradYear(cleanEducationYear(profile.yearOfStudy || profile.year));
      }
      const realCgpa = getCleanCgpa(profile);
      if (realCgpa) {
        setCgpa(realCgpa);
      }
    }
  }, [profile, user]);

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
    if (!isDemoMode && user && activeProfile) {
      try {
        const certsToSave = resumeCertifications.map((c) => ({
          id: c.id,
          title: c.title,
          issuer: c.issuer,
          issueDate: c.date,
          issueYear: c.issueYear,
          credentialUrl: c.credentialUrl,
          credentialId: c.credentialId,
          source: c.source || 'manual',
          sourceEvidence: c.sourceEvidence,
          confidence: c.confidence,
          status: c.status || 'completed',
        }));
        localStorage.setItem(
          `sdt_user_certifications_v4_${user.id}_${activeProfile.id}`,
          JSON.stringify(certsToSave)
        );
        localStorage.setItem(
          `sdt_user_certifications_v4_${user.id}`,
          JSON.stringify(certsToSave)
        );
      } catch (err) {
        console.warn('Failed saving certifications to localStorage:', err);
      }
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopyText = () => {
    const cleanLoc = cleanLocation(location);
    const contactParts = [cleanLoc, email, phone].filter(Boolean).join(' • ');

    const linkParts: string[] = [];
    if (isValidUrl(githubUrl)) {
      linkParts.push(`GitHub: ${normalizeUrl(githubUrl).replace(/^https?:\/\//, '').replace(/\/$/, '')}`);
    }
    if (isValidUrl(linkedinUrl)) {
      linkParts.push(`LinkedIn: ${normalizeUrl(linkedinUrl).replace(/^https?:\/\//, '').replace(/\/$/, '')}`);
    }

    const educationDegreeLine = [degree, branch].filter(Boolean).join(' in ');
    const educationSubLine = [university, cleanLoc, gradYear].filter(Boolean).join(' • ');
    const educationCgpaPart = cgpa && cgpa.trim() !== '' ? ` | CGPA: ${cgpa.trim()}` : '';

    const textOutput = `
${fullName.toUpperCase()}
${headline}
${contactParts}
${linkParts.join(' • ')}

PROFILE
${summary}

TECHNICAL SKILLS
${skillCategories.map((c) => `${c.category.toUpperCase().padEnd(16)}: ${c.skills}`).join('\n')}

SELECTED PROJECTS
${resumeProjects
  .map((p) => {
    const ghLink = isValidUrl(p.githubUrl) ? ` [Code: ${normalizeUrl(p.githubUrl!)}]` : '';

    return `${p.title}${ghLink}
${p.techStack}
${p.bullets.map((b) => `• ${b}`).join('\n')}`;
  })
  .join('\n\n')}

EDUCATION
${educationDegreeLine || 'Degree'}
${educationSubLine}${educationCgpaPart}

${resumeCertifications.length > 0 ? `CERTIFICATIONS\n${resumeCertifications.map((c) => `• ${c.title}${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` (${c.date})` : ''}${c.credentialUrl ? ` [Credential: ${c.credentialUrl}]` : ''}`).join('\n')}\n\n` : ''}
${includePlannedOnResume && plannedCertifications.length > 0 ? `PLANNED CERTIFICATIONS (TARGET)\n${plannedCertifications.map((c) => `• [PLANNED] ${c.title}${c.issuer ? ` — ${c.issuer}` : ''}${c.date ? ` (Target: ${c.date})` : ''}`).join('\n')}\n\n` : ''}
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
          cgpa: cgpa.trim(),
          email,
          phone,
          location: cleanLocation(location),
          githubUrl: isValidUrl(githubUrl) ? normalizeUrl(githubUrl) : undefined,
          linkedinUrl: isValidUrl(linkedinUrl) ? normalizeUrl(linkedinUrl) : undefined,
          summary,
          skillCategories: skillCategories.map((c) => ({
            category: c.category,
            skills: c.skills,
          })),
          projects: resumeProjects.map((p) => ({
            title: p.title,
            techStack: p.techStack.split(/[|•]/).map((s) => s.trim()).filter(Boolean),
            githubUrl: isValidUrl(p.githubUrl) ? normalizeUrl(p.githubUrl!) : undefined,
            bullets: p.bullets,
          })),
          certifications: resumeCertifications.map((c) => ({
            title: c.title,
            issuer: c.issuer,
            date: c.date,
            credentialUrl: c.credentialUrl,
          })),
          plannedCertifications: includePlannedOnResume
            ? plannedCertifications.map((c) => ({
                title: c.title,
                issuer: c.issuer,
                date: c.date,
              }))
            : undefined,
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

              {/* 3. Technical Skills (Categorized) */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>3. Technical Skills ({skillCategories.length} Categories)</span>
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
                  {skillCategories.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No technical skills categorized yet.
                      </p>
                      <button
                        onClick={handleAddSkillCategory}
                        className="mt-2 text-xs text-blue-600 dark:text-cyan-400 hover:underline font-mono"
                      >
                        + Add Skill Category
                      </button>
                    </div>
                  ) : (
                    skillCategories.map((cat) => (
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
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 uppercase"
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
                    ))
                  )}
                </div>
              </div>

              {/* 4. Selected Projects */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                      <span>4. Selected Projects ({resumeProjects.length})</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      Export uses compact [Code] repository links. Live demo URLs are omitted to keep PDF 1-page compact.
                    </p>
                  </div>
                  <button
                    onClick={handleAddProject}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Project</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {resumeProjects.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No projects added yet.
                      </p>
                      <button
                        onClick={handleAddProject}
                        className="mt-2 text-xs text-blue-600 dark:text-cyan-400 hover:underline font-mono"
                      >
                        + Add Project
                      </button>
                    </div>
                  ) : (
                    resumeProjects.map((p) => (
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
                              placeholder="Tech Stack (e.g. React • Node.js • PostgreSQL)"
                              className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-slate-300 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={p.githubUrl || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setResumeProjects((prev) => prev.map((item) => (item.id === p.id ? { ...item, githubUrl: val } : item)));
                              }}
                              placeholder="GitHub Repo URL (e.g. https://github.com/...)"
                              className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-mono text-blue-600 dark:text-cyan-400 focus:outline-none"
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
                              className="text-blue-500 hover:underline flex items-center gap-0.5 cursor-pointer"
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
                    ))
                  )}
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
                      placeholder="e.g. University Name"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Degree</label>
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="e.g. B.Tech"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Branch / Specialization</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Year / Graduation Period</label>
                    <input
                      type="text"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      placeholder="e.g. 2025–2029"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">CGPA / Marks</label>
                    <input
                      type="text"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="Optional (e.g. 8.75 or 9.1)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Certifications / Programs */}
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>6. Certifications / Programs</span>
                  </h3>
                </div>

                {/* LinkedIn Extractor & Review Panel */}
                <LinkedInCertificationsManager
                  resumeCertifications={resumeCertifications}
                  onAddCertification={handleAddCertification}
                  onAddMultipleCertifications={handleAddMultipleCertifications}
                  onUpdateCertification={handleUpdateCertification}
                  onRemoveCertification={handleRemoveCertification}
                  plannedCertifications={plannedCertifications}
                  onAddPlannedCertification={handleAddPlannedCertification}
                  onRemovePlannedCertification={handleRemovePlannedCertification}
                  includePlannedOnResume={includePlannedOnResume}
                  onToggleIncludePlanned={setIncludePlannedOnResume}
                  isDemoMode={Boolean(isDemoMode)}
                />

                {/* Approved Resume Certifications List */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Approved Resume Certifications ({resumeCertifications.length})</span>
                    </h4>
                    <button
                      onClick={() =>
                        handleAddCertification({
                          id: `cert-manual-${Date.now()}`,
                          title: '',
                          issuer: '',
                          date: '',
                          source: 'manual',
                          status: 'completed',
                        })
                      }
                      disabled={isDemoMode}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-white/10 cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Row</span>
                    </button>
                  </div>

                  {resumeCertifications.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        No certifications added to your resume yet.
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Upload your LinkedIn profile PDF above to extract verified credentials, or click "+ Add Manually".
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {resumeCertifications.map((cert) => (
                        <div
                          key={cert.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                            <input
                              type="text"
                              value={cert.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateCertification(cert.id, { title: val });
                              }}
                              placeholder="Certification Title"
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                            />
                            <input
                              type="text"
                              value={cert.issuer}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateCertification(cert.id, { issuer: val });
                              }}
                              placeholder="Issuing Organization"
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                            />
                            <input
                              type="text"
                              value={cert.date}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateCertification(cert.id, { date: val });
                              }}
                              placeholder="Date / Year"
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-slate-400 focus:outline-none"
                            />
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                value={cert.credentialUrl || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateCertification(cert.id, { credentialUrl: val });
                                }}
                                placeholder="Verification URL"
                                className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-600 dark:text-slate-400 focus:outline-none"
                              />
                              {cert.credentialUrl && isValidUrl(cert.credentialUrl) && (
                                <a
                                  href={normalizeUrl(cert.credentialUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-blue-600 dark:text-cyan-400 hover:text-blue-700 shrink-0"
                                  title="Test URL"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {cert.source && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400">
                                {cert.source === 'linkedin_pdf' ? 'LinkedIn' : cert.source}
                              </span>
                            )}
                            <button
                              onClick={() => handleRemoveCertification(cert.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 cursor-pointer"
                              title="Delete certification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                <div className="p-6 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200 font-sans text-[11px] leading-relaxed space-y-3.5 max-h-[780px] overflow-y-auto">
                  
                  {/* Left-Aligned Header */}
                  <div className="text-left space-y-0.5 pb-2.5 border-b border-slate-300">
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 uppercase">
                      {fullName}
                    </h1>
                    {headline && (
                      <div className="text-xs font-semibold text-slate-700">
                        {headline}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-600 flex items-center flex-wrap gap-x-2 pt-0.5">
                      {cleanLocation(location) && <span>{cleanLocation(location)}</span>}
                      {cleanLocation(location) && email && <span>•</span>}
                      {email && <span>{email}</span>}
                      {email && phone && <span>•</span>}
                      {phone && <span>{phone}</span>}
                    </div>
                    {(isValidUrl(githubUrl) || isValidUrl(linkedinUrl)) && (
                      <div className="text-[10px] text-slate-600 flex items-center flex-wrap gap-x-2">
                        {isValidUrl(githubUrl) && (
                          <a
                            href={normalizeUrl(githubUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            GitHub: {normalizeUrl(githubUrl).replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </a>
                        )}
                        {isValidUrl(githubUrl) && isValidUrl(linkedinUrl) && <span>•</span>}
                        {isValidUrl(linkedinUrl) && (
                          <a
                            href={normalizeUrl(linkedinUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            LinkedIn: {normalizeUrl(linkedinUrl).replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 1. PROFILE */}
                  {summary && (
                    <div className="space-y-1">
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#0f766e]">
                        Profile
                      </div>
                      <p className="text-[10px] text-slate-700 leading-normal text-justify">
                        {summary}
                      </p>
                    </div>
                  )}

                  {/* 2. TECHNICAL SKILLS (Tabular Layout) */}
                  {skillCategories.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#0f766e]">
                        Technical Skills
                      </div>
                      <div className="space-y-1 text-[10px] text-slate-700">
                        {skillCategories.map((c) => (
                          <div key={c.id} className="grid grid-cols-[110px_1fr] items-baseline gap-2">
                            <span className="font-bold text-slate-900 uppercase text-[9.5px]">
                              {c.category}:
                            </span>
                            <span className="text-slate-800">{c.skills}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. SELECTED PROJECTS */}
                  {resumeProjects.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#0f766e]">
                        Selected Projects
                      </div>
                      <div className="space-y-2.5">
                        {resumeProjects.map((p) => (
                          <div key={p.id} className="space-y-0.5">
                            <div className="flex items-baseline justify-between text-[10px]">
                              <span className="font-bold text-slate-950 flex items-center gap-1.5">
                                <span>{p.title}</span>
                                {isValidUrl(p.githubUrl) && (
                                  <a
                                    href={normalizeUrl(p.githubUrl!)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline font-mono text-[9px] font-normal"
                                  >
                                    [Code]
                                  </a>
                                )}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 italic">{p.techStack}</span>
                            </div>
                            <ul className="space-y-0.5 pl-3 list-disc text-[9.5px] text-slate-700 leading-normal">
                              {p.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. EDUCATION */}
                  {university && (
                    <div className="space-y-1">
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#0f766e]">
                        Education
                      </div>
                      <div className="text-[10px] text-slate-700 space-y-0.5">
                        <div className="flex items-baseline justify-between">
                          <span className="font-bold text-slate-950">
                            {[degree, branch].filter(Boolean).join(' in ') || 'Undergraduate Degree'}
                          </span>
                          {gradYear && <span className="font-mono text-slate-600 text-[9px]">{gradYear}</span>}
                        </div>
                        <div className="flex items-baseline justify-between text-slate-600 text-[9.5px]">
                          <span>{[university, cleanLocation(location)].filter(Boolean).join(' • ')}</span>
                          {cgpa && cgpa.trim() !== '' && (
                            <span className="font-semibold text-slate-900">CGPA: {cgpa.trim()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. CERTIFICATIONS (2-Column Grid) */}
                  {resumeCertifications.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#0f766e]">
                        Certifications
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[9.5px] text-slate-700">
                        {resumeCertifications.map((c) => (
                          <div key={c.id} className="flex items-start gap-1">
                            <span className="text-slate-400">•</span>
                            <div className="flex-1 leading-tight">
                              <span className="font-semibold text-slate-900">{c.title}</span>
                              {c.issuer && <span className="text-slate-600"> — {c.issuer}</span>}
                              {c.date && <span className="text-slate-500 font-mono text-[8.5px]"> ({c.date})</span>}
                              {c.credentialUrl && isValidUrl(c.credentialUrl) && (
                                <a
                                  href={normalizeUrl(c.credentialUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline ml-1 font-mono text-[8.5px]"
                                >
                                  [Credential]
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5b. PLANNED CERTIFICATIONS (TARGET) */}
                  {includePlannedOnResume && plannedCertifications.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>Planned Certifications (Target)</span>
                        <span className="text-[8px] font-mono lowercase">[target]</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-slate-600 italic">
                        {plannedCertifications.map((c) => (
                          <div key={c.id} className="flex items-start gap-1">
                            <span className="text-slate-400">•</span>
                            <div className="flex-1 leading-tight">
                              <span className="font-medium text-slate-800 not-italic">{c.title}</span>
                              {c.issuer && <span> — {c.issuer}</span>}
                              {c.date && <span className="font-mono text-[8.5px]"> (Target: {c.date})</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. PARTICIPATIONS & EVENTS */}
                  {resumeParticipations.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#0f766e]">
                        Participations & Events
                      </div>
                      <ul className="space-y-0.5 pl-3 list-disc text-[9.5px] text-slate-700">
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
              
              {/* Left-Aligned Header */}
              <div className="text-left space-y-1 pb-3.5 border-b border-slate-300">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">
                  {fullName}
                </h1>
                {headline && (
                  <div className="text-sm font-semibold text-slate-700">
                    {headline}
                  </div>
                )}
                <div className="text-xs text-slate-600 flex items-center flex-wrap gap-x-2.5 pt-0.5">
                  {cleanLocation(location) && <span>{cleanLocation(location)}</span>}
                  {cleanLocation(location) && email && <span>•</span>}
                  {email && <span>{email}</span>}
                  {email && phone && <span>•</span>}
                  {phone && <span>{phone}</span>}
                </div>
                {(isValidUrl(githubUrl) || isValidUrl(linkedinUrl)) && (
                  <div className="text-xs text-slate-600 flex items-center flex-wrap gap-x-2.5 pt-0.5">
                    {isValidUrl(githubUrl) && (
                      <a
                        href={normalizeUrl(githubUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        GitHub: {normalizeUrl(githubUrl).replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    )}
                    {isValidUrl(githubUrl) && isValidUrl(linkedinUrl) && <span>•</span>}
                    {isValidUrl(linkedinUrl) && (
                      <a
                        href={normalizeUrl(linkedinUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        LinkedIn: {normalizeUrl(linkedinUrl).replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* 1. PROFILE */}
              {summary && (
                <div className="space-y-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
                    Profile
                  </h2>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">
                    {summary}
                  </p>
                </div>
              )}

              {/* 2. TECHNICAL SKILLS (Tabular Layout) */}
              {skillCategories.length > 0 && (
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
                    Technical Skills
                  </h2>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    {skillCategories.map((c) => (
                      <div key={c.id} className="grid grid-cols-[140px_1fr] items-baseline gap-3">
                        <span className="font-bold text-slate-900 uppercase text-[11px]">
                          {c.category}:
                        </span>
                        <span className="text-slate-800">{c.skills}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. SELECTED PROJECTS */}
              {resumeProjects.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
                    Selected Projects
                  </h2>
                  <div className="space-y-3.5">
                    {resumeProjects.map((p) => (
                      <div key={p.id} className="space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate-950 flex items-center gap-2">
                            <span>{p.title}</span>
                            {isValidUrl(p.githubUrl) && (
                              <a
                                href={normalizeUrl(p.githubUrl!)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline font-mono text-[11px] font-normal"
                              >
                                [Code]
                              </a>
                            )}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 italic">{p.techStack}</span>
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
              )}

              {/* 4. EDUCATION */}
              {university && (
                <div className="space-y-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
                    Education
                  </h2>
                  <div className="text-xs text-slate-700 space-y-0.5">
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-slate-950 text-sm">
                        {[degree, branch].filter(Boolean).join(' in ') || 'Undergraduate Degree'}
                      </span>
                      {gradYear && <span className="font-mono text-slate-600 text-xs">{gradYear}</span>}
                    </div>
                    <div className="flex items-baseline justify-between text-slate-600 text-xs">
                      <span>{[university, cleanLocation(location)].filter(Boolean).join(' • ')}</span>
                      {cgpa && cgpa.trim() !== '' && (
                        <span className="font-semibold text-slate-900">CGPA: {cgpa.trim()}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CERTIFICATIONS (2-Column Grid) */}
              {resumeCertifications.length > 0 && (
                <div className="space-y-1.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
                    Certifications
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-700">
                    {resumeCertifications.map((cert) => (
                      <div key={cert.id} className="flex items-start gap-1.5">
                        <span className="text-slate-400">•</span>
                        <div className="flex-1 leading-normal">
                          <span className="font-semibold text-slate-900">{cert.title}</span>
                          {cert.issuer && <span className="text-slate-600"> — {cert.issuer}</span>}
                          {cert.date && <span className="text-slate-500 font-mono text-[10px]"> ({cert.date})</span>}
                          {cert.credentialUrl && isValidUrl(cert.credentialUrl) && (
                            <a
                              href={normalizeUrl(cert.credentialUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline ml-1 font-mono text-[10px]"
                            >
                              [Credential]
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5b. PLANNED CERTIFICATIONS (TARGET) */}
              {includePlannedOnResume && plannedCertifications.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Planned Certifications (Target)
                    </h2>
                    <span className="text-[10px] font-mono text-slate-400 lowercase">[target]</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 italic">
                    {plannedCertifications.map((cert) => (
                      <div key={cert.id} className="flex items-start gap-1.5">
                        <span className="text-slate-400">•</span>
                        <div className="flex-1 leading-normal">
                          <span className="font-medium text-slate-800 not-italic">{cert.title}</span>
                          {cert.issuer && <span> — {cert.issuer}</span>}
                          {cert.date && <span className="font-mono text-[10px]"> (Target: {cert.date})</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. PARTICIPATIONS & EVENTS */}
              {resumeParticipations.length > 0 && (
                <div className="space-y-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f766e]">
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

              {/* Bottom Runner */}
              <div className="pt-6 mt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{fullName} • {headline || 'Resume'}</span>
                <span>1</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </EngineLayout>
  );
};
