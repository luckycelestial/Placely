-- ============================================================
-- Migration: Student Schema Expansion
-- Adds missing identity, academic, and address fields
-- ============================================================

-- -------------------------------------------------------
-- 1. students table — add identity fields
-- -------------------------------------------------------
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS roll_number        TEXT,
  ADD COLUMN IF NOT EXISTS gender             TEXT CHECK (gender IN ('Male', 'Female', 'Other', NULL)),
  ADD COLUMN IF NOT EXISTS date_of_birth      DATE;

-- -------------------------------------------------------
-- 2. student_academics table — add academic detail fields
-- -------------------------------------------------------
ALTER TABLE public.student_academics
  ADD COLUMN IF NOT EXISTS diploma_score      NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS semester_cgpa      JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS history_of_arrears BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS active_arrears     INTEGER DEFAULT 0;

-- -------------------------------------------------------
-- 3. student_contacts table — ensure all address columns exist
--    (table created by prior seeds; add any missing cols)
-- -------------------------------------------------------
ALTER TABLE public.student_contacts
  ADD COLUMN IF NOT EXISTS permanent_address  TEXT,
  ADD COLUMN IF NOT EXISTS pincode            TEXT;

-- -------------------------------------------------------
-- 4. RLS policies for new columns don't need changes —
--    existing permissive policies on these tables already
--    cover SELECT / INSERT / UPDATE / DELETE for anon role
-- -------------------------------------------------------

-- -------------------------------------------------------
-- 5. Indexes
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_roll_number
  ON public.students (roll_number);

CREATE INDEX IF NOT EXISTS idx_students_gender
  ON public.students (gender);
