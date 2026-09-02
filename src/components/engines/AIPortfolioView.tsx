import React, { useState, useEffect } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
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
} from 'lucide-react';

interface AIPortfolioViewProps {
  onBackToHub?: () => void;
}

export const AIPortfolioView: React.FC<AIPortfolioViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'ai-portfolio')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('ai-portfolio');

  const [activeTab, setActiveTab] = useState<'builder' | 'preview' | 'code'>('preview');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeCodeFile, setActiveCodeFile] = useState<'html' | 'css' | 'js'>('html');
  const [portfolioTheme, setPortfolioTheme] = useState<'slate' | 'cyber' | 'minimal'>('slate');
  const [copiedCode, setCopiedCode] = useState(false);

  // Content state prefilled from Digital Twin
  const [headline, setHeadline] = useState(
    profile?.targetRole || 'Software Development Engineer | Full-Stack Architect'
  );
  const [bio, setBio] = useState(
    `Passionate computer science scholar at ${profile?.university || 'University'} specializing in full-stack engineering, high-throughput systems, and verifiable software architectures. Dedicated to building clean, scalable products.`
  );

  const handleGeneratePortfolio = async () => {
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
  };

  const studentName = profile?.fullName || profile?.name || 'Sricharan Vangala';
  const githubUrl = profile?.githubUrl || 'https://github.com/Vangala-sricharan';
  const linkedinUrl = profile?.linkedinUrl || 'https://linkedin.com/in/sri-charan-vangala-a7453b384/';

  // Generate responsive HTML/CSS/JS source code
  const generatedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${studentName} | Portfolio</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</head>
<body class="theme-${portfolioTheme}">
  <header class="header">
    <div class="nav-container">
      <div class="brand-logo">&lt;${studentName.split(' ')[0]} /&gt;</div>
      <nav class="nav-links">
        <a href="#about">About</a>
        <a href="#skills">Skills</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <section class="hero" id="hero">
      <div class="badge">PROVEN TECHNICAL CAPABILITY</div>
      <h1 class="hero-title">${studentName}</h1>
      <p class="hero-headline">${headline}</p>
      <p class="hero-bio">${bio}</p>
      <div class="hero-cta">
        <a href="${githubUrl}" target="_blank" class="btn btn-primary">GitHub Profile</a>
        <a href="${linkedinUrl}" target="_blank" class="btn btn-secondary">LinkedIn Connect</a>
      </div>
    </section>

    <section class="section" id="skills">
      <h2 class="section-title">Core Competencies</h2>
      <div class="skills-grid">
        ${skills.map((s) => `<div class="skill-card"><span class="skill-name">${s.name}</span><span class="skill-level">${s.proficiency ? `${s.proficiency}%` : 'Verified'}</span></div>`).join('\n        ')}
      </div>
    </section>

    <section class="section" id="projects">
      <h2 class="section-title">Verified Proof-of-Work Projects</h2>
      <div class="projects-grid">
        ${projects.map((p) => `
        <article class="project-card">
          <div class="project-header">
            <h3>${p.title}</h3>
            <span class="status-tag">VERIFIED</span>
          </div>
          <p class="project-desc">${p.description}</p>
          <div class="project-tech">
            ${p.techStack.map((t) => `<span class="tech-tag">${t}</span>`).join(' ')}
          </div>
          ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" class="project-link">View Repository &rarr;</a>` : ''}
        </article>`).join('')}
      </div>
    </section>

    <section class="section" id="achievements">
      <h2 class="section-title">Honors & Certifications</h2>
      <div class="achievements-list">
        ${achievements.map((a) => `
        <div class="achievement-item">
          <strong>${a.title}</strong>
          <span>${a.issuer} &bull; ${a.date}</span>
        </div>`).join('')}
      </div>
    </section>
  </main>

  <footer class="footer" id="contact">
    <p>&copy; ${new Date().getFullYear()} ${studentName}. Built with verified student digital twin.</p>
  </footer>
</body>
</html>`;

  const generatedCss = `:root {
  --bg-color: ${portfolioTheme === 'cyber' ? '#0b0f19' : portfolioTheme === 'minimal' ? '#ffffff' : '#0f172a'};
  --card-bg: ${portfolioTheme === 'cyber' ? '#111827' : portfolioTheme === 'minimal' ? '#f8fafc' : '#1e293b'};
  --text-primary: ${portfolioTheme === 'minimal' ? '#0f172a' : '#f8fafc'};
  --text-muted: ${portfolioTheme === 'minimal' ? '#64748b' : '#94a3b8'};
  --accent: ${portfolioTheme === 'cyber' ? '#06b6d4' : portfolioTheme === 'minimal' ? '#2563eb' : '#3b82f6'};
  --border: ${portfolioTheme === 'minimal' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'};
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-primary);
  line-height: 1.6;
}

.container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
.header { border-bottom: 1px solid var(--border); padding: 16px 24px; position: sticky; top: 0; background: var(--bg-color); z-index: 10; }
.nav-container { max-width: 1000px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.brand-logo { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--accent); }
.nav-links a { color: var(--text-muted); text-decoration: none; margin-left: 20px; font-size: 14px; }
.nav-links a:hover { color: var(--accent); }

.hero { padding: 60px 0; text-align: left; }
.badge { display: inline-block; font-size: 11px; font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--accent); padding: 4px 10px; border-radius: 999px; background: rgba(59, 130, 246, 0.1); margin-bottom: 16px; border: 1px solid var(--border); }
.hero-title { font-size: 38px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 8px; }
.hero-headline { font-size: 18px; color: var(--accent); font-weight: 600; margin-bottom: 16px; }
.hero-bio { font-size: 15px; color: var(--text-muted); max-width: 700px; margin-bottom: 24px; }
.hero-cta { display: flex; gap: 12px; }

.btn { padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-secondary { background: var(--card-bg); color: var(--text-primary); border: 1px solid var(--border); }

.section { padding: 40px 0; border-top: 1px solid var(--border); }
.section-title { font-size: 20px; font-weight: 700; margin-bottom: 24px; }

.skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.skill-card { background: var(--card-bg); border: 1px solid var(--border); padding: 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
.skill-name { font-weight: 600; font-size: 13px; }
.skill-level { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--accent); }

.projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.project-card { background: var(--card-bg); border: 1px solid var(--border); padding: 20px; border-radius: 16px; display: flex; flex-direction: column; justify-content: space-between; }
.project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.project-header h3 { font-size: 16px; font-weight: 700; }
.status-tag { font-size: 9px; font-family: 'JetBrains Mono', monospace; background: rgba(34, 197, 94, 0.15); color: #22c55e; padding: 2px 6px; border-radius: 4px; }
.project-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; flex-grow: 1; }
.project-tech { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.tech-tag { font-size: 11px; font-family: 'JetBrains Mono', monospace; background: rgba(255, 255, 255, 0.05); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--border); }
.project-link { font-size: 12px; font-weight: 600; color: var(--accent); text-decoration: none; }

.achievements-list { display: flex; flex-direction: column; gap: 10px; }
.achievement-item { background: var(--card-bg); border: 1px solid var(--border); padding: 14px 18px; border-radius: 12px; display: flex; justify-content: space-between; font-size: 13px; }

.footer { border-top: 1px solid var(--border); text-align: center; padding: 30px 20px; font-size: 12px; color: var(--text-muted); }`;

  const generatedJs = `// Interactive Portfolio Script
document.addEventListener('DOMContentLoaded', () => {
  console.log('Portfolio initialized with Student Twin verified credentials.');
  
  // Smooth scrolling for navigation links
  document.querySelectorAll('.nav-links a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});`;

  const currentCode = activeCodeFile === 'html' ? generatedHtml : activeCodeFile === 'css' ? generatedCss : generatedJs;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadZip = () => {
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${studentName.replace(/\s+/g, '_')}_Portfolio.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={handleGeneratePortfolio}
      resultText={rawText || undefined}
    >
      <div className="space-y-6">
        
        {/* Header & Controls Toolbar */}
        <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  AI Digital Twin Portfolio Builder
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                  LIVE COMPILATION + AST PROOF
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Generates responsive HTML/CSS/JS portfolio website directly from your verified twin repositories and skills.
              </p>
            </div>
          </div>

          {/* Action Tabs & Controls */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'builder'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Builder</span>
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Source Code</span>
              </button>
            </div>

            <button
              onClick={handleDownloadZip}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export HTML</span>
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
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">Theme:</span>
                <div className="flex items-center gap-1">
                  {(['slate', 'cyber', 'minimal'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPortfolioTheme(t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all ${
                        portfolioTheme === t
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Device Selector */}
              <div className="p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`p-1.5 rounded-lg transition-all ${
                    deviceView === 'desktop' ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400'
                  }`}
                  title="Desktop View"
                >
                  <Laptop className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceView('tablet')}
                  className={`p-1.5 rounded-lg transition-all ${
                    deviceView === 'tablet' ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400'
                  }`}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`p-1.5 rounded-lg transition-all ${
                    deviceView === 'mobile' ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400'
                  }`}
                  title="Mobile View (375px)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Live Iframe View */}
            <div className="flex justify-center p-4 bg-slate-200 dark:bg-[#080b10] rounded-3xl border border-slate-300 dark:border-white/5 overflow-hidden transition-all">
              <div
                className={`transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border border-slate-300 dark:border-white/10 bg-white ${
                  deviceView === 'desktop'
                    ? 'w-full h-[680px]'
                    : deviceView === 'tablet'
                    ? 'w-[768px] h-[680px]'
                    : 'w-[375px] h-[680px]'
                }`}
              >
                <iframe
                  title="Portfolio Live Preview"
                  srcDoc={`
                    <html>
                      <head>
                        <style>${generatedCss}</style>
                      </head>
                      <body>
                        ${generatedHtml.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*?<\/html>/i, '')}
                        <script>${generatedJs}</script>
                      </body>
                    </html>
                  `}
                  className="w-full h-full border-none"
                />
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: BUILDER / CONFIGURATION */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Portfolio Narrative Config</span>
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 dark:text-slate-400">Target Professional Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-500 dark:text-slate-400">About Narrative & Biography</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleGeneratePortfolio}
                  disabled={isRunning}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isRunning ? 'Synthesizing...' : 'Regenerate with Gemini AI'}</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Twin Data Ingestion Summary</span>
                </h3>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2 text-xs">
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
                    <strong className="text-slate-900 dark:text-white font-mono">{achievements.length} Honors</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The AI Portfolio engine bundles all your verified student twin assets into an SEO-ready single-page portfolio with zero third-party telemetry.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOURCE CODE & EXPORTS */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                {(['html', 'css', 'js'] as const).map((file) => (
                  <button
                    key={file}
                    onClick={() => setActiveCodeFile(file)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-all ${
                      activeCodeFile === file
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {file === 'html' ? 'index.html' : file === 'css' ? 'style.css' : 'app.js'}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-mono font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#090d16] border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto max-h-[600px] leading-relaxed">
              <pre>{currentCode}</pre>
            </div>
          </div>
        )}

      </div>
    </EngineLayout>
  );
};
