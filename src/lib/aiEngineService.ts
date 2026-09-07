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
    readinessScore: profile.readinessScore ?? 0,
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
export async function executeAiEngine(
  request: EngineAiRequest,
  onStageUpdate?: (stageIndex: number, badge?: string) => void
): Promise<EngineAiResponse> {
  onStageUpdate?.(0, 'Initializing Engine');

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
        onStageUpdate?.(2, 'Analysis Complete');
        return json;
      }
    }
  } catch (fetchErr) {
    // Network or direct client fallback
  }

  // Fallback to local serverAiHandler processing with real-time stage updates
  return await processEngineAiRequest(request, onStageUpdate);
}

/**
 * Generates an AI-powered project description based strictly on user-provided inputs.
 * Triggered ONLY by explicit user request ("AI Generate Description").
 */
export async function generateProjectDescriptionAi(params: {
  projectName: string;
  techStack?: string;
  category?: string;
  role?: string;
  keyDetails?: string;
  studentContext?: any;
}): Promise<{ success: boolean; description: string; error?: string }> {
  try {
    const res = await executeAiEngine({
      engineId: 'generate-project-description',
      studentContext: params.studentContext || {
        name: 'Student',
        targetRole: 'Software Developer',
        degree: 'B.Tech',
        branch: 'Computer Science',
        university: 'Engineering Institution',
        year: '3rd',
        readinessScore: 0,
        skills: [],
        projects: [],
        achievements: [],
      },
      userInputs: {
        projectName: params.projectName,
        techStack: params.techStack,
        category: params.category,
        role: params.role,
        keyDetails: params.keyDetails,
      },
    });

    if (res.status === 'success' && res.data?.description) {
      return { success: true, description: res.data.description };
    }
    return { success: false, description: '', error: res.error || 'Failed to generate description.' };
  } catch (err: any) {
    return { success: false, description: '', error: err?.message || 'Error executing AI generation.' };
  }
}

/**
 * Generates an AI-powered achievement description based strictly on user-provided inputs.
 * Triggered ONLY by explicit user request ("AI Generate Description").
 */
export async function generateAchievementDescriptionAi(params: {
  title: string;
  category?: string;
  issuer?: string;
  date?: string;
  details?: string;
  studentContext?: any;
}): Promise<{ success: boolean; description: string; error?: string }> {
  try {
    const res = await executeAiEngine({
      engineId: 'generate-achievement-description',
      studentContext: params.studentContext || {
        name: 'Student',
        targetRole: 'Software Developer',
        degree: 'B.Tech',
        branch: 'Computer Science',
        university: 'Engineering Institution',
        year: '3rd',
        readinessScore: 0,
        skills: [],
        projects: [],
        achievements: [],
      },
      userInputs: {
        title: params.title,
        category: params.category,
        issuer: params.issuer,
        date: params.date,
        details: params.details,
      },
    });

    if (res.status === 'success' && res.data?.description) {
      return { success: true, description: res.data.description };
    }
    return { success: false, description: '', error: res.error || 'Failed to generate description.' };
  } catch (err: any) {
    return { success: false, description: '', error: err?.message || 'Error executing AI generation.' };
  }
}

