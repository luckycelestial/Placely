-- ============================================================
-- Migration: Add get_student_application_stats RPC function
-- Aggregates candidate stream status statistics directly in postgres
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_student_application_stats(p_student_id uuid)
RETURNS TABLE(active_count bigint, placed_count bigint, offered_count bigint) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(*) FILTER (WHERE status NOT ILIKE 'rejected%' AND status NOT ILIKE 'accepted%' AND status NOT ILIKE 'joined%'), 0)::bigint AS active_count,
    COALESCE(COUNT(*) FILTER (WHERE status ILIKE 'accepted%' OR status ILIKE 'joined%'), 0)::bigint AS placed_count,
    COALESCE(COUNT(*) FILTER (WHERE status ILIKE 'offered%'), 0)::bigint AS offered_count
  FROM public.applications
  WHERE student_id = p_student_id;
END;
$$;
