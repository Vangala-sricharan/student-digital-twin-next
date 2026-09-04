import { StudentProfile, SkillItem, ProjectItem, AchievementItem } from '../types';

export interface ReadinessBreakdown {
  overallScore: number;
  foundationScore: number;   // Max 15 pts
  skillsScore: number;       // Max 25 pts
  projectsScore: number;     // Max 30 pts
  achievementsScore: number; // Max 15 pts
  profilesScore: number;     // Max 15 pts (GitHub, LinkedIn, Portfolio)

  // Standardized vector telemetry (0 - 100)
  skillsCoverage: number;
  codeProofHealth: number;
  marketAlignment: number;
  verificationIndex: number;

  hasEvidence: boolean;
  evidenceCounts: {
    skills: number;
    verifiedSkills: number;
    projects: number;
    achievements: number;
    hasGithub: boolean;
    hasLinkedin: boolean;
    hasPortfolio: boolean;
    hasTargetRole: boolean;
  };
}

/**
 * Deterministically calculates the student placement readiness score
 * derived strictly from real, verifiable user-provided evidence.
 * 
 * Empty accounts return strictly 0% across all vectors.
 */
export function calculateRealReadiness(
  profile: Partial<StudentProfile> | null | undefined,
  skills: SkillItem[] = [],
  projects: ProjectItem[] = [],
  achievements: AchievementItem[] = []
): ReadinessBreakdown {
  const emptyResult: ReadinessBreakdown = {
    overallScore: 0,
    foundationScore: 0,
    skillsScore: 0,
    projectsScore: 0,
    achievementsScore: 0,
    profilesScore: 0,
    skillsCoverage: 0,
    codeProofHealth: 0,
    marketAlignment: 0,
    verificationIndex: 0,
    hasEvidence: false,
    evidenceCounts: {
      skills: 0,
      verifiedSkills: 0,
      projects: 0,
      achievements: 0,
      hasGithub: false,
      hasLinkedin: false,
      hasPortfolio: false,
      hasTargetRole: false,
    },
  };

  if (!profile) {
    return emptyResult;
  }

  // 1. Profile / Foundation Evidence (Max 15 pts) - strictly real fields
  let foundationScore = 0;
  const hasTargetRole = Boolean(profile.targetRole && profile.targetRole.trim().length > 1);
  const hasUniversity = Boolean(profile.university && profile.university.trim().length > 1);
  const hasDegree = Boolean(profile.degree && profile.degree.trim().length > 1);
  const hasBio = Boolean(profile.bio && profile.bio.trim().length > 20);
  const hasCgpa = Boolean(profile.cgpa && Number(profile.cgpa) > 0);

  if (hasTargetRole) foundationScore += 4;
  if (hasUniversity) foundationScore += 3;
  if (hasDegree) foundationScore += 3;
  if (hasBio) foundationScore += 3;
  if (hasCgpa) foundationScore += 2;
  foundationScore = Math.min(15, foundationScore);

  // 2. Skills Evidence (Max 25 pts)
  // 4 pts per skill (up to 20 pts), plus 2 pts per verified skill (up to 5 pts)
  let skillsScore = 0;
  const validSkills = skills.filter((s) => s.name && s.name.trim().length > 0);
  const verifiedSkills = validSkills.filter((s) => Boolean(s.verified));
  
  if (validSkills.length > 0) {
    skillsScore = Math.min(20, validSkills.length * 4) + Math.min(5, verifiedSkills.length * 2);
  }
  skillsScore = Math.min(25, skillsScore);

  // 3. Projects Proof-of-Work (Max 30 pts)
  // 8 pts per project + 2 pts bonus for repository URL / live demo (up to 30 pts)
  let projectsScore = 0;
  const validProjects = projects.filter((p) => p.title && p.title.trim().length > 0);
  if (validProjects.length > 0) {
    projectsScore = validProjects.reduce((acc, p) => {
      let pts = 8;
      if ((p.githubUrl && p.githubUrl.trim().length > 5) || (p.liveUrl && p.liveUrl.trim().length > 5)) {
        pts += 2;
      }
      return acc + pts;
    }, 0);
  }
  projectsScore = Math.min(30, projectsScore);

  // 4. Achievements / Distinctions (Max 15 pts)
  // 5 pts per recorded achievement (up to 15 pts)
  let achievementsScore = 0;
  const validAchievements = achievements.filter((a) => a.title && a.title.trim().length > 0);
  if (validAchievements.length > 0) {
    achievementsScore = Math.min(15, validAchievements.length * 5);
  }

  // 5. External Verified Presence (Max 15 pts)
  let profilesScore = 0;
  const hasGithub = Boolean(profile.githubUrl && profile.githubUrl.trim().length > 10 && profile.githubUrl.includes('github.com'));
  const hasLinkedin = Boolean(profile.linkedinUrl && profile.linkedinUrl.trim().length > 10 && profile.linkedinUrl.includes('linkedin.com'));
  const hasPortfolio = Boolean(profile.portfolioUrl && profile.portfolioUrl.trim().length > 8);

  if (hasGithub) profilesScore += 5;
  if (hasLinkedin) profilesScore += 5;
  if (hasPortfolio) profilesScore += 5;
  profilesScore = Math.min(15, profilesScore);

  const rawTotal = foundationScore + skillsScore + projectsScore + achievementsScore + profilesScore;
  const overallScore = Math.min(100, Math.max(0, rawTotal));

  // Determine whether any meaningful career evidence exists
  const hasEvidence =
    validSkills.length > 0 ||
    validProjects.length > 0 ||
    validAchievements.length > 0 ||
    hasGithub ||
    hasLinkedin ||
    hasPortfolio;

  // Normalized Sub-metrics (0 if no evidence)
  const skillsCoverage = validSkills.length > 0 ? Math.min(100, Math.round((validSkills.length / 6) * 100)) : 0;
  const codeProofHealth = validProjects.length > 0 ? Math.min(100, Math.round((projectsScore / 30) * 100)) : 0;
  const marketAlignment = (validSkills.length > 0 || validProjects.length > 0)
    ? Math.min(100, Math.round(((skillsScore + projectsScore) / 55) * 100))
    : 0;
  const verificationIndex = (verifiedSkills.length > 0 || validAchievements.length > 0)
    ? Math.min(100, Math.round(((validAchievements.length * 25) + (verifiedSkills.length * 15))))
    : 0;

  return {
    overallScore,
    foundationScore,
    skillsScore,
    projectsScore,
    achievementsScore,
    profilesScore,
    skillsCoverage,
    codeProofHealth,
    marketAlignment,
    verificationIndex,
    hasEvidence,
    evidenceCounts: {
      skills: validSkills.length,
      verifiedSkills: verifiedSkills.length,
      projects: validProjects.length,
      achievements: validAchievements.length,
      hasGithub,
      hasLinkedin,
      hasPortfolio,
      hasTargetRole,
    },
  };
}
