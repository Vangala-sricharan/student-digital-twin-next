import { EngineId, EngineAiRequest, EngineAiResponse } from './engines';

export type AIJobStatus = 'idle' | 'running' | 'completed' | 'error';

export interface AIJobStage {
  id: string;
  label: string;
  badge?: string;
}

export interface AIJob {
  engineId: EngineId;
  status: AIJobStatus;
  stages: AIJobStage[];
  currentStageIndex: number;
  progress: number; // 0 to 100
  startTime?: number;
  completedTime?: number;
  result?: EngineAiResponse;
  rawText?: string;
  error?: string;
  inputsSnapshot?: any;
}

export interface AIJobContextType {
  jobs: Record<EngineId, AIJob>;
  getJob: (engineId: EngineId) => AIJob;
  runJob: (
    engineId: EngineId,
    requestPayload: EngineAiRequest,
    customStages?: AIJobStage[]
  ) => Promise<EngineAiResponse | null>;
  resetJob: (engineId: EngineId) => void;
  retryJob: (engineId: EngineId) => Promise<EngineAiResponse | null>;
  clearAllJobs: () => void;
}

export const DEFAULT_ENGINE_STAGES: Record<EngineId, AIJobStage[]> = {
  'career-assistant': [
    { id: 'prep', label: 'Preparing Student Twin context & query parameters...', badge: 'Preparing Context' },
    { id: 'analyze', label: 'Analyzing skills, verified projects & gap metrics...', badge: 'Analyzing Twin' },
    { id: 'generate', label: 'Generating structured career co-pilot advisory...', badge: 'AI Advisory' },
    { id: 'finalize', label: 'Formatting actionable placement milestones...', badge: 'Finalizing' },
  ],
  'ai-portfolio': [
    { id: 'extract', label: 'Reading verified skills & project entropy records...', badge: 'Reading Twin' },
    { id: 'structure', label: 'Structuring professional technical positioning...', badge: 'Structuring' },
    { id: 'synthesize', label: 'Synthesizing recruiter-focused narratives & headlines...', badge: 'AI Synthesis' },
    { id: 'finalize', label: 'Compiling formatted portfolio presentation copy...', badge: 'Finalizing' },
  ],
  'project-auditor': [
    { id: 'parse', label: 'Parsing project architecture & technology stack...', badge: 'Parsing Spec' },
    { id: 'audit', label: 'Auditing implementation depth & problem definition...', badge: 'Auditing Code' },
    { id: 'benchmark', label: 'Benchmarking code rigor against industry standards...', badge: 'Benchmarking' },
    { id: 'scorecard', label: 'Generating technical audit report & recommendations...', badge: 'Finalizing' },
  ],
  'github-audit': [
    { id: 'connect', label: 'Connecting to target GitHub profile & repository evidence...', badge: 'Connecting' },
    { id: 'collect', label: 'Analyzing profile content & evidence...', badge: 'Running Audit' },
    { id: 'evaluate', label: 'Evaluating repository documentation & commit discipline...', badge: 'Evaluating' },
    { id: 'scorecard', label: 'Generating GitHub Code Rigor & Recruiter Scorecard...', badge: 'Finalizing' },
  ],
  'linkedin-audit': [
    { id: 'read', label: 'Reading LinkedIn presence evidence & headline signals...', badge: 'Reading Profile' },
    { id: 'positioning', label: 'Auditing About section, project highlights & positioning...', badge: 'Running Audit' },
    { id: 'visibility', label: 'Evaluating recruiter search visibility & keyword alignment...', badge: 'Evaluating' },
    { id: 'recommendations', label: 'Generating LinkedIn optimization recommendations...', badge: 'Finalizing' },
  ],
  'resume-builder': [
    { id: 'extract', label: 'Extracting Student Twin achievements & project highlights...', badge: 'Extracting' },
    { id: 'structure', label: 'Applying ATS-compliant single-column layout structure...', badge: 'Formatting' },
    { id: 'synthesize', label: 'Synthesizing high-impact action-driven bullet points...', badge: 'AI Synthesis' },
    { id: 'compile', label: 'Compiling recruiter-ready ATS formatted resume...', badge: 'Finalizing' },
  ],
  'resume-ats': [
    { id: 'read', label: 'Reading resume structure & credentials...', badge: 'Parsing Resume' },
    { id: 'match', label: 'Matching credentials against target role requirements...', badge: 'Role Match' },
    { id: 'evaluate', label: 'Evaluating ATS parseability & keyword density score...', badge: 'Running Audit' },
    { id: 'scorecard', label: 'Generating priority fixes & ATS compatibility report...', badge: 'Finalizing' },
  ],
  'syllabus-prep': [
    { id: 'read', label: 'Reading uploaded syllabus / slide deck material...', badge: 'Reading Document' },
    { id: 'units', label: 'Identifying core units, modules & high-priority topics...', badge: 'Parsing Units' },
    { id: 'priorities', label: 'Prioritizing exam-critical concepts & question trends...', badge: 'Exam Analysis' },
    { id: 'strategy', label: 'Building topic-wise explanations & practice questions...', badge: 'AI Synthesis' },
    { id: 'finalize', label: 'Generating comprehensive exam preparation roadmap...', badge: 'Finalizing' },
  ],
  'roadmap-30-60-90': [
    { id: 'telemetry', label: 'Analyzing current skill gaps & placement horizon...', badge: 'Gap Analysis' },
    { id: 'days30', label: 'Structuring 30-day foundational sprint & DSA milestones...', badge: 'Sprint 30' },
    { id: 'days60', label: 'Structuring 60-day proof-of-work project milestones...', badge: 'Sprint 60' },
    { id: 'days90', label: 'Structuring 90-day mock interview & placement sprint...', badge: 'Finalizing' },
  ],
  'internship-ready': [
    { id: 'telemetry', label: 'Aggregating Student Twin readiness & verification signals...', badge: 'Aggregating' },
    { id: 'audit', label: 'Auditing technical depth, repositories & resume health...', badge: 'Auditing Signals' },
    { id: 'probability', label: 'Evaluating Tier-1 internship readiness probability...', badge: 'Evaluating' },
    { id: 'actionplan', label: 'Generating pre-application checklist & critical next steps...', badge: 'Finalizing' },
  ],
  'career-simulator': [
    { id: 'baseline', label: 'Loading Student Twin baseline metrics & simulation parameters...', badge: 'Loading Baseline' },
    { id: 'project', label: 'Projecting 1–3 year multi-variable trajectory curves...', badge: 'Simulating' },
    { id: 'compensation', label: 'Estimating compensation bands (₹) & market percentiles...', badge: 'Calculating' },
    { id: 'milestones', label: 'Generating career milestone checklist & risk mitigations...', badge: 'Finalizing' },
  ],
};
