import React, { useState, useRef } from 'react';
import {
  Award,
  Upload,
  FileCheck,
  Sparkles,
  Check,
  X,
  Edit2,
  Trash2,
  ExternalLink,
  Plus,
  AlertCircle,
  Clock,
  Link as LinkIcon,
  ShieldCheck,
  Target,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { ExtractedCertificationRecord } from '../../../types';
import {
  extractCertificationsFromLinkedInPdf,
  isDuplicateCertification,
} from '../../../services/certificationExtractorService';
import { ResumeCertificationItem } from './types';

interface LinkedInCertificationsManagerProps {
  resumeCertifications: ResumeCertificationItem[];
  onAddCertification: (cert: ResumeCertificationItem) => void;
  onAddMultipleCertifications: (certs: ResumeCertificationItem[]) => void;
  onUpdateCertification: (id: string, updates: Partial<ResumeCertificationItem>) => void;
  onRemoveCertification: (id: string) => void;
  plannedCertifications: ResumeCertificationItem[];
  onAddPlannedCertification: (cert: ResumeCertificationItem) => void;
  onRemovePlannedCertification: (id: string) => void;
  includePlannedOnResume: boolean;
  onToggleIncludePlanned: (include: boolean) => void;
  isDemoMode: boolean;
}

export const LinkedInCertificationsManager: React.FC<LinkedInCertificationsManagerProps> = ({
  resumeCertifications,
  onAddCertification,
  onAddMultipleCertifications,
  onUpdateCertification,
  onRemoveCertification,
  plannedCertifications,
  onAddPlannedCertification,
  onRemovePlannedCertification,
  includePlannedOnResume,
  onToggleIncludePlanned,
  isDemoMode,
}) => {
  // Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileSizeFormatted, setFileSizeFormatted] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<string>('');

  // Results State
  const [detectedCertifications, setDetectedCertifications] = useState<ExtractedCertificationRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [supportingMessage, setSupportingMessage] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [addedSuccessToast, setAddedSuccessToast] = useState<string | null>(null);

  // Edit in Review Table State
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    issuingOrganization: string;
    issueYear: string;
    verificationUrl: string;
  }>({
    title: '',
    issuingOrganization: '',
    issueYear: '',
    verificationUrl: '',
  });

  // Manual Add Form State
  const [showManualForm, setShowManualForm] = useState<boolean>(false);
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualIssuer, setManualIssuer] = useState<string>('');
  const [manualYear, setManualYear] = useState<string>('');
  const [manualUrl, setManualUrl] = useState<string>('');
  const [manualCredId, setManualCredId] = useState<string>('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Planned Add Form State
  const [showPlannedForm, setShowPlannedForm] = useState<boolean>(false);
  const [plannedTitle, setPlannedTitle] = useState<string>('');
  const [plannedIssuer, setPlannedIssuer] = useState<string>('');
  const [plannedTargetYear, setPlannedTargetYear] = useState<string>('');
  const [plannedUrl, setPlannedUrl] = useState<string>('');
  const [plannedError, setPlannedError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDemoMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous extraction messages
    setErrorMessage(null);
    setSupportingMessage(null);
    setEmptyMessage(null);

    // Enforce PDF only
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setErrorMessage('Invalid file format. Please upload an authentic PDF (.pdf) exported from LinkedIn.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit. Please upload a standard LinkedIn profile PDF under 10MB.');
      return;
    }

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    setUploadedFile(file);
    setFileSizeFormatted(formatSize(file.size));
    setUploadSuccess(true);
  };

  // Remove uploaded PDF
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileSizeFormatted('');
    setUploadSuccess(false);
    setDetectedCertifications([]);
    setErrorMessage(null);
    setSupportingMessage(null);
    setEmptyMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger AI Extraction
  const handleExtractCertifications = async () => {
    if (isDemoMode || !uploadedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setSupportingMessage(null);
    setEmptyMessage(null);
    setAnalysisStage('Reading LinkedIn profile PDF streams & links...');

    try {
      setTimeout(() => {
        setAnalysisStage('Analyzing certifications & program records with AI...');
      }, 500);

      const result = await extractCertificationsFromLinkedInPdf(uploadedFile);

      if (result.status === 'error') {
        setErrorMessage(result.error || 'No certification records could be reliably extracted from this PDF.');
        setSupportingMessage(
          result.supportingText ||
            'Please ensure you upload an authentic LinkedIn profile PDF exported using More -> Save to PDF.'
        );
        setDetectedCertifications([]);
      } else if (result.status === 'empty') {
        setEmptyMessage(
          result.supportingText ||
            'No certifications were found in this LinkedIn PDF. (Skills and projects were preserved, but are not converted into certifications.)'
        );
        setDetectedCertifications([]);
      } else if (result.status === 'success') {
        setDetectedCertifications(result.certifications);
        setAddedSuccessToast(
          `Detected ${result.certifications.length} certification record(s) from your LinkedIn PDF. Select which ones to add below.`
        );
        setTimeout(() => setAddedSuccessToast(null), 4500);
      }
    } catch (err: any) {
      setErrorMessage('Failed to extract certifications from the uploaded PDF.');
      setSupportingMessage(err?.message || 'An unexpected error occurred during document parsing.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage('');
    }
  };

  // Toggle selection for a detected item
  const toggleSelectCert = (id: string) => {
    setDetectedCertifications((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  // Select all / deselect all
  const selectAllCerts = (selected: boolean) => {
    setDetectedCertifications((prev) => prev.map((c) => ({ ...c, selected })));
  };

  // Start editing a detected item
  const handleStartEdit = (cert: ExtractedCertificationRecord) => {
    setEditingCertId(cert.id);
    setEditForm({
      title: cert.title,
      issuingOrganization: cert.issuingOrganization || '',
      issueYear: cert.issueYear || cert.issueDate || '',
      verificationUrl: cert.verificationUrl || '',
    });
  };

  // Save edit for a detected item
  const handleSaveEdit = (id: string) => {
    if (!editForm.title.trim()) return;

    setDetectedCertifications((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            title: editForm.title.trim(),
            issuingOrganization: editForm.issuingOrganization.trim() || null,
            issueYear: editForm.issueYear.trim() || null,
            issueDate: editForm.issueYear.trim() || null,
            verificationUrl: editForm.verificationUrl.trim() || null,
          };
        }
        return c;
      })
    );
    setEditingCertId(null);
  };

  // Remove from detected list
  const handleRemoveDetected = (id: string) => {
    setDetectedCertifications((prev) => prev.filter((c) => c.id !== id));
  };

  // Add single detected item to resume
  const handleAddSingleToResume = (cert: ExtractedCertificationRecord) => {
    if (isDemoMode) return;
    if (isDuplicateCertification(cert, resumeCertifications)) return;

    const newCert: ResumeCertificationItem = {
      id: `cert-linkedin-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: cert.title,
      issuer: cert.issuingOrganization || '',
      date: cert.issueYear || cert.issueDate || '',
      issueYear: cert.issueYear || undefined,
      credentialUrl: cert.verificationUrl || undefined,
      credentialId: cert.credentialId || undefined,
      source: 'linkedin_pdf',
      sourceEvidence: cert.sourceEvidence,
      confidence: cert.confidence,
      status: 'completed',
    };

    onAddCertification(newCert);
    setAddedSuccessToast(`Added "${cert.title}" to your resume!`);
    setTimeout(() => setAddedSuccessToast(null), 3000);
  };

  // Add all selected detected items to resume
  const handleAddSelectedToResume = () => {
    if (isDemoMode) return;

    const selectedItems = detectedCertifications.filter(
      (c) => c.selected && !isDuplicateCertification(c, resumeCertifications)
    );

    if (selectedItems.length === 0) return;

    const newCerts: ResumeCertificationItem[] = selectedItems.map((cert, index) => ({
      id: `cert-linkedin-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      title: cert.title,
      issuer: cert.issuingOrganization || '',
      date: cert.issueYear || cert.issueDate || '',
      issueYear: cert.issueYear || undefined,
      credentialUrl: cert.verificationUrl || undefined,
      credentialId: cert.credentialId || undefined,
      source: 'linkedin_pdf',
      sourceEvidence: cert.sourceEvidence,
      confidence: cert.confidence,
      status: 'completed',
    }));

    onAddMultipleCertifications(newCerts);
    setAddedSuccessToast(`Added ${newCerts.length} selected certification(s) to your resume!`);
    setTimeout(() => setAddedSuccessToast(null), 3500);
  };

  // Manual Certification Submission
  const handleSaveManualCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) return;

    if (!manualTitle.trim()) {
      setManualError('Certification Name is required.');
      return;
    }

    if (isDuplicateCertification({ title: manualTitle, issuingOrganization: manualIssuer }, resumeCertifications)) {
      setManualError('This certification is already added to your resume.');
      return;
    }

    const newCert: ResumeCertificationItem = {
      id: `cert-manual-${Date.now()}`,
      title: manualTitle.trim(),
      issuer: manualIssuer.trim(),
      date: manualYear.trim(),
      issueYear: manualYear.trim() || undefined,
      credentialUrl: manualUrl.trim() || undefined,
      credentialId: manualCredId.trim() || undefined,
      source: 'manual',
      status: 'completed',
    };

    onAddCertification(newCert);
    setManualTitle('');
    setManualIssuer('');
    setManualYear('');
    setManualUrl('');
    setManualCredId('');
    setManualError(null);
    setShowManualForm(false);
    setAddedSuccessToast(`Manually added "${newCert.title}" to resume.`);
    setTimeout(() => setAddedSuccessToast(null), 3000);
  };

  // Planned Certification Submission
  const handleSavePlannedCertification = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) return;

    if (!plannedTitle.trim()) {
      setPlannedError('Certification Name is required.');
      return;
    }

    const newPlanned: ResumeCertificationItem = {
      id: `cert-planned-${Date.now()}`,
      title: plannedTitle.trim(),
      issuer: plannedIssuer.trim(),
      date: plannedTargetYear.trim(),
      issueYear: plannedTargetYear.trim() || undefined,
      credentialUrl: plannedUrl.trim() || undefined,
      source: 'planned',
      status: 'planned',
    };

    onAddPlannedCertification(newPlanned);
    setPlannedTitle('');
    setPlannedIssuer('');
    setPlannedTargetYear('');
    setPlannedUrl('');
    setPlannedError(null);
    setShowPlannedForm(false);
    setAddedSuccessToast(`Added planned certification "${newPlanned.title}".`);
    setTimeout(() => setAddedSuccessToast(null), 3000);
  };

  const selectedCount = detectedCertifications.filter(
    (c) => c.selected && !isDuplicateCertification(c, resumeCertifications)
  ).length;

  return (
    <div className="space-y-5">
      {/* 1. Extract Certifications from LinkedIn Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-slate-50 dark:from-blue-950/20 dark:via-[#0d1117] dark:to-slate-900 border border-blue-200/70 dark:border-blue-500/20 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Extract Certifications from LinkedIn PDF
                </h3>
                {isDemoMode && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                    Demo Mode (Read-Only)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Upload your LinkedIn PDF to detect certifications, programs and completion details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualForm(true)}
              disabled={isDemoMode}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Manually</span>
            </button>
          </div>
        </div>

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Demo Mode is read-only. Sign in to your account to upload your LinkedIn PDF, extract verified certifications, and save your custom resume.
            </span>
          </div>
        )}

        {/* Upload Zone & Controls */}
        {!uploadedFile ? (
          <div
            onClick={() => !isDemoMode && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              isDemoMode
                ? 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 cursor-not-allowed opacity-75'
                : 'border-blue-300 dark:border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/10 hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 cursor-pointer'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={isDemoMode}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to browse or drop your LinkedIn Profile PDF
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Supported: PDF only (max 10MB) • Export via LinkedIn: More → Save to PDF
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-blue-200 dark:border-blue-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                      {uploadedFile.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                      {fileSizeFormatted}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <Check className="w-3 h-3" />
                    LinkedIn PDF uploaded and verified. Click "Extract Certifications" to begin analysis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing || isDemoMode}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded border border-slate-200 dark:border-white/10 cursor-pointer disabled:opacity-50"
                >
                  Replace PDF
                </button>
                <button
                  onClick={handleRemoveFile}
                  disabled={isAnalyzing}
                  className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer disabled:opacity-50"
                  title="Remove PDF"
                >
                  <X className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={isDemoMode}
                  className="hidden"
                />
              </div>
            </div>

            {/* Explicit Action Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                AI extraction is strictly on-demand and does not modify your resume until you approve records.
              </span>
              <button
                onClick={handleExtractCertifications}
                disabled={isAnalyzing || isDemoMode}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract Certifications</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress status */}
            {isAnalyzing && (
              <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>{analysisStage || 'Analyzing profile text and verifying certifications...'}</span>
              </div>
            )}
          </div>
        )}

        {/* Success Toast */}
        {addedSuccessToast && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">{addedSuccessToast}</span>
            </div>
            <button
              onClick={() => setAddedSuccessToast(null)}
              className="text-emerald-600 hover:text-emerald-800 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            {supportingMessage && (
              <p className="text-[11px] text-red-600/90 dark:text-red-400/80 pl-6">
                {supportingMessage}
              </p>
            )}
          </div>
        )}

        {/* Empty Certifications Alert */}
        {emptyMessage && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{emptyMessage}</span>
            </div>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-400/80 pl-6">
              You can manually enter any certifications using the "+ Add Manually" button above.
            </p>
          </div>
        )}
      </div>

      {/* 2. Detected Certifications Review Table */}
      {detectedCertifications.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Detected Certifications ({detectedCertifications.length})</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Review, edit, and select which items should be added to your resume.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => selectAllCerts(true)}
                className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300 dark:text-white/20">•</span>
              <button
                onClick={() => selectAllCerts(false)}
                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
              >
                Deselect All
              </button>
              <button
                onClick={handleAddSelectedToResume}
                disabled={selectedCount === 0 || isDemoMode}
                className="ml-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Selected to Resume ({selectedCount})</span>
              </button>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-3">
            {detectedCertifications.map((cert) => {
              const isDuplicate = isDuplicateCertification(cert, resumeCertifications);
              const isEditing = editingCertId === cert.id;

              return (
                <div
                  key={cert.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDuplicate
                      ? 'bg-slate-50/70 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 opacity-85'
                      : cert.selected
                      ? 'bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/40 shadow-xs'
                      : 'bg-white dark:bg-[#161b22] border-slate-200 dark:border-white/10'
                  }`}
                >
                  {isEditing ? (
                    /* Inline Edit Mode */
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit Detected Certification</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Certification Name *
                          </label>
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full mt-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white focus:outline-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Issuing Organization
                          </label>
                          <input
                            type="text"
                            value={editForm.issuingOrganization}
                            onChange={(e) =>
                              setEditForm({ ...editForm, issuingOrganization: e.target.value })
                            }
                            className="w-full mt-1 px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white focus:outline-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Issue Year / Date
                          </label>
                          <input
                            type="text"
                            value={editForm.issueYear}
                            onChange={(e) => setEditForm({ ...editForm, issueYear: e.target.value })}
                            placeholder="e.g. 2025 or June 2025"
                            className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white focus:outline-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Verification URL
                          </label>
                          <input
                            type="url"
                            value={editForm.verificationUrl}
                            onChange={(e) =>
                              setEditForm({ ...editForm, verificationUrl: e.target.value })
                            }
                            placeholder="https://..."
                            className="w-full mt-1 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white focus:outline-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingCertId(null)}
                          className="px-3 py-1 rounded text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(cert.id)}
                          className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={Boolean(cert.selected && !isDuplicate)}
                          disabled={isDuplicate}
                          onChange={() => toggleSelectCert(cert.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-40"
                        />
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {cert.title}
                            </span>
                            {isDuplicate && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50">
                                Already added to resume
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            {cert.issuingOrganization ? (
                              <span>
                                <strong className="text-slate-700 dark:text-slate-300">Issuer:</strong>{' '}
                                {cert.issuingOrganization}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Issuer: Not specified</span>
                            )}

                            {cert.issueYear || cert.issueDate ? (
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{cert.issueYear || cert.issueDate}</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-white/5 text-slate-500 italic">
                                Year not found
                              </span>
                            )}

                            {cert.credentialId && (
                              <span className="font-mono text-[11px] text-slate-500">
                                ID: {cert.credentialId}
                              </span>
                            )}
                          </div>

                          {/* Verification Link Status */}
                          <div className="text-[11px]">
                            {cert.verificationUrl ? (
                              <div className="flex items-center gap-1.5 text-blue-600 dark:text-cyan-400">
                                <LinkIcon className="w-3 h-3" />
                                <span className="font-semibold">Verification Link:</span>
                                <a
                                  href={cert.verificationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-blue-800 dark:hover:text-cyan-300 inline-flex items-center gap-0.5"
                                >
                                  [Open Verification]
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400 italic">
                                Verification link not provided in LinkedIn PDF
                              </span>
                            )}
                          </div>

                          {/* Source Evidence */}
                          {cert.sourceEvidence && (
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-white/5 px-2 py-1 rounded inline-block">
                              Source: {cert.sourceEvidence.replace(/\n/g, ' • ')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Row Action Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-1">
                        <button
                          onClick={() => handleStartEdit(cert)}
                          className="px-2 py-1 rounded text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleRemoveDetected(cert.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                          title="Dismiss record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {!isDuplicate && (
                          <button
                            onClick={() => handleAddSingleToResume(cert)}
                            disabled={isDemoMode}
                            className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add to Resume</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Manual Certification Modal / Form */}
      {showManualForm && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-blue-200 dark:border-blue-500/20 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Add Certification Manually</span>
            </h4>
            <button
              onClick={() => {
                setShowManualForm(false);
                setManualError(null);
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {manualError && (
            <div className="p-2 rounded bg-red-50 dark:bg-red-950/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{manualError}</span>
            </div>
          )}

          <form onSubmit={handleSaveManualCertification} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Certification Name *
                </label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  required
                  className="w-full mt-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Issuing Organization
                </label>
                <input
                  type="text"
                  value={manualIssuer}
                  onChange={(e) => setManualIssuer(e.target.value)}
                  placeholder="e.g. Amazon Web Services"
                  className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Issue Year / Date
                </label>
                <input
                  type="text"
                  value={manualYear}
                  onChange={(e) => setManualYear(e.target.value)}
                  placeholder="e.g. 2025 or June 2025"
                  className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Verification URL (Optional)
                </label>
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://credly.com/badges/..."
                  className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Credential ID (Optional)
                </label>
                <input
                  type="text"
                  value={manualCredId}
                  onChange={(e) => setManualCredId(e.target.value)}
                  placeholder="e.g. AWS-1029481"
                  className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setShowManualForm(false);
                  setManualError(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDemoMode}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                Save to Resume
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Planned Certifications Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Planned Certifications ({plannedCertifications.length})
                </h4>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  PLANNED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Certifications you intend to pursue. These will never appear in the completed Certifications section.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPlannedForm(true)}
              disabled={isDemoMode}
              className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100/70 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Planned</span>
            </button>
          </div>
        </div>

        {/* Toggle to include on Resume */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-xs">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="toggle-planned-resume"
              checked={includePlannedOnResume}
              onChange={(e) => onToggleIncludePlanned(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="toggle-planned-resume"
              className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
            >
              Include Planned Certifications section on final resume (clearly labeled under "Planned Certifications (Target)")
            </label>
          </div>
        </div>

        {/* Planned Items List */}
        {plannedCertifications.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-1">
            No planned certifications added yet.
          </p>
        ) : (
          <div className="space-y-2">
            {plannedCertifications.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-amber-300 dark:border-amber-700/40 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 text-xs flex-1">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                    PLANNED
                  </span>
                  <strong className="text-slate-900 dark:text-white font-semibold">{p.title}</strong>
                  {p.issuer && <span className="text-slate-600 dark:text-slate-400">— {p.issuer}</span>}
                  {p.date && <span className="text-slate-500 font-mono">({p.date})</span>}
                </div>
                <button
                  onClick={() => onRemovePlannedCertification(p.id)}
                  className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                  title="Remove planned"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Planned Form Modal */}
        {showPlannedForm && (
          <div className="p-4 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-amber-200/50">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                + Add Planned Certification
              </span>
              <button
                onClick={() => {
                  setShowPlannedForm(false);
                  setPlannedError(null);
                }}
                className="text-amber-600 hover:text-amber-800 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {plannedError && (
              <div className="p-2 rounded bg-red-50 text-xs text-red-600">
                {plannedError}
              </div>
            )}

            <form onSubmit={handleSavePlannedCertification} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={plannedTitle}
                  onChange={(e) => setPlannedTitle(e.target.value)}
                  placeholder="Certification Name *"
                  required
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0d1117] border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-white focus:outline-amber-500"
                />
                <input
                  type="text"
                  value={plannedIssuer}
                  onChange={(e) => setPlannedIssuer(e.target.value)}
                  placeholder="Issuing Organization"
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0d1117] border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-white focus:outline-amber-500"
                />
                <input
                  type="text"
                  value={plannedTargetYear}
                  onChange={(e) => setPlannedTargetYear(e.target.value)}
                  placeholder="Target Year (e.g. 2026)"
                  className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-white dark:bg-[#0d1117] border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-white focus:outline-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  <Target className="w-3 h-3" />
                  <span>Status: Planned (Explicitly segregated)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlannedForm(false);
                      setPlannedError(null);
                    }}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                  >
                    Add Planned
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
