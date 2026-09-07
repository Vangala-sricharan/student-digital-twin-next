import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { AchievementModal } from '../profile/AchievementModal';
import { AchievementItem, CertificationItem, ParticipationItem } from '../../types';
import {
  Award,
  Calendar,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  FileCheck,
  Sparkles,
  Lock,
  Tag,
  ShieldCheck,
} from 'lucide-react';

export const AchievementsView: React.FC = () => {
  const {
    achievements,
    certifications,
    participations,
    addAchievement,
    updateAchievement,
    removeAchievement,
    profile,
    isDemoMode,
    openDemoLockModal,
  } = useStudentTwin();

  const [activeTab, setActiveTab] = useState<'all' | 'certifications' | 'participations' | 'honors'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<AchievementItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const handleSaveAchievement = (achData: Omit<AchievementItem, 'id'>, existingId?: string) => {
    if (isDemoMode) {
      openDemoLockModal();
      return;
    }
    if (existingId) {
      updateAchievement(existingId, achData);
    } else {
      addAchievement(achData);
    }
    setEditingAch(null);
  };

  const handleConfirmDelete = () => {
    if (isDemoMode) {
      openDemoLockModal();
      return;
    }
    if (deleteConfirm) {
      removeAchievement(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider font-mono">
            <ShieldCheck className="w-3 h-3" />
            <span>CREDENTIAL & EVENT RECORDS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Certifications, Participations & Milestones
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verified proof-of-work records separated into accredited certifications, technical event participations, and honors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
              <Lock className="w-3 h-3" />
              <span>Read-Only Showcase</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (isDemoMode) {
                openDemoLockModal();
                return;
              }
              setEditingAch(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Records ({certifications.length + participations.length + achievements.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('certifications')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'certifications'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Certifications & Programs ({certifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('participations')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'participations'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Participations & Events ({participations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('honors')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'honors'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Honors & Awards ({achievements.length})
        </button>
      </div>

      {/* SECTION 1: CERTIFICATIONS & PROGRAMS */}
      {(activeTab === 'all' || activeTab === 'certifications') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <FileCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Certifications / Programs ({certifications.length})
              </h2>
            </div>
          </div>

          {certifications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-5 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold uppercase">
                        Certification / Program
                      </span>
                      {cert.verified && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {cert.title}
                      </h3>
                      <div className="text-xs font-semibold text-blue-600 dark:text-cyan-400 mt-1">
                        Issuer: {cert.issuer}
                      </div>
                    </div>

                    {cert.credentialId && (
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 break-all">
                        <span className="text-slate-400 font-sans block text-[10px] font-semibold uppercase mb-0.5">Credential ID</span>
                        {cert.credentialId}
                      </div>
                    )}

                    {cert.skills && cert.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cert.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[10px] font-medium"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Issued: {cert.issueDate}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">No certifications recorded.</p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PARTICIPATIONS & EVENTS */}
      {(activeTab === 'all' || activeTab === 'participations') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Participations & Events ({participations.length})
              </h2>
            </div>
          </div>

          {participations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {participations.map((part) => (
                <div
                  key={part.id}
                  className="p-5 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 font-semibold uppercase">
                        {part.category}
                      </span>
                      {part.verified && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Recorded</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {part.title}
                    </h3>

                    {part.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {part.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">No event participations recorded.</p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: HONORS & AWARDS (ACHIEVEMENTS) */}
      {(activeTab === 'all' || activeTab === 'honors') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Honors & Distinctions ({achievements.length})
              </h2>
            </div>
          </div>

          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className="p-5 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 font-semibold uppercase">
                        {a.category}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (isDemoMode) {
                              openDemoLockModal();
                              return;
                            }
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
                          onClick={() => {
                            if (isDemoMode) {
                              openDemoLockModal();
                              return;
                            }
                            setDeleteConfirm({ id: a.id, title: a.title });
                          }}
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

                    {a.verified && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDemoMode
                  ? 'All verified credentials and event participations are cataloged in their respective sections above.'
                  : 'No custom honors recorded yet. Click "Add Record" above to add university or competition distinctions.'}
              </p>
            </div>
          )}
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
                  Confirm Deletion
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Delete &quot;{deleteConfirm.title}&quot;?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This action will remove this record from your Student Digital Twin. This action cannot be undone.
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
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
