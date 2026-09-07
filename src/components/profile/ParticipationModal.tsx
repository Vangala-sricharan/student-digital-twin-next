import React, { useState, useEffect } from 'react';
import { X, Sparkles, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { ParticipationItem } from '../../types';
import { generateAchievementDescriptionAi } from '../../lib/aiEngineService';

interface ParticipationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (participation: Omit<ParticipationItem, 'id'>, existingId?: string) => void;
  initialData?: ParticipationItem | null;
  studentContext?: any;
}

export const ParticipationModal: React.FC<ParticipationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  studentContext,
}) => {
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [date, setDate] = useState('2026');
  const [eventUrl, setEventUrl] = useState('');
  const [category, setCategory] = useState('Participations & Events');
  const [details, setDetails] = useState('');
  const [description, setDescription] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setOrganizer(initialData.organizer || initialData.event || '');
      setDate(initialData.date || '2026');
      setEventUrl(initialData.eventUrl || '');
      setCategory(initialData.category || 'Participations & Events');
      setDetails(initialData.details || '');
      setDescription(initialData.description || '');
    } else {
      setTitle('');
      setOrganizer('');
      setDate('2026');
      setEventUrl('');
      setCategory('Participations & Events');
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
      setAiError('Please enter an Event / Participation Name first.');
      return;
    }

    setAiError(null);
    setIsGenerating(true);
    setAiSuccess(false);

    try {
      const res = await generateAchievementDescriptionAi({
        title: title.trim(),
        category: 'Participation / Event',
        issuer: organizer.trim() || 'Event Host',
        date: date.trim() || '2026',
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
      setValidationError('Event / Participation Name is required.');
      return;
    }
    if (!organizer.trim()) {
      setValidationError('Host Organization is required.');
      return;
    }

    const payload: Omit<ParticipationItem, 'id'> = {
      title: title.trim(),
      organizer: organizer.trim(),
      event: organizer.trim(),
      date: date.trim() || '2026',
      category: category || 'Participations & Events',
      eventUrl: eventUrl.trim() || undefined,
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
            <div className="p-2 rounded-lg bg-purple-500/10 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {initialData ? 'Edit Participation' : 'Add Participation'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Log hackathons, technical symposiums, and engineering event participations.
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
              <span>Event / Participation Name <span className="text-rose-500">*</span></span>
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
              placeholder="e.g. AI Prompt Wars, Smart India Hackathon, TechFest"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Host / Organizer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Organization / Host <span className="text-rose-500">*</span></span>
                <span className="text-[10px] font-mono text-slate-400">Required</span>
              </label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => {
                  setOrganizer(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g. IEEE, IIT Bombay, ACM Student Chapter"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. March 2026 or Fall 2025"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Event URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Event URL if applicable
            </label>
            <input
              type="url"
              value={eventUrl}
              onChange={(e) => setEventUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Optional Details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Optional Key Details
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Selected among top 50 teams out of 1,200 national participants"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Description & AI Generator */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Participation Description
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-[11px] font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
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
              placeholder="Detail your engineering role, challenges solved, or project developed during the event..."
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 leading-relaxed"
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
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{initialData ? 'Update Participation' : 'Save Participation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
