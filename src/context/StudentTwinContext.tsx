import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  StudentProfile,
  SkillItem,
  ProjectItem,
  AchievementItem,
  CertificationItem,
  ParticipationItem,
  CareerGoal,
  DigitalTwinReport,
  SubscriptionPlan,
  SubscriptionTier,
} from '../types';
import {
  DEMO_STUDENT_PROFILE,
  DEMO_SKILLS,
  DEMO_PROJECTS,
  DEMO_CERTIFICATIONS,
  DEMO_PARTICIPATIONS,
  DEMO_ACHIEVEMENTS,
  DEMO_CAREER_GOAL,
  DEMO_CAREER_GOALS,
  DEMO_DIGITAL_TWIN_REPORT,
} from '../data/demoData';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured, withTimeout } from '../lib/supabase';
import { calculateRealReadiness, ReadinessBreakdown, PILLAR_WEIGHTS } from '../lib/readinessScore';

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    planName: 'Free Foundation',
    price: '₹0',
    billingPeriod: 'Forever Free',
    priceNum: 0,
    isSimulated: true,
  },
  pro_monthly: {
    tier: 'pro_monthly',
    planName: 'Pro Monthly',
    price: '₹299',
    billingPeriod: 'per month',
    priceNum: 299,
    isSimulated: true,
  },
  pro_annual: {
    tier: 'pro_annual',
    planName: 'Pro Annual',
    price: '₹1,499',
    billingPeriod: 'per year',
    priceNum: 1499,
    isSimulated: true,
  },
  campus: {
    tier: 'campus',
    planName: 'Campus / Enterprise',
    price: '₹12,999',
    billingPeriod: 'per institution / year',
    priceNum: 12999,
    isSimulated: true,
  },
};

interface StudentTwinContextType {
  isDemoMode: boolean;
  setIsDemoMode: (isDemo: boolean) => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  isDemoLockOpen: boolean;
  openDemoLockModal: () => void;
  closeDemoLockModal: () => void;
  requireAuthAction: (action: () => void) => void;
  profile: StudentProfile;
  activeProfile: StudentProfile;
  allProfiles: StudentProfile[];
  skills: SkillItem[];
  projects: ProjectItem[];
  achievements: AchievementItem[];
  certifications: CertificationItem[];
  participations: ParticipationItem[];
  careerGoal: CareerGoal;
  careerGoals: CareerGoal[];
  digitalTwinReport: DigitalTwinReport;
  readinessBreakdown: ReadinessBreakdown;
  subscription: SubscriptionPlan;
  isPro: boolean;
  isTwinHydrating: boolean;
  isTwinReady: boolean;
  isLoading: boolean;
  switchProfile: (profileId: string) => void;
  addNewStudentProfile: (profileData: Partial<StudentProfile>) => Promise<void>;
  updateProfile: (profileData: Partial<StudentProfile>) => Promise<{ error?: any; success?: boolean }>;
  updateStudentProfile: (profileData: Partial<StudentProfile>) => Promise<void>;
  uploadAvatar: (avatarDataUrl: string) => Promise<{ success: boolean; avatarUrl: string }>;
  removeAvatar: () => Promise<void>;
  upgradeSubscription: (tier: SubscriptionTier) => Promise<{ success: boolean; plan: SubscriptionPlan }>;
  addSkill: (skill: Omit<SkillItem, 'id' | 'lastAssessed'>) => void;
  updateSkill: (id: string, updates: Partial<SkillItem>) => void;
  removeSkill: (id: string) => void;
  addProject: (project: Omit<ProjectItem, 'id'>) => void;
  updateProject: (id: string, updates: Partial<ProjectItem>) => void;
  removeProject: (id: string) => void;
  addAchievement: (achievement: Omit<AchievementItem, 'id'>) => void;
  updateAchievement: (id: string, updates: Partial<AchievementItem>) => void;
  removeAchievement: (id: string) => void;
  addCertification: (cert: Omit<CertificationItem, 'id'>) => void;
  updateCertification: (id: string, updates: Partial<CertificationItem>) => void;
  removeCertification: (id: string) => void;
  addParticipation: (part: Omit<ParticipationItem, 'id'>) => void;
  updateParticipation: (id: string, updates: Partial<ParticipationItem>) => void;
  removeParticipation: (id: string) => void;
  updateCareerGoal: (goal: Partial<CareerGoal>) => void;
}

const StudentTwinContext = createContext<StudentTwinContextType | undefined>(undefined);

const USER_STUDENT_PROFILES_KEY = 'sdt_user_profiles_v4';
const USER_SUBSCRIPTION_KEY = 'sdt_user_subscription_v4';
const USER_SKILLS_KEY = 'sdt_user_skills_v4';
const USER_PROJECTS_KEY = 'sdt_user_projects_v4';
const USER_ACHIEVEMENTS_KEY = 'sdt_user_achievements_v4';
const USER_CERTIFICATIONS_KEY = 'sdt_user_certifications_v4';
const USER_PARTICIPATIONS_KEY = 'sdt_user_participations_v4';
const USER_GOALS_KEY = 'sdt_user_goals_v4';

export const StudentTwinProvider: React.FC<{
  isDemoInitial?: boolean;
  children: React.ReactNode;
}> = ({ isDemoInitial = false, children }) => {
  const { user, userProfile, updateProfile: updateAuthProfile } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState<boolean>(isDemoInitial);

  const enterDemoMode = () => setIsDemoMode(true);
  const exitDemoMode = () => setIsDemoMode(false);

  // Demo Lock Modal trigger state
  const [isDemoLockOpen, setIsDemoLockOpen] = useState<boolean>(false);
  const openDemoLockModal = () => setIsDemoLockOpen(true);
  const closeDemoLockModal = () => setIsDemoLockOpen(false);

  const requireAuthAction = (action: () => void) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    action();
  };

  // Authenticated user's own profiles list
  const [userProfiles, setUserProfiles] = useState<StudentProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');

  // Subscription state (defaults strictly to free)
  const [subscription, setSubscription] = useState<SubscriptionPlan>(SUBSCRIPTION_PLANS.free);

  // Authenticated user's individual records (strictly empty for new users)
  const [userSkills, setUserSkills] = useState<SkillItem[]>([]);
  const [userProjects, setUserProjects] = useState<ProjectItem[]>([]);
  const [userAchievements, setUserAchievements] = useState<AchievementItem[]>([]);
  const [userCertifications, setUserCertifications] = useState<CertificationItem[]>([]);
  const [userParticipations, setUserParticipations] = useState<ParticipationItem[]>([]);
  const [userCareerGoals, setUserCareerGoals] = useState<CareerGoal[]>([]);

  const [isTwinHydrating, setIsTwinHydrating] = useState<boolean>(false);
  const [isTwinReady, setIsTwinReady] = useState<boolean>(false);

  // Load authenticated student data whenever authenticated user changes
  useEffect(() => {
    if (!user) {
      setUserProfiles([]);
      setActiveProfileId('');
      setUserSkills([]);
      setUserProjects([]);
      setUserAchievements([]);
      setUserCertifications([]);
      setUserParticipations([]);
      setUserCareerGoals([]);
      setSubscription(SUBSCRIPTION_PLANS.free);
      setIsTwinHydrating(false);
      setIsTwinReady(false);
      return;
    }

    async function loadUserData() {
      const userId = user!.id;
      setIsTwinHydrating(true);

      // STEP 1: FAST LOCAL-FIRST HYDRATION (0ms Latency)
      // Immediately hydrate existing user profiles and records from user-scoped storage
      const profileStorageKey = `${USER_STUDENT_PROFILES_KEY}_${userId}`;
      const localSavedProfiles = localStorage.getItem(profileStorageKey);
      let hasCachedProfiles = false;

      if (localSavedProfiles) {
        try {
          const parsed = JSON.parse(localSavedProfiles);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUserProfiles(parsed);
            setActiveProfileId(parsed[0].id);
            hasCachedProfiles = true;
            // Mark ready immediately so returning users never see an onboarding modal
            setIsTwinReady(true);
          }
        } catch {
          // parse error fallback
        }
      }

      // Load Subscription scoped to user.id immediately
      const subStorageKey = `${USER_SUBSCRIPTION_KEY}_${userId}`;
      const savedSub = localStorage.getItem(subStorageKey);
      if (savedSub) {
        try {
          const parsedSub = JSON.parse(savedSub);
          if (parsedSub && parsedSub.tier && SUBSCRIPTION_PLANS[parsedSub.tier as SubscriptionTier]) {
            setSubscription(parsedSub);
          }
        } catch (e) {
          console.error('Failed to parse subscription', e);
        }
      } else {
        setSubscription(SUBSCRIPTION_PLANS.free);
      }

      // Load User Skills, Projects, Achievements, Certifications, Participations, Goals from user-scoped storage immediately
      const skillsStorageKey = `${USER_SKILLS_KEY}_${userId}`;
      const projectsStorageKey = `${USER_PROJECTS_KEY}_${userId}`;
      const achStorageKey = `${USER_ACHIEVEMENTS_KEY}_${userId}`;
      const certStorageKey = `${USER_CERTIFICATIONS_KEY}_${userId}`;
      const partStorageKey = `${USER_PARTICIPATIONS_KEY}_${userId}`;
      const goalsStorageKey = `${USER_GOALS_KEY}_${userId}`;

      const savedSkills = localStorage.getItem(skillsStorageKey);
      const savedProjects = localStorage.getItem(projectsStorageKey);
      const savedAch = localStorage.getItem(achStorageKey);
      const savedCerts = localStorage.getItem(certStorageKey);
      const savedParts = localStorage.getItem(partStorageKey);
      const savedGoals = localStorage.getItem(goalsStorageKey);

      if (savedSkills) {
        try {
          const parsed = JSON.parse(savedSkills);
          if (Array.isArray(parsed)) setUserSkills(parsed);
        } catch (e) {}
      } else {
        setUserSkills([]);
      }

      if (savedProjects) {
        try {
          const parsed = JSON.parse(savedProjects);
          if (Array.isArray(parsed)) setUserProjects(parsed);
        } catch (e) {}
      } else {
        setUserProjects([]);
      }

      if (savedAch) {
        try {
          const parsed = JSON.parse(savedAch);
          if (Array.isArray(parsed)) setUserAchievements(parsed);
        } catch (e) {}
      } else {
        setUserAchievements([]);
      }

      if (savedCerts) {
        try {
          const parsed = JSON.parse(savedCerts);
          if (Array.isArray(parsed)) setUserCertifications(parsed);
        } catch (e) {}
      } else {
        setUserCertifications([]);
      }

      if (savedParts) {
        try {
          const parsed = JSON.parse(savedParts);
          if (Array.isArray(parsed)) setUserParticipations(parsed);
        } catch (e) {}
      } else {
        setUserParticipations([]);
      }

      if (savedGoals) {
        try {
          const parsed = JSON.parse(savedGoals);
          if (Array.isArray(parsed)) setUserCareerGoals(parsed);
        } catch (e) {}
      } else {
        setUserCareerGoals([]);
      }

      // STEP 2: CLOUD SYNCHRONIZATION WITH STRICT TIMEOUT (Max 3500ms)
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await withTimeout(
            supabase
              .from('student_profiles')
              .select('*')
              .eq('user_id', userId),
            3500,
            { data: null, error: null } as any
          );

          if (data && data.length > 0 && !error) {
            const mappedProfiles: StudentProfile[] = data.map((item) => ({
              id: item.id,
              userId: item.user_id,
              isDemo: false,
              name: item.name || '',
              fullName: item.display_name || item.name || '',
              displayName: item.display_name || item.name || '',
              role: item.role || '',
              headline: item.headline || '',
              university: item.university || '',
              academicProgram: item.academic_program || '',
              degree: item.degree || '',
              branch: item.branch || '',
              year: item.year || '',
              yearOfStudy: item.year_of_study || '',
              gradYear: item.grad_year || '',
              careerFocus: item.career_focus || '',
              specialty: item.specialty || '',
              bio: item.bio || '',
              avatarUrl: item.avatar_url || '',
              email: item.email || user?.email || '',
              phone: item.phone || '',
              githubUrl: item.github_url || '',
              linkedinUrl: item.linkedin_url || '',
              portfolioUrl: item.portfolio_url || '',
              location: item.location || '',
              readinessScore: item.readiness_score || 0,
              skillsVerifiedCount: item.skills_verified_count || 0,
              projectIndexCount: item.project_index_count || 0,
              milestonesCount: item.milestones_count || 0,
              targetRole: item.target_role || '',
              targetCompanyTier: item.target_company_tier || '',
              currentGpa: item.current_gpa || '',
              cgpa: item.cgpa || 0,
              semester: item.semester || '',
              status: (item.status as any) || 'Active Twin',
              subscriptionTier: item.subscription_tier || 'free',
              isOnboarded: Boolean(item.university && (item.degree || item.target_role)),
              createdAt: item.created_at,
            }));

            setUserProfiles(mappedProfiles);
            setActiveProfileId(mappedProfiles[0].id);
            localStorage.setItem(profileStorageKey, JSON.stringify(mappedProfiles));

            if (mappedProfiles[0]?.subscriptionTier && SUBSCRIPTION_PLANS[mappedProfiles[0].subscriptionTier as SubscriptionTier]) {
              const cloudPlan = SUBSCRIPTION_PLANS[mappedProfiles[0].subscriptionTier as SubscriptionTier];
              setSubscription(cloudPlan);
              localStorage.setItem(`${USER_SUBSCRIPTION_KEY}_${userId}`, JSON.stringify(cloudPlan));
            }
            return;
          }
        }

        // If user already had cached profiles, keep them
        if (hasCachedProfiles) {
          return;
        }

        // STEP 3: BRAND NEW USER INITIALIZATION (ZERO DUMMY DATA)
        // Only reached when user genuinely has neither cloud profiles nor local cached profiles
        const userName = userProfile?.fullName || user!.user_metadata?.full_name || '';
        const initialProfile: StudentProfile = {
          id: `profile-${userId}`,
          userId: userId,
          isDemo: false,
          name: userName,
          fullName: userName,
          displayName: userName,
          role: '',
          headline: '',
          university: '',
          academicProgram: '',
          degree: '',
          branch: '',
          year: '',
          yearOfStudy: '',
          gradYear: '',
          careerFocus: '',
          specialty: '',
          bio: '',
          avatarUrl: userProfile?.avatarUrl || user!.user_metadata?.avatar_url || '',
          email: user?.email || '',
          phone: '',
          githubUrl: '',
          linkedinUrl: '',
          portfolioUrl: '',
          location: '',
          readinessScore: 0,
          skillsVerifiedCount: 0,
          projectIndexCount: 0,
          milestonesCount: 0,
          targetRole: '',
          targetCompanyTier: '',
          currentGpa: '',
          cgpa: 0,
          semester: '',
          status: 'Draft',
          subscriptionTier: 'free',
          isOnboarded: false,
          createdAt: new Date().toISOString(),
        };

        setUserProfiles([initialProfile]);
        setActiveProfileId(initialProfile.id);
        localStorage.setItem(profileStorageKey, JSON.stringify([initialProfile]));
      } catch (err) {
        console.warn('Student profile background sync caught:', err);
      } finally {
        setIsTwinHydrating(false);
        setIsTwinReady(true);
      }
    }

    loadUserData();
  }, [user?.id]);

  // Active Profile Calculation (Strict zero-demo fallback for authenticated users)
  const rawActiveProfile: StudentProfile = isDemoMode
    ? DEMO_STUDENT_PROFILE
    : userProfiles.find((p) => p.id === activeProfileId) ||
      userProfiles[0] || {
        id: user ? `profile-${user.id}` : 'empty-profile',
        userId: user?.id,
        isDemo: false,
        name: userProfile?.fullName || user?.user_metadata?.full_name || '',
        fullName: userProfile?.fullName || user?.user_metadata?.full_name || '',
        displayName: userProfile?.fullName || user?.user_metadata?.full_name || '',
        role: '',
        headline: '',
        university: '',
        academicProgram: '',
        degree: '',
        branch: '',
        year: '',
        yearOfStudy: '',
        gradYear: '',
        careerFocus: '',
        specialty: '',
        bio: '',
        avatarUrl: userProfile?.avatarUrl || user?.user_metadata?.avatar_url || '',
        email: user?.email || '',
        phone: '',
        githubUrl: '',
        linkedinUrl: '',
        portfolioUrl: '',
        location: '',
        readinessScore: 0,
        skillsVerifiedCount: 0,
        projectIndexCount: 0,
        milestonesCount: 0,
        targetRole: '',
        targetCompanyTier: '',
        currentGpa: '',
        cgpa: 0,
        semester: '',
        status: 'Draft',
        subscriptionTier: subscription.tier || 'free',
        createdAt: new Date().toISOString(),
      };

  const skills: SkillItem[] = isDemoMode ? DEMO_SKILLS : userSkills;
  const projects: ProjectItem[] = isDemoMode ? DEMO_PROJECTS : userProjects;
  const achievements: AchievementItem[] = isDemoMode ? DEMO_ACHIEVEMENTS : userAchievements;
  const certifications: CertificationItem[] = isDemoMode ? DEMO_CERTIFICATIONS : userCertifications;
  const participations: ParticipationItem[] = isDemoMode ? DEMO_PARTICIPATIONS : userParticipations;
  const careerGoals: CareerGoal[] = isDemoMode ? DEMO_CAREER_GOALS : userCareerGoals;

  // Deterministically compute dynamic readiness breakdown purely from verified user evidence across the 4 pillars
  const dynamicReadiness: ReadinessBreakdown = isDemoMode
    ? {
        overallScore: 94,
        skillsCoverage: 95,
        projectPortfolio: 96,
        industryAlignment: 94,
        verifications: 92,
        pillarWeights: { ...PILLAR_WEIGHTS },
        codeProofHealth: 96,
        marketAlignment: 94,
        verificationIndex: 92,
        foundationScore: 15,
        skillsScore: 25,
        projectsScore: 30,
        achievementsScore: 15,
        profilesScore: 15,
        hasEvidence: true,
        evidenceCounts: {
          skills: DEMO_SKILLS.length,
          verifiedSkills: DEMO_SKILLS.filter((s) => s.verified).length,
          projects: DEMO_PROJECTS.length,
          achievements: DEMO_ACHIEVEMENTS.length,
          hasGithub: true,
          hasLinkedin: true,
          hasPortfolio: true,
          hasTargetRole: true,
          hasCareerGoal: true,
        },
      }
    : calculateRealReadiness(rawActiveProfile, userSkills, userProjects, userAchievements, userCareerGoals);

  // Authenticated activeProfile always adopts the calculated evidence score
  const activeProfile: StudentProfile = isDemoMode
    ? DEMO_STUDENT_PROFILE
    : {
        ...rawActiveProfile,
        readinessScore: dynamicReadiness.overallScore,
        skillsVerifiedCount: userSkills.filter((s) => Boolean(s.verified)).length,
        projectIndexCount: userProjects.length,
        milestonesCount: userAchievements.length,
      };

  const allProfiles: StudentProfile[] = isDemoMode
    ? [DEMO_STUDENT_PROFILE]
    : userProfiles.map((p) =>
        p.id === activeProfileId
          ? { ...p, readinessScore: dynamicReadiness.overallScore }
          : p
      );

  const careerGoal: CareerGoal = isDemoMode ? DEMO_CAREER_GOAL : (userCareerGoals[0] || {
    id: 'user-goal-empty',
    title: '',
    targetRole: activeProfile.targetRole || '',
    targetDomain: '',
    targetTimeline: '',
    targetDate: '',
    progress: dynamicReadiness.overallScore,
    status: dynamicReadiness.hasEvidence ? 'Active' : 'Planned',
    confidenceScore: dynamicReadiness.overallScore,
    requiredSkills: [],
    acquiredSkills: [],
    keyMilestones: [],
  });

  const dynamicReportScore = dynamicReadiness.overallScore;

  const digitalTwinReport: DigitalTwinReport = isDemoMode
    ? DEMO_DIGITAL_TWIN_REPORT
    : {
        overallScore: dynamicReportScore,
        codeProofHealth: dynamicReadiness.codeProofHealth,
        marketRoleAlignment: dynamicReadiness.marketAlignment,
        academicIndex: activeProfile.cgpa ? Math.min(100, Math.round(Number(activeProfile.cgpa) * 10)) : 0,
        dsaProficiency: skills.some((s) => s.category?.toLowerCase().includes('algorithm') || s.name.toLowerCase().includes('dsa')) ? 75 : 0,
        careerVelocity: dynamicReadiness.hasEvidence ? Math.min(100, (skills.length + projects.length) * 10) : 0,
        primaryInsight: dynamicReadiness.hasEvidence
          ? `Twin profile active with ${skills.length} skills, ${projects.length} repository projects, and ${achievements.length} verified milestones.`
          : 'Your Student Twin is ready to be built. Add your skills, projects, and achievements to calibrate your readiness index.',
        recommendedNextStep: projects.length === 0
          ? 'Add your first verified project repository in Projects.'
          : skills.length === 0
          ? 'Add your core technical skills in Skills to calibrate role alignment.'
          : 'Run an AI Career Engine like Project Auditor or Resume ATS Analyzer to evaluate placement readiness.',
        vectors: [
          {
            dimension: 'Skills Coverage',
            score: dynamicReadiness.skillsCoverage,
            benchmark: 80,
            status: dynamicReadiness.skillsCoverage >= 75 ? 'Optimal' : dynamicReadiness.skillsCoverage > 0 ? 'On Track' : 'Needs Attention',
            insight: skills.length > 0 ? `${skills.length} competencies indexed.` : 'Add technical skills to calibrate coverage.',
          },
          {
            dimension: 'Project Portfolio',
            score: dynamicReadiness.projectPortfolio,
            benchmark: 75,
            status: dynamicReadiness.projectPortfolio >= 75 ? 'Optimal' : dynamicReadiness.projectPortfolio > 0 ? 'On Track' : 'Needs Attention',
            insight: projects.length > 0 ? `${projects.length} repository projects indexed.` : 'Add GitHub projects to evaluate code authenticity.',
          },
          {
            dimension: 'Industry Alignment',
            score: dynamicReadiness.industryAlignment,
            benchmark: 80,
            status: dynamicReadiness.industryAlignment >= 75 ? 'Optimal' : dynamicReadiness.industryAlignment > 0 ? 'On Track' : 'Needs Attention',
            insight: activeProfile.targetRole ? `Targeting ${activeProfile.targetRole}.` : 'Specify target role to align skills.',
          },
          {
            dimension: 'Verifications',
            score: dynamicReadiness.verifications,
            benchmark: 70,
            status: dynamicReadiness.verifications >= 75 ? 'Optimal' : dynamicReadiness.verifications > 0 ? 'On Track' : 'Needs Attention',
            insight: (achievements.length > 0 || activeProfile.githubUrl) ? 'Verifications recorded.' : 'Connect GitHub, LinkedIn, or add distinctions.',
          },
          {
            dimension: 'Academic Standing',
            score: activeProfile.cgpa ? Math.min(100, Math.round(Number(activeProfile.cgpa) * 10)) : 0,
            benchmark: 75,
            status: activeProfile.cgpa && Number(activeProfile.cgpa) >= 8 ? 'Optimal' : activeProfile.cgpa ? 'On Track' : 'Needs Attention',
            insight: activeProfile.cgpa ? `CGPA of ${activeProfile.cgpa} recorded.` : 'Add academic GPA in profile.',
          },
        ],
      };

  const switchProfile = (profileId: string) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    setActiveProfileId(profileId);
  };

  const updateStudentProfile = async (profileData: Partial<StudentProfile>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    
    // Deterministically recompute readiness score strictly from verified user evidence
    const candidateProfile = { ...activeProfile, ...profileData };
    const realBreakdown = calculateRealReadiness(
      candidateProfile,
      userSkills,
      userProjects,
      userAchievements,
      userCareerGoals
    );

    const mergedData = {
      ...profileData,
      readinessScore: realBreakdown.overallScore,
    };

    setUserProfiles((prev) =>
      prev.map((p) => (p.id === activeProfile.id ? { ...p, ...mergedData } : p))
    );

    if (user) {
      const updated = userProfiles.map((p) =>
        p.id === activeProfile.id ? { ...p, ...mergedData } : p
      );
      localStorage.setItem(`${USER_STUDENT_PROFILES_KEY}_${user.id}`, JSON.stringify(updated));

      if (isSupabaseConfigured) {
        withTimeout(
          supabase
            .from('student_profiles')
            .upsert({
              id: activeProfile.id,
              user_id: user.id,
              name: mergedData.name || mergedData.fullName,
              display_name: mergedData.displayName || mergedData.fullName,
              role: mergedData.role,
              headline: mergedData.headline,
              university: mergedData.university,
              academic_program: mergedData.academicProgram,
              degree: mergedData.degree,
              branch: mergedData.branch,
              year: mergedData.year,
              year_of_study: mergedData.yearOfStudy,
              grad_year: mergedData.gradYear,
              career_focus: mergedData.careerFocus,
              specialty: mergedData.specialty,
              bio: mergedData.bio,
              avatar_url: mergedData.avatarUrl,
              phone: mergedData.phone,
              github_url: mergedData.githubUrl,
              linkedin_url: mergedData.linkedinUrl,
              portfolio_url: mergedData.portfolioUrl,
              location: mergedData.location,
              current_gpa: mergedData.currentGpa,
              cgpa: mergedData.cgpa,
              semester: mergedData.semester,
              target_role: mergedData.targetRole,
              target_company_tier: mergedData.targetCompanyTier,
              readiness_score: mergedData.readinessScore,
              skills_verified_count: userSkills.filter((s) => Boolean(s.verified)).length,
              project_index_count: userProjects.length,
              milestones_count: userAchievements.length,
              status: mergedData.status,
            }),
          3500
        ).catch((err) => {
          console.warn('Student profile cloud update notice:', err);
        });
      }
    }
  };

  const updateProfile = async (profileData: Partial<StudentProfile>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return { error: new Error('Demo mode is read-only. Please create an account to customize your profile.'), success: false };
    }
    try {
      await updateStudentProfile(profileData);
      return { success: true };
    } catch (err) {
      return { error: err, success: false };
    }
  };

  // Upload or replace student profile picture (Strictly read-only in demo mode)
  const uploadAvatar = async (avatarDataUrl: string): Promise<{ success: boolean; avatarUrl: string }> => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return { success: false, avatarUrl: '' };
    }
    try {
      await updateStudentProfile({ avatarUrl: avatarDataUrl });
      if (updateAuthProfile) {
        await updateAuthProfile({ avatarUrl: avatarDataUrl });
      }
      return { success: true, avatarUrl: avatarDataUrl };
    } catch (err) {
      console.error('Avatar upload failed:', err);
      return { success: false, avatarUrl: '' };
    }
  };

  // Remove student profile picture (Strictly read-only in demo mode)
  const removeAvatar = async (): Promise<void> => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    await updateStudentProfile({ avatarUrl: undefined });
    if (updateAuthProfile) {
      await updateAuthProfile({ avatarUrl: undefined });
    }
  };

  // Upgrade or change subscription tier (Simulated Payment Sandbox)
  const upgradeSubscription = async (tier: SubscriptionTier): Promise<{ success: boolean; plan: SubscriptionPlan }> => {
    const planBase = SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.free;
    const activatedPlan: SubscriptionPlan = {
      ...planBase,
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isSimulated: true,
    };

    setSubscription(activatedPlan);

    if (user) {
      const subStorageKey = `${USER_SUBSCRIPTION_KEY}_${user.id}`;
      localStorage.setItem(subStorageKey, JSON.stringify(activatedPlan));
      await updateStudentProfile({ subscriptionTier: tier });
    }

    return { success: true, plan: activatedPlan };
  };

  const addNewStudentProfile = async (profileData: Partial<StudentProfile>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }

    const newId = `profile-${Date.now()}`;
    const newProfile: StudentProfile = {
      id: newId,
      userId: user?.id,
      isDemo: false,
      name: profileData.name || 'New Student',
      fullName: profileData.fullName || profileData.name || 'New Student',
      displayName: profileData.displayName || profileData.name || 'New Student',
      role: profileData.role || '',
      headline: profileData.headline || '',
      university: profileData.university || '',
      academicProgram: profileData.academicProgram || '',
      degree: profileData.degree || '',
      branch: profileData.branch || '',
      year: profileData.year || '',
      yearOfStudy: profileData.yearOfStudy || '',
      gradYear: profileData.gradYear || '',
      careerFocus: profileData.careerFocus || '',
      specialty: profileData.specialty || '',
      bio: profileData.bio || '',
      avatarUrl: profileData.avatarUrl,
      email: profileData.email || user?.email || '',
      phone: profileData.phone || '',
      githubUrl: profileData.githubUrl || '',
      linkedinUrl: profileData.linkedinUrl || '',
      portfolioUrl: profileData.portfolioUrl || '',
      location: profileData.location || '',
      readinessScore: 0,
      skillsVerifiedCount: 0,
      projectIndexCount: 0,
      milestonesCount: 0,
      targetRole: profileData.targetRole || '',
      targetCompanyTier: profileData.targetCompanyTier || '',
      currentGpa: profileData.currentGpa || '',
      cgpa: 0,
      semester: '',
      status: 'Draft',
      subscriptionTier: subscription.tier,
      createdAt: new Date().toISOString(),
    };

    const updated = [...userProfiles, newProfile];
    setUserProfiles(updated);
    setActiveProfileId(newId);

    if (user) {
      localStorage.setItem(`${USER_STUDENT_PROFILES_KEY}_${user.id}`, JSON.stringify(updated));

      if (isSupabaseConfigured) {
        withTimeout(
          supabase.from('student_profiles').insert({
            id: newId,
            user_id: user.id,
            name: newProfile.name,
            display_name: newProfile.displayName,
            role: newProfile.role,
            headline: newProfile.headline,
            university: newProfile.university,
            academic_program: newProfile.academicProgram,
            year_of_study: newProfile.yearOfStudy,
            career_focus: newProfile.careerFocus,
            specialty: newProfile.specialty,
            bio: newProfile.bio,
            avatar_url: newProfile.avatarUrl,
            github_url: newProfile.githubUrl,
            linkedin_url: newProfile.linkedinUrl,
            location: newProfile.location,
            readiness_score: 0,
          }),
          3000
        ).catch((err) => {
          console.warn('Student profile cloud insert notice:', err);
        });
      }
    }
  };

  const syncEvidenceCountersToCloud = (
    nextSkills: SkillItem[],
    nextProjects: ProjectItem[],
    nextAchievements: AchievementItem[],
    nextGoals: CareerGoal[]
  ) => {
    if (!user || isDemoMode || !isSupabaseConfigured) return;
    const computed = calculateRealReadiness(
      rawActiveProfile,
      nextSkills,
      nextProjects,
      nextAchievements,
      nextGoals
    );
    withTimeout(
      supabase
        .from('student_profiles')
        .update({
          skills_verified_count: nextSkills.filter((s) => Boolean(s.verified)).length,
          project_index_count: nextProjects.length,
          milestones_count: nextAchievements.length,
          readiness_score: computed.overallScore,
        })
        .eq('id', activeProfile.id),
      3000
    ).catch((err) => {
      console.warn('Background metrics sync caught:', err);
    });
  };

  const addSkill = (skillData: Omit<SkillItem, 'id' | 'lastAssessed'>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const newSkill: SkillItem = {
      ...skillData,
      id: `skill-${Date.now()}`,
      lastAssessed: new Date().toISOString().split('T')[0],
    };
    const updated = [newSkill, ...userSkills];
    setUserSkills(updated);
    if (user) {
      localStorage.setItem(`${USER_SKILLS_KEY}_${user.id}`, JSON.stringify(updated));
      syncEvidenceCountersToCloud(updated, userProjects, userAchievements, userCareerGoals);
    }
  };

  const updateSkill = (id: string, updates: Partial<SkillItem>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userSkills.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setUserSkills(updated);
    if (user) {
      localStorage.setItem(`${USER_SKILLS_KEY}_${user.id}`, JSON.stringify(updated));
      syncEvidenceCountersToCloud(updated, userProjects, userAchievements, userCareerGoals);
    }
  };

  const removeSkill = (id: string) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userSkills.filter((s) => s.id !== id);
    setUserSkills(updated);
    if (user) {
      localStorage.setItem(`${USER_SKILLS_KEY}_${user.id}`, JSON.stringify(updated));
      syncEvidenceCountersToCloud(updated, userProjects, userAchievements, userCareerGoals);
    }
  };

  const addProject = (projectData: Omit<ProjectItem, 'id'>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const newProject: ProjectItem = {
      ...projectData,
      id: `proj-${Date.now()}`,
    };
    const updated = [newProject, ...userProjects];
    setUserProjects(updated);
    if (user) {
      localStorage.setItem(`${USER_PROJECTS_KEY}_${user.id}`, JSON.stringify(updated));
      syncEvidenceCountersToCloud(userSkills, updated, userAchievements, userCareerGoals);
    }
  };

  const updateProject = (id: string, updates: Partial<ProjectItem>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userProjects.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setUserProjects(updated);
    if (user) {
      localStorage.setItem(`${USER_PROJECTS_KEY}_${user.id}`, JSON.stringify(updated));
      syncEvidenceCountersToCloud(userSkills, updated, userAchievements, userCareerGoals);
    }
  };

  const removeProject = (id: string) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userProjects.filter((p) => p.id !== id);
    setUserProjects(updated);
    if (user) {
      localStorage.setItem(`${USER_PROJECTS_KEY}_${user.id}`, JSON.stringify(updated));
      syncEvidenceCountersToCloud(userSkills, updated, userAchievements, userCareerGoals);
    }
  };

  const addAchievement = (achievementData: Omit<AchievementItem, 'id'>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const newAchievement: AchievementItem = {
      ...achievementData,
      id: `ach-${Date.now()}`,
    };
    const updated = [newAchievement, ...userAchievements];
    setUserAchievements(updated);
    if (user) {
      localStorage.setItem(`${USER_ACHIEVEMENTS_KEY}_${user.id}`, JSON.stringify(updated));
      syncEvidenceCountersToCloud(userSkills, userProjects, updated, userCareerGoals);
    }
  };

  const updateAchievement = (id: string, updates: Partial<AchievementItem>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userAchievements.map((a) => (a.id === id ? { ...a, ...updates } : a));
    setUserAchievements(updated);
    if (user) {
      localStorage.setItem(`${USER_ACHIEVEMENTS_KEY}_${user.id}`, JSON.stringify(updated));
      syncEvidenceCountersToCloud(userSkills, userProjects, updated, userCareerGoals);
    }
  };

  const removeAchievement = (id: string) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userAchievements.filter((a) => a.id !== id);
    setUserAchievements(updated);
    if (user) {
      localStorage.setItem(`${USER_ACHIEVEMENTS_KEY}_${user.id}`, JSON.stringify(updated));
      syncEvidenceCountersToCloud(userSkills, userProjects, updated, userCareerGoals);
    }
  };

  const addCertification = (certData: Omit<CertificationItem, 'id'>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const newCert: CertificationItem = {
      ...certData,
      id: `cert-${Date.now()}`,
    };
    const updated = [newCert, ...userCertifications];
    setUserCertifications(updated);
    if (user) {
      localStorage.setItem(`${USER_CERTIFICATIONS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const updateCertification = (id: string, updates: Partial<CertificationItem>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userCertifications.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setUserCertifications(updated);
    if (user) {
      localStorage.setItem(`${USER_CERTIFICATIONS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const removeCertification = (id: string) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userCertifications.filter((c) => c.id !== id);
    setUserCertifications(updated);
    if (user) {
      localStorage.setItem(`${USER_CERTIFICATIONS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const addParticipation = (partData: Omit<ParticipationItem, 'id'>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const newPart: ParticipationItem = {
      ...partData,
      id: `part-${Date.now()}`,
    };
    const updated = [newPart, ...userParticipations];
    setUserParticipations(updated);
    if (user) {
      localStorage.setItem(`${USER_PARTICIPATIONS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const updateParticipation = (id: string, updates: Partial<ParticipationItem>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userParticipations.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setUserParticipations(updated);
    if (user) {
      localStorage.setItem(`${USER_PARTICIPATIONS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const removeParticipation = (id: string) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userParticipations.filter((p) => p.id !== id);
    setUserParticipations(updated);
    if (user) {
      localStorage.setItem(`${USER_PARTICIPATIONS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const updateCareerGoal = (goalUpdates: Partial<CareerGoal>) => {
    if (isDemoMode) {
      setIsDemoLockOpen(true);
      return;
    }
    const updated = userCareerGoals.length > 0
      ? userCareerGoals.map((g, i) => (i === 0 ? { ...g, ...goalUpdates } : g))
      : [
          {
            id: `goal-${Date.now()}`,
            title: goalUpdates.title || 'Career Placement Milestone',
            targetRole: goalUpdates.targetRole || activeProfile.targetRole || 'Software Development',
            targetDomain: goalUpdates.targetDomain || '',
            targetTimeline: goalUpdates.targetTimeline || '',
            targetDate: goalUpdates.targetDate || '',
            progress: goalUpdates.progress || 0,
            status: goalUpdates.status || 'Planned',
            confidenceScore: goalUpdates.confidenceScore || 0,
            requiredSkills: goalUpdates.requiredSkills || [],
            acquiredSkills: goalUpdates.acquiredSkills || [],
            keyMilestones: goalUpdates.keyMilestones || [],
          },
        ];
    setUserCareerGoals(updated);
    if (user) {
      localStorage.setItem(`${USER_GOALS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const isPro = !isDemoMode && Boolean(user) && subscription?.tier !== 'free' && (subscription?.tier === 'pro_monthly' || subscription?.tier === 'pro_annual' || subscription?.tier === 'campus');

  return (
    <StudentTwinContext.Provider
      value={{
        isDemoMode,
        setIsDemoMode,
        enterDemoMode,
        exitDemoMode,
        isDemoLockOpen,
        openDemoLockModal,
        closeDemoLockModal,
        requireAuthAction,
        profile: activeProfile,
        activeProfile,
        allProfiles,
        skills,
        projects,
        achievements,
        certifications,
        participations,
        careerGoal,
        careerGoals,
        digitalTwinReport,
        readinessBreakdown: dynamicReadiness,
        subscription,
        isPro,
        isTwinHydrating,
        isTwinReady,
        isLoading: isTwinHydrating,
        switchProfile,
        addNewStudentProfile,
        updateProfile,
        updateStudentProfile,
        uploadAvatar,
        removeAvatar,
        upgradeSubscription,
        addSkill,
        updateSkill,
        removeSkill,
        addProject,
        updateProject,
        removeProject,
        addAchievement,
        updateAchievement,
        removeAchievement,
        addCertification,
        updateCertification,
        removeCertification,
        addParticipation,
        updateParticipation,
        removeParticipation,
        updateCareerGoal,
      }}
    >
      {children}
    </StudentTwinContext.Provider>
  );
};

export const useStudentTwin = (): StudentTwinContextType => {
  const context = useContext(StudentTwinContext);
  if (!context) {
    throw new Error('useStudentTwin must be used within a StudentTwinProvider');
  }
  return context;
};

