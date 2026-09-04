import React, { useState, useEffect } from 'react';
import { X, Sparkles, Award, ExternalLink, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { AchievementItem } from '../../types';
import { generateAchievementDescriptionAi } from '../../lib/aiEngineService';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (achievement: Omit<AchievementItem, 'id'>, existingId?: string) => void;
  initialData?: AchievementItem | null;
  studentContext?: any;
}

const CATEGORY_OPTIONS = [
  'Hackathon & Competitions',
  'Academic Distinction & GPA',
  'Industry Certification',
  'Research & Publication',
  'Fellowship & Grant',
  'Open Source & Community Leadership',
  'Standardized Examination',
];

export const AchievementModal: React.FC<AchievementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  studentContext,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [issuer, setIssuer] = useState('');
  const [date, setDate] = useState('2026');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [details, setDetails] = useState('');
  const [description, setDescription] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setCategory(
        CATEGORY_OPTIONS.includes(initialData.category || '')
          ? initialData.category
          : CATEGORY_OPTIONS[0]
      );
      setIssuer(initialData.issuer || '');
      setDate(initialData.date || '2026');
      setCredentialUrl(initialData.credentialUrl || '');
      setDetails((initialData as any).details || '');
      setDescription(initialData.description || '');
    } else {
      setTitle('');
      setCategory(CATEGORY_OPTIONS[0]);
      setIssuer('');
      setDate('2026');
      setCredentialUrl('');
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
      setAiError('Please enter an Achievement Title first.');
      return;
    }

    setAiError(null);
    setIsGenerating(true);
    setAiSuccess(false);

    try {
      const res = await generateAchievementDescriptionAi({
        title: title.trim(),
        category,
        issuer: issuer.trim(),
        date: date.trim(),
        details: details.trim(),
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
      setValidationError('Achievement Title is required.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Please provide or generate an achievement description.');
      return;
    }

    const payload: any = {
      title: title.trim(),
      category,
      issuer: issuer.trim() || 'Academic / Industry Entity',
      date: date.trim() || '2026',
      credentialUrl: credentialUrl.trim() || undefined,
      details: details.trim() || undefined,
      description: description.trim(),
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
            <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {initialData ? 'Edit Milestone & Distinction' : 'Add Milestone & Distinction'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Log verified accolades and certifications to your Student Digital Twin.
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

          {/* Title & Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Achievement / Distinction Title <span className="text-rose-500">*</span></span>
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
              placeholder="e.g. Smart India Hackathon Finalist or AWS Solutions Architect Associate"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Organization / Issuer
              </label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g. Ministry of Education, AWS, IEEE"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date & Proof Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Date / Timeline
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. March 2026 or 2026"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Verification / Credential URL</span>
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

          {/* Optional Details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Optional Details</span>
              <span className="text-[10px] font-mono text-slate-400">Context for AI</span>
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Selected among top 15 teams nationwide in AI healthcare track"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description Section with AI Button */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Achievement Description <span className="text-rose-500">*</span>
              </label>

              {/* AI GENERATE DESCRIPTION BUTTON (Explicit user trigger ONLY) */}
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                title="Generate concise description using Gemini based strictly on provided inputs"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Description...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                    <span>AI Generate Description</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {aiSuccess && (
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Description generated! You can review and modify it before saving.</span>
              </div>
            )}

            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Crisp 1-2 sentence description highlighting the achievement's distinction and relevance. Click 'AI Generate Description' above to draft this automatically."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
              required
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              AI uses ONLY your provided inputs. No fabricated honors, organizations, or statistics.
            </p>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{initialData ? 'Update Milestone' : 'Save Milestone'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
