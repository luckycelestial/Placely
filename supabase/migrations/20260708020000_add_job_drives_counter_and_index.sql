-- Migration: Add composite index on applications and cached total_applicants count on job_drives

-- 1. Create composite index on applications
CREATE INDEX IF NOT EXISTS idx_applications_drive_stage 
ON public.applications(drive_id, current_stage);

-- 2. Add total_applicants column to job_drives if it does not exist
ALTER TABLE public.job_drives 
ADD COLUMN IF NOT EXISTS total_applicants INTEGER DEFAULT 0;

-- 3. Populate initial counts for total_applicants
UPDATE public.job_drives jd
SET total_applicants = (
  SELECT COUNT(*)::INTEGER 
  FROM public.applications a 
  WHERE a.drive_id = jd.id
);

-- 4. Create trigger function to keep total_applicants updated
CREATE OR REPLACE FUNCTION update_job_drive_applicants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.job_drives
    SET total_applicants = total_applicants + 1
    WHERE id = NEW.drive_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.job_drives
    SET total_applicants = GREATEST(0, total_applicants - 1)
    WHERE id = OLD.drive_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger on applications table
DROP TRIGGER IF EXISTS trg_update_job_drive_applicants_count ON public.applications;
CREATE TRIGGER trg_update_job_drive_applicants_count
AFTER INSERT OR DELETE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION update_job_drive_applicants_count();
