import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { buildStudentContext } from '../../lib/aiEngineService';
import { AIProcessingCard } from './AIProcessingCard';
import { generateStyledPDF } from '../../lib/pdfExportService';
import { FileSearch, CheckCircle2, Sliders, AlertCircle, Sparkles, Download, Copy, Check } from 'lucide-react';

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
          
          <div className="p-6 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4 transition-colors">
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
            <div className="p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl space-y-5 min-h-[500px] flex flex-col justify-between transition-colors">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-cyan-400">
                      ATS Keyword Density & Gap Breakdown
                    </span>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> High-Accuracy Parsing
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportPDF}
                      disabled={exportingPdf}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{exportingPdf ? 'Exporting...' : 'Download PDF'}</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-[550px] overflow-y-auto">
                  {rawText}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 font-mono flex items-center justify-between">
                <span>Calibrates formatting to pass modern Enterprise ATS engines.</span>
              </div>
            </div>
          ) : !isRunning && !isError ? (
            <div className="p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl min-h-[500px] flex flex-col items-center justify-center text-center space-y-3 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
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
