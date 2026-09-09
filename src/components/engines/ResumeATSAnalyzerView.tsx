import React, { useState, useRef } from 'react';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { AIProcessingCard } from './AIProcessingCard';
import { generateStyledPDF } from '../../lib/pdfExportService';
import {
  validateResumePdfFile,
  extractResumePdfData,
  ResumeExtractedData,
} from '../../lib/resumePdfExtractor';
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
  FileText,
  Zap,
  Upload,
  RefreshCw,
  Trash2,
  FileCheck2,
} from 'lucide-react';

interface ResumeATSAnalyzerViewProps {
  onBackToHub?: () => void;
}

export const ResumeATSAnalyzerView: React.FC<ResumeATSAnalyzerViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'resume-ats')!;
  const { job, isRunning, isError, rawText, structuredData, execute, reset, retry } = useEngineJob('resume-ats');

  const [targetJobDescription, setTargetJobDescription] = useState(
    'Seeking a Software Development Engineer with strong proficiency in TypeScript, React, Node.js, distributed databases, REST APIs, and automated testing. Experience with cloud deployments (Docker, AWS/GCP) and CI/CD pipelines preferred.'
  );

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidatingFile, setIsValidatingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [analyzedFileFingerprint, setAnalyzedFileFingerprint] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');

  const getFileFingerprint = (file: File) => `${file.name}_${file.size}_${file.lastModified}`;

  const handleFileSelection = async (file: File) => {
    // Clear previous analysis immediately to prevent stale results
    reset();
    setAnalyzedFileFingerprint(null);
    setExtractionError(null);
    setFileError(null);
    setUploadedFile(file);
    setIsValidatingFile(true);

    try {
      const validation = await validateResumePdfFile(file);
      if (!validation.isValid) {
        setFileError(validation.error || 'Invalid PDF file. Please select a valid PDF resume.');
      } else {
        setFileError(null);
      }
    } catch (err: any) {
      setFileError(err?.message || 'Error validating file.');
    } finally {
      setIsValidatingFile(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
    // Reset input value so re-uploading the same file works
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileError(null);
    setExtractionError(null);
    setAnalyzedFileFingerprint(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReplaceFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRunAnalysis = async () => {
    if (!uploadedFile || isRunning || fileError || isValidatingFile) return;

    setExtractionError(null);
    const currentFingerprint = getFileFingerprint(uploadedFile);

    // 1. Extract text and structure from the uploaded PDF
    let extracted: ResumeExtractedData;
    try {
      extracted = await extractResumePdfData(uploadedFile);
    } catch (err: any) {
      setExtractionError(`Failed to process PDF: ${err?.message || 'Extraction failed'}. No fabricated result will be displayed.`);
      reset();
      return;
    }

    // 2. Validate extracted text
    if (!extracted.isValid || !extracted.extractedText || extracted.extractedText.length < 30) {
      setExtractionError(
        extracted.error ||
          'The uploaded PDF does not contain extractable resume text. Please ensure it is a text-based PDF and not a scanned image.'
      );
      reset();
      return;
    }

    // 3. Mark the active file fingerprint
    setAnalyzedFileFingerprint(currentFingerprint);

    // 4. Send ONLY the uploaded resume text and target JD to the AI engine pipeline
    await execute({
      engineId: 'resume-ats',
      studentContext: {
        name: extracted.candidateName || 'Candidate',
        targetRole: 'Target Role (from Job Description)',
        degree: '',
        branch: '',
        university: '',
        year: '',
        cgpa: '',
        readinessScore: 0,
        skills: extracted.skillsList.map((s) => ({ name: s, level: 'intermediate', category: 'Core' })),
        projects: [],
        achievements: [],
      },
      userInputs: {
        jobDescription: targetJobDescription,
        resumeText: extracted.extractedText,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type || 'application/pdf',
        isUploadedResume: true,
        extractedDetails: extracted,
      },
      documentText: extracted.extractedText,
      documentMeta: {
        fileName: uploadedFile.name,
        fileType: 'pdf',
        fileSize: uploadedFile.size,
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
    if (!structuredData && !rawText) return;
    setExportingPdf(true);

    try {
      const data = structuredData || {};
      const score = data.score ?? 0;
      const candidateName = data.candidateName || 'Candidate';
      const targetRole = data.targetRole || 'Target Role (from Job Description)';
      const matched = data.matchedKeywords || [];
      const missing = data.missingKeywords || [];
      const recs = data.recommendations || [];

      await generateStyledPDF(
        {
          title: 'ATS RESUME COMPATIBILITY & KEYWORD DIAGNOSTIC',
          subtitle: `Candidate: ${candidateName}  •  File: ${data.fileName || uploadedFile?.name || 'Uploaded Resume'}`,
          studentName: candidateName,
          engineName: 'Engine 7 • Resume ATS Analyzer',
          score,
          sections: [
            {
              heading: '1. Executive Diagnostic Summary',
              items: [
                { label: 'Candidate Name', value: candidateName },
                { label: 'Uploaded Resume', value: data.fileName || uploadedFile?.name || 'Resume.pdf' },
                { label: 'Target Evaluation Role', value: targetRole },
                { label: 'ATS Compatibility Score', value: `${score} / 100 (${data.evaluation || 'Analyzed'})` },
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
        `${candidateName.replace(/\s+/g, '_')}_ATS_Diagnostic.pdf`
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  // Ensure results only display when they belong to the current uploaded file
  const currentFileFingerprint = uploadedFile ? getFileFingerprint(uploadedFile) : null;
  const isResultStale = analyzedFileFingerprint !== null && currentFileFingerprint !== analyzedFileFingerprint;

  const data = structuredData || {};
  const score = data.score ?? 0;
  const evaluation = data.evaluation || (score >= 85 ? 'Excellent Alignment' : score >= 70 ? 'Competitive with Minor Gaps' : 'Needs Optimization');
  const breakdown: Array<{ label: string; score: number; max: number }> = data.breakdown || [];
  const matchedKeywords: string[] = data.matchedKeywords || [];
  const missingKeywords: string[] = data.missingKeywords || [];
  const strengths: string[] = data.strengths || [];
  const gaps: string[] = data.gaps || [];
  const recommendations: Array<{ priority: number; title: string; desc: string }> = data.recommendations || [];
  const candidateName = data.candidateName || 'Candidate';
  const detectedSectionsList = data.extractedSections?.detected ? data.extractedSections.detected.split(', ') : [];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={handleRunAnalysis}
      resultText={rawText && !isResultStale ? rawText : undefined}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upload Resume & JD Column */}
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
                rows={4}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>

            {/* Resume Upload Control */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold flex items-center justify-between">
                <span>Upload Resume (PDF)</span>
                <span className="text-[10px] text-slate-400 font-normal">Max 10MB</span>
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                id="resume-pdf-upload-input"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {!uploadedFile ? (
                /* Dropzone when no file is selected */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 sm:p-7 border-2 border-dashed rounded-xl text-center transition-all cursor-pointer ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                      : 'border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-blue-400'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-2.5">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    Upload your resume PDF
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-2.5">
                    Drag and drop your PDF resume here, or click to browse.
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shadow-2xs">
                    <FileText className="w-3 h-3 text-blue-500" />
                    <span>Select PDF Resume</span>
                  </div>
                </div>
              ) : (
                /* File Selected Metadata Card with Replace / Remove */
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[220px]" title={uploadedFile.name}>
                          {uploadedFile.name}
                        </span>
                        {!fileError && !isValidatingFile && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                            <FileCheck2 className="w-3 h-3" />
                            <span>Valid PDF</span>
                          </span>
                        )}
                        {isValidatingFile && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold">
                            Validating...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                        <span>Type: {uploadedFile.type || 'application/pdf'}</span>
                        <span>•</span>
                        <span>Size: {formatSize(uploadedFile.size)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Replace / Remove */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
                    <button
                      type="button"
                      onClick={handleReplaceFile}
                      disabled={isRunning}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 hover:border-blue-300 dark:hover:border-blue-700/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Replace</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={isRunning}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Validation or Extraction Error Notice */}
              {(fileError || extractionError) && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold font-mono">Error: </span>
                    <span>{fileError || extractionError}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Explicit Analyze Resume Button */}
            <button
              id="btn-analyze-resume-action"
              onClick={handleRunAnalysis}
              disabled={isRunning || !uploadedFile || isValidatingFile || !!fileError}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRunning ? 'Analyzing Resume ATS Compatibility...' : 'Analyze Resume'}</span>
            </button>
          </div>

        </div>

        {/* ATS Diagnostic Report Column */}
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
          {rawText && !isResultStale && !isRunning ? (
            <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-5 min-h-[500px] flex flex-col justify-between transition-colors">
              <div className="space-y-5">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4 gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-blue-600 dark:text-cyan-400">
                      ATS Compatibility & Keyword Diagnostic
                    </span>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> High-Accuracy Parsing • {uploadedFile?.name || data.fileName || 'Uploaded Resume'}
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

                      <div className="text-xs font-mono text-slate-500 text-right sm:max-w-xs space-y-0.5">
                        <div>Candidate: <strong className="text-slate-800 dark:text-slate-200">{candidateName}</strong></div>
                        <div className="text-[11px] text-slate-400">File: {uploadedFile?.name || data.fileName || 'Resume.pdf'}</div>
                      </div>
                    </div>

                    {/* Detected Sections Badge Row */}
                    {detectedSectionsList.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                          Extracted Resume Sections Detected:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {detectedSectionsList.map((sec, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40"
                            >
                              ✓ {sec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Breakdown Matrix */}
                    {breakdown.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-blue-500" />
                          <span>ATS Evaluation Breakdown</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {breakdown.map((item, i) => {
                            const pct = item.max > 0 ? Math.round((item.score / item.max) * 100) : 0;
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
                    )}

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
                          {matchedKeywords.length > 0 ? (
                            matchedKeywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                              >
                                ✓ {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">No target keywords matched yet.</span>
                          )}
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
                          {missingKeywords.length > 0 ? (
                            missingKeywords.map((kw, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                              >
                                + {kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">No critical keyword deficits identified.</span>
                          )}
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
                    {recommendations.length > 0 && (
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
                    )}
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap max-h-[550px] overflow-y-auto p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono">
                    {rawText}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 font-mono flex items-center justify-between">
                <span>Calibrates formatting and keyword density to pass enterprise ATS scanners.</span>
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
                Upload your resume PDF and click <strong className="text-slate-700 dark:text-slate-300">"Analyze Resume"</strong> to extract real contact, skill, project, and keyword data against the target job description.
              </p>
            </div>
          ) : null}

        </div>

      </div>
    </EngineLayout>
  );
};
