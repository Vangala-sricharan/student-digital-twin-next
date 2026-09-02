import React, { useState, useEffect } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import {
  User,
  GraduationCap,
  Briefcase,
  BookOpen,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export const ManageProfiles: React.FC = () => {
  const { profile, updateProfile, isDemoMode } = useStudentTwin();

  const [formData, setFormData] = useState({
    fullName: '',
    university: '',
    degree: '',
    branch: '',
    year: '2nd',
    semester: '4th',
    cgpa: 0,
    targetRole: '',
    bio: '',
    readinessScore: 0,
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || profile.name || '',
        university: profile.university || '',
        degree: profile.degree || '',
        branch: profile.branch || '',
        year: profile.year || profile.yearOfStudy || '',
        semester: profile.semester || '',
        cgpa: profile.cgpa ?? 0,
        targetRole: profile.targetRole || '',
        bio: profile.bio || '',
        readinessScore: profile.readinessScore ?? 0,
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'cgpa' || name === 'readinessScore' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    setFeedbackMsg('');

    try {
      const { error } = await updateProfile(formData);
      if (error) {
        setSaveStatus('error');
        setFeedbackMsg(error.message || 'Failed to update student profile.');
      } else {
        setSaveStatus('saved');
        setFeedbackMsg(
          isDemoMode
            ? 'Demo profile synchronized in memory (Demo Sandbox Mode).'
            : 'Student Digital Twin profile saved successfully.'
        );
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setFeedbackMsg(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl space-y-2 transition-colors">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-[10px] font-bold uppercase tracking-wider font-mono">
              Profile Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
              Manage Digital Twin Profile
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Configure core academic metadata, institutional affiliation, and target career calibration.
            </p>
          </div>

          {isDemoMode && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Demo Mode Active (Non-Persistent)</span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {saveStatus === 'saved' && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-sm dark:shadow-2xl space-y-8 transition-colors">
        
        {/* Academic Credentials Group */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
            <User className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              1. Student Identity & Degree
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 focus:border-blue-600 dark:focus:border-cyan-400 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono mb-1.5">
                University / Institute
              </label>
              <input
                type="text"
                name="university"
                required
                value={formData.university}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 focus:border-blue-600 dark:focus:border-cyan-400 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono mb-1.5">
                Degree Program
              </label>
              <input
                type="text"
                name="degree"
                required
                value={formData.degree}
                onChange={handleChange}
                placeholder="e.g. B.Tech"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 focus:border-blue-600 dark:focus:border-cyan-400 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono mb-1.5">
                Branch / Specialization
              </label>
              <input
                type="text"
                name="branch"
                required
                value={formData.branch}
                onChange={handleChange}
                placeholder="e.g. CSE (AI/ML)"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 focus:border-blue-600 dark:focus:border-cyan-400 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Academic Standing Group */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
            <GraduationCap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              2. Standing & Performance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono mb-1.5">
                Academic Year
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 focus:border-blue-600 dark:focus:border-cyan-400"
              >
                <option value="1st" className="bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white">1st Year</option>
                <option value="2nd" className="bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white">2nd Year</option>
                <option value="3rd" className="bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white">3rd Year</option>
                <option value="4th" className="bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white">4th Year</option>
                <option value="Postgraduate" className="bg-white dark:bg-[#0d1117] text-slate-900 dark:text-white">Postgraduate</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono mb-1.5">
                Current Semester
              </label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                placeholder="e.g. 4th"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 focus:border-blue-600 dark:focus:border-cyan-400 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono mb-1.5">
                Cumulative CGPA (10.0 scale)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                name="cgpa"
                value={formData.cgpa}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 focus:border-blue-600 dark:focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Career Calibration Group */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
            <Briefcase className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              3. Career Trajectory & Summary
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono mb-1.5">
                Target Career Role
              </label>
              <input
                type="text"
                name="targetRole"
                required
                value={formData.targetRole}
                onChange={handleChange}
                placeholder="e.g. AI/ML Engineer, Distributed Systems Architect"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 focus:border-blue-600 dark:focus:border-cyan-400 placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono mb-1.5">
                Professional Twin Summary / Bio
              </label>
              <textarea
                rows={3}
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Summarize your engineering interests and technical focus..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-cyan-400 focus:border-blue-600 dark:focus:border-cyan-400 resize-none placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-white/5 flex-wrap gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isDemoMode ? (
              <span className="text-blue-600 dark:text-cyan-400 font-medium">
                * Modifications will apply locally in the Demo sandbox session.
              </span>
            ) : (
              <span>* Changes are committed directly to your authenticated Supabase profile.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={saveStatus === 'saving'}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-[0_4px_20px_rgba(37,99,235,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saveStatus === 'saving' ? 'Saving Profile...' : 'Save Twin Profile'}</span>
          </button>
        </div>

      </form>

    </div>
  );
};
