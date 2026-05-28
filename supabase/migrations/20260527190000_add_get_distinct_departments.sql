-- ============================================================
-- Migration: Add get_distinct_departments RPC function
-- Optimizes fetching unique departments to avoid full student scans
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_distinct_departments()
RETURNS SETOF text AS $$
  SELECT DISTINCT department 
  FROM public.students 
  WHERE department IS NOT NULL AND department <> ''
  ORDER BY 1;
$$ LANGUAGE sql STABLE;
