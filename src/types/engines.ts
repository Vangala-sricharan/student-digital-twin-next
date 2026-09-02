export type EngineId =
  | 'career-assistant'
  | 'ai-portfolio'
  | 'project-auditor'
  | 'github-audit'
  | 'linkedin-audit'
  | 'resume-builder'
  | 'resume-ats'
  | 'syllabus-prep'
  | 'roadmap-30-60-90'
  | 'internship-ready'
  | 'career-simulator';

export interface EngineMeta {
  id: EngineId;
  number: number;
  name: string;
  shortDesc: string;
  fullDesc: string;
  category: 'Advisory & Strategy' | 'Portfolio & Brand' | 'Audits & Code' | 'Academic & Career Planning';
  icon: string;
  badge?: string;
}

export interface EngineAiRequest {
  engineId: EngineId;
  studentContext: {
    name: string;
    targetRole: string;
    degree: string;
    branch: string;
    university: string;
    year: string;
    cgpa?: number | string;
    readinessScore: number;
    skills: Array<{ name: string; category: string; proficiency: number; verified: boolean }>;
    projects: Array<{ title: string; techStack: string[]; description: string; astDepth?: string; entropyScore?: number }>;
    achievements: Array<{ title: string; issuer: string; date: string; category: string }>;
    careerGoal?: { targetRole: string; targetDomain?: string; targetTimeline?: string };
    githubUrl?: string;
    linkedinUrl?: string;
  };
  userInputs?: Record<string, any>;
  documentText?: string;
  documentMeta?: {
    fileName: string;
    fileType: 'pdf' | 'ppt' | 'pptx' | 'txt' | 'other';
    fileSize: number;
  };
}

export interface EngineAiResponse {
  engineId: EngineId;
  timestamp: string;
  status: 'success' | 'error';
  data: any;
  rawText?: string;
  error?: string;
}
