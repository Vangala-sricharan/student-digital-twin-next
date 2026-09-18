import { supabase, isSupabaseConfigured, withTimeout } from './supabase';
import { QuizHistoryRecord } from '../types/quiz';

const USER_HISTORY_PREFIX = 'sdt_quiz_history_';
const USER_STREAK_PREFIX = 'sdt_quiz_streak_';
const DEMO_VISITOR_HISTORY_KEY = 'sdt_demo_visitor_quiz_history';
const DEMO_VISITOR_STREAK_KEY = 'sdt_demo_visitor_quiz_streak';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayDiff(dateStr1: string, dateStr2: string): number {
  try {
    const [y1, m1, d1] = dateStr1.split('-').map(Number);
    const [y2, m2, d2] = dateStr2.split('-').map(Number);
    const utc1 = Date.UTC(y1, m1 - 1, d1);
    const utc2 = Date.UTC(y2, m2 - 1, d2);
    return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

/**
 * Mathematically derives the user's real consecutive-day quiz streak from their actual history.
 * - Same-day quizzes count as 1 active day.
 * - Consecutive calendar days increment the streak.
 * - If last quiz was played today: streak is active.
 * - If last quiz was played yesterday: streak is active (awaiting play today).
 * - If last quiz was played >1 calendar day ago or 0 quizzes completed: streak is 0.
 */
export function calculateStreakFromHistory(history: QuizHistoryRecord[]): number {
  if (!Array.isArray(history) || history.length === 0) {
    return 0;
  }

  // Extract unique sorted calendar days (YYYY-MM-DD) descending
  const uniqueDates = Array.from(
    new Set(
      history
        .map((h) => {
          try {
            return getLocalDateString(new Date(h.completedAt));
          } catch {
            return '';
          }
        })
        .filter(Boolean)
    )
  ).sort().reverse();

  if (uniqueDates.length === 0) return 0;

  const today = getLocalDateString();
  const mostRecentDate = uniqueDates[0];
  const diffFromToday = getDayDiff(mostRecentDate, today);

  // If last quiz was neither today nor yesterday, streak is broken / 0
  if (diffFromToday > 1) {
    return 0;
  }

  let streak = 1;
  let currentDateStr = mostRecentDate;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDateStr = uniqueDates[i];
    const diff = getDayDiff(prevDateStr, currentDateStr);
    if (diff === 1) {
      streak += 1;
      currentDateStr = prevDateStr;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Returns the active user's current quiz streak.
 * ZERO hardcoded numbers: if no quizzes completed, returns 0.
 */
export function getUserQuizStreak(userId?: string | null, isDemo: boolean = false): number {
  if (typeof window === 'undefined') return 0;

  // Demo mode visitor
  if (isDemo || !userId) {
    try {
      const raw = sessionStorage.getItem(DEMO_VISITOR_STREAK_KEY);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return typeof parsed?.count === 'number' ? parsed.count : 0;
    } catch {
      return 0;
    }
  }

  // Authenticated user: isolated by userId
  try {
    const rawHistory = localStorage.getItem(`${USER_HISTORY_PREFIX}${userId}`);
    if (rawHistory) {
      const parsedHistory: QuizHistoryRecord[] = JSON.parse(rawHistory);
      if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
        return calculateStreakFromHistory(parsedHistory);
      }
    }

    const rawStreak = localStorage.getItem(`${USER_STREAK_PREFIX}${userId}`);
    if (rawStreak) {
      const parsed = JSON.parse(rawStreak);
      return typeof parsed?.count === 'number' ? parsed.count : 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Fetches the user's quiz history.
 * - Authenticated: Isolated strictly to userId. Reads local cache & syncs with Supabase if configured.
 * - Demo mode: Isolated to visitor's temporary session storage. Never writes or leaks to creator database.
 * - Zero hardcoded or fake history. Empty state if no quizzes played.
 */
export async function getQuizHistory(
  userId?: string | null,
  isDemo: boolean = false
): Promise<QuizHistoryRecord[]> {
  if (typeof window === 'undefined') return [];

  // Demo mode visitor: temporary session storage only
  if (isDemo || !userId) {
    try {
      const raw = sessionStorage.getItem(DEMO_VISITOR_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.warn('[QuizStorage] Error reading demo visitor history:', err);
    }
    return [];
  }

  const storageKey = `${USER_HISTORY_PREFIX}${userId}`;
  let localRecords: QuizHistoryRecord[] = [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localRecords = parsed;
      }
    }
  } catch (err) {
    console.warn('[QuizStorage] Error reading local history cache:', err);
  }

  // If Supabase is configured, fetch and merge cloud records for this authenticated user
  if (isSupabaseConfigured) {
    try {
      const query = supabase
        .from('user_quiz_history')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      const { data, error } = await withTimeout(query, 3000, { data: null, error: null } as any);

      if (!error && Array.isArray(data)) {
        const cloudRecords: QuizHistoryRecord[] = data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          studentProfileId: item.student_profile_id,
          topic: item.topic,
          difficulty: item.difficulty,
          numberOfQuestions: item.number_of_questions,
          correctAnswers: item.correct_answers,
          incorrectAnswers: item.incorrect_answers,
          score: item.score,
          percentage: item.percentage,
          quizMode: item.quiz_mode || 'untimed',
          timeTakenSeconds: item.time_taken_seconds,
          timeTakenFormatted: item.details?.timeTakenFormatted,
          completedAt: item.completed_at,
          questions: item.details?.questions,
          selectedAnswers: item.details?.selectedAnswers,
        }));

        // Deduplicate and merge
        const recordMap = new Map<string, QuizHistoryRecord>();
        for (const r of cloudRecords) {
          recordMap.set(r.id, r);
        }
        for (const r of localRecords) {
          if (!recordMap.has(r.id)) {
            recordMap.set(r.id, r);
          }
        }

        const merged = Array.from(recordMap.values()).sort(
          (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );

        try {
          localStorage.setItem(storageKey, JSON.stringify(merged));
        } catch {}

        return merged;
      }
    } catch (err) {
      console.info('[QuizStorage] Supabase fetch notice, using local cache:', err);
    }
  }

  return localRecords;
}

/**
 * Persists a completed quiz history record.
 * - Authenticated: Updates user-scoped localStorage and inserts into Supabase user_quiz_history.
 * - Demo mode: Saves to sessionStorage only; never writes to creator database or modifies creator data.
 * - Updates user streak based on actual completed quiz activity.
 */
export async function saveQuizHistoryRecord(
  record: QuizHistoryRecord,
  isDemo: boolean = false
): Promise<QuizHistoryRecord> {
  const completedAt = record.completedAt || new Date().toISOString();
  const normalizedRecord: QuizHistoryRecord = {
    ...record,
    completedAt,
  };

  if (typeof window === 'undefined') {
    return normalizedRecord;
  }

  // DEMO MODE: Visitor temporary session storage
  if (isDemo || !record.userId) {
    try {
      const raw = sessionStorage.getItem(DEMO_VISITOR_HISTORY_KEY);
      const existing: QuizHistoryRecord[] = raw ? JSON.parse(raw) : [];
      const updated = [normalizedRecord, ...existing];
      sessionStorage.setItem(DEMO_VISITOR_HISTORY_KEY, JSON.stringify(updated));

      const newStreak = calculateStreakFromHistory(updated);
      sessionStorage.setItem(
        DEMO_VISITOR_STREAK_KEY,
        JSON.stringify({ count: newStreak, lastPlayedDate: getLocalDateString() })
      );

      window.dispatchEvent(
        new CustomEvent('sdt:quiz-history-updated', { detail: { record: normalizedRecord, isDemo: true } })
      );
      window.dispatchEvent(
        new CustomEvent('sdt:quiz-streak-updated', { detail: { count: newStreak, isDemo: true } })
      );
    } catch (err) {
      console.warn('[QuizStorage] Error saving demo visitor quiz:', err);
    }
    return normalizedRecord;
  }

  // AUTHENTICATED USER: User-isolated persistence
  const storageKey = `${USER_HISTORY_PREFIX}${record.userId}`;
  let updatedList: QuizHistoryRecord[] = [];

  try {
    const raw = localStorage.getItem(storageKey);
    const existing: QuizHistoryRecord[] = raw ? JSON.parse(raw) : [];
    updatedList = [normalizedRecord, ...existing.filter((item) => item.id !== normalizedRecord.id)];
    localStorage.setItem(storageKey, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('[QuizStorage] Error saving local quiz history cache:', err);
  }

  // Calculate and store user-scoped streak
  const newStreak = calculateStreakFromHistory(updatedList);
  try {
    localStorage.setItem(
      `${USER_STREAK_PREFIX}${record.userId}`,
      JSON.stringify({ count: newStreak, lastPlayedDate: getLocalDateString() })
    );
  } catch {}

  // Sync to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const payload = {
        id: normalizedRecord.id,
        user_id: normalizedRecord.userId,
        student_profile_id: normalizedRecord.studentProfileId || null,
        topic: normalizedRecord.topic,
        difficulty: normalizedRecord.difficulty,
        number_of_questions: normalizedRecord.numberOfQuestions,
        correct_answers: normalizedRecord.correctAnswers,
        incorrect_answers: normalizedRecord.incorrectAnswers,
        score: normalizedRecord.score,
        percentage: normalizedRecord.percentage,
        quiz_mode: normalizedRecord.quizMode,
        time_taken_seconds: normalizedRecord.timeTakenSeconds || null,
        completed_at: normalizedRecord.completedAt,
        details: {
          questions: normalizedRecord.questions,
          selectedAnswers: normalizedRecord.selectedAnswers,
          timeTakenFormatted: normalizedRecord.timeTakenFormatted,
        },
      };

      await withTimeout(
        supabase.from('user_quiz_history').upsert(payload, { onConflict: 'id' }),
        3500
      );
    } catch (err) {
      console.info('[QuizStorage] Cloud sync notice (saved locally):', err);
    }
  }

  window.dispatchEvent(
    new CustomEvent('sdt:quiz-history-updated', { detail: { record: normalizedRecord, userId: record.userId } })
  );
  window.dispatchEvent(
    new CustomEvent('sdt:quiz-streak-updated', { detail: { count: newStreak, userId: record.userId } })
  );

  return normalizedRecord;
}
