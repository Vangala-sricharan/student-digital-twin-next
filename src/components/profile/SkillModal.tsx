import React, { useState, useEffect } from 'react';
import { X, Code2, Check, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { SkillItem } from '../../types';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (skill: Omit<SkillItem, 'id' | 'lastAssessed'>, existingId?: string) => void;
  initialData?: SkillItem | null;
}

const SKILL_CATEGORIES = [
  'Languages & Frameworks',
  'Data Structures & Algorithms',
  'AI/ML & Deep Learning',
  'Distributed Systems & Cloud',
  'Frontend Architecture',
  'Backend Engineering',
  'DevOps, CI/CD & Tooling',
  'Database & Data Systems',
];

export const SkillModal: React.FC<SkillModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(SKILL_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [proficiency, setProficiency] = useState<number>(75);
  const [verified, setVerified] = useState(true);
  const [proofCount, setProofCount] = useState<number>(1);
  const [marketAlignmentScore, setMarketAlignmentScore] = useState<number>(85);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      if (SKILL_CATEGORIES.includes(initialData.category)) {
        setCategory(initialData.category);
        setCustomCategory('');
      } else {
        setCategory('Custom');
        setCustomCategory(initialData.category || '');
      }
      setProficiency(initialData.proficiency || 75);
      setVerified(initialData.verified !== undefined ? Boolean(initialData.verified) : true);
      setProofCount(initialData.proofCount || 1);
      setMarketAlignmentScore(initialData.marketAlignmentScore || 85);
    } else {
      setName('');
      setCategory(SKILL_CATEGORIES[0]);
      setCustomCategory('');
      setProficiency(75);
      setVerified(true);
      setProofCount(1);
      setMarketAlignmentScore(85);
    }
    setValidationError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const getProficiencyLabel = (val: number) => {
    if (val < 40) return { label: 'Beginner', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50' };
    if (val < 70) return { label: 'Intermediate', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50' };
    if (val < 90) return { label: 'Advanced', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50' };
    return { label: 'Expert / Master', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50' };
  };

  const currentProf = getProficiencyLabel(proficiency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationError('Skill name is required.');
      return;
    }

    const finalCategory = category === 'Custom' 
      ? (customCategory.trim() || 'Technical Skills')
      : category;

    const payload: Omit<SkillItem, 'id' | 'lastAssessed'> = {
      name: name.trim(),
      category: finalCategory,
      proficiency: Number(proficiency),
      verified: Boolean(verified),
      proofCount: Math.max(0, Number(proofCount) || 0),
      marketAlignmentScore: Math.min(100, Math.max(0, Number(marketAlignmentScore) || 75)),
    };

    onSave(payload, initialData?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl my-8 overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0d1322] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {initialData ? 'Edit Skill' : 'Add Skill'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Index technical competencies to your Student Twin's verified skills graph.
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

          {/* Skill Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Skill Name <span className="text-rose-500">*</span></span>
              <span className="text-[10px] font-mono text-slate-400">Required</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="e.g. TypeScript, PyTorch, GraphQL, Docker, Dynamic Programming"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="Custom">Custom Category...</option>
            </select>

            {category === 'Custom' && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name..."
                className="w-full mt-2 px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Proficiency Slider */}
          <div className="space-y-2 pt-1 bg-slate-50 dark:bg-[#050811] p-3.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Proficiency / Self-Rating
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentProf.color}`}>
                  {currentProf.label}
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {proficiency}%
                </span>
              </div>
            </div>

            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={proficiency}
              onChange={(e) => setProficiency(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Novice (10%)</span>
              <span>Competent (50%)</span>
              <span>Advanced (75%)</span>
              <span>Mastery (100%)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Proof / Projects Count */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Proof / Projects Built
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={proofCount}
                onChange={(e) => setProofCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Market Alignment Score */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Market Demand Index
              </label>
              <input
                type="number"
                min={10}
                max={100}
                value={marketAlignmentScore}
                onChange={(e) => setMarketAlignmentScore(Math.min(100, Math.max(10, parseInt(e.target.value) || 75)))}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Verification Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050811] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
              />
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Mark as Verified Skill
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Includes this skill in readiness calculation and live portfolio indexing.
                </span>
              </div>
            </label>
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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{initialData ? 'Update Skill' : 'Save Skill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
