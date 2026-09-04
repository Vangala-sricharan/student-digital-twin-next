import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudentTwin } from '../../context/StudentTwinContext';
import { calculateRealReadiness } from '../../lib/readinessScore';
import {
  Sparkles,
  User,
  GraduationCap,
  Briefcase,
  Cpu,
  Link as LinkIcon,
  ArrowRight,
  CheckCircle2,
  X,
  Plus,
  Compass,
} from 'lucide-react';

interface StudentOnboardingModalProps {
  onComplete?: () => void;
}

export const StudentOnboardingModal: React.FC<StudentOnboardingModalProps> = ({ onComplete }) => {
  const { user, userProfile, updateProfile: updateAuthProfile } = useAuth();
  const { profile, updateProfile, addSkill, updateCareerGoal } = useStudentTwin();

  // Form State initialized strictly with authenticated data, zero fake defaults
  const [fullName, setFullName] = useState(
    profile?.fullName ||
      profile?.name ||
      userProfile?.fullName ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      ''
  );
  const email = user?.email || userProfile?.email || profile?.email || '';
  const [university, setUniversity] = useState(profile?.university || '');
  const [degree, setDegree] = useState(profile?.degree || '');
  const [branch, setBranch] = useState(profile?.branch || '');
  const [yearOfStudy, setYearOfStudy] = useState(profile?.yearOfStudy || '');
  const [gradYear, setGradYear] = useState(profile?.gradYear || '');
  const [targetRole, setTargetRole] = useState(profile?.targetRole || '');
  const [careerGoal, setCareerGoal] = useState('');
  const [bio, setBio] = useState(profile?.bio || '');
  const [githubUrl, setGithubUrl] = useState(profile?.githubUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolioUrl || '');

  // Skills Tag Input
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const popularSkills = [
    'TypeScript',
    'Python',
    'React',
    'Node.js',
    'C++',
    'Java',
    'PostgreSQL',
    'Docker',
    'Algorithms & DSA',
    'Machine Learning',
  ];

  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skillsList.includes(trimmed)) {
      setSkillsList([...skillsList, trimmed]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please provide your Full Name.');
      return;
    }
    if (!university.trim()) {
      setErrorMsg('Please specify your University or Institution.');
      return;
    }
    if (!degree.trim()) {
      setErrorMsg('Please select or specify your Degree program.');
      return;
    }
    if (!targetRole.trim()) {
      setErrorMsg('Please specify your Target Engineering or Career Role.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Calculate real initial readiness score strictly from actual entered evidence
      const initialSkills = skillsList.map((skillName, idx) => ({
        id: `init-skill-${idx}`,
        name: skillName,
        category: 'Software Engineering',
        proficiency: 70,
        verified: false,
        proofCount: 0,
        lastAssessed: new Date().toISOString().split('T')[0],
      }));

      const readinessCalc = calculateRealReadiness(
        {
          name: fullName.trim(),
          university: university.trim(),
          degree: degree.trim(),
          branch: branch.trim(),
          targetRole: targetRole.trim(),
          bio: bio.trim(),
          githubUrl: githubUrl.trim(),
          linkedinUrl: linkedinUrl.trim(),
          portfolioUrl: portfolioUrl.trim(),
        },
        initialSkills,
        [],
        []
      );
      const initialReadiness = readinessCalc.overallScore;

      // 2. Update Student Twin Profile with isOnboarded = true
      await updateProfile({
        name: fullName.trim(),
        fullName: fullName.trim(),
        displayName: fullName.trim(),
        university: university.trim(),
        degree: degree.trim(),
        branch: branch.trim(),
        academicProgram: branch.trim() ? `${degree.trim()} in ${branch.trim()}` : degree.trim(),
        yearOfStudy: yearOfStudy.trim(),
        year: yearOfStudy.replace(' Year', '').trim(),
        gradYear: gradYear.trim(),
        targetRole: targetRole.trim(),
        careerFocus: careerGoal.trim() || targetRole.trim(),
        bio: bio.trim(),
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
        readinessScore: initialReadiness,
        isOnboarded: true,
        status: 'Active Twin',
      });

      // 3. Update Auth context profile if applicable
      if (updateAuthProfile) {
        await updateAuthProfile({
          fullName: fullName.trim(),
        });
      }

      // 4. Add initial skills to the user's ontology
      for (const skillName of skillsList) {
        addSkill({
          name: skillName,
          category: 'Software Engineering',
          proficiency: 75,
          verified: false,
          proofCount: 1,
        });
      }

      // 5. Update Career Placement Goal
      if (careerGoal.trim() || targetRole.trim()) {
        updateCareerGoal({
          title: careerGoal.trim() || `${targetRole.trim()} Placement Milestone`,
          targetRole: targetRole.trim(),
          progress: 25,
          status: 'Active',
          requiredSkills: skillsList,
        });
      }

      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete initial calibration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl p-6 sm:p-10 space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header Badge & Title */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-[11px] font-bold uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Twin Calibration Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Configure Your Student Twin
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Welcome to the Student Digital Twin OS. Please provide your genuine academic and career details to initialize your personal career intelligence model.
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Calibration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Personal & Institutional Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
              <User className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                1. Identity & Institution
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Authenticated Email</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">University / College *</label>
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Stanford University or Delhi Technological University"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Program */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
              <GraduationCap className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                2. Academic Program & Timeline
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Degree Program *</label>
                <select
                  required
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="" className="text-slate-400">Select Degree</option>
                  <option value="B.Tech">B.Tech / B.E.</option>
                  <option value="B.S.">B.S. / Bachelor of Science</option>
                  <option value="BCA">BCA</option>
                  <option value="M.Tech">M.Tech / M.E.</option>
                  <option value="M.S.">M.S. / Master of Science</option>
                  <option value="MCA">MCA</option>
                  <option value="Other">Other Degree</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Branch / Major</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Academic Standing Year</label>
                <select
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="" className="text-slate-400">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate / Masters</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Expected Graduation</label>
                <input
                  type="text"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  placeholder="e.g. 2026 or 2027"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Target Role & Career Direction */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                3. Career Target & Placement Goals
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Target Role *</label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full-Stack Software Engineer or AI/ML Engineer"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Placement Focus / Timeline</label>
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. Tier-1 Placement or Research Fellowship"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Professional Bio / About</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A concise summary of your technical interests and engineering background..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Skills Ontology */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
              <Cpu className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                4. Verified Core Competencies
              </h3>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(skillInput);
                    }
                  }}
                  placeholder="Type a skill (e.g. React, Python) and press Add or Enter"
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkill(skillInput)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Selected Skills Chips */}
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-white/10 border border-blue-200 dark:border-white/10 text-blue-600 dark:text-cyan-300 text-xs font-medium"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Popular Skill Quick Add Suggestions */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[10px] text-slate-400 font-mono mr-1">Quick add:</span>
                {popularSkills.map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => handleAddSkill(sk)}
                    disabled={skillsList.includes(sk)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono transition-all cursor-pointer ${
                      skillsList.includes(sk)
                        ? 'opacity-40 bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-cyan-400'
                    }`}
                  >
                    +{sk}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Public Proof Profiles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
              <LinkIcon className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                5. Code & Professional Links
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">GitHub Profile URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/yourusername"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-500 dark:text-slate-400">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourusername"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Calibrating Personal Digital Twin...</span>
              ) : (
                <>
                  <span>Complete Twin Setup & Enter Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
