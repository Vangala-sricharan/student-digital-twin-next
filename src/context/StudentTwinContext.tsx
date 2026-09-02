import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  StudentProfile,
  SkillItem,
  ProjectItem,
  AchievementItem,
  CareerGoal,
  DigitalTwinReport,
  SubscriptionPlan,
  SubscriptionTier,
} from '../types';
import {
  DEMO_STUDENT_PROFILE,
  DEMO_SKILLS,
  DEMO_PROJECTS,
  DEMO_ACHIEVEMENTS,
  DEMO_CAREER_GOAL,
  DEMO_CAREER_GOALS,
  DEMO_DIGITAL_TWIN_REPORT,
} from '../data/demoData';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  profile: StudentProfile;
  activeProfile: StudentProfile;
  allProfiles: StudentProfile[];
  skills: SkillItem[];
  projects: ProjectItem[];
  achievements: AchievementItem[];
  careerGoal: CareerGoal;
  careerGoals: CareerGoal[];
  digitalTwinReport: DigitalTwinReport;
  subscription: SubscriptionPlan;
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
  updateCareerGoal: (goal: Partial<CareerGoal>) => void;
}

const StudentTwinContext = createContext<StudentTwinContextType | undefined>(undefined);

const USER_STUDENT_PROFILES_KEY = 'sdt_user_profiles_v4';
const USER_SUBSCRIPTION_KEY = 'sdt_user_subscription_v4';
const USER_SKILLS_KEY = 'sdt_user_skills_v4';
const USER_PROJECTS_KEY = 'sdt_user_projects_v4';
const USER_ACHIEVEMENTS_KEY = 'sdt_user_achievements_v4';
const USER_GOALS_KEY = 'sdt_user_goals_v4';

export const StudentTwinProvider: React.FC<{
  isDemoInitial?: boolean;
  children: React.ReactNode;
}> = ({ isDemoInitial = false, children }) => {
  const { user, userProfile, updateProfile: updateAuthProfile } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState<boolean>(isDemoInitial);

  const enterDemoMode = () => setIsDemoMode(true);
  const exitDemoMode = () => setIsDemoMode(false);

  // Authenticated user's own profiles list
  const [userProfiles, setUserProfiles] = useState<StudentProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');

  // Subscription state (defaults strictly to free)
  const [subscription, setSubscription] = useState<SubscriptionPlan>(SUBSCRIPTION_PLANS.free);

  // Authenticated user's individual records (strictly empty for new users)
  const [userSkills, setUserSkills] = useState<SkillItem[]>([]);
  const [userProjects, setUserProjects] = useState<ProjectItem[]>([]);
  const [userAchievements, setUserAchievements] = useState<AchievementItem[]>([]);
  const [userCareerGoals, setUserCareerGoals] = useState<CareerGoal[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load authenticated student data whenever authenticated user changes
  useEffect(() => {
    if (!user) {
      setUserProfiles([]);
      setActiveProfileId('');
      setUserSkills([]);
      setUserProjects([]);
      setUserAchievements([]);
      setUserCareerGoals([]);
      setSubscription(SUBSCRIPTION_PLANS.free);
      return;
    }

    async function loadUserData() {
      setIsLoading(true);
      try {
        const userId = user!.id;

        // 1. Load Subscription scoped to user.id
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

        // 2. Load User Skills, Projects, Achievements, Goals from user-scoped storage
        const skillsStorageKey = `${USER_SKILLS_KEY}_${userId}`;
        const projectsStorageKey = `${USER_PROJECTS_KEY}_${userId}`;
        const achStorageKey = `${USER_ACHIEVEMENTS_KEY}_${userId}`;
        const goalsStorageKey = `${USER_GOALS_KEY}_${userId}`;

        const savedSkills = localStorage.getItem(skillsStorageKey);
        const savedProjects = localStorage.getItem(projectsStorageKey);
        const savedAch = localStorage.getItem(achStorageKey);
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

        if (savedGoals) {
          try {
            const parsed = JSON.parse(savedGoals);
            if (Array.isArray(parsed)) setUserCareerGoals(parsed);
          } catch (e) {}
        } else {
          setUserCareerGoals([]);
        }

        // 3. Load Student Profiles
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('user_id', userId);

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
              createdAt: item.created_at,
            }));

            setUserProfiles(mappedProfiles);
            setActiveProfileId(mappedProfiles[0].id);
            return;
          }
        }

        // Local user-scoped storage fallback
        const profileStorageKey = `${USER_STUDENT_PROFILES_KEY}_${userId}`;
        const localSaved = localStorage.getItem(profileStorageKey);

        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setUserProfiles(parsed);
              setActiveProfileId(parsed[0].id);
              return;
            }
          } catch {
            // parse error fallback
          }
        }

        // Create empty personalized initial profile for this new user (ZERO dummy data)
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
          createdAt: new Date().toISOString(),
        };

        setUserProfiles([initialProfile]);
        setActiveProfileId(initialProfile.id);
        localStorage.setItem(profileStorageKey, JSON.stringify([initialProfile]));
      } catch (err) {
        console.error('Failed to load student profiles:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [user?.id]);

  // Active Profile Calculation (Strict zero-demo fallback for authenticated users)
  const activeProfile: StudentProfile = isDemoMode
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

  const allProfiles: StudentProfile[] = isDemoMode ? [DEMO_STUDENT_PROFILE] : userProfiles;

  const skills: SkillItem[] = isDemoMode ? DEMO_SKILLS : userSkills;
  const projects: ProjectItem[] = isDemoMode ? DEMO_PROJECTS : userProjects;
  const achievements: AchievementItem[] = isDemoMode ? DEMO_ACHIEVEMENTS : userAchievements;
  const careerGoals: CareerGoal[] = isDemoMode ? DEMO_CAREER_GOALS : userCareerGoals;
  const careerGoal: CareerGoal = isDemoMode ? DEMO_CAREER_GOAL : (userCareerGoals[0] || {
    id: 'user-goal-empty',
    title: '',
    targetRole: activeProfile.targetRole || '',
    targetDomain: '',
    targetTimeline: '',
    targetDate: '',
    progress: 0,
    status: 'Planned',
    confidenceScore: 0,
    requiredSkills: [],
    acquiredSkills: [],
    keyMilestones: [],
  });

  // Calculate dynamic twin report based purely on real user data or demo mode
  const dynamicReportScore = activeProfile.readinessScore || (
    skills.length > 0 || projects.length > 0
      ? Math.min(100, Math.round((skills.length * 8) + (projects.length * 15) + (achievements.length * 10)))
      : 0
  );

  const digitalTwinReport: DigitalTwinReport = isDemoMode
    ? DEMO_DIGITAL_TWIN_REPORT
    : {
        overallScore: dynamicReportScore,
        codeProofHealth: projects.length > 0 ? Math.min(100, 45 + projects.length * 15) : 0,
        marketRoleAlignment: skills.length > 0 ? Math.min(100, 35 + skills.length * 9) : 0,
        academicIndex: activeProfile.cgpa ? Math.min(100, Math.round(activeProfile.cgpa * 10)) : 0,
        dsaProficiency: skills.some((s) => s.category?.toLowerCase().includes('algorithm') || s.name.toLowerCase().includes('dsa')) ? 75 : 0,
        careerVelocity: (skills.length > 0 || projects.length > 0) ? Math.min(100, (skills.length + projects.length) * 10) : 0,
        primaryInsight: skills.length > 0 || projects.length > 0
          ? `Twin profile active with ${skills.length} verified skills and ${projects.length} repository index records.`
          : 'Your Student Twin is ready to be built. Add your skills and projects to calibrate your readiness index.',
        recommendedNextStep: projects.length === 0
          ? 'Add your first verified project repository to evaluate Code & Proof Health.'
          : 'Continue logging skill proofs and project updates to raise market role alignment.',
        vectors: [
          {
            dimension: 'Role Alignment Score',
            score: skills.length > 0 ? Math.min(100, 35 + skills.length * 9) : 0,
            benchmark: 75,
            status: skills.length >= 4 ? 'Optimal' : skills.length > 0 ? 'On Track' : 'Needs Attention',
            insight: skills.length > 0 ? `${skills.length} verified competencies recorded.` : 'Add your technical skills to calculate alignment.',
          },
          {
            dimension: 'Code & Proof Health',
            score: projects.length > 0 ? Math.min(100, 45 + projects.length * 15) : 0,
            benchmark: 70,
            status: projects.length >= 2 ? 'Optimal' : projects.length > 0 ? 'On Track' : 'Needs Attention',
            insight: projects.length > 0 ? `${projects.length} project repositories indexed.` : 'Add GitHub projects to evaluate code authenticity.',
          },
          {
            dimension: 'Academic Standing',
            score: activeProfile.cgpa ? Math.min(100, Math.round(activeProfile.cgpa * 10)) : 0,
            benchmark: 75,
            status: activeProfile.cgpa && activeProfile.cgpa >= 8 ? 'Optimal' : activeProfile.cgpa ? 'On Track' : 'Needs Attention',
            insight: activeProfile.cgpa ? `CGPA of ${activeProfile.cgpa} recorded.` : 'Add academic GPA in profile.',
          },
          {
            dimension: 'DSA & Algorithmic Rigor',
            score: skills.some((s) => s.category?.toLowerCase().includes('algorithm') || s.name.toLowerCase().includes('dsa')) ? 75 : 0,
            benchmark: 80,
            status: skills.some((s) => s.category?.toLowerCase().includes('algorithm') || s.name.toLowerCase().includes('dsa')) ? 'On Track' : 'Needs Attention',
            insight: 'Add Data Structures & Algorithms under skills or run the Syllabus Prep engine.',
          },
          {
            dimension: 'Adaptive Milestones',
            score: achievements.length > 0 ? Math.min(100, achievements.length * 25) : 0,
            benchmark: 65,
            status: achievements.length >= 2 ? 'Optimal' : achievements.length > 0 ? 'On Track' : 'Needs Attention',
            insight: achievements.length > 0 ? `${achievements.length} verified achievements logged.` : 'Log hackathons, honors, or certifications.',
          },
        ],
      };

  const switchProfile = (profileId: string) => {
    if (isDemoMode) return;
    setActiveProfileId(profileId);
  };

  const updateStudentProfile = async (profileData: Partial<StudentProfile>) => {
    if (isDemoMode) return;
    
    // Automatically recalculate readiness score dynamically if user adds data and score is 0
    const updatedSkillsCount = profileData.skillsVerifiedCount !== undefined ? profileData.skillsVerifiedCount : activeProfile.skillsVerifiedCount;
    const updatedProjectCount = profileData.projectIndexCount !== undefined ? profileData.projectIndexCount : activeProfile.projectIndexCount;
    
    let computedReadiness = profileData.readinessScore !== undefined ? profileData.readinessScore : activeProfile.readinessScore;
    if (computedReadiness === 0 && (updatedSkillsCount > 0 || updatedProjectCount > 0)) {
      computedReadiness = Math.min(95, Math.round((updatedSkillsCount * 8) + (updatedProjectCount * 15)));
    }

    const mergedData = {
      ...profileData,
      ...(computedReadiness !== undefined ? { readinessScore: computedReadiness } : {}),
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
        await supabase
          .from('student_profiles')
          .update({
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
            status: mergedData.status,
          })
          .eq('id', activeProfile.id);
      }
    }
  };

  const updateProfile = async (profileData: Partial<StudentProfile>) => {
    try {
      await updateStudentProfile(profileData);
      return { success: true };
    } catch (err) {
      return { error: err, success: false };
    }
  };

  // Upload or replace student profile picture
  const uploadAvatar = async (avatarDataUrl: string): Promise<{ success: boolean; avatarUrl: string }> => {
    try {
      if (isDemoMode) {
        DEMO_STUDENT_PROFILE.avatarUrl = avatarDataUrl;
        return { success: true, avatarUrl: avatarDataUrl };
      }

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

  // Remove student profile picture
  const removeAvatar = async (): Promise<void> => {
    if (isDemoMode) {
      DEMO_STUDENT_PROFILE.avatarUrl = undefined;
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
      alert('Cannot add student profile in Demo Mode. Please sign up or log in to create custom student profiles.');
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
        await supabase.from('student_profiles').insert({
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
        });
      }
    }
  };

  const addSkill = (skillData: Omit<SkillItem, 'id' | 'lastAssessed'>) => {
    if (isDemoMode) return;
    const newSkill: SkillItem = {
      ...skillData,
      id: `skill-${Date.now()}`,
      lastAssessed: new Date().toISOString().split('T')[0],
    };
    const updated = [newSkill, ...userSkills];
    setUserSkills(updated);
    if (user) {
      localStorage.setItem(`${USER_SKILLS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const updateSkill = (id: string, updates: Partial<SkillItem>) => {
    if (isDemoMode) return;
    const updated = userSkills.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setUserSkills(updated);
    if (user) {
      localStorage.setItem(`${USER_SKILLS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const removeSkill = (id: string) => {
    if (isDemoMode) return;
    const updated = userSkills.filter((s) => s.id !== id);
    setUserSkills(updated);
    if (user) {
      localStorage.setItem(`${USER_SKILLS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const addProject = (projectData: Omit<ProjectItem, 'id'>) => {
    if (isDemoMode) return;
    const newProject: ProjectItem = {
      ...projectData,
      id: `proj-${Date.now()}`,
    };
    const updated = [newProject, ...userProjects];
    setUserProjects(updated);
    if (user) {
      localStorage.setItem(`${USER_PROJECTS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const updateProject = (id: string, updates: Partial<ProjectItem>) => {
    if (isDemoMode) return;
    const updated = userProjects.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setUserProjects(updated);
    if (user) {
      localStorage.setItem(`${USER_PROJECTS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const removeProject = (id: string) => {
    if (isDemoMode) return;
    const updated = userProjects.filter((p) => p.id !== id);
    setUserProjects(updated);
    if (user) {
      localStorage.setItem(`${USER_PROJECTS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const addAchievement = (achievementData: Omit<AchievementItem, 'id'>) => {
    if (isDemoMode) return;
    const newAchievement: AchievementItem = {
      ...achievementData,
      id: `ach-${Date.now()}`,
    };
    const updated = [newAchievement, ...userAchievements];
    setUserAchievements(updated);
    if (user) {
      localStorage.setItem(`${USER_ACHIEVEMENTS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const updateAchievement = (id: string, updates: Partial<AchievementItem>) => {
    if (isDemoMode) return;
    const updated = userAchievements.map((a) => (a.id === id ? { ...a, ...updates } : a));
    setUserAchievements(updated);
    if (user) {
      localStorage.setItem(`${USER_ACHIEVEMENTS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const removeAchievement = (id: string) => {
    if (isDemoMode) return;
    const updated = userAchievements.filter((a) => a.id !== id);
    setUserAchievements(updated);
    if (user) {
      localStorage.setItem(`${USER_ACHIEVEMENTS_KEY}_${user.id}`, JSON.stringify(updated));
    }
  };

  const updateCareerGoal = (goalUpdates: Partial<CareerGoal>) => {
    if (isDemoMode) return;
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

  return (
    <StudentTwinContext.Provider
      value={{
        isDemoMode,
        setIsDemoMode,
        enterDemoMode,
        exitDemoMode,
        profile: activeProfile,
        activeProfile,
        allProfiles,
        skills,
        projects,
        achievements,
        careerGoal,
        careerGoals,
        digitalTwinReport,
        subscription,
        isLoading,
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

