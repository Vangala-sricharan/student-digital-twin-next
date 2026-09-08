import { useState, useEffect } from 'react';

const QUIZ_STREAK_STORAGE_KEY = 'sdt_demo_quiz_streak';

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
 * Returns current valid quiz streak count.
 * Resets streak to 0 if visitor missed more than 1 calendar day.
 */
export function getQuizStreak(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(QUIZ_STREAK_STORAGE_KEY);
    if (!raw) return 0;
    const data: QuizStreakData = JSON.parse(raw);
    if (!data || typeof data.count !== 'number' || !data.lastPlayedDate) return 0;

    const today = getLocalDateString();
    const diff = getDayDiff(data.lastPlayedDate, today);

    // Played today: active streak
    if (diff === 0) {
      return data.count;
    }
    // Played yesterday: active streak awaiting play today
    if (diff === 1) {
      return data.count;
    }
    // Missed a calendar day: reset streak to 0
    if (diff > 1) {
      localStorage.setItem(
        QUIZ_STREAK_STORAGE_KEY,
        JSON.stringify({ count: 0, lastPlayedDate: '' })
      );
      return 0;
    }
    return data.count;
  } catch {
    return 0;
  }
}

/**
 * Records completion of a quiz.
 * - Counts only upon actual quiz completion/submission.
 * - Same-day completions do not increment multiple times.
 * - Consecutive day increments streak.
 * - Missed day resets to 1.
 */
export function recordQuizCompleted(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const today = getLocalDateString();
    const raw = localStorage.getItem(QUIZ_STREAK_STORAGE_KEY);
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
    localStorage.setItem(QUIZ_STREAK_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('sdt:quiz-streak-updated', { detail: payload }));
    return newCount;
  } catch {
    return 1;
  }
}

/**
 * React hook to reactively subscribe to demo quiz streak changes.
 */
export function useQuizStreak(): number {
  const [streak, setStreak] = useState<number>(() => getQuizStreak());

  useEffect(() => {
    const handleUpdate = () => {
      setStreak(getQuizStreak());
    };

    window.addEventListener('sdt:quiz-streak-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('sdt:quiz-streak-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return streak;
}
