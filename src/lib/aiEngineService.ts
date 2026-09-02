import { EngineAiRequest, EngineAiResponse, EngineId } from '../types/engines';
import { StudentProfile, SkillItem, ProjectItem, AchievementItem, CareerGoal } from '../types';
import { processEngineAiRequest } from './serverAiHandler';

/**
 * Builds standard EngineAiRequest payload from StudentTwin context
 */
export function buildStudentContext(
  profile: StudentProfile,
  skills: SkillItem[],
  projects: ProjectItem[],
  achievements: AchievementItem[],
  careerGoal?: CareerGoal
): EngineAiRequest['studentContext'] {
  return {
    name: profile.fullName || profile.name || 'Student Candidate',
    targetRole: profile.targetRole || 'Software Development Engineer',
    degree: profile.degree || 'B.Tech',
    branch: profile.branch || 'Computer Science & Engineering',
    university: profile.university || 'Engineering University',
    year: profile.year || '3rd',
    cgpa: profile.cgpa || profile.currentGpa || '8.5',
    readinessScore: profile.readinessScore || 75,
    skills: skills.map((s) => ({
      name: s.name,
      category: s.category,
      proficiency: s.proficiency,
      verified: s.verified,
    })),
    projects: projects.map((p) => ({
      title: p.title,
      techStack: p.techStack || [],
      description: p.description,
      astDepth: p.astDepth,
      entropyScore: p.entropyScore,
    })),
    achievements: achievements.map((a) => ({
      title: a.title,
      issuer: a.issuer,
      date: a.date,
      category: a.category,
    })),
    careerGoal: careerGoal
      ? {
          targetRole: careerGoal.targetRole,
          targetDomain: careerGoal.targetDomain,
          targetTimeline: careerGoal.targetTimeline,
        }
      : undefined,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
  };
}

/**
 * Client service to execute an AI Career OS Engine.
 * Attempts POST /api/engine-ai, with automatic client-side fallback if server route is unavailable.
 */
export async function executeAiEngine(request: EngineAiRequest): Promise<EngineAiResponse> {
  try {
    const res = await fetch('/api/engine-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success') {
        return json;
      }
    }
  } catch (fetchErr) {
    // Network or direct client fallback
  }

  // Fallback to local serverAiHandler processing
  return await processEngineAiRequest(request);
}
