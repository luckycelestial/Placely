-- ============================================================
-- Migration: Add Performance Indexes for JOIN Tables
-- Speeds up dashboard, opportunities, notices, and progress queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_applications_student_id 
  ON public.applications(student_id);

CREATE INDEX IF NOT EXISTS idx_applications_drive_id 
  ON public.applications(drive_id);

CREATE INDEX IF NOT EXISTS idx_job_drives_company_id 
  ON public.job_drives(company_id);

CREATE INDEX IF NOT EXISTS idx_joinees_student_id 
  ON public.joinees(student_id);

CREATE INDEX IF NOT EXISTS idx_tasks_student_id 
  ON public.tasks(student_id);

-- 1. applications table indexes
CREATE INDEX IF NOT EXISTS idx_applications_current_stage 
  ON public.applications(current_stage);

CREATE INDEX IF NOT EXISTS idx_applications_status 
  ON public.applications(status);

CREATE INDEX IF NOT EXISTS idx_applications_applied_at 
  ON public.applications(applied_at);

-- 2. students table indexes
CREATE INDEX IF NOT EXISTS idx_students_department 
  ON public.students(department);

CREATE INDEX IF NOT EXISTS idx_students_placement_status 
  ON public.students(placement_status);

-- 3. offers table indexes
CREATE INDEX IF NOT EXISTS idx_offers_student_id 
  ON public.offers(student_id);

CREATE INDEX IF NOT EXISTS idx_offers_verification_status 
  ON public.offers(verification_status);

-- 4. notices table indexes
CREATE INDEX IF NOT EXISTS idx_notices_status_publish_at 
  ON public.notices(status, publish_at);
