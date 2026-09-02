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

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionPlan>(SUBSCRIPTION_PLANS.free);

  // Authenticated user's individual records
  const [userSkills, setUserSkills] = useState<SkillItem[]>([]);
  const [userProjects, setUserProjects] = useState<ProjectItem[]>([]);
  const [userAchievements, setUserAchievements] = useState<AchievementItem[]>([]);
  const [userCareerGoals, setUserCareerGoals] = useState<CareerGoal[]>([
    {
      id: 'user-goal-1',
      title: 'Full-Stack Software Engineer Placement',
      targetRole: 'Software Engineer / AI Systems',
      targetDomain: 'Cloud & Intelligent Computing',
      targetTimeline: '2026-2027 Placement Cycle',
      targetDate: 'Dec 2026',
      progress: 70,
      status: 'On Track',
      confidenceScore: 78,
      requiredSkills: ['Data Structures & Algorithms', 'TypeScript / Python', 'System Design', 'Database Management'],
      acquiredSkills: ['TypeScript / Python', 'Database Management'],
      keyMilestones: [
        { title: 'Initialize Personal Student Digital Twin', completed: true, dueDate: 'Immediate' },
        { title: 'Verify Core CS & Algorithmic Projects', completed: false, dueDate: 'Month 2' },
        { title: 'Complete AI Career Readiness Audit', completed: false, dueDate: 'Month 4' },
      ],
    },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load authenticated student data whenever authenticated user changes
  useEffect(() => {
    if (!user) {
      setUserProfiles([]);
      setActiveProfileId('');
      setSubscription(SUBSCRIPTION_PLANS.free);
      return;
    }

    async function loadUserData() {
      setIsLoading(true);
      try {
        // Load Subscription
        const subStorageKey = `${USER_SUBSCRIPTION_KEY}_${user!.id}`;
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
        }

        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('user_id', user!.id);

          if (data && data.length > 0 && !error) {
            const mappedProfiles: StudentProfile[] = data.map((item) => ({
              id: item.id,
              userId: item.user_id,
              isDemo: false,
              name: item.name,
              fullName: item.display_name || item.name,
              displayName: item.display_name,
              role: item.role || 'Student Scholar',
              headline: item.headline || 'Computer Science Scholar | Aspiring Software Engineer',
              university: item.university || 'University Institute of Technology',
              academicProgram: item.academic_program || 'B.Tech Computer Science & Engineering',
              degree: item.degree || 'B.Tech',
              branch: item.branch || 'Computer Science',
              year: item.year || '3rd',
              yearOfStudy: item.year_of_study || '3rd Year',
              gradYear: item.grad_year || '2026',
              careerFocus: item.career_focus || 'Software Engineering',
              specialty: item.specialty || 'Full-Stack Systems & Distributed Computing',
              bio: item.bio || 'Building and verifying technical competencies with the Student Digital Twin OS.',
              avatarUrl: item.avatar_url,
              email: item.email || user?.email || '',
              phone: item.phone || '',
              githubUrl: item.github_url || '',
              linkedinUrl: item.linkedin_url || '',
              portfolioUrl: item.portfolio_url || '',
              location: item.location || 'Bengaluru, India',
              readinessScore: item.readiness_score || 72,
              skillsVerifiedCount: item.skills_verified_count || 4,
              projectIndexCount: item.project_index_count || 2,
              milestonesCount: item.milestones_count || 3,
              targetRole: item.target_role || 'Software Development Engineer',
              targetCompanyTier: item.target_company_tier || 'Global Tech',
              currentGpa: item.current_gpa || '8.5 / 10.0',
              cgpa: item.cgpa || 8.5,
              semester: item.semester || 'Semester 5',
              status: (item.status as any) || 'Active Twin',
              subscriptionTier: item.subscription_tier || 'free',
              createdAt: item.created_at,
            }));

            setUserProfiles(mappedProfiles);
            setActiveProfileId(mappedProfiles[0].id);
            return;
          }
        }

        // Local sandbox or initial fresh user state (NOT creator demo data)
        const storageKey = `${USER_STUDENT_PROFILES_KEY}_${user!.id}`;
        const localSaved = localStorage.getItem(storageKey);

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

        // Create default personalized initial profile for this new user
        const userName = userProfile?.fullName || user!.user_metadata?.full_name || 'Student Candidate';
        const initialProfile: StudentProfile = {
          id: `profile-${user!.id}`,
          userId: user!.id,
          isDemo: false,
          name: userName,
          fullName: userName,
          displayName: userName,
          role: 'Student Engineer',
          headline: 'Computer Science Scholar | Aspiring Software Engineer',
          university: 'University Institute of Technology',
          academicProgram: 'B.Tech Computer Science & Engineering',
          degree: 'B.Tech',
          branch: 'Computer Science',
          year: '3rd',
          yearOfStudy: '3rd Year',
          gradYear: '2026',
          careerFocus: 'Software Engineering & Cloud Architecture',
          specialty: 'Full-Stack Systems & Distributed Computing',
          bio: 'Building and verifying technical competencies with the Student Digital Twin OS.',
          avatarUrl: userProfile?.avatarUrl || '',
          email: user?.email || 'scholar@university.edu',
          phone: '+91 98765 43210',
          githubUrl: '',
          linkedinUrl: '',
          portfolioUrl: '',
          location: 'Bengaluru, India',
          readinessScore: 74,
          skillsVerifiedCount: 8,
          projectIndexCount: 2,
          milestonesCount: 5,
          targetRole: 'Full-Stack Software Engineer',
          targetCompanyTier: 'Tier-1 Tech & High Growth Startups',
          currentGpa: '8.7 / 10.0',
          cgpa: 8.7,
          semester: '5th',
          status: 'Active Twin',
          subscriptionTier: 'free',
          createdAt: new Date().toISOString(),
        };

        const initialSkills: SkillItem[] = [
          { id: 'usr-sk-1', name: 'Data Structures & Algorithms', category: 'Data Structures & Algorithms', proficiency: 82, verified: true, proofCount: 6, marketAlignmentScore: 88, lastAssessed: '2026-02-15' },
          { id: 'usr-sk-2', name: 'JavaScript & TypeScript', category: 'Languages', proficiency: 85, verified: true, proofCount: 5, marketAlignmentScore: 90, lastAssessed: '2026-02-18' },
          { id: 'usr-sk-3', name: 'React & Modern Web Architecture', category: 'Languages', proficiency: 80, verified: true, proofCount: 4, marketAlignmentScore: 86, lastAssessed: '2026-02-20' },
          { id: 'usr-sk-4', name: 'PostgreSQL & Database Design', category: 'Cloud & Infrastructure', proficiency: 76, verified: true, proofCount: 3, marketAlignmentScore: 84, lastAssessed: '2026-02-22' },
        ];

        const initialProjects: ProjectItem[] = [
          {
            id: 'usr-proj-1',
            title: 'Real-Time Collaborative Task Matrix',
            role: 'Full Stack Engineer',
            description: 'Scalable task management platform with WebSocket synchronization and role-based permissions.',
            techStack: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
            status: 'Completed',
            proofHealthScore: 84,
            astDepth: 'Level 3 (Moderate)',
            entropyScore: 88,
            featured: true,
            highlights: ['Designed normalized relational schema', 'Implemented optimistic UI state updates'],
          },
        ];

        const initialAchievements: AchievementItem[] = [
          {
            id: 'usr-ach-1',
            title: 'University Hackathon Finalist',
            issuer: 'Institute Annual Tech Symposium',
            date: '2025-10-14',
            category: 'Hackathon',
            verified: true,
            description: 'Built high-concurrency campus event management microservice.',
          },
        ];

        setUserProfiles([initialProfile]);
        setActiveProfileId(initialProfile.id);
        setUserSkills(initialSkills);
        setUserProjects(initialProjects);
        setUserAchievements(initialAchievements);

        localStorage.setItem(storageKey, JSON.stringify([initialProfile]));
      } catch (err) {
        console.error('Failed to load student profiles:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [user?.id]);

  // Active Profile Calculation
  const activeProfile: StudentProfile = isDemoMode
    ? DEMO_STUDENT_PROFILE
    : userProfiles.find((p) => p.id === activeProfileId) ||
      userProfiles[0] || {
        id: 'temp-profile',
        name: userProfile?.fullName || 'Student Explorer',
        fullName: userProfile?.fullName || 'Student Explorer',
        displayName: userProfile?.fullName || 'Student Explorer',
        role: 'Student',
        headline: 'Exploring Student Twin',
        university: 'University Campus',
        academicProgram: 'B.Tech CSE',
        degree: 'B.Tech',
        branch: 'CSE',
        year: '2nd',
        yearOfStudy: '2nd Year',
        gradYear: '2026',
        careerFocus: 'Software Engineering',
        specialty: 'Systems Engineering',
        bio: 'Welcome to your Student Digital Twin OS.',
        avatarUrl: userProfile?.avatarUrl || '',
        email: user?.email || 'scholar@university.edu',
        phone: '+91 98765 43210',
        githubUrl: '',
        linkedinUrl: '',
        portfolioUrl: '',
        location: 'India',
        readinessScore: 70,
        skillsVerifiedCount: 4,
        projectIndexCount: 1,
        milestonesCount: 2,
        targetRole: 'Software Engineer',
        targetCompanyTier: 'Tech Leaders',
        currentGpa: '8.4 / 10.0',
        cgpa: 8.4,
        semester: '4th',
        status: 'Active Twin',
        subscriptionTier: subscription.tier,
        createdAt: new Date().toISOString(),
      };

  const allProfiles: StudentProfile[] = isDemoMode ? [DEMO_STUDENT_PROFILE] : userProfiles;

  const skills: SkillItem[] = isDemoMode ? DEMO_SKILLS : userSkills;
  const projects: ProjectItem[] = isDemoMode ? DEMO_PROJECTS : userProjects;
  const achievements: AchievementItem[] = isDemoMode ? DEMO_ACHIEVEMENTS : userAchievements;
  const careerGoals: CareerGoal[] = isDemoMode ? DEMO_CAREER_GOALS : userCareerGoals;
  const careerGoal: CareerGoal = isDemoMode ? DEMO_CAREER_GOAL : userCareerGoals[0];

  const digitalTwinReport: DigitalTwinReport = isDemoMode
    ? DEMO_DIGITAL_TWIN_REPORT
    : {
        overallScore: activeProfile.readinessScore || 74,
        codeProofHealth: 82,
        marketRoleAlignment: 79,
        academicIndex: 85,
        dsaProficiency: 78,
        careerVelocity: 81,
        primaryInsight: `Twin analysis calibrated for ${activeProfile.targetRole || 'Software Development'}. Good foundational proof.`,
        recommendedNextStep: 'Add 2 more verified proof-of-work project repositories to boost Code & Proof Health above 90%.',
        vectors: [
          { dimension: 'Role Alignment Score', score: 79, benchmark: 75, status: 'On Track', insight: 'Core CS foundational competencies are verified.' },
          { dimension: 'Code & Proof Health', score: 82, benchmark: 70, status: 'Optimal', insight: 'Solid architecture hygiene across repository index.' },
          { dimension: 'Academic Standing', score: 85, benchmark: 75, status: 'Optimal', insight: 'Consistent academic GPA standing.' },
          { dimension: 'DSA & Algorithmic Rigor', score: 78, benchmark: 80, status: 'Needs Attention', insight: 'Practice graph problems and system design fundamentals.' },
          { dimension: 'Adaptive Milestones', score: 81, benchmark: 65, status: 'Optimal', insight: 'Milestone tracking is active and on schedule.' },
        ],
      };

  const switchProfile = (profileId: string) => {
    if (isDemoMode) return;
    setActiveProfileId(profileId);
  };

  const updateStudentProfile = async (profileData: Partial<StudentProfile>) => {
    if (isDemoMode) return;
    setUserProfiles((prev) =>
      prev.map((p) => (p.id === activeProfile.id ? { ...p, ...profileData } : p))
    );

    if (user) {
      const updated = userProfiles.map((p) =>
        p.id === activeProfile.id ? { ...p, ...profileData } : p
      );
      localStorage.setItem(`${USER_STUDENT_PROFILES_KEY}_${user.id}`, JSON.stringify(updated));

      if (isSupabaseConfigured) {
        await supabase
          .from('student_profiles')
          .update({
            name: profileData.name || profileData.fullName,
            display_name: profileData.displayName || profileData.fullName,
            role: profileData.role,
            headline: profileData.headline,
            university: profileData.university,
            academic_program: profileData.academicProgram,
            year_of_study: profileData.yearOfStudy,
            career_focus: profileData.careerFocus,
            specialty: profileData.specialty,
            bio: profileData.bio,
            avatar_url: profileData.avatarUrl,
            github_url: profileData.githubUrl,
            linkedin_url: profileData.linkedinUrl,
            portfolio_url: profileData.portfolioUrl,
            location: profileData.location,
            current_gpa: profileData.currentGpa,
            target_role: profileData.targetRole,
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
      role: profileData.role || 'Student Scholar',
      headline: profileData.headline || 'B.Tech Student | Ready for Industry Placement',
      university: profileData.university || 'Engineering University',
      academicProgram: profileData.academicProgram || 'B.Tech CSE',
      degree: 'B.Tech',
      branch: 'CSE',
      year: '2nd',
      yearOfStudy: profileData.yearOfStudy || '2nd Year',
      gradYear: '2026',
      careerFocus: profileData.careerFocus || 'Software Development',
      specialty: profileData.specialty || 'Generalist & Distributed Systems',
      bio: profileData.bio || 'Continuous learner and digital twin builder.',
      avatarUrl: profileData.avatarUrl,
      email: profileData.email || user?.email || '',
      phone: profileData.phone || '',
      githubUrl: profileData.githubUrl || '',
      linkedinUrl: profileData.linkedinUrl || '',
      portfolioUrl: profileData.portfolioUrl || '',
      location: profileData.location || 'India',
      readinessScore: 68,
      skillsVerifiedCount: 3,
      projectIndexCount: 1,
      milestonesCount: 2,
      targetRole: profileData.targetRole || 'Software Engineer',
      targetCompanyTier: profileData.targetCompanyTier || 'Tier-1 Tech',
      currentGpa: profileData.currentGpa || '8.2 / 10.0',
      cgpa: 8.2,
      semester: '4th',
      status: 'Active Twin',
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
          readiness_score: newProfile.readinessScore,
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
    setUserSkills((prev) => [newSkill, ...prev]);
  };

  const updateSkill = (id: string, updates: Partial<SkillItem>) => {
    if (isDemoMode) return;
    setUserSkills((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeSkill = (id: string) => {
    if (isDemoMode) return;
    setUserSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const addProject = (projectData: Omit<ProjectItem, 'id'>) => {
    if (isDemoMode) return;
    const newProject: ProjectItem = {
      ...projectData,
      id: `proj-${Date.now()}`,
    };
    setUserProjects((prev) => [newProject, ...prev]);
  };

  const updateProject = (id: string, updates: Partial<ProjectItem>) => {
    if (isDemoMode) return;
    setUserProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removeProject = (id: string) => {
    if (isDemoMode) return;
    setUserProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const addAchievement = (achievementData: Omit<AchievementItem, 'id'>) => {
    if (isDemoMode) return;
    const newAchievement: AchievementItem = {
      ...achievementData,
      id: `ach-${Date.now()}`,
    };
    setUserAchievements((prev) => [newAchievement, ...prev]);
  };

  const updateAchievement = (id: string, updates: Partial<AchievementItem>) => {
    if (isDemoMode) return;
    setUserAchievements((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const removeAchievement = (id: string) => {
    if (isDemoMode) return;
    setUserAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  const updateCareerGoal = (goalUpdates: Partial<CareerGoal>) => {
    if (isDemoMode) return;
    setUserCareerGoals((prev) =>
      prev.map((g, i) => (i === 0 ? { ...g, ...goalUpdates } : g))
    );
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

