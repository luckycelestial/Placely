-- ============================================================
-- Migration: Add database RPC functions for drive stages updates
-- Optimizes individual and global updates using atomic jsonb_set
-- ============================================================

-- Function to update a single job drive's stages
CREATE OR REPLACE FUNCTION public.update_drive_stages(drive_id uuid, new_stages jsonb)
RETURNS void AS $$
BEGIN
  UPDATE public.job_drives
  SET eligibility_rules = jsonb_set(
    COALESCE(eligibility_rules, '{}'::jsonb),
    '{stages}',
    new_stages
  )
  WHERE id = drive_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update all job drives' stages at once
CREATE OR REPLACE FUNCTION public.update_all_drive_stages(new_stages jsonb)
RETURNS void AS $$
BEGIN
  UPDATE public.job_drives
  SET eligibility_rules = jsonb_set(
    COALESCE(eligibility_rules, '{}'::jsonb),
    '{stages}',
    new_stages
  );
END;
$$ LANGUAGE plpgsql;
