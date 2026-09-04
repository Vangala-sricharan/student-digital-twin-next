import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { AchievementModal } from '../profile/AchievementModal';
import { AchievementItem } from '../../types';
import { Award, Trophy, Calendar, CheckCircle2, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';

export const AchievementsView: React.FC = () => {
  const { achievements, addAchievement, updateAchievement, removeAchievement, profile } = useStudentTwin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<AchievementItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const handleSaveAchievement = (achData: Omit<AchievementItem, 'id'>, existingId?: string) => {
    if (existingId) {
      updateAchievement(existingId, achData);
    } else {
      addAchievement(achData);
    }
    setEditingAch(null);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      removeAchievement(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-7xl mx-auto">
      
      {/* Header — Balanced Rectangular Soft-Corner */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider font-mono">
            MILESTONES & PROOF
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Verified Honors & Milestones
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cryptographically recorded academic distinctions, hackathon victories, and research fellowships.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAch(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Achievement</span>
        </button>
      </div>

      {/* Grid of Achievements */}
      {achievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className="p-5 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase">
                      {a.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAch(a);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit milestone"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ id: a.id, title: a.title })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete milestone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {a.title}
                  </h3>
                  <div className="text-xs font-semibold text-blue-600 dark:text-cyan-400 mt-0.5">
                    Issued by {a.issuer}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {a.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{a.date}</span>
                </span>

                <div className="flex items-center gap-2">
                  {a.credentialUrl && (
                    <a
                      href={a.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 text-[11px] font-mono"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Proof</span>
                    </a>
                  )}

                  {a.verified && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              No Milestones Recorded Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Add academic awards, hackathon rankings, and industry certifications to your Student Digital Twin.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                setEditingAch(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Milestone</span>
            </button>
          </div>
        </div>
      )}

      {/* Achievement Modal */}
      <AchievementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAch(null);
        }}
        onSave={handleSaveAchievement}
        initialData={editingAch}
        studentContext={{
          name: profile.fullName || profile.name,
          targetRole: profile.targetRole,
          degree: profile.degree,
          branch: profile.branch,
          university: profile.university,
        }}
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
                  Confirm Milestone Deletion
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Delete &quot;{deleteConfirm.title}&quot;?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This action will remove this achievement from your Student Digital Twin. This action cannot be undone.
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
                Delete Milestone
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
