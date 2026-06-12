-- ============================================================
-- Migration: Add get_student_dashboard_stats RPC function
-- Aggregates dashboard counts directly in postgres
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_student_dashboard_stats(p_student_id uuid)
RETURNS TABLE(applications_count bigint, offers_count bigint, interviews_count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COALESCE(COUNT(*), 0) FROM public.applications WHERE student_id = p_student_id)::bigint AS applications_count,
    (SELECT COALESCE(COUNT(*), 0) FROM public.offers WHERE student_id = p_student_id)::bigint AS offers_count,
    (SELECT COALESCE(COUNT(*), 0) FROM public.applications WHERE student_id = p_student_id AND current_stage <> 'applied')::bigint AS interviews_count;
END;
$$;
