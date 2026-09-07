import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { StudentProfile } from '../../types';
import { StudentTwinModal } from '../profile/StudentTwinModal';
import {
  User,
  GraduationCap,
  Briefcase,
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Code2,
  FolderGit2,
  Award,
  Compass,
  Check,
  Building2,
  Layers,
} from 'lucide-react';

export const ManageProfiles: React.FC = () => {
  const {
    activeProfile,
    allProfiles,
    switchProfile,
    addNewStudentProfile,
    updateStudentProfile,
    deleteStudentProfile,
    isDemoMode,
    openDemoLockModal,
  } = useStudentTwin();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<StudentProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<StudentProfile | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleOpenCreate = () => {
    if (isDemoMode) {
      openDemoLockModal();
      return;
    }
    setEditingProfile(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (profileToEdit: StudentProfile) => {
    if (isDemoMode) {
      openDemoLockModal();
      return;
    }
    setEditingProfile(profileToEdit);
    setIsCreateModalOpen(true);
  };

  const handleSaveProfile = async (
    data: {
      fullName: string;
      university: string;
      degree: string;
      branch: string;
      year: string;
      semester: string;
      cgpa: number;
      targetRole: string;
      careerGoal: string;
      bio: string;
      setActiveImmediately?: boolean;
    },
    existingId?: string
  ) => {
    try {
      if (existingId) {
        // Edit existing Student Twin
        await updateStudentProfile(
          {
            name: data.fullName,
            fullName: data.fullName,
            displayName: data.fullName,
            university: data.university,
            degree: data.degree,
            academicProgram: data.degree,
            branch: data.branch,
            year: data.year,
            yearOfStudy: data.year,
            semester: data.semester,
            cgpa: data.cgpa,
            currentGpa: data.cgpa ? `${data.cgpa} / 10.0` : '',
            targetRole: data.targetRole,
            careerFocus: data.careerGoal || data.targetRole,
            bio: data.bio,
          },
          existingId
        );

        showNotification('success', `Student Twin "${data.fullName}" updated successfully.`);
      } else {
        // Create new Student Twin
        await addNewStudentProfile({
          name: data.fullName,
          fullName: data.fullName,
          displayName: data.fullName,
          university: data.university,
          degree: data.degree,
          academicProgram: data.degree,
          branch: data.branch,
          year: data.year,
          yearOfStudy: data.year,
          semester: data.semester,
          cgpa: data.cgpa,
          currentGpa: data.cgpa ? `${data.cgpa} / 10.0` : '',
          targetRole: data.targetRole,
          careerFocus: data.careerGoal || data.targetRole,
          careerGoal: data.careerGoal,
          bio: data.bio,
          setActiveImmediately: data.setActiveImmediately,
        });

        showNotification(
          'success',
          `Student Twin "${data.fullName}" created successfully with clean isolated records.`
        );
      }
    } catch (err: any) {
      showNotification('error', err?.message || 'Operation failed.');
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProfile) return;
    if (isDemoMode) {
      openDemoLockModal();
      setDeletingProfile(null);
      return;
    }

    setIsDeleting(true);
    try {
      const targetName = deletingProfile.fullName || deletingProfile.name || 'Student Twin';
      await deleteStudentProfile(deletingProfile.id);
      showNotification('success', `Student Twin "${targetName}" has been deleted.`);
      setDeletingProfile(null);
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to delete student twin profile.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSwitchActive = (targetId: string) => {
    if (targetId === activeProfile.id) return;
    switchProfile(targetId);
    showNotification('success', 'Active workspace switched.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner with Prominent [+ Add Student Twin] button */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wider font-mono">
              <Layers className="w-3 h-3" />
              <span>Student Twins Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Student Twins
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Manage multiple student twin profiles with completely isolated academic credentials, verified skills, and career readiness roadmaps.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isDemoMode && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Mode</span>
              </div>
            )}

            {/* [+ Add Student Twin] Prominent Action Button */}
            <button
              type="button"
              id="add-student-twin-btn"
              onClick={handleOpenCreate}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-[0_4px_20px_rgba(37,99,235,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Student Twin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Profiles Grid or Empty State */}
      {allProfiles.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-dashed border-slate-200 dark:border-white/10 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-cyan-400">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Student Twins yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Create your first Student Digital Twin to begin tracking your academic journey, readiness metrics, and career pathways.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Student Twin</span>
          </button>
        </div>
      ) : (
        /* Grid of Student Twin Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {allProfiles.map((p) => {
            const isActive = p.id === activeProfile.id;
            const profileName = p.fullName || p.name || 'Student Twin';
            const initials = profileName
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'ST';

            return (
              <div
                key={p.id}
                className={`relative flex flex-col justify-between rounded-[2rem] p-6 transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-[#0e1626] border-2 border-blue-500 dark:border-blue-500/60 shadow-lg shadow-blue-500/5'
                    : 'bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm'
                }`}
              >
                {/* Active Indicator & Top Badges */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold font-mono tracking-wider uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active Workspace
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 text-[10px] font-mono">
                      Twin Profile
                    </span>
                  )}

                  {/* Readiness Score Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/10 text-[11px] font-bold font-mono text-blue-600 dark:text-cyan-300">
                    <Sparkles className="w-3 h-3" />
                    <span>{p.readinessScore ?? 0}% Ready</span>
                  </div>
                </div>

                {/* Identity Header */}
                <div className="flex items-start gap-3.5 mb-4">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={profileName}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm tracking-wider shadow-sm shrink-0">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                      {profileName}
                    </h3>
                    <p className="text-xs font-medium text-blue-600 dark:text-cyan-400 truncate">
                      {p.targetRole || p.role || 'Software Engineering'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{p.university || 'Academic Institution'}</span>
                    </p>
                  </div>
                </div>

                {/* Academic Metadata Pill Group */}
                <div className="space-y-2 py-3 border-y border-slate-100 dark:border-white/5 my-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="text-[11px] flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      Degree & Branch
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[170px] text-right">
                      {p.degree || p.academicProgram || 'B.Tech'}{' '}
                      {p.branch ? `• ${p.branch}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="text-[11px]">Academic Standing</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {p.year || p.yearOfStudy || '3rd Year'}
                      {p.semester ? ` (${p.semester})` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="text-[11px]">Cumulative CGPA</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200 font-mono">
                      {p.cgpa ? `${p.cgpa} / 10.0` : p.currentGpa || '8.5 / 10.0'}
                    </span>
                  </div>
                </div>

                {/* Evidence Counters */}
                <div className="grid grid-cols-3 gap-2 my-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {p.skillsVerifiedCount ?? (isActive ? p.skillsVerifiedCount : 0)}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono mt-0.5">
                      Skills
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {p.projectIndexCount ?? (isActive ? p.projectIndexCount : 0)}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono mt-0.5">
                      Projects
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {p.milestonesCount ?? (isActive ? p.milestonesCount : 0)}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-mono mt-0.5">
                      Awards
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-white/5 mt-2">
                  {/* Switch Active Workspace */}
                  {isActive ? (
                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/40">
                      <Check className="w-3.5 h-3.5" />
                      <span>Current Workspace</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSwitchActive(p.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-white/5 dark:hover:bg-blue-900/30 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Set Active</span>
                    </button>
                  )}

                  {/* Edit & Delete Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      title="Edit this Student Twin"
                      className="p-2 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {allProfiles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDeletingProfile(p)}
                        title="Delete this Student Twin"
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create & Edit Modal */}
      <StudentTwinModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProfile(null);
        }}
        onSave={handleSaveProfile}
        initialData={editingProfile}
      />

      {/* Delete Confirmation Modal */}
      {deletingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-white/10 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete this Student Twin?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {deletingProfile.fullName || deletingProfile.name || 'this Student Twin'}
                </span>
                ? All associated local evidence, skills, and goals for this twin will be removed.
              </p>
            </div>

            {deletingProfile.id === activeProfile.id && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                ⚠️ This is your currently active workspace. Deleting it will automatically switch to your next available Student Twin.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProfile(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Student Twin'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
