import { supabase, isSupabaseConfigured, withTimeout } from './supabase';
import { ParsedDocument } from './documentParser';

export interface SyllabusPrepStorageData {
  parsedDoc: ParsedDocument | null;
  pastedSyllabus: string;
  structuredData: any;
  rawText: string;
  checklistState: Record<string, boolean>;
  completedUnitTopics: Record<string, boolean>;
  unitProgressOverrides: Record<string, number>;
  qaEntries: Array<{ id?: string; question: string; answer: string; citation?: string; timestamp: string }>;
  updatedAt: string;
}

const STORAGE_PREFIX = 'sdt_syllabus_prep_';

function getStorageKey(userId?: string, profileId?: string): string {
  if (!userId) return `${STORAGE_PREFIX}anon`;
  return `${STORAGE_PREFIX}${userId}_${profileId || 'default'}`;
}

/**
 * Loads stored syllabus prep state for the current authenticated user & active twin.
 * Demo mode never loads authenticated user state, and authenticated users never get demo data.
 */
export async function loadSyllabusPrepState(
  userId?: string,
  profileId?: string,
  isDemo?: boolean
): Promise<SyllabusPrepStorageData | null> {
  // If demo mode, do not load authenticated user data
  if (isDemo || !userId) {
    return null;
  }

  const storageKey = getStorageKey(userId, profileId);

  // 1. Read from local cache first
  let localData: SyllabusPrepStorageData | null = null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      localData = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[SyllabusPrepStorage] Failed to read local storage cache:', err);
  }

  // 2. Fetch from Supabase if configured to guarantee multi-device persistence
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('user_roadmaps')
        .select('*')
        .eq('user_id', userId)
        .eq('domain', 'syllabus-prep')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (profileId) {
        query = query.eq('student_profile_id', profileId);
      }

      const { data, error } = await withTimeout(query, 3500, { data: null, error: null } as any);

      if (!error && Array.isArray(data) && data.length > 0 && data[0]?.phases) {
        const cloudData = data[0].phases as SyllabusPrepStorageData;
        if (cloudData && (cloudData.structuredData || cloudData.parsedDoc)) {
          // Update local cache with cloud state
          try {
            localStorage.setItem(storageKey, JSON.stringify(cloudData));
          } catch {}
          return cloudData;
        }
      }
    } catch (err) {
      console.warn('[SyllabusPrepStorage] Supabase fetch error:', err);
    }
  }

  return localData;
}

/**
 * Persists syllabus prep state to both localStorage and Supabase.
 * Scoped strictly by user ID and active student twin profile.
 */
export async function saveSyllabusPrepState(
  userId: string | undefined,
  profileId: string | undefined,
  data: SyllabusPrepStorageData,
  isDemo?: boolean
): Promise<void> {
  // Never persist demo mode data to cloud
  if (isDemo || !userId) {
    return;
  }

  const storageKey = getStorageKey(userId, profileId);

  // 1. Write to local cache immediately
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (err) {
    console.warn('[SyllabusPrepStorage] Local storage write failed:', err);
  }

  // 2. Write to Supabase user_roadmaps table
  if (isSupabaseConfigured) {
    try {
      const subjectName =
        data.structuredData?.documentSummary?.subject ||
        data.parsedDoc?.subject ||
        data.parsedDoc?.fileName ||
        'Academic Syllabus Preparation';

      // Check for existing record
      const checkQuery = supabase
        .from('user_roadmaps')
        .select('id')
        .eq('user_id', userId)
        .eq('domain', 'syllabus-prep')
        .eq('student_profile_id', profileId || 'default')
        .limit(1);

      const { data: existingRows } = await withTimeout(checkQuery, 2500, { data: null, error: null } as any);

      const payload: any = {
        user_id: userId,
        student_profile_id: profileId || 'default',
        domain: 'syllabus-prep',
        title: subjectName,
        goal: 'Exam Mastery & High-Yield Syllabus Preparation',
        phases: data, // JSONB storage of complete analysis & checklist state
        summary: data.structuredData?.documentSummary?.coverageOverview || 'AI-grounded syllabus preparation guide',
        updated_at: new Date().toISOString(),
      };

      if (existingRows && existingRows.length > 0) {
        await withTimeout(
          supabase
            .from('user_roadmaps')
            .update(payload)
            .eq('id', existingRows[0].id),
          3500
        );
      } else {
        payload.created_at = new Date().toISOString();
        await withTimeout(
          supabase.from('user_roadmaps').insert(payload),
          3500
        );
      }
    } catch (err) {
      console.warn('[SyllabusPrepStorage] Cloud persistence notice:', err);
    }
  }
}

/**
 * Clears stored syllabus prep state for the current user and twin.
 */
export async function clearSyllabusPrepState(
  userId?: string,
  profileId?: string
): Promise<void> {
  if (!userId) return;

  const storageKey = getStorageKey(userId, profileId);
  try {
    localStorage.removeItem(storageKey);
  } catch {}

  if (isSupabaseConfigured) {
    try {
      await withTimeout(
        supabase
          .from('user_roadmaps')
          .delete()
          .eq('user_id', userId)
          .eq('domain', 'syllabus-prep')
          .eq('student_profile_id', profileId || 'default'),
        3000
      );
    } catch (err) {
      console.warn('[SyllabusPrepStorage] Cloud deletion notice:', err);
    }
  }
}
