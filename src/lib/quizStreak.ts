import { useState, useEffect } from 'react';
import { getUserQuizStreak } from './quizStorageService';

const USER_STREAK_PREFIX = 'sdt_quiz_streak_';
const DEMO_VISITOR_STREAK_KEY = 'sdt_demo_visitor_quiz_streak';

export interface QuizStreakData {
  count: number;
  lastPlayedDate: string; // YYYY-MM-DD
}

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
 * Returns current valid quiz streak count for user or demo visitor.
 * ZERO hardcoded numbers. If no quizzes completed, returns 0.
 */
export function getQuizStreak(userId?: string | null, isDemo: boolean = false): number {
  return getUserQuizStreak(userId, isDemo);
}

/**
 * Records completion of a quiz for user or demo visitor.
 * - Counts only upon actual quiz completion/submission.
 * - Same-day completions do not increment multiple times.
 * - Consecutive day increments streak.
 * - Missed day resets to 1.
 */
export function recordQuizCompleted(userId?: string | null, isDemo: boolean = false): number {
  if (typeof window === 'undefined') return 1;
  try {
    const today = getLocalDateString();
    const isDemoVisitor = isDemo || !userId;
    const storageKey = isDemoVisitor ? DEMO_VISITOR_STREAK_KEY : `${USER_STREAK_PREFIX}${userId}`;
    const raw = isDemoVisitor ? sessionStorage.getItem(storageKey) : localStorage.getItem(storageKey);
    let currentCount = 0;
    let lastDate = '';

    if (raw) {
      try {
        const parsed: QuizStreakData = JSON.parse(raw);
        if (parsed && typeof parsed.count === 'number') {
          currentCount = parsed.count;
          lastDate = parsed.lastPlayedDate || '';
        }
      } catch {
        // start fresh
      }
    }

    let newCount = 1;
    if (lastDate) {
      const diff = getDayDiff(lastDate, today);
      if (diff === 0) {
        // Already played today: maintain streak without incrementing multiple times
        newCount = Math.max(1, currentCount);
      } else if (diff === 1) {
        // Consecutive calendar day!
        newCount = currentCount + 1;
      } else {
        // Missed one or more days
        newCount = 1;
      }
    } else {
      newCount = 1;
    }

    const payload: QuizStreakData = {
      count: newCount,
      lastPlayedDate: today,
    };

    if (isDemoVisitor) {
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
    } else {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }

    window.dispatchEvent(
      new CustomEvent('sdt:quiz-streak-updated', { detail: { count: newCount, userId, isDemo } })
    );
    return newCount;
  } catch {
    return 1;
  }
}

/**
 * React hook to reactively subscribe to quiz streak changes for current user/demo.
 */
export function useQuizStreak(userId?: string | null, isDemo: boolean = false): number {
  const [streak, setStreak] = useState<number>(() => getUserQuizStreak(userId, isDemo));

  useEffect(() => {
    setStreak(getUserQuizStreak(userId, isDemo));

    const handleUpdate = () => {
      setStreak(getUserQuizStreak(userId, isDemo));
    };

    window.addEventListener('sdt:quiz-streak-updated', handleUpdate);
    window.addEventListener('sdt:quiz-history-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('sdt:quiz-streak-updated', handleUpdate);
      window.removeEventListener('sdt:quiz-history-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [userId, isDemo]);

  return streak;
}
