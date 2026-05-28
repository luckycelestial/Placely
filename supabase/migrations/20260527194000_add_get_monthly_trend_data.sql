-- ============================================================
-- Migration: Add database RPC function for monthly trend data
-- Pre-aggregates counts by month inside a single CTE query
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_monthly_trend_data()
RETURNS TABLE (
  month_date date,
  placements bigint,
  offers bigint,
  drives bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', NOW() - INTERVAL '5 months')::date,
      date_trunc('month', NOW())::date,
      '1 month'::interval
    )::date AS m
  ),
  drives_count AS (
    SELECT date_trunc('month', created_at)::date AS m, COUNT(*) AS count
    FROM public.job_drives
    WHERE created_at >= date_trunc('month', NOW() - INTERVAL '5 months')
    GROUP BY 1
  ),
  apps_count AS (
    SELECT date_trunc('month', applied_at)::date AS m, COUNT(*) AS count
    FROM public.applications
    WHERE applied_at >= date_trunc('month', NOW() - INTERVAL '5 months')
    GROUP BY 1
  ),
  offers_count AS (
    SELECT date_trunc('month', created_at)::date AS m, COUNT(*) AS count
    FROM public.offers
    WHERE created_at >= date_trunc('month', NOW() - INTERVAL '5 months')
    GROUP BY 1
  )
  SELECT 
    months.m AS month_date,
    COALESCE(apps_count.count, 0)::bigint AS placements,
    COALESCE(offers_count.count, 0)::bigint AS offers,
    COALESCE(drives_count.count, 0)::bigint AS drives
  FROM months
  LEFT JOIN apps_count ON months.m = apps_count.m
  LEFT JOIN offers_count ON months.m = offers_count.m
  LEFT JOIN drives_count ON months.m = drives_count.m
  ORDER BY months.m ASC;
END;
$$ LANGUAGE plpgsql STABLE;
