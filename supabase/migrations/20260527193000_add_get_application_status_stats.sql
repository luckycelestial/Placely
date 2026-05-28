-- ============================================================
-- Migration: Add database RPC function for application status counts
-- Optimizes counting statuses to a single GROUP BY in a single query
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_application_status_stats(filter_drive_id uuid DEFAULT NULL)
RETURNS TABLE (status text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT a.status, COUNT(*)
  FROM public.applications a
  WHERE (filter_drive_id IS NULL OR a.drive_id = filter_drive_id)
  GROUP BY a.status;
END;
$$ LANGUAGE plpgsql STABLE;
