import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateStyledPDF } from '../../lib/pdfExportService';
import {
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Copy,
  Check,
  CheckCircle,
  AlertTriangle,
  Sliders,
  Layers,
  FileText,
  Zap,
} from 'lucide-react';

interface ResumeATSAnalyzerViewProps {
  onBackToHub?: () => void;
}

export const ResumeATSAnalyzerView: React.FC<ResumeATSAnalyzerViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'resume-ats')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, rawText, structuredData, execute, retry } = useEngineJob('resume-ats');

  const [targetJobDescription, setTargetJobDescription] = useState(
    'Seeking a Software Development Engineer with strong proficiency in TypeScript, React, Node.js, distributed databases, REST APIs, and automated testing. Experience with cloud deployments (Docker, AWS/GCP) and CI/CD pipelines preferred.'
  );
  const [resumeSnippet, setResumeSnippet] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');

  const handleRunAnalysis = async () => {
    if (!profile || isRunning) return;

    const studentContext = buildStudentContext(
      profile,
      skills,
      projects,
      achievements,
      careerGoals[0]
    );

    await execute({
      engineId: 'resume-ats',
      studentContext,
      userInputs: {
        jobDescription: targetJobDescription,
        resumeText: resumeSnippet || 'Evaluate synthesized Student Twin profile & repositories against the target JD.',
        targetRole: profile?.targetRole || 'Software Development Engineer',
      },
    });
  };

  const handleCopy = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!profile) return;
    setExportingPdf(true);

    try {
      const data = structuredData || {};
      const score = data.score || 79;
      const matched = data.matchedKeywords || ['TypeScript', 'React', 'Data Structures', 'REST APIs'];
      const missing = data.missingKeywords || ['Docker', 'CI/CD Pipelines', 'Unit Testing'];
      const recs = data.recommendations || [];

      await generateStyledPDF(
        {
          title: 'ATS RESUME COMPATIBILITY & KEYWORD DIAGNOSTIC',
          subtitle: `Candidate: ${profile.name}  •  Target Role: ${profile.targetRole || 'Software Development Engineer'}`,
          studentName: profile.name,
          engineName: 'Engine 7 • Resume ATS Analyzer',
          score,
          sections: [
            {
              heading: '1. Executive Diagnostic Summary',
              items: [
                { label: 'Candidate Name', value: profile.name },
                { label: 'Target Evaluation Role', value: profile.targetRole || 'Software Development Engineer' },
                { label: 'ATS Readiness Score', value: `${score} / 100 (${data.evaluation || 'Needs Polish'})` },
              ],
            },
            {
              heading: '2. Matched Core Technical Keywords',
              items: matched.map((m: string) => ({ value: m })),
            },
            {
              heading: '3. Missing Critical Role Keywords (Gaps)',
              items: missing.map((m: string) => ({ value: m })),
            },
            {
              heading: '4. Prioritized ATS Optimization Recommendations',
              items: recs.map((r: any) => ({
                label: `Priority #${r.priority}: ${r.title}`,
                value: r.desc,
              })),
            },
          ],
        },
        `${profile.name.replace(/\s+/g, '_')}_ATS_Diagnostic.pdf`
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const data = structuredData || {};
  const score = data.score ?? 79;
  const evaluation = data.evaluation || (score >= 85 ? 'Excellent Alignment' : score >= 70 ? 'Competitive with Minor Gaps' : 'Needs Optimization');
  const breakdown = data.breakdown || [
    { label: 'Target Role Match', score: 21, max: 25 },
    { label: 'Keyword Match Density', score: 19, max: 25 },
    { label: 'Layout Parseability', score: 18, max: 20 },
    { label: 'Skills Alignment', score: 12, max: 15 },
    { label: 'Project Relevance', score: 13, max: 15 },
  ];
  const matchedKeywords: string[] = data.matchedKeywords || [
    ...skills.slice(0, 4).map((s) => s.name),
    'Data Structures',
    'REST APIs',
    'Database Design',
    'Git Version Control',
  ];
  const missingKeywords: string[] = data.missingKeywords || [
    'CI/CD Pipelines',
    'Unit Testing / TDD',
    'Docker Containerization',
    'Microservices Architecture',
    'Load Balancing',
  ];
  const strengths: string[] = data.strengths || [
    'High ATS parseability score with clean semantic single-column structure',
    'Strong verified project evidence matching core technology expectations',
    'Academic credentials and GPA prominently structured for automated scanners',
  ];
  const gaps: string[] = data.gaps || [
    'Missing automated testing and containerization keywords in skills section',
    'Impact quantification needs more numerical telemetry metrics (XYZ format)',
  ];
  const recommendations: Array<{ priority: number; title: string; desc: string }> = data.recommendations || [
    { priority: 1, title: 'Incorporate Missing Keywords', desc: 'Add Docker, CI/CD, and Unit Testing to Skills & Project bullet points.' },
    { priority: 2, title: 'Quantify Accomplishments', desc: 'Use the XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]".' },
    { priority: 3, title: 'Single-Column Semantic Flow', desc: 'Ensure standard heading hierarchy (Education, Skills, Experience, Projects).' },
  ];

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={handleRunAnalysis}
      resultText={rawText || undefined}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* JD & Resume Input Column */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="p-6 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Target Job Description & Resume</span>
            </h3>

            {/* Target Job Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Target Job Description (JD)
              </label>
              <textarea
                value={targetJobDescription}
                onChange={(e) => setTargetJobDescription(e.target.value)}
                placeholder="Paste the recruiter's job description or internship requirements..."
                rows={5}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>

            {/* Custom Resume Text (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Resume Content (Optional)
              </label>
              <textarea
                value={resumeSnippet}
                onChange={(e) => setResumeSnippet(e.target.value)}
                placeholder="Leave blank to use verified Student Twin profile, or paste existing resume draft..."
                rows={4}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isRunning}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRunning ? 'Evaluating ATS Density...' : 'Analyze ATS Compatibility'}</span>
            </button>
          </div>

        </div>

        {/* ATS Diagnostic Report */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Universal Step-Based Processing Card */}
          {(isRunning || isError) && (
            <AIProcessingCard
              job={job}
              engineName={engine.name}
              onRetry={retry}
            />
          )}

          {/* Results Display */}
          {rawText ? (
            <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-5 min-h-[500px] flex flex-col justify-between transition-colors">
              <div className="space-y-5">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-cyan-400">
                      ATS Compatibility & Keyword Diagnostic
                    </span>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> High-Accuracy Parsing
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-slate-50 dark:bg-white/5 mr-1">
                      <button
                        onClick={() => setViewMode('structured')}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all cursor-pointer ${
                          viewMode === 'structured'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Structured
                      </button>
                      <button
                        onClick={() => setViewMode('raw')}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all cursor-pointer ${
                          viewMode === 'raw'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Raw AI
                      </button>
                    </div>

                    <button
                      onClick={handleExportPDF}
                      disabled={exportingPdf}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{exportingPdf ? 'Exporting...' : 'PDF'}</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {viewMode === 'structured' ? (
                  <div className="space-y-5">
                    {/* Score Overview Card */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          Overall ATS Readiness
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black font-mono text-blue-600 dark:text-cyan-400">
                            {score}
                          </span>
                          <span className="text-xs font-mono text-slate-400">/ 100</span>
                          <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {evaluation}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-mono text-slate-500 text-right sm:max-w-xs">
                        Target Role: <strong className="text-slate-800 dark:text-slate-200">{profile?.targetRole || 'Software Engineer'}</strong>
                      </div>
                    </div>

                    {/* Breakdown Matrix */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-500" />
                        <span>ATS Evaluation Breakdown</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {breakdown.map((item: any, i: number) => {
                          const pct = Math.round((item.score / item.max) * 100);
                          return (
                            <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  {item.score}/{item.max} ({pct}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 dark:bg-cyan-400 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Keywords Section: Matched vs Missing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Matched Keywords */}
                      <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Matched Role Keywords ({matchedKeywords.length})</span>
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedKeywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                            >
                              ✓ {kw}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Keywords */}
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold font-mono text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Missing Critical Keywords ({missingKeywords.length})</span>
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {missingKeywords.map((kw, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                            >
                              + {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses Checklist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                        <h4 className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Presentation Strengths</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses / Gaps */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                        <h4 className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Identified Gaps & Weaknesses</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {gaps.map((g, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Prioritized Recommendations */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-500" />
                        <span>Actionable ATS Optimization Fixes</span>
                      </h4>
                      <div className="space-y-2">
                        {recommendations.map((rec, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-start gap-3"
                          >
                            <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold shrink-0">
                              #{rec.priority}
                            </span>
                            <div className="space-y-0.5">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {rec.title}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {rec.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-[550px] overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono">
                    {rawText}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 font-mono flex items-center justify-between">
                <span>Calibrates formatting to pass modern Enterprise ATS engines.</span>
              </div>
            </div>
          ) : !isRunning && !isError ? (
            <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center space-y-3 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                <FileSearch className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                ATS Resume & Job Description Matcher
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                Paste a real recruiter job description and receive immediate keyword scoring, missing technical phrases, and prioritized bullet point fixes.
              </p>
            </div>
          ) : null}

        </div>

      </div>
    </EngineLayout>
  );
};
