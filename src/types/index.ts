export type Theme = 'dark' | 'light';

export type SubscriptionTier = 'free' | 'pro_monthly' | 'pro_annual' | 'campus';

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  planName: string;
  price: string;
  billingPeriod: string;
  priceNum: number;
  activatedAt?: string;
  expiresAt?: string;
  isSimulated?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role?: string;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId?: string;
  isDemo?: boolean;
  name: string;
  fullName: string;
  displayName: string;
  role: string;
  headline: string;
  university: string;
  academicProgram: string;
  degree?: string;
  branch?: string;
  year?: string;
  yearOfStudy: string;
  gradYear?: string;
  careerFocus: string;
  specialty: string;
  bio: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl?: string;
  location: string;
  readinessScore: number;
  skillsVerifiedCount: number;
  projectIndexCount: number;
  milestonesCount: number;
  targetRole: string;
  targetCompanyTier: string;
  targetCompanies?: string[];
  currentGpa: string;
  cgpa?: number;
  semester: string;
  status: 'Active Twin' | 'Syncing' | 'Draft';
  subscriptionTier?: SubscriptionTier;
  subscriptionExpiresAt?: string;
  certifications?: string[];
  isOnboarded?: boolean;
  createdAt: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  proficiency: number; // 0-100
  verified: boolean;
  proofCount?: number;
  marketAlignmentScore?: number; // 0-100
  lastAssessed?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  role?: string;
  description: string;
  techStack: string[];
  status?: 'Completed' | 'In Progress' | 'Production Live' | 'Architecture Verified';
  githubUrl?: string;
  liveUrl?: string;
  proofHealthScore?: number; // 0-100
  featured?: boolean;
  highlights?: string[];
  astDepth?: string;
  entropyScore?: number;
}

export interface AchievementItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  category: string;
  verified: boolean;
  credentialUrl?: string;
  description: string;
}

export interface CareerGoal {
  id: string;
  title?: string;
  targetRole: string;
  targetDomain?: string;
  targetTimeline?: string;
  targetDate?: string;
  progress?: number;
  status?: string;
  confidenceScore?: number;
  requiredSkills?: string[];
  acquiredSkills?: string[];
  keyMilestones?: {
    title: string;
    completed: boolean;
    dueDate: string;
  }[];
}

export interface ReadinessVector {
  dimension: string;
  score: number; // 0-100
  benchmark: number; // 0-100
  status: 'Optimal' | 'On Track' | 'Needs Attention';
  insight: string;
}

export interface DigitalTwinReport {
  overallScore: number;
  codeProofHealth: number;
  marketRoleAlignment: number;
  academicIndex: number;
  dsaProficiency: number;
  careerVelocity: number;
  primaryInsight: string;
  recommendedNextStep: string;
  vectors: ReadinessVector[];
}

export interface AiEngineMeta {
  id: string;
  number: number;
  name: string;
  slug: string;
  shortDesc: string;
  fullDesc: string;
  category: 'Intelligence' | 'Auditing' | 'Preparation' | 'Simulation';
  phase: 'Phase 2' | 'Phase 3';
  status: 'Foundation Reserved' | 'Coming Soon';
  iconName: string;
}
