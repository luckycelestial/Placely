-- Migration: Add get_average_ctc RPC function to precompute average offer packages on database side

CREATE OR REPLACE FUNCTION get_average_ctc()
RETURNS NUMERIC AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(NULLIF(regexp_replace(package_ctc, '[^0-9.]', '', 'g'), '')::NUMERIC), 0)
    FROM public.offers
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
