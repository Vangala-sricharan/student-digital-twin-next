import React, { useState, useEffect } from 'react';
import { X, Sparkles, FileCheck, RefreshCw, AlertCircle, Check, Tag } from 'lucide-react';
import { CertificationItem } from '../../types';
import { generateAchievementDescriptionAi } from '../../lib/aiEngineService';

interface CertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cert: Omit<CertificationItem, 'id'>, existingId?: string) => void;
  initialData?: CertificationItem | null;
  studentContext?: any;
}

export const CertificationModal: React.FC<CertificationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  studentContext,
}) => {
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('2026');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [details, setDetails] = useState('');
  const [description, setDescription] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setIssuer(initialData.issuer || '');
      setIssueDate(initialData.issueDate || '2026');
      setCredentialId(initialData.credentialId || '');
      setCredentialUrl(initialData.credentialUrl || '');
      setSkillsInput(initialData.skills ? initialData.skills.join(', ') : '');
      setDetails(initialData.details || '');
      setDescription(initialData.description || '');
    } else {
      setTitle('');
      setIssuer('');
      setIssueDate('2026');
      setCredentialId('');
      setCredentialUrl('');
      setSkillsInput('');
      setDetails('');
      setDescription('');
    }
    setAiError(null);
    setAiSuccess(false);
    setValidationError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleGenerateDescription = async () => {
    if (!title.trim()) {
      setAiError('Please enter a Certification / Program Name first.');
      return;
    }

    setAiError(null);
    setIsGenerating(true);
    setAiSuccess(false);

    try {
      const res = await generateAchievementDescriptionAi({
        title: title.trim(),
        category: 'Certification / Program',
        issuer: issuer.trim() || 'Accredited Entity',
        date: issueDate.trim() || '2026',
        details: `${details.trim()} ${skillsInput.trim() ? `Technologies: ${skillsInput.trim()}` : ''}`.trim(),
        studentContext,
      });

      if (res.success && res.description) {
        setDescription(res.description);
        setAiSuccess(true);
        setTimeout(() => setAiSuccess(false), 3000);
      } else {
        setAiError(res.error || 'Failed to generate description.');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Error generating description.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Certification / Program Name is required.');
      return;
    }
    if (!issuer.trim()) {
      setValidationError('Issuing Organization is required.');
      return;
    }

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Omit<CertificationItem, 'id'> = {
      title: title.trim(),
      issuer: issuer.trim(),
      issueDate: issueDate.trim() || '2026',
      credentialId: credentialId.trim() || undefined,
      credentialUrl: credentialUrl.trim() || undefined,
      skills: skills.length > 0 ? skills : undefined,
      details: details.trim() || undefined,
      description: description.trim() || undefined,
      verified: initialData?.verified !== undefined ? initialData.verified : true,
    };

    onSave(payload, initialData?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl my-8 overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0d1322] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {initialData ? 'Edit Certification' : 'Add Certification'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Index accredited industry and university credentials to your Student Twin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {validationError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Certification / Program Name <span className="text-rose-500">*</span></span>
              <span className="text-[10px] font-mono text-slate-400">Required</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError(null);
                if (aiError) setAiError(null);
              }}
              placeholder="e.g. AWS Certified Solutions Architect, Google Cloud Engineer"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Issuer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Issuing Organization <span className="text-rose-500">*</span></span>
                <span className="text-[10px] font-mono text-slate-400">Required</span>
              </label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => {
                  setIssuer(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g. Amazon Web Services, Forage, Coursera"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date / Timeline
              </label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="e.g. July 2026 or Nov 2025"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Credential ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Credential ID
              </label>
              <input
                type="text"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="e.g. AWS-837194 or 6a644a09"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Credential URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Credential URL
              </label>
              <input
                type="url"
                value={credentialUrl}
                onChange={(e) => setCredentialUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Skills / Technologies */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Associated Skills & Topics</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Comma separated</span>
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Python, Cloud Architecture, Generative AI, SQL"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Optional Details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Optional Key Details / Context
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Completed 40-hour hands-on capstone on containerized microservices"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description & AI Generator */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Certification Description
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : aiSuccess ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Generated!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>AI Generate Description</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <p className="text-[11px] text-rose-500 font-medium">
                {aiError}
              </p>
            )}

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the competencies mastered, evaluation scope, or industry application..."
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{initialData ? 'Update Certification' : 'Save Certification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
