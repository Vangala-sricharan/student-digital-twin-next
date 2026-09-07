import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useAuth } from '../../context/AuthContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { UpgradeProModal } from '../subscription/UpgradeProModal';
import {
  Sparkles,
  Layers,
  Sliders,
  CheckCircle2,
  Code2,
  Globe,
  Eye,
  Laptop,
  Tablet,
  Smartphone,
  Copy,
  Check,
  Download,
  ExternalLink,
  Code,
  Layout,
  Palette,
  Terminal,
  User,
  AlertCircle,
  ArrowRight,
  FolderGit2,
  Cpu,
  Trophy,
  Mail,
  MapPin,
  Github,
  Linkedin,
  Lock,
} from 'lucide-react';

interface AIPortfolioViewProps {
  onBackToHub?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AIPortfolioView: React.FC<AIPortfolioViewProps> = ({ onBackToHub, onNavigateTab }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'ai-portfolio')!;
  const {
    profile,
    skills,
    projects,
    achievements,
    careerGoals,
    isDemoMode,
    subscription,
    isPro,
    openDemoLockModal,
  } = useStudentTwin();
  const { user } = useAuth();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('ai-portfolio');

  const [activeTab, setActiveTab] = useState<'preview' | 'builder' | 'code'>('preview');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeCodeFile, setActiveCodeFile] = useState<'html' | 'css' | 'js'>('html');
  const [portfolioTheme, setPortfolioTheme] = useState<'slate' | 'light' | 'cyber'>('slate');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Content state prefilled from Digital Twin
  const [headline, setHeadline] = useState(
    profile?.targetRole || 'Software Development Engineer'
  );
  const [bio, setBio] = useState(
    profile?.bio ||
    `Computer science scholar at ${profile?.university || 'University'} specializing in verifiable software architectures and engineering solutions.`
  );

  useEffect(() => {
    if (profile?.targetRole) {
      setHeadline(profile.targetRole);
    }
    if (profile?.bio) {
      setBio(profile.bio);
    }
  }, [profile?.targetRole, profile?.bio]);

  const handleGeneratePortfolio = async () => {
    // 1. DEMO MODE GATE: Showcase mode is strictly view-only
    if (isDemoMode) {
      openDemoLockModal();
      return;
    }

    // 2. CRITICAL PRE-AI PRO GATE: Check authenticated user's current subscription FIRST
    // Must be current user's active plan. ZERO AI/API calls or quota consumption if free.
    const currentPlan = subscription?.tier || 'free';
    if (!user || currentPlan === 'free' || !isPro) {
      setIsUpgradeModalOpen(true);
      return;
    }

    // 3. PRO USERS ONLY: proceed with AI engine execution
    if (!profile || isRunning) return;

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    await execute({
      engineId: 'ai-portfolio',
      studentContext,
      userInputs: {
        section: 'Complete Portfolio Suite',
        tone: 'High-Impact Technical & Verifiable Proof-of-Work',
        theme: portfolioTheme,
      },
    });

    if (user?.id) {
      localStorage.setItem(`sdt_has_portfolio_${user.id}`, 'true');
    }
  };

  const studentName = profile?.fullName || profile?.name || 'Student Candidate';
  const githubUrl = profile?.githubUrl || '';
  const linkedinUrl = profile?.linkedinUrl || '';
  const portfolioUrl = profile?.portfolioUrl || '';
  const studentEmail = profile?.email || '';
  const studentLocation = profile?.location || '';
  const studentUniversity = profile?.university || '';
  const studentDegree = profile?.degree ? `${profile.degree}${profile.branch ? ` in ${profile.branch}` : ''}` : '';
  const avatarUrl = profile?.avatarUrl || '';

  // Generate initials for monogram if no avatar
  const initials = studentName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST';

  // Check if authenticated user has insufficient data
  const hasInsufficientData = !isDemoMode && skills.length === 0 && projects.length === 0;

  // Group skills by category
  const skillsByCategory = skills.reduce<Record<string, typeof skills>>((acc, skill) => {
    const cat = skill.category || 'Core Technologies';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  // Security & Subscription Plan Verification:
  // Source code and personal portfolio synthesis must NEVER be generated or exposed to Free users
  const currentPlan = subscription?.tier || 'free';
  const isUserPro = Boolean(user && currentPlan !== 'free' && isPro);
  const shouldBuildPortfolio = isUserPro || isDemoMode;

  // Generate responsive HTML/CSS/JS source code (Pro & Demo showcase only)
  const generatedHtml = shouldBuildPortfolio ? `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${studentName} | Software Engineer & Technical Portfolio</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</head>
<body class="theme-${portfolioTheme}">
  <!-- Navigation Header -->
  <header class="header" id="header">
    <div class="nav-container">
      <a href="#hero" class="brand-logo">
        <span class="brand-bracket">&lt;</span>${studentName.split(' ')[0]}<span class="brand-slash"> /</span><span class="brand-bracket">&gt;</span>
      </a>
      <button class="mobile-toggle" id="mobileToggle" aria-label="Toggle navigation">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
      <nav class="nav-links" id="navLinks">
        <a href="#hero" class="nav-link">Home</a>
        <a href="#about" class="nav-link">About</a>
        <a href="#skills" class="nav-link">Skills</a>
        <a href="#projects" class="nav-link">Projects</a>
        ${achievements.length > 0 ? '<a href="#achievements" class="nav-link">Achievements</a>' : ''}
        <a href="#contact" class="nav-link">Contact</a>
        <a href="#contact" class="nav-btn">Get In Touch</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <!-- 1. HERO SECTION -->
    <section class="hero" id="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="status-dot"></span>
          <span>PLACEMENT-VERIFIED STUDENT TWIN</span>
        </div>
        <h1 class="hero-title">${studentName}</h1>
        <p class="hero-headline">${headline}</p>
        <p class="hero-bio">${bio}</p>
        
        <div class="hero-meta">
          ${studentUniversity ? `<span class="meta-item"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>${studentUniversity}</span>` : ''}
          ${studentLocation ? `<span class="meta-item"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>${studentLocation}</span>` : ''}
        </div>

        <div class="hero-cta">
          <a href="#projects" class="btn btn-primary">Explore Projects</a>
          <a href="#contact" class="btn btn-secondary">Connect With Me</a>
          ${githubUrl ? `<a href="${githubUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-icon" title="GitHub Profile"><svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg></a>` : ''}
          ${linkedinUrl ? `<a href="${linkedinUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-icon" title="LinkedIn Profile"><svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>` : ''}
        </div>
      </div>

      <div class="hero-visual">
        <div class="avatar-wrapper">
          ${avatarUrl 
            ? `<img src="${avatarUrl}" alt="${studentName}" class="avatar-image" />`
            : `<div class="avatar-monogram"><span>${initials}</span></div>`
          }
          <div class="avatar-verified-badge" title="Identity & Twin Verified">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
        </div>
        <div class="twin-quick-stats">
          <div class="quick-stat">
            <span class="stat-number">${skills.length}</span>
            <span class="stat-label">Skills</span>
          </div>
          <div class="quick-stat">
            <span class="stat-number">${projects.length}</span>
            <span class="stat-label">Projects</span>
          </div>
          <div class="quick-stat">
            <span class="stat-number">${achievements.length}</span>
            <span class="stat-label">Honors</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. ABOUT SECTION -->
    <section class="section" id="about">
      <div class="section-header">
        <span class="section-tag">BACKGROUND & ASPIRATION</span>
        <h2 class="section-title">About Me</h2>
      </div>

      <div class="about-grid">
        <div class="about-card">
          <h3 class="card-title">Academic Foundation</h3>
          <p class="card-desc">Comprehensive university grounding in algorithmic structures, software design patterns, and engineering systems.</p>
          <ul class="meta-list">
            ${studentUniversity ? `<li><strong>University:</strong> <span>${studentUniversity}</span></li>` : ''}
            ${studentDegree ? `<li><strong>Degree:</strong> <span>${studentDegree}</span></li>` : ''}
            ${(profile?.gradYear || profile?.yearOfStudy) ? `<li><strong>Class Year:</strong> <span>${profile.gradYear || profile.yearOfStudy}</span></li>` : ''}
            ${(profile?.cgpa || profile?.currentGpa) ? `<li><strong>CGPA / GPA:</strong> <span>${profile.cgpa || profile.currentGpa}</span></li>` : ''}
          </ul>
        </div>

        <div class="about-card">
          <h3 class="card-title">Engineering Focus</h3>
          <p class="card-desc">${bio}</p>
          <div class="focus-tags">
            <span class="focus-tag">Target Role: ${headline}</span>
            <span class="focus-tag">Verified Proof-of-Work</span>
            <span class="focus-tag">Full Lifecycle Engineering</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. SKILLS SECTION -->
    <section class="section" id="skills">
      <div class="section-header">
        <span class="section-tag">VERIFIED COMPETENCIES</span>
        <h2 class="section-title">Technical Skills & Expertise</h2>
      </div>

      ${
        skills.length > 0
          ? `
      <div class="skills-container">
        ${Object.entries(skillsByCategory).map(([category, catSkills]) => `
          <div class="skill-category-block">
            <h3 class="skill-category-title">${category}</h3>
            <div class="skills-grid">
              ${catSkills.map((s) => `
                <div class="skill-card">
                  <div class="skill-card-top">
                    <span class="skill-name">${s.name}</span>
                    <span class="skill-level">${s.proficiency ? `${s.proficiency}%` : 'Verified'}</span>
                  </div>
                  ${s.proficiency ? `
                  <div class="skill-bar-track">
                    <div class="skill-bar-fill" style="width: ${s.proficiency}%"></div>
                  </div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
          `
          : `
      <div class="empty-state-card">
        <p>No verified skills recorded yet in your Student Digital Twin.</p>
        <span class="empty-sub">Add technical competencies in My Foundation to feature them here.</span>
      </div>
          `
      }
    </section>

    <!-- 4. PROJECTS SECTION -->
    <section class="section" id="projects">
      <div class="section-header">
        <span class="section-tag">PROVEN CAPABILITIES</span>
        <h2 class="section-title">Featured Projects</h2>
      </div>

      ${
        projects.length > 0
          ? `
      <div class="projects-grid">
        ${projects.map((p) => `
          <article class="project-card">
            <div class="project-card-header">
              <div>
                <h3 class="project-title">${p.title}</h3>
                ${p.role ? `<span class="project-role-badge">${p.role}</span>` : ''}
              </div>
              <span class="status-badge">CODEBASE AUDITED</span>
            </div>

            <p class="project-description">${p.description}</p>

            ${p.techStack && p.techStack.length > 0 ? `
            <div class="project-tech-stack">
              ${p.techStack.map((t) => `<span class="tech-pill">${t}</span>`).join('')}
            </div>` : ''}

            <div class="project-card-actions">
              ${p.githubUrl ? `
              <a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-action-link">
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                <span>Source Code</span>
              </a>` : ''}
              ${p.liveUrl ? `
              <a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="project-action-link accent">
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                <span>Live Preview</span>
              </a>` : ''}
            </div>
          </article>
        `).join('')}
      </div>
          `
          : `
      <div class="empty-state-card">
        <p>No proof-of-work projects published yet.</p>
        <span class="empty-sub">Add your repositories and engineering builds in My Foundation to display them here.</span>
      </div>
          `
      }
    </section>

    <!-- 5. ACHIEVEMENTS SECTION (Only if user has achievements) -->
    ${
      achievements.length > 0
        ? `
    <section class="section" id="achievements">
      <div class="section-header">
        <span class="section-tag">HONORS & MILESTONES</span>
        <h2 class="section-title">Verified Distinctions</h2>
      </div>

      <div class="achievements-grid">
        ${achievements.map((a) => `
          <div class="achievement-card">
            <div class="achievement-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
            </div>
            <div class="achievement-content">
              <h3 class="achievement-title">${a.title}</h3>
              <div class="achievement-issuer">${a.issuer}${a.date ? ` &bull; ${a.date}` : ''}</div>
              ${a.description ? `<p class="achievement-desc">${a.description}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </section>
        `
        : ''
    }

    <!-- 6. CONTACT SECTION -->
    <section class="section" id="contact">
      <div class="section-header">
        <span class="section-tag">DIRECT INQUIRIES</span>
        <h2 class="section-title">Let's Connect</h2>
      </div>

      <div class="contact-grid">
        <div class="contact-info">
          <p class="contact-lead">I am always open to discussing prospective engineering opportunities, open-source initiatives, or technical placement conversations.</p>
          
          <div class="contact-channels">
            ${studentEmail ? `
            <a href="mailto:${studentEmail}" class="contact-channel-card">
              <div class="channel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                <span class="channel-title">Email Direct</span>
                <span class="channel-value">${studentEmail}</span>
              </div>
            </a>` : ''}

            ${studentLocation ? `
            <div class="contact-channel-card">
              <div class="channel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <span class="channel-title">Location</span>
                <span class="channel-value">${studentLocation}</span>
              </div>
            </div>` : ''}

            ${githubUrl ? `
            <a href="${githubUrl}" target="_blank" rel="noopener noreferrer" class="contact-channel-card">
              <div class="channel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/></svg>
              </div>
              <div>
                <span class="channel-title">GitHub Profile</span>
                <span class="channel-value">Explore Repositories</span>
              </div>
            </a>` : ''}

            ${linkedinUrl ? `
            <a href="${linkedinUrl}" target="_blank" rel="noopener noreferrer" class="contact-channel-card">
              <div class="channel-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </div>
              <div>
                <span class="channel-title">LinkedIn Network</span>
                <span class="channel-value">Professional Profile</span>
              </div>
            </a>` : ''}
          </div>
        </div>

        <div class="contact-form-card">
          <h3 class="form-title">Send a Quick Message</h3>
          <form id="contactForm" onsubmit="return false;">
            <div class="form-group">
              <label for="contactName">Your Name</label>
              <input type="text" id="contactName" required placeholder="Jane Doe" />
            </div>
            <div class="form-group">
              <label for="contactEmail">Your Email</label>
              <input type="email" id="contactEmail" required placeholder="jane@company.com" />
            </div>
            <div class="form-group">
              <label for="contactMsg">Message / Subject</label>
              <textarea id="contactMsg" rows="4" required placeholder="Hi ${studentName.split(' ')[0]}, I came across your portfolio and wanted to discuss..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="submitBtn">
              <span>Send Message</span>
            </button>
            <div id="formStatus" class="form-status-box"></div>
          </form>
        </div>
      </div>
    </section>
  </main>

  <!-- 7. FOOTER -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-left">
        <span class="footer-copy">&copy; ${new Date().getFullYear()} ${studentName}. All rights reserved.</span>
        <span class="footer-sub">Verified with Student Digital Twin AI Career OS.</span>
      </div>
      <a href="#hero" class="back-to-top" aria-label="Back to top">
        <span>Top</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>
      </a>
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>` : '';

  const generatedCss = shouldBuildPortfolio ? `/* ===================================================================
   STUDENT DIGITAL TWIN - VERIFIED PERSONAL PORTFOLIO
   Theme: ${portfolioTheme}
   =================================================================== */

:root {
  ${
    portfolioTheme === 'light'
      ? `
  --bg-main: #f8fafc;
  --bg-card: #ffffff;
  --bg-card-subtle: #f1f5f9;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --text-soft: #94a3b8;
  --accent-primary: #2563eb;
  --accent-secondary: #0284c7;
  --border-color: #e2e8f0;
  --border-subtle: #f1f5f9;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
  --status-dot: #10b981;
      `
      : portfolioTheme === 'cyber'
      ? `
  --bg-main: #050508;
  --bg-card: #0d1117;
  --bg-card-subtle: #161b22;
  --text-main: #f0f6fc;
  --text-muted: #8b949e;
  --text-soft: #6e7681;
  --accent-primary: #10b981;
  --accent-secondary: #06b6d4;
  --border-color: rgba(255, 255, 255, 0.1);
  --border-subtle: rgba(255, 255, 255, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.6);
  --status-dot: #10b981;
      `
      : `
  --bg-main: #0a0f1d;
  --bg-card: #111827;
  --bg-card-subtle: #1f2937;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --text-soft: #64748b;
  --accent-primary: #3b82f6;
  --accent-secondary: #06b6d4;
  --border-color: rgba(255, 255, 255, 0.1);
  --border-subtle: rgba(255, 255, 255, 0.05);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --status-dot: #10b981;
      `
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-main);
  color: var(--text-main);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* Container */
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Header & Navigation */
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--bg-main);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(12px);
}

.nav-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  font-family: 'JetBrains Mono', monospace;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-main);
  text-decoration: none;
  letter-spacing: -0.02em;
}

.brand-bracket { color: var(--accent-primary); }
.brand-slash { color: var(--text-muted); }

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: color 0.15s ease;
}

.nav-link:hover {
  color: var(--accent-primary);
}

.nav-btn {
  padding: 7px 14px;
  border-radius: 8px;
  background: var(--accent-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.nav-btn:hover {
  opacity: 0.9;
}

.mobile-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.mobile-toggle .bar {
  width: 20px;
  height: 2px;
  background-color: var(--text-main);
  border-radius: 2px;
}

/* Hero Section */
.hero {
  padding: 72px 0 60px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 48px;
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-radius: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: var(--accent-primary);
  letter-spacing: 0.05em;
  margin-bottom: 20px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--status-dot);
  box-shadow: 0 0 6px var(--status-dot);
}

.hero-title {
  font-size: 44px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin-bottom: 12px;
  color: var(--text-main);
}

.hero-headline {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent-primary);
  margin-bottom: 18px;
}

.hero-bio {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.65;
  margin-bottom: 24px;
  max-width: 580px;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.meta-item .icon {
  width: 14px;
  height: 14px;
  stroke: var(--accent-primary);
}

.hero-cta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: var(--accent-primary);
  color: #ffffff;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background-color: var(--bg-card);
  color: var(--text-main);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  border-color: var(--accent-primary);
}

.btn-icon {
  padding: 10px;
  background-color: var(--bg-card);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.btn-icon:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.btn-icon .icon {
  width: 16px;
  height: 16px;
}

.btn-block {
  width: 100%;
}

/* Hero Visual / Avatar Card */
.hero-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.avatar-wrapper {
  position: relative;
  width: 170px;
  height: 170px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid var(--border-color);
  box-shadow: var(--shadow-md);
}

.avatar-monogram {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 48px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  box-shadow: var(--shadow-md);
  border: 2px solid var(--border-color);
}

.avatar-verified-badge {
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #10b981;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.avatar-verified-badge svg {
  width: 16px;
  height: 16px;
}

.twin-quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 280px;
}

.quick-stat {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 18px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-primary);
}

.stat-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-soft);
  text-transform: uppercase;
}

/* Sections */
.section {
  padding: 56px 0;
  border-top: 1px solid var(--border-color);
}

.section-header {
  margin-bottom: 32px;
}

.section-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: var(--accent-primary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-title {
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
  margin-top: 4px;
}

/* About Section */
.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.about-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-main);
}

.card-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 16px;
}

.meta-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-list li {
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 4px;
}

.meta-list strong {
  color: var(--text-soft);
  font-weight: 600;
}

.meta-list span {
  color: var(--text-main);
  font-weight: 600;
}

.focus-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.focus-tag {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
  color: var(--accent-primary);
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

/* Skills Section */
.skills-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.skill-category-block {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

.skill-category-title {
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-soft);
  margin-bottom: 14px;
  letter-spacing: 0.05em;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.skill-card {
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 14px;
}

.skill-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.skill-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main);
}

.skill-level {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: var(--accent-primary);
}

.skill-bar-track {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--border-color);
  overflow: hidden;
}

.skill-bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
}

/* Projects Section */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.project-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.15s ease;
}

.project-card:hover {
  border-color: var(--accent-primary);
}

.project-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.project-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.project-role-badge {
  display: inline-block;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent-primary);
  margin-top: 2px;
}

.status-badge {
  font-size: 9px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.project-description {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 16px;
  flex-grow: 1;
}

.project-tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.tech-pill {
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  background: var(--bg-card-subtle);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  padding: 3px 7px;
  border-radius: 4px;
}

.project-card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  padding-top: 14px;
}

.project-action-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}

.project-action-link:hover {
  color: var(--text-main);
}

.project-action-link.accent {
  color: var(--accent-primary);
}

.project-action-link.accent:hover {
  opacity: 0.8;
}

.action-icon {
  width: 14px;
  height: 14px;
}

/* Achievements Section */
.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.achievement-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.achievement-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
  shrink-0;
}

.achievement-icon svg {
  width: 18px;
  height: 18px;
}

.achievement-content {
  flex-grow: 1;
}

.achievement-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.achievement-issuer {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-soft);
  margin-top: 2px;
  margin-bottom: 4px;
}

.achievement-desc {
  font-size: 12px;
  color: var(--text-muted);
}

/* Contact Section */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

.contact-lead {
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 24px;
}

.contact-channels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-channel-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease;
}

.contact-channel-card:hover {
  border-color: var(--accent-primary);
}

.channel-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--bg-card-subtle);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  shrink-0;
}

.channel-icon svg {
  width: 18px;
  height: 18px;
}

.channel-title {
  display: block;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-soft);
  text-transform: uppercase;
}

.channel-value {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.contact-form-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
}

.form-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-main);
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-soft);
  margin-bottom: 6px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  background: var(--bg-card-subtle);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  font-size: 13px;
  font-family: inherit;
  transition: border-color 0.15s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-status-box {
  margin-top: 10px;
  font-size: 12px;
  text-align: center;
  display: none;
}

/* Empty State Card */
.empty-state-card {
  background: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  padding: 36px 24px;
  text-align: center;
}

.empty-state-card p {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
}

.empty-sub {
  display: block;
  font-size: 12px;
  color: var(--text-soft);
  margin-top: 4px;
}

/* Footer */
.footer {
  border-top: 1px solid var(--border-color);
  padding: 32px 0;
  margin-top: 40px;
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.footer-copy {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.footer-sub {
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-soft);
}

.back-to-top {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-muted);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  transition: all 0.15s ease;
}

.back-to-top:hover {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.back-to-top svg {
  width: 12px;
  height: 12px;
}

/* Responsive Styles */
@media (max-width: 860px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 36px;
  }
  .hero-bio {
    margin-left: auto;
    margin-right: auto;
  }
  .hero-meta, .hero-cta {
    justify-content: center;
  }
  .about-grid, .contact-grid {
    grid-template-columns: 1fr;
  }
  .mobile-toggle {
    display: flex;
  }
  .nav-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-main);
    border-bottom: 1px solid var(--border-color);
    padding: 16px 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .nav-links.active {
    display: flex;
  }
}
` : '';

  const generatedJs = shouldBuildPortfolio ? `// Student Digital Twin Verified Portfolio Script
document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // Smooth Scrolling for all internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Client-Side Contact Form Handling
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('contactName') || {}).value || '';
      const email = (document.getElementById('contactEmail') || {}).value || '';
      const msg = (document.getElementById('contactMsg') || {}).value || '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';
      }

      setTimeout(() => {
        formStatus.style.display = 'block';
        formStatus.style.color = '#10b981';
        formStatus.innerText = 'Thank you for reaching out, ' + name + '! Your message has been received.';
        contactForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Message Sent ✓';
        }
      }, 700);
    });
  }
});` : '';

  // Pro users get real code; Free users and unauthenticated users receive empty string
  const currentCode = isUserPro
    ? (activeCodeFile === 'html'
        ? generatedHtml
        : activeCodeFile === 'css'
        ? generatedCss
        : generatedJs)
    : '';

  const handleCopyCode = () => {
    // 1. DEMO MODE GATE: Block demo visitors from copying
    if (isDemoMode) {
      openDemoLockModal();
      return;
    }

    // 2. CRITICAL PRE-COPY PRO GATE: Verify current authenticated user is Pro before clipboard operation
    const plan = subscription?.tier || 'free';
    if (!user || plan === 'free' || !isPro) {
      setIsUpgradeModalOpen(true);
      return;
    }

    // 3. PRO USERS ONLY: proceed with copying source code
    if (!currentCode) return;
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadZip = async () => {
    // 1. DEMO MODE GATE: Block demo visitors from downloading
    if (isDemoMode) {
      openDemoLockModal();
      return;
    }

    // 2. CRITICAL PRO GATE: Verify current authenticated user is Pro before zipping/downloading
    const plan = subscription?.tier || 'free';
    if (!user || plan === 'free' || !isPro) {
      setIsUpgradeModalOpen(true);
      return;
    }

    // 3. PRO USERS ONLY: proceed with zip generation
    if (!isUserPro || !generatedHtml) return;

    try {
      setIsZipping(true);
      const zip = new JSZip();
      zip.file('index.html', generatedHtml);
      zip.file('style.css', generatedCss);
      zip.file('script.js', generatedJs);
      zip.file(
        'README.md',
        `# ${studentName} - Personal Portfolio Website

This portfolio website was generated automatically using verified Student Digital Twin metrics and evidence.

## Files Included
- \`index.html\`: Clean, semantic HTML5 structure with responsive sections (Hero, About, Skills, Projects, Achievements, Contact, Footer).
- \`style.css\`: Complete responsive styling, custom theme variables, high-contrast layouts, and mobile-ready media queries.
- \`script.js\`: Smooth scrolling, mobile drawer toggle, and client-side contact interaction.

## How to Run & Deploy
1. **Local Preview**: Double-click \`index.html\` to open in any modern browser.
2. **Deploy to GitHub Pages**:
   - Create a repository named \`<your-username>.github.io\`
   - Upload \`index.html\`, \`style.css\`, and \`script.js\`
   - Enable GitHub Pages in repository settings!
3. **Deploy to Vercel / Netlify**:
   - Drag and drop this folder directly onto Vercel or Netlify for instant deployment.
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${studentName.replace(/\s+/g, '_')}_Portfolio.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating portfolio zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={handleGeneratePortfolio}
      resultText={isUserPro ? (rawText || undefined) : undefined}
    >
      <div className="space-y-6">
        
        {/* Anti-Fake Data Guard Notice for Authenticated Users with Insufficient Data */}
        {hasInsufficientData && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-bold">Incomplete Portfolio Foundation</div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Add your profile, skills and at least one project to build a stronger portfolio. We never populate your portfolio with fake demo data.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {onNavigateTab && (
                <>
                  <button
                    onClick={() => onNavigateTab('my-profile')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition-all"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => onNavigateTab('projects')}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-semibold cursor-pointer hover:bg-amber-100 transition-all"
                  >
                    Add Projects
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* FREE USER PROFESSIONAL PREMIUM LOCK CARD */}
        {!isPro && !isDemoMode && (
          <div
            id="ai-portfolio-pro-lock-banner"
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 dark:from-blue-950/40 dark:via-[#0d1117] dark:to-slate-900/40 border border-blue-200 dark:border-blue-500/30 shadow-sm transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-blue-500/30">
                      🔒 PRO FEATURE
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      ₹299/month or ₹1,499/year
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    AI Portfolio Builder is available with Pro.
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                    Unlock:
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono">
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>AI-powered portfolio generation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>Personal portfolio preview</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>Downloadable portfolio ZIP</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>Advanced career presentation</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
                <button
                  id="btn-portfolio-banner-upgrade"
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-mono font-bold shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Upgrade to Pro</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Mode Notice Banner with Live Portfolio Link */}
        {isDemoMode && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Demo Showcase Portfolio — Vangala Sricharan
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  This interactive preview is grounded in verified student twin credentials. You can also visit the live production portfolio at:
                </p>
              </div>
            </div>
            <a
              href="https://vangala-sricharan-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all shrink-0"
            >
              <span>Open Live Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Header & Controls Toolbar */}
        <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  AI Digital Twin Portfolio Builder
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                  SINGLE-PAGE HTML/CSS/JS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generates a production-ready personal portfolio website grounded strictly in your verified Student Twin credentials.
              </p>
            </div>
          </div>

          {/* Action Tabs & Controls */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="p-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'builder'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {!isPro && !isDemoMode ? <Lock className="w-3.5 h-3.5 text-blue-500" /> : <Code2 className="w-3.5 h-3.5" />}
                <span>Source Code</span>
              </button>
            </div>

            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              {!isPro && !isDemoMode ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Download ZIP (Pro)</span>
                </>
              ) : isDemoMode ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Download ZIP</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{isZipping ? 'Generating ZIP...' : 'Download Portfolio ZIP'}</span>
                </>
              )}
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

        {/* TAB 1: LIVE INTERACTIVE PREVIEW */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            
            {/* Device Frame Toolbar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">Theme:</span>
                <div className="flex items-center gap-1">
                  {(['slate', 'light', 'cyber'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPortfolioTheme(t)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono capitalize transition-all cursor-pointer ${
                        portfolioTheme === t
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {t === 'light' ? 'Editorial Light' : t === 'slate' ? 'Slate Modern' : 'Cyber Terminal'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Device Selector */}
              <div className="p-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    deviceView === 'desktop' ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400'
                  }`}
                  title="Desktop View (Full Width)"
                >
                  <Laptop className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceView('tablet')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    deviceView === 'tablet' ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400'
                  }`}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`p-1.5 rounded-md transition-all cursor-pointer ${
                    deviceView === 'mobile' ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400'
                  }`}
                  title="Mobile View (375px)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Live Iframe View / Premium Preview Teaser */}
            <div className="flex justify-center p-4 bg-slate-100 dark:bg-[#070b14] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden transition-all">
              <div
                className={`transition-all duration-300 shadow-lg rounded-lg overflow-hidden border border-slate-300 dark:border-white/10 bg-white relative ${
                  deviceView === 'desktop'
                    ? 'w-full h-[720px]'
                    : deviceView === 'tablet'
                    ? 'w-[768px] h-[720px]'
                    : 'w-[375px] h-[720px]'
                }`}
              >
                {isPro || isDemoMode ? (
                  <iframe
                    title="Portfolio Live Preview"
                    srcDoc={`
                      <html>
                        <head>
                          <meta charset="UTF-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
                          <style>${generatedCss}</style>
                        </head>
                        <body class="theme-${portfolioTheme}">
                          ${generatedHtml.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*?<\/html>/i, '')}
                          <script>${generatedJs}</script>
                        </body>
                      </html>
                    `}
                    className="w-full h-full border-none"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex flex-col relative select-none overflow-hidden">
                    {/* Background Visual Mockup Teaser */}
                    <div className="opacity-20 filter blur-[1px] pointer-events-none p-6 space-y-6 text-slate-300 font-sans">
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="h-6 w-28 bg-blue-500/40 rounded"></div>
                        <div className="flex gap-4">
                          <div className="h-4 w-12 bg-white/20 rounded"></div>
                          <div className="h-4 w-12 bg-white/20 rounded"></div>
                          <div className="h-4 w-12 bg-white/20 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-4 max-w-xl pt-8">
                        <div className="h-5 w-44 bg-blue-400/40 rounded-full"></div>
                        <div className="h-10 w-80 bg-white/30 rounded"></div>
                        <div className="h-4 w-full bg-white/20 rounded"></div>
                        <div className="h-4 w-3/4 bg-white/20 rounded"></div>
                        <div className="flex gap-3 pt-2">
                          <div className="h-9 w-28 bg-blue-600/60 rounded"></div>
                          <div className="h-9 w-28 bg-white/10 rounded"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-8">
                        <div className="h-28 bg-white/5 rounded-lg border border-white/10 p-3 space-y-2">
                          <div className="h-4 w-20 bg-white/30 rounded"></div>
                          <div className="h-3 w-full bg-white/15 rounded"></div>
                        </div>
                        <div className="h-28 bg-white/5 rounded-lg border border-white/10 p-3 space-y-2">
                          <div className="h-4 w-20 bg-white/30 rounded"></div>
                          <div className="h-3 w-full bg-white/15 rounded"></div>
                        </div>
                        <div className="h-28 bg-white/5 rounded-lg border border-white/10 p-3 space-y-2">
                          <div className="h-4 w-20 bg-white/30 rounded"></div>
                          <div className="h-3 w-full bg-white/15 rounded"></div>
                        </div>
                      </div>
                    </div>

                    {/* Centered Professional Premium Teaser Card */}
                    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-6">
                      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-sm">
                          <Lock className="w-7 h-7" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase">
                            <Lock className="w-3 h-3" />
                            <span>PRO PORTFOLIO PREVIEW</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Personal Portfolio Preview is Available with Pro
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Upgrade to Pro to synthesize, preview, and customize your personalized single-page portfolio website grounded strictly in your verified Student Digital Twin credentials.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-left text-xs font-mono space-y-1.5 text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Bespoke Responsive Layout & Dark/Light Themes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Verified Competencies & GitHub Repositories</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>Production-Ready Source Code & ZIP Export</span>
                          </div>
                        </div>

                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setIsUpgradeModalOpen(true)}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Upgrade to Pro</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: BUILDER / CUSTOMIZATION */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Customize Portfolio Narrative</span>
                </h3>

                {!isPro && !isDemoMode && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-cyan-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 shrink-0 text-blue-600 dark:text-cyan-400" />
                      <span>Personal narrative customization is available with Pro.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-mono text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Upgrade
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 dark:text-slate-400">Target Professional Role</label>
                  <input
                    type="text"
                    value={headline}
                    readOnly={!isPro}
                    onClick={() => {
                      if (isDemoMode) {
                        openDemoLockModal();
                        return;
                      }
                      if (!isPro) {
                        setIsUpgradeModalOpen(true);
                      }
                    }}
                    onChange={(e) => {
                      if (isDemoMode) {
                        openDemoLockModal();
                        return;
                      }
                      if (!isPro) {
                        setIsUpgradeModalOpen(true);
                        return;
                      }
                      setHeadline(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Distributed Systems Engineer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 dark:text-slate-400">Biography / About Statement</label>
                  <textarea
                    value={bio}
                    readOnly={!isPro}
                    onClick={() => {
                      if (isDemoMode) {
                        openDemoLockModal();
                        return;
                      }
                      if (!isPro) {
                        setIsUpgradeModalOpen(true);
                      }
                    }}
                    onChange={(e) => {
                      if (isDemoMode) {
                        openDemoLockModal();
                        return;
                      }
                      if (!isPro) {
                        setIsUpgradeModalOpen(true);
                        return;
                      }
                      setBio(e.target.value);
                    }}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                    placeholder="Describe your background and core technical capabilities..."
                  />
                </div>

                <button
                  onClick={handleGeneratePortfolio}
                  disabled={isRunning}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {!isPro && !isDemoMode ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Regenerate Narrative with AI (Pro)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{isRunning ? 'Synthesizing...' : 'Regenerate Narrative with AI'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Student Twin Data Feeds</span>
                </h3>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Student Profile:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{studentName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Connected Repositories:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{projects.length} Verified</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ontology Skills:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{skills.length} Competencies</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Verified Achievements:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{achievements.length} Distinctions</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The AI Portfolio engine uses real data from your profile, skills, and projects. When you update your Digital Twin, the changes automatically reflect in this portfolio.
                </p>

                {onNavigateTab && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => onNavigateTab('my-profile')}
                      className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Update Foundation Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOURCE CODE & EXPORTS */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {(['html', 'css', 'js'] as const).map((file) => (
                  <button
                    key={file}
                    onClick={() => {
                      if (isDemoMode) {
                        openDemoLockModal();
                        return;
                      }
                      if (!isPro) {
                        setIsUpgradeModalOpen(true);
                        return;
                      }
                      setActiveCodeFile(file);
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase transition-all cursor-pointer ${
                      activeCodeFile === file
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {!isPro ? (
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-slate-400" />
                        {file === 'html' ? 'INDEX.HTML' : file === 'css' ? 'STYLE.CSS' : 'SCRIPT.JS'}
                      </span>
                    ) : (
                      file === 'html' ? 'index.html' : file === 'css' ? 'style.css' : 'script.js'
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-mono font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  {!isPro ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Copy Code (Pro)</span>
                    </>
                  ) : (
                    <>
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {!isPro && !isDemoMode ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Download ZIP (Pro)</span>
                    </>
                  ) : isDemoMode ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Download ZIP</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download ZIP</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pro: Render verified real source code */}
            {isPro ? (
              <div className="p-4 rounded-xl bg-[#090d16] border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto max-h-[600px] leading-relaxed">
                <pre>{currentCode}</pre>
              </div>
            ) : !isDemoMode ? (
              /* Authenticated Free User: Render PRO SOURCE CODE locked state */
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <Lock className="w-3 h-3" />
                    <span>PRO SOURCE CODE</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Source code access is available with Pro.
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Upgrade to Pro to inspect, copy, and export production-ready HTML5, modular CSS3, and JavaScript source code for your Student Digital Twin portfolio.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-600/25 inline-flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Upgrade to Pro</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Demo Mode: Render SHOWCASE SOURCE CODE LOCKED */
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <Lock className="w-3 h-3" />
                    <span>SHOWCASE SOURCE CODE LOCKED</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Showcase source code is locked for demonstration.
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Sign up or log in to generate and export your personal Student Digital Twin portfolio website.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={openDemoLockModal}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-blue-600/25 inline-flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Sign Up / Log In to Unlock</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <UpgradeProModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        featureName="AI Portfolio Builder"
        onNavigateToUpgrade={onNavigateTab ? () => onNavigateTab('upgrade') : undefined}
      />
    </EngineLayout>
  );
};
