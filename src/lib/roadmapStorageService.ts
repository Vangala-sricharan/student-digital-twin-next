import { supabase, isSupabaseConfigured, withTimeout } from './supabase';
import { UserRoadmap, RoadmapPhase, RoadmapTask } from '../types/roadmap';

const STORAGE_PREFIX = 'sdt_user_roadmaps_';

/**
 * Calculates current completion counts and progress percentage
 */
export function recalculateRoadmapProgress(phases: RoadmapPhase[]): {
  completedTasksCount: number;
  totalTasksCount: number;
  progress: number;
} {
  let completed = 0;
  let total = 0;

  for (const phase of phases) {
    if (Array.isArray(phase.tasks)) {
      for (const task of phase.tasks) {
        total++;
        if (task.completed) {
          completed++;
        }
      }
    }
  }

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completedTasksCount: completed, totalTasksCount: total, progress };
}

/**
 * Read-only Demo Mode Showcase Roadmap (Alex Chen - Systems & Full-Stack 90-Day Sprint)
 */
export function getDemoShowcaseRoadmap(): UserRoadmap {
  const phases: RoadmapPhase[] = [
    {
      id: 'demo-phase-1',
      name: '30-Day Foundation',
      phase: 'Days 1–30',
      days: 'Days 1–30',
      focus: 'Advanced TypeScript Systems, Concurrency Patterns & Core Performance Auditing',
      milestones: [
        'Solidify distributed transaction patterns (2PC, Saga) and benchmark database connection pools',
        'Audit active Next.js/Go repository codebases for strict type safety and sub-50ms query latency',
        'Deploy modular Redis cache-aside layer to handle high-throughput mock workloads',
      ],
      tasks: [
        {
          id: 'demo-task-1-1',
          title: 'Benchmark Redis Cache-Aside Hit Ratio Under Simulated Traffic',
          description: 'Deploy a k6 load test script targeting cached vs uncached REST endpoints to document p99 latency gains.',
          type: 'Project',
          estimatedHours: 6,
          completed: true,
          completedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
        },
        {
          id: 'demo-task-1-2',
          title: 'Implement Database Connection Pooling & Zero-Allocation Serialization',
          description: 'Refactor repository database drivers to utilize connection pools with strict connection timeouts and metrics.',
          type: 'Skill',
          estimatedHours: 8,
          completed: true,
          completedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
        },
        {
          id: 'demo-task-1-3',
          title: 'Instrument Structured JSON Logging with OpenTelemetry Traces',
          description: 'Wrap Express/Fastify service request lifecycles with correlation IDs and OpenTelemetry span exports.',
          type: 'Skill',
          estimatedHours: 5,
          completed: false,
        },
        {
          id: 'demo-task-1-4',
          title: 'Audit Repository AST Structure and Remove Dead Code Dependencies',
          description: 'Run automated bundle analyzer and eliminate duplicate tree dependencies to minimize container image sizes.',
          type: 'Portfolio',
          estimatedHours: 4,
          completed: false,
        },
      ],
      deliverables: [
        'Public GitHub repo with passing CI/CD benchmark tests and OpenTelemetry instrumentation',
        'Validated k6 latency report demonstrating <45ms p95 latency under 500 RPS',
      ],
    },
    {
      id: 'demo-phase-2',
      name: '60-Day Acceleration',
      phase: 'Days 31–60',
      days: 'Days 31–60',
      focus: 'Distributed Systems Architecture, Container Orchestration & Cloud Proof of Work',
      milestones: [
        'Containerize microservices with multi-stage Dockerfiles and deploy to Kubernetes / Cloud Run',
        'Implement resilient retry with exponential backoff and circuit breakers on external service calls',
        'Publish an architecture RFC document detailing trade-offs between sync REST vs async message queues',
      ],
      tasks: [
        {
          id: 'demo-task-2-1',
          title: 'Architect Asynchronous Event Bus with RabbitMQ / Kafka',
          description: 'Decouple ingestion from background workers with dead-letter queue handling and idempotent consumers.',
          type: 'Project',
          estimatedHours: 12,
          completed: false,
        },
        {
          id: 'demo-task-2-2',
          title: 'Deploy Production Cluster with Terraform Infrastructure-as-Code',
          description: 'Write reproducible HCL configuration for VPC, subnets, managed database, and container ingress.',
          type: 'Skill',
          estimatedHours: 10,
          completed: false,
        },
        {
          id: 'demo-task-2-3',
          title: 'Author In-Depth Technical Architecture Post on LinkedIn / Dev.to',
          description: 'Break down real system trade-offs: CAP theorem considerations, database partitioning, and indexing strategies.',
          type: 'Career',
          estimatedHours: 4,
          completed: false,
        },
      ],
      deliverables: [
        'Live production service with SSL, automated health checks, and public demo credentials',
        'Comprehensive technical architecture diagram and OpenAPI 3.0 specification in repo',
      ],
    },
    {
      id: 'demo-phase-3',
      name: '90-Day Placement Ready',
      phase: 'Days 61–90',
      days: 'Days 61–90',
      focus: 'High-Level System Design Mastery, Recruiter STAR Calibration & Targeted Outreach',
      milestones: [
        'Execute 10+ live technical mock interviews focusing on distributed caching, sharding, and rate limiting',
        'Tailor ATS resume to highlight quantifiable impact metrics (latency reduced by 40%, 10k RPS throughput)',
        'Engage directly with engineering leads and alumni at target high-growth product companies',
      ],
      tasks: [
        {
          id: 'demo-task-3-1',
          title: 'Complete 5 High-Level System Design Mock Architecture Whiteboard Sprints',
          description: 'Design Twitter Feed, URL Shortener, Distributed Rate Limiter, and Notification System under 45-min constraints.',
          type: 'Interview',
          estimatedHours: 8,
          completed: false,
        },
        {
          id: 'demo-task-3-2',
          title: 'Calibrate ATS Resume with Quantified Engineering Impact Metrics',
          description: 'Run through Resume & ATS Analyzer to ensure 90%+ keyword match against Tier-1 SDE job postings.',
          type: 'Career',
          estimatedHours: 3,
          completed: false,
        },
        {
          id: 'demo-task-3-3',
          title: 'Build Interactive Engineering Portfolio with Live Performance Demos',
          description: 'Showcase live system latency graphs, GitHub commit graphs, and verified architecture diagrams.',
          type: 'Portfolio',
          estimatedHours: 6,
          completed: false,
        },
      ],
      deliverables: [
        'Verified 90%+ score across all 4 Student Digital Twin career readiness vectors',
        'Active interview pipeline with top product engineering companies',
      ],
    },
  ];

  const { completedTasksCount, totalTasksCount, progress } = recalculateRoadmapProgress(phases);

  return {
    id: 'demo-showcase-roadmap-alex-chen',
    userId: 'demo-user-id',
    studentProfileId: 'demo-profile-alex-chen',
    title: 'Distributed Systems & Cloud Architecture Sprint',
    domain: 'Full-Stack & Systems Engineering',
    goal: 'Placement-ready at Tier-1 High-Scale Product Engineering Teams',
    durationDays: 90,
    level: 'Advanced',
    availableHours: '20 Hours/Week',
    targetRole: 'Software Development Engineer (Systems / Backend)',
    targetCompanies: 'Google, Stripe, Uber, Cloudflare, Zerodha',
    specificTopics: 'Distributed Systems, High-Concurrency APIs, Redis, Docker, System Design',
    phases,
    summary: 'Tailored 90-day execution blueprint calibrated to bridge academic software engineering to high-scale production systems standards.',
    progress,
    completedTasksCount,
    totalTasksCount,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    isDemo: true,
  };
}

/**
 * Load roadmaps for the current user
 */
export async function loadUserRoadmaps(
  userId?: string,
  profileId?: string,
  isDemo?: boolean
): Promise<UserRoadmap[]> {
  // If demo mode, return the read-only showcase roadmap
  if (isDemo || !userId) {
    return [getDemoShowcaseRoadmap()];
  }

  const storageKey = `${STORAGE_PREFIX}${userId}`;

  // 1. Read from local storage cache first
  let localRoadmaps: UserRoadmap[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localRoadmaps = parsed;
      }
    }
  } catch (err) {
    console.warn('[RoadmapStorage] Failed to read local storage:', err);
  }

  // 2. Try fetching from Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const query = supabase
        .from('user_roadmaps')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data, error } = await withTimeout(query, 3000, { data: null, error: null } as any);

      if (!error && Array.isArray(data) && data.length > 0) {
        const cloudRoadmaps: UserRoadmap[] = data.map((item: any) => {
          const phases: RoadmapPhase[] = Array.isArray(item.phases) ? item.phases : [];
          const { completedTasksCount, totalTasksCount, progress } = recalculateRoadmapProgress(phases);

          return {
            id: item.id,
            userId: item.user_id,
            studentProfileId: item.student_profile_id,
            title: item.title,
            domain: item.domain,
            goal: item.goal,
            durationDays: item.duration_days || 90,
            level: item.level || 'Intermediate',
            availableHours: item.available_hours || '',
            targetRole: item.target_role || '',
            targetCompanies: item.target_companies || '',
            specificTopics: item.specific_topics || '',
            phases,
            summary: item.summary || '',
            recommendations: item.recommendations || [],
            progress,
            completedTasksCount,
            totalTasksCount,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            isDemo: false,
          };
        });

        // Update local storage cache with fresh cloud data
        try {
          localStorage.setItem(storageKey, JSON.stringify(cloudRoadmaps));
        } catch (e) {}

        return cloudRoadmaps;
      }
    } catch (err) {
      console.info('[RoadmapStorage] Cloud fetch notice, utilizing local storage cache:', err);
    }
  }

  return localRoadmaps;
}

/**
 * Save or update a roadmap for the current user
 */
export async function saveUserRoadmap(
  roadmap: UserRoadmap,
  userId: string,
  profileId?: string
): Promise<UserRoadmap> {
  if (!userId || roadmap.isDemo) {
    throw new Error('Cannot save demo roadmap to cloud database.');
  }

  const { completedTasksCount, totalTasksCount, progress } = recalculateRoadmapProgress(roadmap.phases);

  const updatedRoadmap: UserRoadmap = {
    ...roadmap,
    userId,
    studentProfileId: profileId || roadmap.studentProfileId,
    completedTasksCount,
    totalTasksCount,
    progress,
    updatedAt: new Date().toISOString(),
    isDemo: false,
  };

  // 1. Save to local storage cache immediately
  const storageKey = `${STORAGE_PREFIX}${userId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    let list: UserRoadmap[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }

    const existingIdx = list.findIndex((r) => r.id === updatedRoadmap.id);
    if (existingIdx >= 0) {
      list[existingIdx] = updatedRoadmap;
    } else {
      list.unshift(updatedRoadmap);
    }

    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch (err) {
    console.warn('[RoadmapStorage] Failed to save to local cache:', err);
  }

  // 2. Persist to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const payload = {
        id: updatedRoadmap.id,
        user_id: userId,
        student_profile_id: updatedRoadmap.studentProfileId || null,
        title: updatedRoadmap.title,
        domain: updatedRoadmap.domain,
        goal: updatedRoadmap.goal,
        duration_days: updatedRoadmap.durationDays,
        level: updatedRoadmap.level || 'Intermediate',
        available_hours: updatedRoadmap.availableHours || '',
        target_role: updatedRoadmap.targetRole || '',
        target_companies: updatedRoadmap.targetCompanies || '',
        specific_topics: updatedRoadmap.specificTopics || '',
        phases: updatedRoadmap.phases,
        summary: updatedRoadmap.summary || '',
        recommendations: updatedRoadmap.recommendations || [],
        completed_tasks_count: updatedRoadmap.completedTasksCount,
        total_tasks_count: updatedRoadmap.totalTasksCount,
        progress: updatedRoadmap.progress,
        updated_at: updatedRoadmap.updatedAt,
      };

      await withTimeout(
        supabase.from('user_roadmaps').upsert(payload, { onConflict: 'id' }),
        3500
      );
    } catch (err) {
      console.info('[RoadmapStorage] Cloud upsert notice, saved locally:', err);
    }
  }

  return updatedRoadmap;
}

/**
 * Update task completion state
 */
export async function updateTaskCompletion(
  roadmapId: string,
  taskId: string,
  completed: boolean,
  userId: string
): Promise<UserRoadmap | null> {
  const roadmaps = await loadUserRoadmaps(userId);
  const target = roadmaps.find((r) => r.id === roadmapId);
  if (!target) return null;

  let found = false;
  const updatedPhases = target.phases.map((phase) => {
    return {
      ...phase,
      tasks: phase.tasks.map((t) => {
        if (t.id === taskId) {
          found = true;
          return {
            ...t,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
          };
        }
        return t;
      }),
    };
  });

  if (!found) return target;

  const { completedTasksCount, totalTasksCount, progress } = recalculateRoadmapProgress(updatedPhases);

  const updated: UserRoadmap = {
    ...target,
    phases: updatedPhases,
    completedTasksCount,
    totalTasksCount,
    progress,
    updatedAt: new Date().toISOString(),
  };

  return saveUserRoadmap(updated, userId, updated.studentProfileId);
}

/**
 * Delete a user's roadmap
 */
export async function deleteUserRoadmap(roadmapId: string, userId: string): Promise<boolean> {
  if (!userId) return false;

  const storageKey = `${STORAGE_PREFIX}${userId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((r: UserRoadmap) => r.id !== roadmapId);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      }
    }
  } catch (err) {
    console.warn('[RoadmapStorage] Failed to delete from local cache:', err);
  }

  if (isSupabaseConfigured) {
    try {
      await withTimeout(
        supabase.from('user_roadmaps').delete().eq('id', roadmapId).eq('user_id', userId),
        3000
      );
    } catch (err) {
      console.info('[RoadmapStorage] Cloud delete notice:', err);
    }
  }

  return true;
}

/**
 * Update roadmap title
 */
export async function updateRoadmapTitle(
  roadmapId: string,
  newTitle: string,
  userId: string
): Promise<UserRoadmap | null> {
  const roadmaps = await loadUserRoadmaps(userId);
  const target = roadmaps.find((r) => r.id === roadmapId);
  if (!target) return null;

  const updated: UserRoadmap = {
    ...target,
    title: newTitle.trim() || target.title,
    updatedAt: new Date().toISOString(),
  };

  return saveUserRoadmap(updated, userId, updated.studentProfileId);
}
