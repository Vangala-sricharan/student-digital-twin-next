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
    name: profile.fullName || profile.name || '',
    targetRole: profile.targetRole || careerGoal?.targetRole || '',
    degree: profile.degree || '',
    branch: profile.branch || '',
    university: profile.university || '',
    year: profile.year || '',
    cgpa: profile.cgpa || profile.currentGpa || '',
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
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
      role: p.role,
      status: p.status,
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
    portfolioUrl: profile.portfolioUrl,
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

  // Dedicated Production Serverless Route for Project Proof Auditor
  if (request.engineId === 'project-auditor') {
    onStageUpdate?.(1, 'Inspecting Repository & Code Evidence');
    try {
      const res = await fetch('/api/ai/project-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request.userInputs,
          studentContext: request.studentContext,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.status === 'success' && json.data) {
        onStageUpdate?.(2, 'Audit Complete');
        return {
          engineId: 'project-auditor',
          status: 'success',
          data: json.data,
          rawText: json.rawText || json.data.rawText || '',
          timestamp: json.timestamp || new Date().toISOString(),
        };
      }

      // Handle specific error codes cleanly
      const errorMsg =
        json.error ||
        (res.status === 404
          ? 'GitHub repository not found.'
          : res.status === 400
          ? 'Invalid project details provided for audit.'
          : 'Project code audit could not be completed.');

      return {
        engineId: 'project-auditor',
        status: 'error',
        error: errorMsg,
        data: null,
        timestamp: new Date().toISOString(),
      };
    } catch (fetchErr: any) {
      return {
        engineId: 'project-auditor',
        status: 'error',
        error: fetchErr?.message || 'Network connection failed while reaching Project Auditor API.',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // GitHub Auditor: Call dedicated /api/ai/github-audit route
  if (request.engineId === 'github-audit') {
    try {
      onStageUpdate?.(1, 'Analyzing GitHub Profile');
      const res = await fetch('/api/ai/github-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request.userInputs,
          studentContext: request.studentContext,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.status === 'success' && json.data) {
        onStageUpdate?.(2, 'Audit Complete');
        return {
          engineId: 'github-audit',
          status: 'success',
          data: json.data,
          rawText: json.rawText || '',
          timestamp: json.timestamp || new Date().toISOString(),
        };
      }

      const errorMsg =
        json.error ||
        (res.status === 404
          ? "GitHub account not found. We couldn't find a public GitHub account for this username. Please check the URL and try again."
          : res.status === 400
          ? 'Please provide a valid public GitHub profile URL.'
          : res.status === 429
          ? 'GitHub API rate limit reached. Please wait a few moments before retrying.'
          : 'GitHub profile audit could not be completed.');

      return {
        engineId: 'github-audit',
        status: 'error',
        error: errorMsg,
        data: null,
        timestamp: new Date().toISOString(),
      };
    } catch (fetchErr: any) {
      return {
        engineId: 'github-audit',
        status: 'error',
        error: fetchErr?.message || 'Network connection failed while reaching GitHub Auditor API.',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // LinkedIn Audit: Call dedicated /api/ai/linkedin-audit route
  if (request.engineId === 'linkedin-audit') {
    try {
      onStageUpdate?.(1, 'Analyzing LinkedIn PDF');
      const res = await fetch('/api/ai/linkedin-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request.userInputs,
          studentContext: request.studentContext,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok && json.status === 'success' && json.data) {
        onStageUpdate?.(2, 'Audit Complete');
        return {
          engineId: 'linkedin-audit',
          status: 'success',
          data: json.data,
          rawText: json.rawText || '',
          timestamp: json.timestamp || new Date().toISOString(),
        };
      }

      const errorMsg =
        json.error ||
        (res.status === 400
          ? 'The uploaded PDF does not contain sufficient profile content to conduct an audit. Please upload an authentic profile export PDF.'
          : 'LinkedIn profile audit could not be completed.');

      return {
        engineId: 'linkedin-audit',
        status: 'error',
        error: errorMsg,
        data: null,
        timestamp: new Date().toISOString(),
      };
    } catch (fetchErr: any) {
      return {
        engineId: 'linkedin-audit',
        status: 'error',
        error: fetchErr?.message || 'Network connection failed while reaching LinkedIn Audit API.',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }

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

