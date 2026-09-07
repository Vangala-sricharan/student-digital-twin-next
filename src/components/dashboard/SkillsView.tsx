import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { SkillModal } from '../profile/SkillModal';
import { SkillItem } from '../../types';
import {
  Cpu,
  CheckCircle2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Layers,
} from 'lucide-react';

export const SkillsView: React.FC = () => {
  const {
    skills,
    isDemoMode,
    openDemoLockModal,
    addSkill,
    updateSkill,
    removeSkill,
  } = useStudentTwin();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const categories = [
    'All',
    'AI/ML & Deep Learning',
    'Languages & Frameworks',
    'Data Structures & Algorithms',
    'Distributed Systems & Cloud',
    'Frontend Architecture',
    'Backend Engineering',
  ];

  const filteredSkills = skills.filter((s) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      s.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (selectedCategory === 'Languages & Frameworks' && s.category.toLowerCase().includes('lang'));
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveSkill = (skillData: Omit<SkillItem, 'id' | 'lastAssessed'>, existingId?: string) => {
    if (isDemoMode) {
      openDemoLockModal();
      return;
    }
    if (existingId) {
      updateSkill(existingId, skillData);
    } else {
      addSkill(skillData);
    }
    setEditingSkill(null);
  };

  const handleConfirmDelete = () => {
    if (isDemoMode) {
      openDemoLockModal();
      return;
    }
    if (deleteConfirm) {
      removeSkill(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wider font-mono">
            Living Skills Graph
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Verified Skills Ontology
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Dynamic proficiency indexing calibrated against coursework, commits, and problem-solving benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isDemoMode && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
              <Lock className="w-3 h-3" />
              <span>Read-Only Showcase</span>
            </div>
          )}
          {/* Standard Add Skill Action Button */}
          <button
            type="button"
            onClick={() => {
              if (isDemoMode) {
                openDemoLockModal();
                return;
              }
              setEditingSkill(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Skill</span>
          </button>
        </div>
      </div>

      {/* Controls: Search & Categories */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search skills (e.g. PyTorch, Rust)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 focus:border-blue-600 dark:focus:border-cyan-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-3 hover:border-blue-500/40 dark:hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-white/5 text-blue-600 dark:text-cyan-400 border border-blue-100 dark:border-white/5">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">
                      {s.proficiency}%
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (isDemoMode) {
                          openDemoLockModal();
                          return;
                        }
                        setEditingSkill(s);
                        setIsModalOpen(true);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit skill"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isDemoMode) {
                          openDemoLockModal();
                          return;
                        }
                        setDeleteConfirm({ id: s.id, name: s.name });
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-100 dark:border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(5, s.proficiency))}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5">
                <span className="font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                  {s.category}
                </span>
                {s.verified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Unverified</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Skills Indexed Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your Student Digital Twin starts with zero predefined skills. Click &quot;+ Add Skill&quot; above to index your core technical competencies and DSA proficiencies.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                if (isDemoMode) {
                  openDemoLockModal();
                  return;
                }
                setEditingSkill(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Skill</span>
            </button>
          </div>
        </div>
      )}

      {/* Skill Modal */}
      <SkillModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSkill(null);
        }}
        onSave={handleSaveSkill}
        initialData={editingSkill}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-200 dark:border-rose-900/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Confirm Skill Removal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Delete &quot;{deleteConfirm.name}&quot;?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This action will remove this skill from your Living Skills Graph and recalculate your twin readiness metrics.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
              >
                Delete Skill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
