import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { EngineId, EngineAiRequest, EngineAiResponse } from '../types/engines';
import { AIJob, AIJobContextType, AIJobStage, DEFAULT_ENGINE_STAGES } from '../types/aiJobs';
import { executeAiEngine } from '../lib/aiEngineService';
import { useAuth } from './AuthContext';
import { useStudentTwin } from './StudentTwinContext';

const AIJobContext = createContext<AIJobContextType | undefined>(undefined);

// Initial empty job generator
function createInitialJob(engineId: EngineId): AIJob {
  return {
    engineId,
    status: 'idle',
    stages: DEFAULT_ENGINE_STAGES[engineId] || [],
    currentStageIndex: 0,
    progress: 0,
  };
}

export const AIJobProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isDemoMode } = useStudentTwin();
  const scopeKey = isDemoMode ? 'demo' : (user?.id ? `user_${user.id}` : 'guest');

  const getStorageKey = useCallback((engineId: EngineId) => {
    return `sdt_ai_job_${scopeKey}_${engineId}`;
  }, [scopeKey]);

  // Load jobs specific to active session/scope
  const loadJobsForScope = useCallback((): Record<EngineId, AIJob> => {
    const initial: Partial<Record<EngineId, AIJob>> = {};
    const engineIds = Object.keys(DEFAULT_ENGINE_STAGES) as EngineId[];
    engineIds.forEach((id) => {
      let restored: AIJob | null = null;
      try {
        const saved = localStorage.getItem(`sdt_ai_job_${scopeKey}_${id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.status === 'completed' && parsed.result) {
            restored = parsed;
          }
        }
      } catch {}
      initial[id] = restored || createInitialJob(id);
    });
    return initial as Record<EngineId, AIJob>;
  }, [scopeKey]);

  const [jobs, setJobs] = useState<Record<EngineId, AIJob>>(loadJobsForScope);

  // Sync jobs whenever scope changes (e.g., login, switch to demo, logout)
  useEffect(() => {
    setJobs(loadJobsForScope());
  }, [scopeKey, loadJobsForScope]);

  // Keep track of active timers and abort controllers
  const jobTimers = useRef<Record<string, NodeJS.Timeout[]>>({});
  const lastPayloads = useRef<Record<string, { payload: EngineAiRequest; stages?: AIJobStage[] }>>({});

  const clearJobTimers = (engineId: string) => {
    if (jobTimers.current[engineId]) {
      jobTimers.current[engineId].forEach((t) => clearTimeout(t));
      jobTimers.current[engineId] = [];
    }
  };

  const getJob = useCallback(
    (engineId: EngineId): AIJob => {
      return jobs[engineId] || createInitialJob(engineId);
    },
    [jobs]
  );

  const resetJob = useCallback((engineId: EngineId) => {
    clearJobTimers(engineId);
    try {
      localStorage.removeItem(getStorageKey(engineId));
    } catch {}
    setJobs((prev) => ({
      ...prev,
      [engineId]: createInitialJob(engineId),
    }));
  }, [getStorageKey]);

  const clearAllJobs = useCallback(() => {
    Object.keys(jobTimers.current).forEach(clearJobTimers);
    const initial: Partial<Record<EngineId, AIJob>> = {};
    (Object.keys(DEFAULT_ENGINE_STAGES) as EngineId[]).forEach((id) => {
      try {
        localStorage.removeItem(getStorageKey(id));
      } catch {}
      initial[id] = createInitialJob(id);
    });
    setJobs(initial as Record<EngineId, AIJob>);
  }, [getStorageKey]);

  const runJob = useCallback(
    async (
      engineId: EngineId,
      requestPayload: EngineAiRequest,
      customStages?: AIJobStage[]
    ): Promise<EngineAiResponse | null> => {
      const current = jobs[engineId];
      // Prevent duplicate executions if already actively running
      if (current && current.status === 'running') {
        console.info(`[AIJobManager] Job for engine ${engineId} is already running.`);
        return null;
      }

      const stages = customStages || DEFAULT_ENGINE_STAGES[engineId] || [
        { id: 'start', label: 'Preparing parameters...', badge: 'Preparing' },
        { id: 'running', label: 'Analyzing profile content & evidence...', badge: 'Running Audit' },
        { id: 'finalize', label: 'Finalizing report...', badge: 'Finalizing' },
      ];

      lastPayloads.current[engineId] = { payload: requestPayload, stages };
      clearJobTimers(engineId);

      const startTime = Date.now();

      // Set initial running state (Step 1 of N)
      setJobs((prev) => ({
        ...prev,
        [engineId]: {
          engineId,
          status: 'running',
          stages,
          currentStageIndex: 0,
          progress: Math.round(100 / (stages.length * 2)),
          startTime,
          error: undefined,
          inputsSnapshot: requestPayload.userInputs,
        },
      }));

      // Real-time stage progression handler updated dynamically as execution progresses
      const handleStageProgress = (stageIndex: number, badge?: string) => {
        setJobs((prev) => {
          const currentJob = prev[engineId];
          if (currentJob && currentJob.status === 'running') {
            const boundedIndex = Math.max(0, Math.min(stages.length - 1, stageIndex));
            const targetProgress = Math.min(95, Math.round(((boundedIndex + 0.6) / stages.length) * 100));
            return {
              ...prev,
              [engineId]: {
                ...currentJob,
                currentStageIndex: boundedIndex,
                progress: targetProgress,
              },
            };
          }
          return prev;
        });
      };

      jobTimers.current[engineId] = [];

      // Safety timeout after 45 seconds to guard against network stalls
      const timeoutTimer = setTimeout(() => {
        setJobs((prev) => {
          const currentJob = prev[engineId];
          if (currentJob && currentJob.status === 'running') {
            return {
              ...prev,
              [engineId]: {
                ...currentJob,
                status: 'error',
                error: 'Analysis is taking longer than expected. Please verify your parameters and retry.',
              },
            };
          }
          return prev;
        });
      }, 45000);
      jobTimers.current[engineId].push(timeoutTimer);

      try {
        // Execute the actual AI engine call with real-time stage updates
        const response = await executeAiEngine(requestPayload, handleStageProgress);

        // Immediate completion: clear timers and finalize
        clearJobTimers(engineId);

        if (response.status === 'error') {
          setJobs((prev) => ({
            ...prev,
            [engineId]: {
              engineId,
              status: 'error',
              stages,
              currentStageIndex: 0,
              progress: 0,
              startTime,
              error: response.error || 'Failed to complete analysis. Please check parameters and retry.',
              inputsSnapshot: requestPayload.userInputs,
              result: undefined,
              rawText: undefined,
            },
          }));
          return response;
        }

        const completedJob: AIJob = {
          engineId,
          status: 'completed',
          stages,
          currentStageIndex: stages.length - 1,
          progress: 100,
          startTime,
          completedTime: Date.now(),
          result: response,
          rawText: response.rawText,
          error: undefined,
          inputsSnapshot: requestPayload.userInputs,
        };

        try {
          localStorage.setItem(getStorageKey(engineId), JSON.stringify(completedJob));
        } catch (e) {
          console.warn('Could not persist job to localStorage:', e);
        }

        setJobs((prev) => ({
          ...prev,
          [engineId]: completedJob,
        }));

        return response;
      } catch (err: any) {
        clearJobTimers(engineId);
        const errorMessage = err?.message || 'An error occurred during AI execution. Please try again.';

        setJobs((prev) => ({
          ...prev,
          [engineId]: {
            engineId,
            status: 'error',
            stages,
            currentStageIndex: 0,
            progress: 0,
            startTime,
            error: errorMessage,
            inputsSnapshot: requestPayload.userInputs,
            result: undefined,
            rawText: undefined,
          },
        }));
        return null;
      }
    },
    [jobs]
  );

  const retryJob = useCallback(
    async (engineId: EngineId): Promise<EngineAiResponse | null> => {
      const saved = lastPayloads.current[engineId];
      if (saved) {
        return await runJob(engineId, saved.payload, saved.stages);
      }
      return null;
    },
    [runJob]
  );

  return (
    <AIJobContext.Provider
      value={{
        jobs,
        getJob,
        runJob,
        resetJob,
        retryJob,
        clearAllJobs,
      }}
    >
      {children}
    </AIJobContext.Provider>
  );
};

export function useAIJobs() {
  const context = useContext(AIJobContext);
  if (!context) {
    throw new Error('useAIJobs must be used within an AIJobProvider');
  }
  return context;
}

export function useEngineJob(engineId: EngineId) {
  const { jobs, runJob, resetJob, retryJob } = useAIJobs();
  const job = jobs[engineId] || createInitialJob(engineId);

  const execute = useCallback(
    (requestPayload: EngineAiRequest, customStages?: AIJobStage[]) => {
      return runJob(engineId, requestPayload, customStages);
    },
    [engineId, runJob]
  );

  const reset = useCallback(() => {
    resetJob(engineId);
  }, [engineId, resetJob]);

  const retry = useCallback(() => {
    return retryJob(engineId);
  }, [engineId, retryJob]);

  return {
    job,
    isRunning: job.status === 'running',
    isCompleted: job.status === 'completed',
    isError: job.status === 'error',
    result: job.result,
    structuredData: job.result?.data,
    rawText: job.rawText,
    error: job.error,
    currentStageIndex: job.currentStageIndex,
    progress: job.progress,
    stages: job.stages,
    execute,
    reset,
    retry,
  };
}
