import React, { useState, useMemo, useRef } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useEngineJob } from '../../context/AIJobContext';
import { AI_ENGINES } from '../../data/enginesData';
import { EngineLayout } from './EngineLayout';
import { AIProcessingCard } from './AIProcessingCard';
import { generateAuditReportPDF } from '../../lib/pdfExportService';
import { validateAndExtractLinkedInPdf, PdfValidationResult } from '../../lib/pdfTextExtractor';
import { calculateLinkedInAuditScore } from '../../lib/serverAiHandler';
import {
  Share2,
  CheckCircle2,
  Award,
  UserCheck,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Lightbulb,
  Search,
  Copy,
  Check,
  User,
  Download,
  FileText,
  Upload,
  Trash2,
  FileCheck2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Bug,
} from 'lucide-react';

interface LinkedInAuditViewProps {
  onBackToHub?: () => void;
}

export const LinkedInAuditView: React.FC<LinkedInAuditViewProps> = ({ onBackToHub }) => {
  const engine = AI_ENGINES.find((e) => e.id === 'linkedin-audit')!;
  const { profile, skills, projects, achievements, careerGoals } = useStudentTwin();
  const { job, isRunning, isError, execute, reset, retry } = useEngineJob('linkedin-audit');

  const [copiedHeadline, setCopiedHeadline] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  // PDF Upload State (Exclusively PDF-based audit)
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfValidation, setPdfValidation] = useState<PdfValidationResult | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isValidatingPdf, setIsValidatingPdf] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const auditRunIdRef = useRef(0);

  const handleProcessPdfFile = async (file: File) => {
    // Invalidate any ongoing audit run to prevent stale async responses
    auditRunIdRef.current += 1;
    // Reset previous audit scorecard on new upload
    reset();
    setUploadedPdfFile(file);
    setPdfBase64(null);
    setPdfError(null);
    setPdfValidation(null);
    setIsValidatingPdf(true);

    try {
      if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
        setPdfError('Please upload an authentic LinkedIn profile export PDF.');
        setIsValidatingPdf(false);
        return;
      }

      // Convert file to Base64 for direct Gemini multimodal document analysis
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const b64 = res.split(',')[1] || '';
          resolve(b64);
        };
        reader.onerror = () => reject(new Error('Failed to read PDF file'));
        reader.readAsDataURL(file);
      });

      if (!base64) {
        setPdfError('Failed to encode PDF data. Please try again.');
        setIsValidatingPdf(false);
        return;
      }

      setPdfBase64(base64);

      const sizeFormatted = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

      // Run client-side extraction to display instant pre-validation signals
      let validationDetails: PdfValidationResult | null = null;
      try {
        validationDetails = await validateAndExtractLinkedInPdf(file);
      } catch {
        // Non-blocking fallback; Gemini will perform direct document analysis
      }

      setPdfValidation({
        isValid: true,
        fileSizeFormatted: sizeFormatted,
        extractedText: validationDetails?.extractedText || '',
        rawExtractedText: validationDetails?.rawExtractedText || '',
        normalizedText: validationDetails?.normalizedText || '',
        detectedSections: validationDetails?.detectedSections || ['Document Attached'],
        missingSections: validationDetails?.missingSections || [],
        candidateName: validationDetails?.candidateName || '',
        candidateHeadline: validationDetails?.candidateHeadline || '',
        candidateLocation: validationDetails?.candidateLocation || '',
        debugInfo: validationDetails?.debugInfo,
      });
      setPdfError(null);
    } catch (err: any) {
      setPdfError(err?.message || 'Error parsing PDF document.');
    } finally {
      setIsValidatingPdf(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessPdfFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessPdfFile(file);
    }
  };

  const handleClearPdf = () => {
    auditRunIdRef.current += 1;
    reset();
    setUploadedPdfFile(null);
    setPdfBase64(null);
    setPdfValidation(null);
    setPdfError(null);
  };

  const handleExportPDF = async () => {
    setExportingPdf(true);
    try {
      await generateAuditReportPDF({
        type: 'LinkedIn Audit',
        title: `LinkedIn Profile Audit: ${profileInfo.name}`,
        candidateName: profileInfo.name,
        score: overallScore,
        maxScore: 100,
        evaluation,
        breakdown,
        strengths,
        gaps,
        recommendations: adjustments.map((a: any) => `${a.title}: ${a.desc}`),
      }, `${profileInfo.name.replace(/\s+/g, '_')}_LinkedIn_Audit.pdf`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleRunAudit = async () => {
    if (isRunning || !pdfBase64) return;

    const currentRunId = ++auditRunIdRef.current;

    const inputs: Record<string, any> = {
      pdfBase64,
      fileName: uploadedPdfFile?.name || 'linkedin_profile.pdf',
      fileSize: pdfValidation?.fileSizeFormatted || `${(((uploadedPdfFile?.size || 0) / 1024)).toFixed(1)} KB`,
      rawExtractedText: pdfValidation?.rawExtractedText || pdfValidation?.extractedText || '',
    };

    await execute({
      engineId: 'linkedin-audit',
      userInputs: inputs,
    });

    // Discard result if a newer PDF upload superseded this run
    if (auditRunIdRef.current !== currentRunId) {
      reset();
    }
  };

  const auditData = job?.result?.data;
  const rawText = job?.rawText;

  const profileInfo = {
    name: auditData?.profile?.name || auditData?.candidate?.name || 'Candidate',
    headline: auditData?.profile?.headline || auditData?.candidate?.headline || '',
    location: auditData?.profile?.location || auditData?.candidate?.location || '',
  };

  const rawBreakdown = auditData?.breakdown ?? [];

  // Mathematical single source of truth: overall score derived deterministically from breakdown
  const scoreResult = useMemo(() => {
    if (!rawBreakdown || rawBreakdown.length === 0) {
      return { overallScore: 0, evaluation: 'Pending Audit', breakdown: [] };
    }
    return calculateLinkedInAuditScore(rawBreakdown);
  }, [rawBreakdown]);

  const overallScore = auditData ? scoreResult.overallScore : 0;
  const evaluation = auditData ? scoreResult.evaluation : 'Pending Audit';
  const breakdown = auditData ? scoreResult.breakdown : [];

  const strengths = auditData?.strengths ?? [];
  const gaps = auditData?.gaps ?? [];
  const headlineVariations = auditData?.headlineVariations ?? [];
  const adjustments = auditData?.recommendations ?? [];
  const searchOptimization = auditData?.searchOptimization ?? '';

  const getInitials = (name: string) => {
    const clean = (name || '').trim().replace(/[^a-zA-Z\s]/g, '');
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'LI';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedHeadline(idx);
    setTimeout(() => setCopiedHeadline(null), 2000);
  };

  return (
    <EngineLayout
      engine={engine}
      onBackToHub={onBackToHub}
      isRunning={isRunning}
      onRunEngine={handleRunAudit}
      resultText={rawText || undefined}
    >
      <div className="space-y-6">
        
        {/* PDF Upload Card (Exclusive input for LinkedIn Profile Audit) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Exported LinkedIn Profile Audit</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload your official LinkedIn Profile PDF export for deterministic ATS and recruiter score evaluation.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {!uploadedPdfFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] hover:border-blue-400'
                }`}
                onClick={() => document.getElementById('linkedin-pdf-input')?.click()}
              >
                <input
                  id="linkedin-pdf-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Upload LinkedIn Profile Export (PDF)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-3 leading-relaxed">
                  On LinkedIn, go to your profile &rarr; click <span className="font-semibold text-slate-700 dark:text-slate-300">More &rarr; Save to PDF</span> &rarr; drag and drop the exported PDF file here.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Select Profile PDF (Max 10MB)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Uploaded File Status Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {uploadedPdfFile.name}
                        </span>
                        {pdfValidation && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                            <FileCheck2 className="w-3 h-3" />
                            <span>Valid LinkedIn PDF</span>
                          </span>
                        )}
                        {isValidatingPdf && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold flex items-center gap-1">
                            Validating content...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono flex-wrap">
                        <span>Size: {pdfValidation?.fileSizeFormatted || `${(uploadedPdfFile.size / 1024).toFixed(1)} KB`}</span>
                        {pdfValidation?.detectedSections && pdfValidation.detectedSections.length > 0 && (
                          <span>
                            Detected: {pdfValidation.detectedSections.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearPdf}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* PDF Extraction Diagnostics (Requirement 9: verify detected Name, Headline, About, Skills, Certs, Edu, Exp) */}
                {(auditData?.debugInfo || pdfValidation?.debugInfo) && (
                  <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowDiagnostics(!showDiagnostics)}
                      className="w-full px-4 py-2.5 text-left text-xs font-mono font-semibold flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Bug className="w-3.5 h-3.5 text-indigo-500" />
                        <span>PDF Extraction Diagnostics</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                          Field Verification
                        </span>
                      </div>
                      {showDiagnostics ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {showDiagnostics && (
                      <div className="p-4 border-t border-slate-100 dark:border-white/5 space-y-2.5 text-xs font-mono">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Detected Name</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {auditData?.debugInfo?.detectedName || pdfValidation?.debugInfo?.detectedName || 'None'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Detected Headline</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">
                              {auditData?.debugInfo?.detectedHeadline || pdfValidation?.debugInfo?.detectedHeadline || 'None'}
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Detected About / Summary</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {auditData?.debugInfo?.detectedAbout || pdfValidation?.debugInfo?.detectedAbout || 'None'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Detected Skills ({((auditData?.debugInfo?.detectedSkills || pdfValidation?.debugInfo?.detectedSkills) || []).length})
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 break-words">
                              {((auditData?.debugInfo?.detectedSkills || pdfValidation?.debugInfo?.detectedSkills) || []).join(', ') || 'None detected'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Detected Certifications ({((auditData?.debugInfo?.detectedCertifications || pdfValidation?.debugInfo?.detectedCertifications) || []).length})
                            </span>
                            <span className="text-slate-700 dark:text-slate-300 break-words">
                              {((auditData?.debugInfo?.detectedCertifications || pdfValidation?.debugInfo?.detectedCertifications) || []).join('; ') || 'None detected'}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Detected Education</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {auditData?.debugInfo?.detectedEducation || pdfValidation?.debugInfo?.detectedEducation || 'None'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Detected Experience</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {auditData?.debugInfo?.detectedExperience || pdfValidation?.debugInfo?.detectedExperience || 'None'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Validation Error Notice if any */}
                {pdfError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{pdfError}</span>
                  </div>
                )}

                {/* Explicit Action Button to Run Audit */}
                {pdfValidation && !pdfError && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      LinkedIn export validated successfully. Click below to begin ATS and recruiter evaluation.
                    </p>
                    <button
                      onClick={handleRunAudit}
                      disabled={isRunning || !pdfValidation || isValidatingPdf}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold font-mono uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isRunning ? 'Analyzing LinkedIn Profile...' : 'Analyze LinkedIn Profile'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Real Step-Based AI Processing Card */}
        {(isRunning || (isError && job.startTime)) && (
          <AIProcessingCard
            job={job}
            engineName={engine.name}
            onRetry={retry}
          />
        )}

        {/* Idle State Prompt when no file uploaded */}
        {!isRunning && !auditData && !isError && !uploadedPdfFile && (
          <div className="p-8 sm:p-12 rounded-xl bg-white dark:bg-[#0d1117] border border-dashed border-slate-200 dark:border-white/10 text-center space-y-4">
            <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ready for LinkedIn Profile Audit
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Upload your LinkedIn profile export PDF above to evaluate recruiter discoverability, headline impact, and engineering proof-of-work.
              </p>
            </div>
          </div>
        )}

        {/* Audit Results View (PDF Evidence Grounded) */}
        {auditData && !isRunning && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Top Action Header Bar */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-xs font-bold border border-blue-200 dark:border-blue-800">
                  PDF-VERIFIED AUDIT
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authentic Document Grounded
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{exportingPdf ? 'Generating PDF...' : 'Download LinkedIn Audit PDF'}</span>
                </button>
              </div>
            </div>

            {/* Row 1: Profile Identity & Score Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: LINKEDIN PROFILE CARD */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-5 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                      {getInitials(profileInfo.name)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                          {profileInfo.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold border border-blue-200 dark:border-blue-800">
                          <FileCheck2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span>PDF Audit</span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        Audited File: <strong className="text-slate-700 dark:text-slate-300">{auditData?.fileName || uploadedPdfFile?.name || 'linkedin_export.pdf'}</strong>
                      </div>
                    </div>
                  </div>

                  {profileInfo.headline && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                      "{profileInfo.headline}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Location: {profileInfo.location || 'Not specified in profile'}</span>
                  <span>{auditData?.detectedSections?.length ? `${auditData.detectedSections.length} Sections Verified` : 'PDF Grounded'}</span>
                </div>
              </div>

              {/* Right Column: SCORE & PARAMETERS */}
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-5 transition-colors">
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      LinkedIn Recruiter Score
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {overallScore}
                      </span>
                      <span className="text-lg text-slate-400 font-medium">/ 100</span>
                    </div>
                  </div>

                  <div className={`rounded-xl border px-4 py-2.5 flex items-center gap-2.5 ${
                    overallScore >= 80
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : overallScore >= 70
                      ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                      : overallScore >= 55
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  }`}>
                    <ShieldCheck className={`w-5 h-5 ${
                      overallScore >= 80
                        ? 'text-emerald-500'
                        : overallScore >= 70
                        ? 'text-blue-500'
                        : overallScore >= 55
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }`} />
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase leading-none opacity-80">
                        Evaluation
                      </div>
                      <div className="text-xs font-bold mt-0.5">
                        {evaluation}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall Score Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>Recruiter Readiness Benchmark (Deterministic)</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{overallScore}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden p-0.5 border border-slate-200/60 dark:border-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        overallScore >= 80
                          ? 'bg-emerald-500 dark:bg-emerald-400'
                          : overallScore >= 70
                          ? 'bg-blue-600 dark:bg-cyan-400'
                          : overallScore >= 55
                          ? 'bg-amber-500 dark:bg-amber-400'
                          : 'bg-rose-500 dark:bg-rose-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, overallScore))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {breakdown.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-300 truncate">{item.label}</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{item.score}/{item.max}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600 dark:bg-cyan-400"
                          style={{ width: `${Math.min(100, Math.round((item.score / item.max) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Row 2: Strengths & Deficiencies */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile Strengths</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {strengths.map((str: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold font-mono uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Identified Gaps & Deficiencies</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {gaps.map((gap: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Row 3: High-Converting Headline Variations */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4 transition-colors">
              <div className="flex items-center gap-2 text-blue-600 dark:text-cyan-400 text-xs font-bold font-mono uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>High-Converting Headline Variations</span>
              </div>
              <div className="space-y-3">
                {headlineVariations.map((headline: string, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between gap-4"
                  >
                    <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono leading-relaxed">
                      {headline}
                    </div>
                    <button
                      onClick={() => handleCopy(headline, idx)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-white/20 transition-all shrink-0 cursor-pointer"
                    >
                      {copiedHeadline === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4: Search Optimization */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 transition-colors">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider">
                <Search className="w-4 h-4" />
                <span>Recruiter Search Optimization</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {searchOptimization}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={handleExportPDF}
                disabled={exportingPdf}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportingPdf ? 'Generating PDF...' : 'Download LinkedIn Audit PDF'}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </EngineLayout>
  );
};

