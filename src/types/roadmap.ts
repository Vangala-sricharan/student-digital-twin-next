export type RoadmapDuration = 30 | 60 | 90;

export type RoadmapLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type TaskType = 'Skill' | 'Project' | 'Career' | 'Interview' | 'Portfolio';

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  estimatedHours: number;
  completed: boolean;
  completedAt?: string;
}

export interface RoadmapPhase {
  id: string;
  name: string; // e.g. "30-Day Foundation", "60-Day Acceleration", "90-Day Placement Ready"
  phase: string; // e.g. "Days 1–30", "Days 31–60", "Days 61–90"
  days: string; // e.g. "Days 1–30"
  focus: string;
  milestones: string[];
  tasks: RoadmapTask[];
  deliverables?: string[];
}

export interface UserRoadmap {
  id: string;
  userId: string;
  studentProfileId?: string;
  title: string;
  domain: string;
  goal: string;
  durationDays: RoadmapDuration;
  level?: RoadmapLevel;
  availableHours?: string;
  targetRole?: string;
  targetCompanies?: string;
  specificTopics?: string;
  phases: RoadmapPhase[];
  summary?: string;
  strengths?: string[];
  gaps?: string[];
  recommendations?: Array<{ priority: number; title: string; desc: string }>;
  progress: number; // 0 - 100
  completedTasksCount: number;
  totalTasksCount: number;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface RoadmapCreationParams {
  domain: string;
  goal: string;
  durationDays: RoadmapDuration;
  level?: RoadmapLevel;
  availableHours?: string;
  targetRole?: string;
  targetCompanies?: string;
  specificTopics?: string;
}
