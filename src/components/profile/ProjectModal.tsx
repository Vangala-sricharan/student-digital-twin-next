import React, { useState, useEffect } from 'react';
import { X, Sparkles, FolderGit2, Github, ExternalLink, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { ProjectItem } from '../../types';
import { generateProjectDescriptionAi } from '../../lib/aiEngineService';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<ProjectItem, 'id'>, existingId?: string) => void;
  initialData?: ProjectItem | null;
  studentContext?: any;
}

const CATEGORY_OPTIONS = [
  'Full Stack Development',
  'AI & Machine Learning',
  'Distributed Systems & Cloud',
  'Mobile Application',
  'Systems & Infrastructure',
  'Data Engineering & Analytics',
  'Open Source Tool',
  'Cybersecurity & Networking',
];

const ROLE_OPTIONS = [
  'Solo Creator / Architect',
  'Lead Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Developer',
  'AI / ML Engineer',
  'Contributor',
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  studentContext,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [techStack, setTechStack] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [keyDetails, setKeyDetails] = useState('');
  const [description, setDescription] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setCategory(
        CATEGORY_OPTIONS.includes((initialData as any).category || '')
          ? (initialData as any).category
          : CATEGORY_OPTIONS[0]
      );
      setRole(initialData.role || ROLE_OPTIONS[0]);
      setTechStack(Array.isArray(initialData.techStack) ? initialData.techStack.join(', ') : '');
      setGithubUrl(initialData.githubUrl || '');
      setLiveUrl(initialData.liveUrl || '');
      setKeyDetails((initialData as any).keyDetails || '');
      setDescription(initialData.description || '');
    } else {
      setTitle('');
      setCategory(CATEGORY_OPTIONS[0]);
      setRole(ROLE_OPTIONS[0]);
      setTechStack('');
      setGithubUrl('');
      setLiveUrl('');
      setKeyDetails('');
      setDescription('');
    }
    setAiError(null);
    setAiSuccess(false);
    setValidationError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleGenerateDescription = async () => {
    if (!title.trim()) {
      setAiError('Please enter a Project Name first.');
      return;
    }

    setAiError(null);
    setIsGenerating(true);
    setAiSuccess(false);

    try {
      const res = await generateProjectDescriptionAi({
        projectName: title.trim(),
        techStack: techStack.trim(),
        category,
        role,
        keyDetails: keyDetails.trim(),
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
      setValidationError('Project Name is required.');
      return;
    }
    if (!description.trim()) {
      setValidationError('Please provide or generate a project description.');
      return;
    }

    const techArray = techStack
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const projectPayload: any = {
      title: title.trim(),
      role: role.trim(),
      category,
      techStack: techArray.length > 0 ? techArray : ['Full Stack'],
      description: description.trim(),
      githubUrl: githubUrl.trim() || undefined,
      liveUrl: liveUrl.trim() || undefined,
      keyDetails: keyDetails.trim() || undefined,
      status: initialData?.status || 'Completed',
      proofHealthScore: initialData?.proofHealthScore || 88,
      entropyScore: initialData?.entropyScore || 85,
      featured: initialData?.featured !== undefined ? initialData.featured : true,
    };

    onSave(projectPayload, initialData?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl my-8 overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0d1322] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/10 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {initialData ? 'Edit Proof-of-Work Project' : 'Add New Proof-of-Work Project'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Artifact logged to your Student Digital Twin foundational graph.
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

          {/* Project Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Project Name <span className="text-rose-500">*</span></span>
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
                placeholder="e.g. Distributed Consensus Engine or Student Digital Twin"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category / Domain
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
                Your Role / Contribution
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Technologies */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Technologies & Skills Used</span>
              <span className="text-[10px] font-mono text-slate-400">Comma separated</span>
            </label>
            <input
              type="text"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="e.g. React, TypeScript, Node.js, Docker, PostgreSQL, Tailwind CSS"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Links: GitHub & Live Demo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-400" />
                <span>GitHub Repository URL</span>
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/project"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Live Demo / Production URL</span>
              </label>
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://my-app.vercel.app"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Optional Key Details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Key Architecture Notes / Optional Details</span>
              <span className="text-[10px] font-mono text-slate-400">Helps AI synthesize description</span>
            </label>
            <input
              type="text"
              value={keyDetails}
              onChange={(e) => setKeyDetails(e.target.value)}
              placeholder="e.g. Microservices architecture, sub-50ms latency, handles concurrency via worker threads"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description Section with AI Generation Button */}
          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Project Description <span className="text-rose-500">*</span>
              </label>

              {/* AI GENERATE DESCRIPTION BUTTON (Explicit user trigger ONLY) */}
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                title="Generate crisp description using Gemini based strictly on provided inputs"
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
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Crisp 2-3 sentence description covering project purpose, architectural strengths, and core technical impact. You can click 'AI Generate Description' above to draft this automatically."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
              required
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              AI generation is grounded strictly on your inputs above without inventing unverified facts. You have complete control to edit the text before saving.
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
              <span>{initialData ? 'Update Project' : 'Save Project'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
