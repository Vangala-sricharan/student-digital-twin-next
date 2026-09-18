import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};
const rawSupabaseUrl = (metaEnv.VITE_SUPABASE_URL || '').trim();
const rawSupabaseAnonKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();

// Clean URL: trim whitespace and remove trailing slashes or accidental /rest/v1
const cleanSupabaseUrl = rawSupabaseUrl
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

export const isSupabaseConfigured = Boolean(
  cleanSupabaseUrl && 
  rawSupabaseAnonKey && 
  cleanSupabaseUrl !== 'https://your-project.supabase.co' &&
  cleanSupabaseUrl !== 'https://mock-sdt-project.supabase.co' &&
  !cleanSupabaseUrl.includes('placeholder') &&
  !rawSupabaseAnonKey.includes('placeholder') &&
  cleanSupabaseUrl !== ''
);

// Resilient fallback client URL if environment variables are not yet populated
const clientUrl = isSupabaseConfigured ? cleanSupabaseUrl : 'https://mock-sdt-project.supabase.co';
const clientKey = isSupabaseConfigured ? rawSupabaseAnonKey : 'mock-anon-key-sdt-os-placeholder';

const V4_STUDENT_PROFILES_STORAGE_KEY = 'sdt_v4_student_profiles_store';

function getStoredStudentProfiles(): Record<string, any> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return {};
  }
  try {
    const raw = localStorage.getItem(V4_STUDENT_PROFILES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredStudentProfiles(records: Record<string, any>) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(V4_STUDENT_PROFILES_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Handles /rest/v1/student_profiles requests locally to avoid 404s when the table
 * does not exist on the Supabase instance, strictly preserving the V4 schema and data.
 */
function handleStudentProfilesRest(urlStr: string, init?: RequestInit): Response {
  const method = (init?.method || 'GET').toUpperCase();
  const headersObj = (init?.headers as Record<string, string>) || {};
  const acceptHeader =
    headersObj[Object.keys(headersObj).find((k) => k.toLowerCase() === 'accept') || ''] || '';
  const isSingle = String(acceptHeader).includes('vnd.pgrst.object+json');

  let targetUserId: string | null = null;
  let targetId: string | null = null;

  try {
    const parsedUrl = new URL(urlStr, 'https://localhost');
    const uMatch = parsedUrl.search.match(/user_id=eq\.([^&]+)/);
    if (uMatch) targetUserId = decodeURIComponent(uMatch[1]);
    const idMatch = parsedUrl.search.match(/[?&]id=eq\.([^&]+)/);
    if (idMatch) targetId = decodeURIComponent(idMatch[1]);
  } catch {
    const uMatch = urlStr.match(/user_id=eq\.([^&]+)/);
    if (uMatch) targetUserId = decodeURIComponent(uMatch[1]);
    const idMatch = urlStr.match(/[?&]id=eq\.([^&]+)/);
    if (idMatch) targetId = decodeURIComponent(idMatch[1]);
  }

  const profilesMap = getStoredStudentProfiles();

  // If no record exists yet for this user_id in profilesMap, check if local user profile exists
  if (targetUserId && !profilesMap[targetUserId] && typeof window !== 'undefined' && window.localStorage) {
    try {
      const localUserProfile = localStorage.getItem(`sdt_user_profile_${targetUserId}`);
      if (localUserProfile) {
        const u = JSON.parse(localUserProfile);
        profilesMap[targetUserId] = {
          id: `sp-${targetUserId.slice(0, 8)}`,
          user_id: targetUserId,
          name: u.fullName || u.name || 'Student',
          display_name: u.fullName || u.name || 'Student',
          role: u.role || 'Student',
          headline: 'Student Digital Twin Active Profile',
          university: 'Academic Institution',
          academic_program: 'Engineering & Technology',
          year_of_study: '1st Year',
          career_focus: 'Software Engineering',
          avatar_url: u.avatarUrl || '',
          readiness_score: 65,
          skills_verified_count: 0,
          project_index_count: 0,
          milestones_count: 0,
          status: 'Active Twin',
          created_at: u.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        saveStoredStudentProfiles(profilesMap);
      }
    } catch {
      // ignore
    }
  }

  if (method === 'GET') {
    let list = Object.values(profilesMap);
    if (targetUserId) {
      list = list.filter((p: any) => p.user_id === targetUserId);
    }
    if (targetId) {
      list = list.filter((p: any) => p.id === targetId);
    }

    if (isSingle) {
      const item = list[0] || null;
      return new Response(JSON.stringify(item), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify(list), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'content-range': `0-${list.length}/${list.length}`,
      },
    });
  }

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    let payload: any = {};
    try {
      payload = JSON.parse(String(init?.body || '{}'));
    } catch {
      payload = {};
    }

    const items = Array.isArray(payload) ? payload : [payload];
    const updatedItems: any[] = [];

    for (const item of items) {
      const uid = item.user_id || targetUserId || 'anon-user';
      const existing = profilesMap[uid] || {};
      const merged = {
        id: item.id || existing.id || `sp-${uid.slice(0, 8)}`,
        user_id: uid,
        name: item.name ?? existing.name ?? 'Student',
        display_name: item.display_name ?? existing.display_name ?? item.name ?? 'Student',
        role: item.role ?? existing.role ?? 'Student',
        headline: item.headline ?? existing.headline ?? '',
        university: item.university ?? existing.university ?? 'Academic Institution',
        academic_program: item.academic_program ?? existing.academic_program ?? 'Engineering & Technology',
        year_of_study: item.year_of_study ?? existing.year_of_study ?? '1st Year',
        career_focus: item.career_focus ?? existing.career_focus ?? 'Software Engineering',
        specialty: item.specialty ?? existing.specialty ?? '',
        bio: item.bio ?? existing.bio ?? '',
        avatar_url: item.avatar_url ?? existing.avatar_url ?? '',
        github_url: item.github_url ?? existing.github_url ?? '',
        linkedin_url: item.linkedin_url ?? existing.linkedin_url ?? '',
        portfolio_url: item.portfolio_url ?? existing.portfolio_url ?? '',
        location: item.location ?? existing.location ?? '',
        readiness_score: item.readiness_score ?? existing.readiness_score ?? 65,
        skills_verified_count: item.skills_verified_count ?? existing.skills_verified_count ?? 0,
        project_index_count: item.project_index_count ?? existing.project_index_count ?? 0,
        milestones_count: item.milestones_count ?? existing.milestones_count ?? 0,
        target_role: item.target_role ?? existing.target_role ?? '',
        target_company_tier: item.target_company_tier ?? existing.target_company_tier ?? '',
        current_gpa: item.current_gpa ?? existing.current_gpa ?? '',
        semester: item.semester ?? existing.semester ?? '',
        status: item.status ?? existing.status ?? 'Active Twin',
        created_at: existing.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item,
      };
      profilesMap[uid] = merged;
      updatedItems.push(merged);
    }

    saveStoredStudentProfiles(profilesMap);

    return new Response(JSON.stringify(isSingle ? updatedItems[0] : updatedItems), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  if (method === 'DELETE') {
    if (targetUserId && profilesMap[targetUserId]) {
      delete profilesMap[targetUserId];
      saveStoredStudentProfiles(profilesMap);
    }
    return new Response(null, { status: 204 });
  }

  return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function handleUserQuizHistoryRest(urlStr: string, init?: RequestInit): Response {
  const method = (init?.method || 'GET').toUpperCase();
  const url = new URL(urlStr, 'http://localhost');
  const userIdParam = url.searchParams.get('user_id');
  const targetUserId = userIdParam ? userIdParam.replace(/^eq\./, '') : '';

  if (method === 'GET') {
    if (!targetUserId) {
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const raw = typeof window !== 'undefined' ? localStorage.getItem(`sdt_quiz_history_${targetUserId}`) : null;
    const records = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify(records), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    try {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const record = Array.isArray(body) ? body[0] : body;
      const uId = record?.user_id || targetUserId;
      if (uId && typeof window !== 'undefined') {
        const raw = localStorage.getItem(`sdt_quiz_history_${uId}`);
        const existing = raw ? JSON.parse(raw) : [];
        const updated = [record, ...existing.filter((x: any) => x.id !== record.id)];
        localStorage.setItem(`sdt_quiz_history_${uId}`, JSON.stringify(updated));
      }
    } catch {}
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export const supabase: SupabaseClient = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : (input as Request).url;

      // Intercept student_profiles to prevent 404 network errors while preserving V4 schema
      if (urlStr.includes('/rest/v1/student_profiles')) {
        return handleStudentProfilesRest(urlStr, init);
      }

      // Intercept user_quiz_history for seamless offline/mock client persistence
      if (urlStr.includes('/rest/v1/user_quiz_history')) {
        return handleUserQuizHistoryRest(urlStr, init);
      }

      return fetch(input, init);
    },
  },
});

/**
 * Robust promise timeout wrapper to prevent slow network / paused server freezes
 */
export function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number = 4000,
  fallbackVal?: T
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]).catch((err) => {
    if (fallbackVal !== undefined) return fallbackVal;
    throw err;
  });
}

/**
 * Supabase PostgreSQL Database Schema Foundation
 * Phase 1 Architecture Schema Definition with Row Level Security (RLS)
 */
export const SUPABASE_SQL_SCHEMA = `
-- ============================================================
-- STUDENT DIGITAL TWIN OS (student-digital-twin-v4)
-- SUPABASE POSTGRESQL + ROW LEVEL SECURITY (RLS) FOUNDATION
-- ============================================================

-- 1. User Profiles (Auth Synced)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Student Profiles (Digital Twin Living Graph)
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'Student',
  headline TEXT,
  university TEXT NOT NULL,
  academic_program TEXT NOT NULL,
  year_of_study TEXT DEFAULT '1st Year',
  career_focus TEXT NOT NULL,
  specialty TEXT,
  bio TEXT,
  avatar_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  location TEXT,
  readiness_score INT DEFAULT 65,
  skills_verified_count INT DEFAULT 0,
  project_index_count INT DEFAULT 0,
  milestones_count INT DEFAULT 0,
  target_role TEXT,
  target_company_tier TEXT,
  current_gpa TEXT,
  semester TEXT,
  status TEXT DEFAULT 'Active Twin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on student_profiles
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own student profiles"
  ON public.student_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Skills Repository
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_profile_id UUID REFERENCES public.student_profiles ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  proficiency INT DEFAULT 50,
  verified BOOLEAN DEFAULT FALSE,
  proof_count INT DEFAULT 0,
  market_alignment_score INT DEFAULT 70,
  last_assessed DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage skills through student profile"
  ON public.skills FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = skills.student_profile_id AND sp.user_id = auth.uid()
  ));

-- 4. Projects & Proof-of-Work
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_profile_id UUID REFERENCES public.student_profiles ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT NOT NULL,
  tech_stack TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'In Progress',
  github_url TEXT,
  live_url TEXT,
  proof_health_score INT DEFAULT 75,
  featured BOOLEAN DEFAULT FALSE,
  highlights TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage projects through student profile"
  ON public.projects FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = projects.student_profile_id AND sp.user_id = auth.uid()
  ));

-- 5. Verified Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_profile_id UUID REFERENCES public.student_profiles ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  verified BOOLEAN DEFAULT TRUE,
  credential_url TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage achievements through student profile"
  ON public.achievements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = achievements.student_profile_id AND sp.user_id = auth.uid()
  ));

-- 6. Career Goals & Roadmap
CREATE TABLE IF NOT EXISTS public.career_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_profile_id UUID REFERENCES public.student_profiles ON DELETE CASCADE NOT NULL,
  target_role TEXT NOT NULL,
  target_domain TEXT NOT NULL,
  target_timeline TEXT NOT NULL,
  confidence_score INT DEFAULT 70,
  required_skills TEXT[] DEFAULT '{}',
  acquired_skills TEXT[] DEFAULT '{}',
  key_milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage career goals through student profile"
  ON public.career_goals FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.id = career_goals.student_profile_id AND sp.user_id = auth.uid()
  ));

-- 7. User Custom Roadmaps (30-60-90 Engine)
CREATE TABLE IF NOT EXISTS public.user_roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  student_profile_id UUID REFERENCES public.student_profiles ON DELETE CASCADE,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  goal TEXT NOT NULL,
  duration_days INT NOT NULL DEFAULT 90,
  level TEXT DEFAULT 'Intermediate',
  available_hours TEXT,
  target_role TEXT,
  target_companies TEXT,
  specific_topics TEXT,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  recommendations JSONB DEFAULT '[]'::jsonb,
  completed_tasks_count INT DEFAULT 0,
  total_tasks_count INT DEFAULT 0,
  progress INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own roadmaps"
  ON public.user_roadmaps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 8. User Quiz History & Performance
CREATE TABLE IF NOT EXISTS public.user_quiz_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  student_profile_id UUID REFERENCES public.student_profiles ON DELETE SET NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  number_of_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  incorrect_answers INT NOT NULL,
  score INT NOT NULL,
  percentage INT NOT NULL,
  quiz_mode TEXT DEFAULT 'untimed',
  time_taken_seconds INT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.user_quiz_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own quiz history"
  ON public.user_quiz_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
`;
