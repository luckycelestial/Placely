-- Migration to support student LeetCode manual sync and student projects

ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS leetcode_last_fetched timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.student_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  technologies text, -- Comma-separated list of technologies
  github_url text,
  live_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Disable RLS for compatibility with the rest of the database configuration
ALTER TABLE public.student_projects DISABLE ROW LEVEL SECURITY;
