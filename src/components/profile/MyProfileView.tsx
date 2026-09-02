import React, { useState } from 'react';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { ProfilePictureUploader } from './ProfilePictureUploader';
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
} from 'lucide-react';

interface MyProfileViewProps {
  onBackToDashboard?: () => void;
  onNavigateToUpgrade?: () => void;
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  onBackToDashboard,
  onNavigateToUpgrade,
}) => {
  const {
    profile,
    updateProfile,
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
    removeAchievement,
    subscription,
    isDemoMode,
  } = useStudentTwin();

  // Local Form States
  const [formData, setFormData] = useState({
    fullName: profile.fullName || profile.name || '',
    headline: profile.headline || '',
    email: profile.email || 'student@university.edu',
    phone: profile.phone || '+91 98765 43210',
    location: profile.location || 'Bengaluru, India',
    university: profile.university || '',
    academicProgram: profile.academicProgram || 'B.Tech Computer Science & Engineering',
    degree: profile.degree || 'B.Tech',
    branch: profile.branch || 'Computer Science & Engineering',
    yearOfStudy: profile.yearOfStudy || '3rd Year',
    gradYear: profile.gradYear || '2026',
    currentGpa: profile.currentGpa || '8.8 / 10.0',
    careerFocus: profile.careerFocus || 'Full-Stack Software Engineering',
    targetRole: profile.targetRole || 'Software Development Engineer',
    targetCompanyTier: profile.targetCompanyTier || 'Tier-1 Tech & High Growth Startups',
    bio: profile.bio || '',
    githubUrl: profile.githubUrl || '',
    linkedinUrl: profile.linkedinUrl || '',
    portfolioUrl: profile.portfolioUrl || '',
  });

  // Modal / Inline Adders
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Languages');
  const [newSkillProficiency, setNewSkillProficiency] = useState(85);

  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectTech, setNewProjectTech] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectRepo, setNewProjectRepo] = useState('');

  const [newAchTitle, setNewAchTitle] = useState('');
  const [newAchIssuer, setNewAchIssuer] = useState('');
  const [newAchDate, setNewAchDate] = useState('2026');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const handleAddProject = () => {
    if (!newProjectTitle.trim()) return;
    addProject({
      title: newProjectTitle.trim(),
      techStack: newProjectTech.split(',').map((s) => s.trim()).filter(Boolean),
      description: newProjectDesc.trim() || 'Verified student twin project proof.',
      githubUrl: newProjectRepo.trim() || undefined,
      status: 'Completed',
      proofHealthScore: 88,
      entropyScore: 85,
      featured: true,
    });
    setNewProjectTitle('');
    setNewProjectTech('');
    setNewProjectDesc('');
    setNewProjectRepo('');
  };

  const handleAddAchievement = () => {
    if (!newAchTitle.trim()) return;
    addAchievement({
      title: newAchTitle.trim(),
      issuer: newAchIssuer.trim() || 'Academic / Industry Entity',
      date: newAchDate.trim(),
      category: 'Certification',
      verified: true,
      description: 'Verified candidate achievement on Student Digital Twin graph.',
    });
    setNewAchTitle('');
    setNewAchIssuer('');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                My Student Profile
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400 font-mono text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                {isDemoMode ? 'DEMO SCHOLAR' : 'CORE DIGITAL TWIN GRAPH'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage your personal student twin identity, academic standing, verified proofs, and career targets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Dashboard
            </button>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: PROFILE PICTURE & CORE IDENTITY */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Profile Picture & Core Identity
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Syncs Globally</span>
        </div>

        {/* Profile Picture Uploader */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5">
          <ProfilePictureUploader
            studentName={formData.fullName}
            size="xl"
            onAvatarChange={(url) => setFormData((prev) => ({ ...prev }))}
          />
        </div>

        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
              placeholder="e.g. Sricharan Vangala"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Location</label>
            <div className="relative">
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Bengaluru, India"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-1 sm:col-span-3">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Professional Headline</label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
              placeholder="e.g. AI/ML Engineer | Distributed Intelligence & Generative AI Systems"
            />
          </div>

          <div className="space-y-1 sm:col-span-3">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Bio / Career Pitch</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
              placeholder="Brief summary of your background, career vision, and engineering strengths..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Phone Number</label>
            <div className="relative">
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Subscription Tier</label>
            <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{subscription.planName}</span>
              {onNavigateToUpgrade && (
                <button
                  type="button"
                  onClick={onNavigateToUpgrade}
                  className="text-[11px] text-blue-600 dark:text-cyan-400 hover:underline font-mono font-bold"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACADEMIC STANDING & UNIVERSITY */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Academic Standing & Institution
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Degree & Year</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">University / College</label>
            <input
              type="text"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
              placeholder="e.g. Marwadi University"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Current CGPA / GPA</label>
            <input
              type="text"
              value={formData.currentGpa}
              onChange={(e) => setFormData({ ...formData, currentGpa: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              placeholder="e.g. 9.42 / 10.0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Degree</label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. B.Tech"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Branch / Specialization</label>
            <input
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. Computer Science (AI/ML)"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Year of Study & Graduation</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formData.yearOfStudy}
                onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                placeholder="2nd Year"
              />
              <input
                type="text"
                value={formData.gradYear}
                onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                placeholder="2026"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: SOCIAL, REPOSITORIES & PORTFOLIO LINKS */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <Link2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              3. Online Presence & Repositories
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Proof Links</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">GitHub Profile URL</label>
            <input
              type="text"
              value={formData.githubUrl}
              onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              placeholder="https://github.com/username"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">LinkedIn Profile URL</label>
            <input
              type="text"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              placeholder="https://linkedin.com/in/username"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Portfolio / Website URL</label>
            <input
              type="text"
              value={formData.portfolioUrl}
              onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
              placeholder="https://myportfolio.dev"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: CAREER GOALS & TARGET ROLE */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <Target className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              4. Career Goal & Industry Placement Target
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Placement Benchmark</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Target Role</label>
            <input
              type="text"
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
              placeholder="e.g. Software Development Engineer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Career Focus Domain</label>
            <input
              type="text"
              value={formData.careerFocus}
              onChange={(e) => setFormData({ ...formData, careerFocus: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
              placeholder="e.g. AI/ML & Distributed Systems"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Target Company Tier</label>
            <input
              type="text"
              value={formData.targetCompanyTier}
              onChange={(e) => setFormData({ ...formData, targetCompanyTier: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. Tier-1 Tech, Global R&D"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: VERIFIED SKILLS GRAPH */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <Code className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              5. Technical Competencies & Skills ({skills.length})
            </h2>
          </div>
        </div>

        {/* Add Skill Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Add new skill (e.g. Docker, Rust, PyTorch)..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
          />

          <select
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 focus:outline-none font-mono"
          >
            <option value="Languages">Languages</option>
            <option value="Frameworks">Frameworks & Libraries</option>
            <option value="Cloud & Infrastructure">Cloud & Infra</option>
            <option value="Data Structures & Algorithms">DSA & Algorithms</option>
            <option value="AI & Machine Learning">AI & ML</option>
          </select>

          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Skill</span>
          </button>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {skills.map((s) => (
            <div
              key={s.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-3 group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{s.name}</span>
                  {s.verified && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold border border-emerald-200 dark:border-emerald-800">
                      VERIFIED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{s.category}</span>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-bold">{s.proficiency}%</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeSkill(s.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Remove skill"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6: VERIFIED PROOF-OF-WORK PROJECTS */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              6. Verified Proof-of-Work Projects ({projects.length})
            </h2>
          </div>
        </div>

        {/* Add Project Form */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-3">
          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            Add New Project Artifact
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="Project Title (e.g. Distributed Consensus Engine)"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            <input
              type="text"
              value={newProjectTech}
              onChange={(e) => setNewProjectTech(e.target.value)}
              placeholder="Tech Stack (comma separated: Go, Raft, gRPC, Docker)"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
            />
            <input
              type="text"
              value={newProjectRepo}
              onChange={(e) => setNewProjectRepo(e.target.value)}
              placeholder="Repository URL (e.g. https://github.com/...)"
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none font-mono sm:col-span-2"
            />
            <textarea
              rows={2}
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              placeholder="Project architecture description and key accomplishments..."
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none sm:col-span-2"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddProject}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Project</span>
            </button>
          </div>
        </div>

        {/* Project List */}
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 space-y-2 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</h3>
                    <span className="px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 font-mono text-[9px] font-bold border border-blue-200 dark:border-blue-800">
                      AST SCORE {p.proofHealthScore || 85}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeProject(p.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Remove project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center flex-wrap gap-1.5 pt-1">
                {p.techStack.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-mono text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 7: HONORS & CERTIFICATIONS */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              7. Honors & Certifications ({achievements.length})
            </h2>
          </div>
        </div>

        {/* Add Achievement */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={newAchTitle}
            onChange={(e) => setNewAchTitle(e.target.value)}
            placeholder="Honor / Certification Title"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none sm:col-span-2"
          />
          <input
            type="text"
            value={newAchIssuer}
            onChange={(e) => setNewAchIssuer(e.target.value)}
            placeholder="Issuing Entity"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddAchievement}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Honor</span>
          </button>
        </div>

        {/* Achievements List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-3 group"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ach.title}</h4>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  {ach.issuer} • {ach.date}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeAchievement(ach.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Remove achievement"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating / Bottom Save Bar */}
      <div className="sticky bottom-6 p-4 rounded-2xl bg-white/90 dark:bg-[#0d1117]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
          <FileCheck className="w-4 h-4 text-emerald-500" />
          <span>Profile updates propagate directly to Resume Builder, AI Portfolio, and Audit Reports.</span>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>All Changes Saved</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
