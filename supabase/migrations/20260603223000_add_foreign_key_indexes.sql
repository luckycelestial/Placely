-- ============================================================
-- Migration: Add Indexes to foreign keys for performance
-- Speeds up relational lookups on events, drives, joinees, and notices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_events_created_by 
  ON public.events(created_by);

CREATE INDEX IF NOT EXISTS idx_job_drives_created_by 
  ON public.job_drives(created_by);

CREATE INDEX IF NOT EXISTS idx_joinees_company_id 
  ON public.joinees(company_id);

CREATE INDEX IF NOT EXISTS idx_notices_created_by 
  ON public.notices(created_by);
