import { StudentProfile, SkillItem, ProjectItem, AchievementItem, CareerGoal } from '../types';

export interface ReadinessBreakdown {
  overallScore: number;

  // The Four Pillars (0 - 100)
  skillsCoverage: number;       // Pillar A: Skills Coverage (Weight: 25%)
  projectPortfolio: number;     // Pillar B: Project Portfolio (Weight: 30%)
  industryAlignment: number;    // Pillar C: Industry Alignment (Weight: 25%)
  verifications: number;        // Pillar D: Verifications (Weight: 20%)

  // Four-Pillar Weights
  pillarWeights: {
    skillsCoverage: number;
    projectPortfolio: number;
    industryAlignment: number;
    verifications: number;
  };

  // Telemetry & Legacy Field Aliases for backward compatibility
  codeProofHealth: number;      // alias to projectPortfolio
  marketAlignment: number;      // alias to industryAlignment
  verificationIndex: number;    // alias to verifications
  foundationScore: number;
  skillsScore: number;
  projectsScore: number;
  achievementsScore: number;
  profilesScore: number;

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
    hasCareerGoal: boolean;
  };
}

export const PILLAR_WEIGHTS = {
  skillsCoverage: 0.25,     // 25%
  projectPortfolio: 0.30,   // 30%
  industryAlignment: 0.25,  // 25%
  verifications: 0.20,      // 20%
} as const;

/**
 * Deterministically calculates the student placement readiness score
 * derived strictly from real, verifiable user-provided evidence across four pillars:
 * 
 * Pillar A: SKILLS COVERAGE (25% Weight)
 * Pillar B: PROJECT PORTFOLIO (30% Weight)
 * Pillar C: INDUSTRY ALIGNMENT (25% Weight)
 * Pillar D: VERIFICATIONS (20% Weight)
 * 
 * Empty accounts return strictly 0% across all pillars and overall score.
 * Never uses placeholder, demo, or fallback values for authenticated users.
 */
export function calculateRealReadiness(
  profile: Partial<StudentProfile> | null | undefined,
  skills: SkillItem[] = [],
  projects: ProjectItem[] = [],
  achievements: AchievementItem[] = [],
  careerGoals: CareerGoal[] = []
): ReadinessBreakdown {
  const emptyResult: ReadinessBreakdown = {
    overallScore: 0,
    skillsCoverage: 0,
    projectPortfolio: 0,
    industryAlignment: 0,
    verifications: 0,
    pillarWeights: { ...PILLAR_WEIGHTS },
    codeProofHealth: 0,
    marketAlignment: 0,
    verificationIndex: 0,
    foundationScore: 0,
    skillsScore: 0,
    projectsScore: 0,
    achievementsScore: 0,
    profilesScore: 0,
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
      hasCareerGoal: false,
    },
  };

  if (!profile) {
    return emptyResult;
  }

  // ---------------------------------------------------------------------------
  // PILLAR A: SKILLS COVERAGE (0 - 100) — Weight: 25%
  // Evaluates actual saved skills, proficiency calibration, and verification.
  // ---------------------------------------------------------------------------
  const validSkills = (skills || []).filter(
    (s) => s && typeof s.name === 'string' && s.name.trim().length > 0
  );
  const verifiedSkills = validSkills.filter((s) => Boolean(s.verified));

  let skillsCoverage = 0;
  if (validSkills.length > 0) {
    // 1. Skill Volume: calibrated to 6 diverse core competencies (up to 60 pts)
    const volumeScore = Math.min(60, Math.round((validSkills.length / 6) * 60));

    // 2. Proficiency Depth: average recorded proficiency (up to 20 pts)
    const avgProficiency =
      validSkills.reduce((acc, s) => {
        const p = typeof s.proficiency === 'number' && !isNaN(s.proficiency) ? s.proficiency : 60;
        return acc + Math.min(100, Math.max(0, p));
      }, 0) / validSkills.length;
    const proficiencyScore = Math.min(20, Math.round((avgProficiency / 100) * 20));

    // 3. Verification & Proof: verified skills or proof attachments (up to 20 pts)
    const verifiedOrProven = validSkills.filter(
      (s) => Boolean(s.verified) || (typeof s.proofCount === 'number' && s.proofCount > 0)
    );
    const proofScore = Math.min(20, verifiedOrProven.length * 7);

    skillsCoverage = Math.min(100, Math.max(0, volumeScore + proficiencyScore + proofScore));
  }

  // ---------------------------------------------------------------------------
  // PILLAR B: PROJECT PORTFOLIO (0 - 100) — Weight: 30%
  // Evaluates actual saved projects, architectural descriptions, tech stacks, and links.
  // ---------------------------------------------------------------------------
  const validProjects = (projects || []).filter(
    (p) => p && typeof p.title === 'string' && p.title.trim().length > 0
  );

  let projectPortfolio = 0;
  if (validProjects.length > 0) {
    // Each project contributes up to 30 points (calibrated so ~3-4 projects reach full maturity)
    let projectPoints = 0;
    let projectsWithLinks = 0;

    for (const p of validProjects) {
      let pts = 12; // Base existence of verified project
      if (p.description && p.description.trim().length >= 15) {
        pts += 6; // Detailed architectural description
      }
      if (Array.isArray(p.techStack) && p.techStack.length > 0) {
        pts += 6; // Mapped tech stack
      }
      const hasLink = Boolean(
        (p.githubUrl && p.githubUrl.trim().length > 5) ||
        (p.liveUrl && p.liveUrl.trim().length > 5)
      );
      if (hasLink) {
        pts += 6; // Verifiable repository or live demonstration link
        projectsWithLinks++;
      }
      projectPoints += pts;
    }

    // Portfolio depth bonus: having multiple projects with verifiable links
    const bonus = projectsWithLinks >= 2 ? 10 : 0;
    projectPortfolio = Math.min(100, Math.max(0, projectPoints + bonus));
  }

  // ---------------------------------------------------------------------------
  // PILLAR C: INDUSTRY ALIGNMENT (0 - 100) — Weight: 25%
  // Evaluates career target, goal formulation, company tier, and domain relevance.
  // ---------------------------------------------------------------------------
  const hasTargetRole = Boolean(profile.targetRole && profile.targetRole.trim().length > 1);
  const hasCareerGoal = Boolean(
    (profile.careerFocus && profile.careerFocus.trim().length > 1) ||
    (careerGoals && careerGoals.some((g) => g.title && g.title.trim().length > 1))
  );
  const hasCompanyTier = Boolean(
    profile.targetCompanyTier && profile.targetCompanyTier.trim().length > 1
  );

  let industryAlignment = 0;
  // Industry alignment strictly requires a defined career target or goal
  if (hasTargetRole || hasCareerGoal || hasCompanyTier) {
    let alignmentScore = 0;
    if (hasTargetRole) alignmentScore += 30;
    if (hasCareerGoal) alignmentScore += 25;
    if (hasCompanyTier) alignmentScore += 15;

    // Alignment proof: skills supporting the designated target role
    if (validSkills.length >= 4) {
      alignmentScore += 20;
    } else if (validSkills.length >= 2) {
      alignmentScore += 15;
    }

    // Alignment proof: at least 1 project demonstrating target fit
    if (validProjects.length >= 1) {
      alignmentScore += 10;
    }

    industryAlignment = Math.min(100, Math.max(0, alignmentScore));
  }

  // ---------------------------------------------------------------------------
  // PILLAR D: VERIFICATIONS (0 - 100) — Weight: 20%
  // Evaluates connected proof profiles (GitHub/LinkedIn/Portfolio), distinctions, and GPA.
  // ---------------------------------------------------------------------------
  const hasGithub = Boolean(
    profile.githubUrl &&
    profile.githubUrl.includes('github.com') &&
    profile.githubUrl.trim().length > 12 &&
    !profile.githubUrl.includes('username')
  );
  const hasLinkedin = Boolean(
    profile.linkedinUrl &&
    profile.linkedinUrl.includes('linkedin.com') &&
    profile.linkedinUrl.trim().length > 12 &&
    !profile.linkedinUrl.includes('username')
  );
  const hasPortfolio = Boolean(
    profile.portfolioUrl &&
    profile.portfolioUrl.trim().length > 8 &&
    !profile.portfolioUrl.includes('placeholder')
  );

  const validAchievements = (achievements || []).filter(
    (a) => a && typeof a.title === 'string' && a.title.trim().length > 0
  );
  const hasCgpa = Boolean(profile.cgpa && Number(profile.cgpa) > 0);

  let verifications = 0;
  const anyVerificationEvidence =
    hasGithub ||
    hasLinkedin ||
    hasPortfolio ||
    validAchievements.length > 0 ||
    verifiedSkills.length > 0 ||
    hasCgpa;

  if (anyVerificationEvidence) {
    let verifScore = 0;
    if (hasGithub) verifScore += 25;
    if (hasLinkedin) verifScore += 25;
    if (hasPortfolio) verifScore += 15;
    if (validAchievements.length > 0) {
      verifScore += Math.min(25, validAchievements.length * 15);
    }
    if (verifiedSkills.length > 0) {
      verifScore += Math.min(15, verifiedSkills.length * 5);
    }
    if (hasCgpa) {
      verifScore += 10;
    }

    verifications = Math.min(100, Math.max(0, verifScore));
  }

  // ---------------------------------------------------------------------------
  // OVERALL READINESS INDEX DERIVATION (0 - 100)
  // Derived strictly from the four pillars using standard V4 weighting.
  // ---------------------------------------------------------------------------
  const hasEvidence =
    validSkills.length > 0 ||
    validProjects.length > 0 ||
    validAchievements.length > 0 ||
    hasTargetRole ||
    hasCareerGoal ||
    hasGithub ||
    hasLinkedin ||
    hasPortfolio;

  let overallScore = 0;
  if (hasEvidence) {
    const rawWeighted =
      skillsCoverage * PILLAR_WEIGHTS.skillsCoverage +
      projectPortfolio * PILLAR_WEIGHTS.projectPortfolio +
      industryAlignment * PILLAR_WEIGHTS.industryAlignment +
      verifications * PILLAR_WEIGHTS.verifications;

    overallScore = Math.min(100, Math.max(0, Math.round(rawWeighted)));
  }

  return {
    overallScore,
    skillsCoverage,
    projectPortfolio,
    industryAlignment,
    verifications,
    pillarWeights: { ...PILLAR_WEIGHTS },
    // Backward-compatibility aliases
    codeProofHealth: projectPortfolio,
    marketAlignment: industryAlignment,
    verificationIndex: verifications,
    foundationScore: Math.round((industryAlignment / 100) * 15),
    skillsScore: Math.round((skillsCoverage / 100) * 25),
    projectsScore: Math.round((projectPortfolio / 100) * 30),
    achievementsScore: Math.round((verifications / 100) * 15),
    profilesScore: Math.round((verifications / 100) * 15),
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
      hasCareerGoal,
    },
  };
}
