import React, { useState, useRef } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { useAuth } from '../../context/AuthContext';
import { ProjectModal } from './ProjectModal';
import { AchievementModal } from './AchievementModal';
import { ProjectItem, AchievementItem } from '../../types';
import {
  User,
  GraduationCap,
  Briefcase,
  Code,
  Award,
  Link2,
  Save,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ChevronRight,
  Globe,
  MapPin,
  Mail,
  Phone,
  Target,
  FileCheck,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Github,
  Edit2,
  Compass,
  Cpu,
  FolderGit2,
  ShieldCheck,
  Database,
  Key,
} from 'lucide-react';

interface MyProfileViewProps {
  onBackToDashboard?: () => void;
  onNavigateToUpgrade?: () => void;
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  onBackToDashboard,
  onNavigateToUpgrade,
}) => {
  const { user } = useAuth();
  const {
    profile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    skills,
    addSkill,
    updateSkill,
    removeSkill,
    projects,
    addProject,
    updateProject,
    removeProject,
    achievements,
    addAchievement,
    updateAchievement,
    removeAchievement,
    subscription,
    isDemoMode,
  } = useStudentTwin();

  // Core Form State
  const [formData, setFormData] = useState({
    fullName: profile.fullName || profile.name || '',
    headline: profile.headline || '',
    email: profile.email || user?.email || '',
    phone: profile.phone || '',
    location: profile.location || '',
    university: profile.university || '',
    academicProgram: profile.academicProgram || '',
    degree: profile.degree || 'B.Tech',
    branch: profile.branch || '',
    yearOfStudy: profile.yearOfStudy || profile.year || '3rd Year',
    gradYear: profile.gradYear || '2027',
    currentGpa: profile.currentGpa || (profile.cgpa ? `${profile.cgpa} / 10.0` : ''),
    careerFocus: profile.careerFocus || 'Software Engineering',
    targetRole: profile.targetRole || 'Software Developer',
    targetCompanyTier: profile.targetCompanyTier || 'Tier-1 Product Companies',
    bio: profile.bio || '',
    githubUrl: profile.githubUrl || '',
    linkedinUrl: profile.linkedinUrl || '',
    portfolioUrl: profile.portfolioUrl || '',
  });

  // Avatar Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);

  // Quick Skill Adder State
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Core Languages');
  const [newSkillProficiency, setNewSkillProficiency] = useState(85);

  // Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Achievement Modal State
  const [isAchModalOpen, setIsAchModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<AchievementItem | null>(null);

  // Deletion Confirmation Dialog State
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'project' | 'achievement' | 'skill';
    id: string;
    title: string;
  } | null>(null);

  // Save / Sync State
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState(false);

  // Handle Profile Save
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: formData.fullName,
        fullName: formData.fullName,
        displayName: formData.fullName,
        headline: formData.headline,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        university: formData.university,
        academicProgram: formData.academicProgram,
        degree: formData.degree,
        branch: formData.branch,
        yearOfStudy: formData.yearOfStudy,
        gradYear: formData.gradYear,
        currentGpa: formData.currentGpa,
        careerFocus: formData.careerFocus,
        targetRole: formData.targetRole,
        targetCompanyTier: formData.targetCompanyTier,
        bio: formData.bio,
        githubUrl: formData.githubUrl,
        linkedinUrl: formData.linkedinUrl,
        portfolioUrl: formData.portfolioUrl,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  // Handle Cloud Sync Trigger
  const handleCloudUpload = async () => {
    setSaving(true);
    try {
      await handleSaveProfile();
      setCloudSyncSuccess(true);
      setTimeout(() => setCloudSyncSuccess(false), 3000);
    } catch (err) {
      console.error('Cloud sync error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Avatar Photo Handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoFeedback('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoFeedback('File size exceeds 5MB limit.');
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoFeedback(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            await uploadAvatar(dataUrl);
            setPhotoFeedback('Profile picture updated successfully!');
            setTimeout(() => setPhotoFeedback(null), 3000);
          }
        };
        img.src = evt.target?.result as string;
      } catch (err) {
        setPhotoFeedback('Failed to process image.');
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      await removeAvatar();
      setPhotoFeedback('Profile picture removed.');
      setTimeout(() => setPhotoFeedback(null), 3000);
    } catch (err) {
      setPhotoFeedback('Failed to remove photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Skill Handlers
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    addSkill({
      name: newSkillName.trim(),
      category: newSkillCategory,
      proficiency: newSkillProficiency,
      verified: true,
      proofCount: 3,
      marketAlignmentScore: 88,
    });
    setNewSkillName('');
  };

  // Project Save Handler (Add or Edit)
  const handleSaveProject = (projectData: Omit<ProjectItem, 'id'>, existingId?: string) => {
    if (existingId) {
      updateProject(existingId, projectData);
    } else {
      addProject(projectData);
    }
    setEditingProject(null);
  };

  // Achievement Save Handler (Add or Edit)
  const handleSaveAchievement = (achData: Omit<AchievementItem, 'id'>, existingId?: string) => {
    if (existingId) {
      updateAchievement(existingId, achData);
    } else {
      addAchievement(achData);
    }
    setEditingAch(null);
  };

  // Confirm Delete Handler
  const executeDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'project') {
      removeProject(itemToDelete.id);
    } else if (itemToDelete.type === 'achievement') {
      removeAchievement(itemToDelete.id);
    } else if (itemToDelete.type === 'skill') {
      removeSkill(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  // Derived user display
  const displayName = formData.fullName || profile.fullName || profile.name || 'Student Candidate';
  const displayEmail = formData.email || profile.email || user?.email || 'student@university.edu';
  const targetRole = formData.targetRole || profile.targetRole || 'Software Developer';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'ST';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* TOP HEADER BAR — BALANCED RECTANGULAR + SOFT-CORNER (Matches Screenshot) */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-600 dark:text-cyan-400">
              PROFILE FOUNDATION
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              V4 STUDENT TWIN
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Student Twin Profile Foundation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Authenticated user profile synced with Supabase (<span className="font-mono text-cyan-600 dark:text-cyan-400">auth.uid() = user_id</span>)
          </p>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCloudUpload}
            disabled={saving}
            className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-mono font-semibold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Synchronize profile record to Supabase cloud storage"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-500 dark:text-cyan-400" />
            <span>{cloudSyncSuccess ? 'Cloud Synced' : 'Upload to Cloud'}</span>
          </button>

          <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold tracking-wider">
            {isDemoMode ? 'DEMO SCHOLAR' : 'AUTHENTICATED TWIN'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2-COLUMN PRIMARY PROFILE FOUNDATION GRID (Matches Screenshot) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ------------------------------------------------------------- */}
        {/* LEFT COLUMN: Profile Identity Card & Metadata (~4 of 12 cols) */}
        {/* ------------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
            
            {/* Soft-Corner Rectangular Profile Avatar Frame */}
            <div className="relative w-32 h-32 mx-auto rounded-2xl border-2 border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-[#0d1322] overflow-hidden shadow-md group">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 text-white flex items-center justify-center text-3xl font-bold font-mono select-none">
                  {initials}
                </div>
              )}

              {/* Camera Action Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-1 right-1 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
                title="Change Photo"
                aria-label="Upload new profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Photo Action Links */}
            <div className="flex items-center justify-center gap-3 text-xs pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 dark:text-cyan-400 hover:underline font-medium cursor-pointer"
              >
                Change Photo
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 font-medium cursor-pointer"
              >
                Remove
              </button>
            </div>

            {photoFeedback && (
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {photoFeedback}
              </div>
            )}

            {/* Name, Email, Role */}
            <div className="space-y-1.5 pt-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {displayName}
              </h2>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
                {displayEmail}
              </p>
              <div>
                <span className="inline-block px-3 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-900/50 text-xs font-semibold">
                  {targetRole}
                </span>
              </div>
            </div>

            {/* Metadata Table Rows */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Subscription Plan:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {subscription.tier === 'free' ? 'FREE PLAN (₹0)' : subscription.planName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Auth UID:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] truncate max-w-[140px]" title={user?.id || '7f6bcc1f-auth-user'}>
                  {user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : '7f6bcc1f-...'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">RLS Ownership:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400 text-[11px]">
                  auth.uid() = user_id
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Cloud Storage:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                  Supabase PostgreSQL
                </span>
              </div>
            </div>

          </div>

          {/* Quick Stats Mini-Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Twin Graph Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800">
                <div className="text-lg font-bold text-blue-600 dark:text-cyan-400">{projects.length}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Projects</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800">
                <div className="text-lg font-bold text-amber-500 dark:text-amber-400">{achievements.length}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Honors</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800">
                <div className="text-lg font-bold text-emerald-500 dark:text-emerald-400">{skills.length}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Skills</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800">
                <div className="text-lg font-bold text-purple-500 dark:text-purple-400">{profile.readinessScore || 78}%</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">AST Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* RIGHT COLUMN: Core Profile & Academic Details (~8 of 12 cols) */}
        {/* ------------------------------------------------------------- */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSaveProfile} className="p-6 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Core Profile & Academic Details
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Defines your core identity attributes used across all AI engines and portfolio builders.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                  </>
                )}
              </button>
            </div>

            {/* 2-Column Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Sri Charan Vangala"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. student@gmail.com"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* University / College */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                  <span>University / College <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Degree Program */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Degree Program <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="B.Tech">B.Tech (Bachelor of Technology)</option>
                  <option value="B.E.">B.E. (Bachelor of Engineering)</option>
                  <option value="B.Sc">B.Sc (Computer Science / IT)</option>
                  <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                  <option value="M.Tech">M.Tech (Master of Technology)</option>
                  <option value="MCA">MCA (Master of Computer Applications)</option>
                  <option value="M.S.">M.S. (Master of Science)</option>
                </select>
              </div>

              {/* Branch / Major */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Branch / Major <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Academic Year */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Academic Year <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.yearOfStudy}
                  onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="1st Year">1st Year (Freshman)</option>
                  <option value="2nd Year">2nd Year (Sophomore)</option>
                  <option value="3rd Year">3rd Year (Junior)</option>
                  <option value="4th Year">4th Year (Senior)</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Recent Graduate">Recent Graduate</option>
                </select>
              </div>

              {/* Primary Career Goal */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-slate-400" />
                  <span>Primary Career Goal <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={formData.careerFocus}
                  onChange={(e) => setFormData({ ...formData, careerFocus: e.target.value })}
                  placeholder="e.g. SDE-1 at Tier-1 Product Company"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                  required
                />
              </div>

              {/* Target Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target Role</span>
                </label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  placeholder="e.g. Software Developer / Full Stack Engineer"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {/* GitHub Profile URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-slate-400" />
                  <span>GitHub Profile URL</span>
                </label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/your-username"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* LinkedIn Profile URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>LinkedIn Profile URL</span>
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/your-profile"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Location / City */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Location / City</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Hyderabad, India"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Phone / Mobile */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone / Mobile</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Bio / Professional Headline (Full Width) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Professional Headline & Summary
                </label>
                <textarea
                  rows={2}
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. Aspiring Full Stack & Systems Engineer | Actively building high-concurrency architectures and distributed software systems"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

            </div>

            {/* Bottom Save Notification */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Changes persist immediately across ATS Analyzer, Resume Builder, and AI Portfolio.</span>
              </span>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION: TECHNICAL COMPETENCIES & SKILLS GRAPH (Rectangular Soft-Corner) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/10 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Technical Competencies & Skills ({skills.length})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Core engineering capabilities verified on your digital twin graph.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Add Skill Form Bar */}
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Skill Name (e.g. Go, Docker, Redis, Next.js)"
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#0a0f1d] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 sm:col-span-2"
          />
          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#0a0f1d] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="Core Languages">Core Languages</option>
            <option value="Frameworks & Runtimes">Frameworks & Runtimes</option>
            <option value="Databases & Storage">Databases & Storage</option>
            <option value="Cloud & Infrastructure">Cloud & Infrastructure</option>
            <option value="System Design & CS">System Design & CS</option>
          </select>
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </button>
        </div>

        {/* Skills Grid */}
        {skills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{skill.name}</h3>
                    {skill.verified && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {skill.category} • {skill.proficiency}% Proficiency
                  </div>
                  <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-cyan-400 h-full rounded-full"
                      style={{ width: `${skill.proficiency}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setItemToDelete({ type: 'skill', id: skill.id, title: skill.name })}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                  title="Remove skill"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-lg bg-slate-50 dark:bg-[#050811] border border-dashed border-slate-300 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            No technical skills logged yet. Use the input bar above to add languages, tools, and frameworks.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION: PROOF-OF-WORK PROJECTS (V4 Project Management Experience) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/10 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Proof-of-Work Projects ({projects.length})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Audited codebase artifacts and architecture proofs with AI description generation.
              </p>
            </div>
          </div>

          {/* + ADD PROJECT BUTTON */}
          <button
            type="button"
            onClick={() => {
              setEditingProject(null);
              setIsProjectModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        </div>

        {/* Project List / Empty State */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800/90 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {p.role && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-900/50 font-semibold">
                            {p.role}
                          </span>
                        )}
                        {(p as any).category && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {(p as any).category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(p);
                          setIsProjectModalOpen(true);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToDelete({ type: 'project', id: p.id, title: p.title })}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {p.description}
                  </p>

                  {/* Tech Stack Tags */}
                  {p.techStack && p.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.techStack.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Links */}
                {(p.githubUrl || p.liveUrl) && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-3 text-xs font-mono">
                    {p.githubUrl && (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <Github className="w-3 h-3" />
                        <span>Repository</span>
                      </a>
                    )}
                    {p.liveUrl && (
                      <a
                        href={p.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                No Projects Added Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Log your projects to verify proof-of-work architecture across your Student Digital Twin.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setEditingProject(null);
                  setIsProjectModalOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Your First Project</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION: HONORS & CERTIFICATIONS (V4 Achievement Management) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Honors & Certifications ({achievements.length})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Logged distinctions, hackathon honors, certifications, and academic milestones.
              </p>
            </div>
          </div>

          {/* + ADD ACHIEVEMENT BUTTON */}
          <button
            type="button"
            onClick={() => {
              setEditingAch(null);
              setIsAchModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Achievement</span>
          </button>
        </div>

        {/* Achievement List / Empty State */}
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800/90 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                        {ach.title}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        {ach.issuer} • {ach.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAch(ach);
                          setIsAchModalOpen(true);
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                        title="Edit achievement"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToDelete({ type: 'achievement', id: ach.id, title: ach.title })}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete achievement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {ach.category}
                  </span>

                  {ach.credentialUrl && (
                    <a
                      href={ach.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Credential Link</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Award className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                No Achievements Added Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Log hackathon recognitions, competitive distinctions, or certifications to your Student Digital Twin.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  setEditingAch(null);
                  setIsAchModalOpen(true);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Your First Achievement</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION: EXTERNAL GRAPH & PROFESSIONAL LINKS */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#0a0f1d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Link2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Online Presence & Digital Identity
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400">GITHUB REPOSITORY AUDIT</span>
            <div className="font-mono text-slate-800 dark:text-slate-200 truncate">
              {formData.githubUrl || 'Not Connected'}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400">LINKEDIN PROFILE SYNC</span>
            <div className="font-mono text-slate-800 dark:text-slate-200 truncate">
              {formData.linkedinUrl || 'Not Connected'}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#050811] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400">PERSONAL PORTFOLIO URL</span>
            <div className="font-mono text-slate-800 dark:text-slate-200 truncate">
              {formData.portfolioUrl || 'Built with AI Portfolio Engine'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING SAVE BAR (Subtle rectangular bar with soft-corners) */}
      {/* ========================================================================= */}
      <div className="sticky bottom-4 z-20 p-3.5 px-5 rounded-xl bg-white/95 dark:bg-[#0a0f1d]/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
          <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="hidden sm:inline">
            Foundation changes synchronize automatically with Supabase cloud storage.
          </span>
          <span className="sm:hidden">Changes sync across OS.</span>
        </div>

        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Dashboard
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSaveProfile()}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Saved All</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {/* Project Add / Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialData={editingProject}
        studentContext={{
          name: displayName,
          targetRole,
          degree: formData.degree,
          branch: formData.branch,
          university: formData.university,
          year: formData.yearOfStudy,
        }}
      />

      {/* Achievement Add / Edit Modal */}
      <AchievementModal
        isOpen={isAchModalOpen}
        onClose={() => {
          setIsAchModalOpen(false);
          setEditingAch(null);
        }}
        onSave={handleSaveAchievement}
        initialData={editingAch}
        studentContext={{
          name: displayName,
          targetRole,
          degree: formData.degree,
          branch: formData.branch,
          university: formData.university,
        }}
      />

      {/* Deletion Confirmation Modal */}
      {itemToDelete && (
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
                  Delete {itemToDelete.type}: &quot;{itemToDelete.title}&quot;?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This action will remove this record from your authenticated Student Digital Twin graph. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
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
