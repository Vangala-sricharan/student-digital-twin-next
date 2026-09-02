import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseUrl !== ''
);

// Fallback mock client URL if environment variables are not yet populated
const fallbackUrl = supabaseUrl || 'https://mock-sdt-project.supabase.co';
const fallbackKey = supabaseAnonKey || 'mock-anon-key-sdt-os-placeholder';

export const supabase: SupabaseClient = createClient(fallbackUrl, fallbackKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
`;
