import React, { useState, useEffect } from 'react';
import { X, User, GraduationCap, Briefcase, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StudentProfile } from '../../types';

interface StudentTwinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
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
  ) => Promise<void> | void;
  initialData?: StudentProfile | null;
}

export const StudentTwinModal: React.FC<StudentTwinModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year');
  const [semester, setSemester] = useState('6th');
  const [cgpa, setCgpa] = useState<number>(8.5);
  const [targetRole, setTargetRole] = useState('AI/ML Engineer');
  const [careerGoal, setCareerGoal] = useState('');
  const [bio, setBio] = useState('');
  const [setActiveImmediately, setSetActiveImmediately] = useState(true);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || initialData.name || '');
      setUniversity(initialData.university || '');
      setDegree(initialData.degree || 'B.Tech');
      setBranch(initialData.branch || 'Computer Science & Engineering');
      setYear(initialData.year || initialData.yearOfStudy || '3rd Year');
      setSemester(initialData.semester || '6th');
      setCgpa(initialData.cgpa ?? 8.5);
      setTargetRole(initialData.targetRole || '');
      setCareerGoal(initialData.careerFocus || '');
      setBio(initialData.bio || '');
      setSetActiveImmediately(false);
    } else {
      setFullName('');
      setUniversity('');
      setDegree('B.Tech');
      setBranch('Computer Science & Engineering');
      setYear('3rd Year');
      setSemester('6th');
      setCgpa(8.5);
      setTargetRole('');
      setCareerGoal('');
      setBio('');
      setSetActiveImmediately(true);
    }
    setValidationError(null);
    setIsSubmitting(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedName = fullName.trim();
    const trimmedUniv = university.trim();
    const trimmedRole = targetRole.trim();

    if (!trimmedName) {
      setValidationError('Please provide your Full Name.');
      return;
    }

    if (!trimmedUniv) {
      setValidationError('Please specify your University or Institute.');
      return;
    }

    if (!trimmedRole) {
      setValidationError('Please specify your Target Career Role.');
      return;
    }

    if (cgpa < 0 || cgpa > 10) {
      setValidationError('CGPA must be between 0.0 and 10.0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          fullName: trimmedName,
          university: trimmedUniv,
          degree: degree.trim() || 'B.Tech',
          branch: branch.trim() || 'Computer Science',
          year,
          semester: semester.trim(),
          cgpa: Number(cgpa) || 0,
          targetRole: trimmedRole,
          careerGoal: careerGoal.trim(),
          bio: bio.trim(),
          setActiveImmediately: initialData ? false : setActiveImmediately,
        },
        initialData?.id
      );
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to save student twin profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl my-8 rounded-2xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider font-mono">
              <User className="w-3 h-3" />
              <span>{initialData ? 'Update Profile' : 'Student Digital Twin'}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {initialData ? 'Edit Student Twin' : 'Create Student Twin'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {initialData
                ? 'Update academic credentials, target career calibration, and twin profile.'
                : 'Create another student profile to manage a separate academic or career identity.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Identity Group */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                1. Student Identity & University
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  University / Institute <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University / IIT"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Degree Program
                </label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech, M.S., B.S."
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Branch / Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science (AI/ML)"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Academic Standing */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                2. Academic Standing & Performance
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Current Semester
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6th"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cumulative CGPA (10.0)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 8.5"
                  value={cgpa}
                  onChange={(e) => setCgpa(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Career Trajectory */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                3. Career Trajectory & Goal
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Career Role <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI/ML Systems Engineer, Distributed Backend Developer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Career Goal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Placement at Tier-1 Tech Company by Q4 2026"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Twin Summary / Bio
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of engineering interests, focus areas, and technical pursuits..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 resize-none"
                />
              </div>

              {!initialData && (
                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={setActiveImmediately}
                      onChange={(e) => setSetActiveImmediately(e.target.checked)}
                      className="w-4 h-4 rounded-sm border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">Set as active workspace immediately upon creation</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{initialData ? 'Save Changes' : 'Create Student Twin'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
