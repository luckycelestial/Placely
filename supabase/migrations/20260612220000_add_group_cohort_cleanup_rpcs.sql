-- SQL migration to add group and cohort cleanup RPC functions for set-based updates

CREATE OR REPLACE FUNCTION public.unlink_specializations_by_options(options_to_remove text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.student_profiles
  SET specializations = COALESCE(
    (SELECT array_agg(x) FROM unnest(specializations) x WHERE NOT (x = ANY(options_to_remove))),
    ARRAY[]::text[]
  )
  WHERE specializations && options_to_remove;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlink_placement_group_by_key(group_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.student_preferences
  SET work_mode_preference = CASE
    WHEN work_mode_preference IS NULL THEN NULL
    WHEN work_mode_preference = group_id THEN NULL
    WHEN work_mode_preference ~ '^{.*}$' THEN
      CASE 
        WHEN ((work_mode_preference::jsonb) - group_id) = '{}'::jsonb THEN NULL
        ELSE ((work_mode_preference::jsonb) - group_id)::text
      END
    ELSE NULL
  END
  WHERE work_mode_preference IS NOT NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.unlink_placement_group_option(group_id text, option_to_remove text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.student_preferences
  SET work_mode_preference = CASE
    WHEN work_mode_preference IS NULL THEN NULL
    WHEN work_mode_preference = option_to_remove AND group_id = 'placement_groups' THEN NULL
    WHEN work_mode_preference ~ '^{.*}$' THEN
      CASE 
        WHEN (work_mode_preference::jsonb)->>group_id = option_to_remove THEN
          CASE 
            WHEN ((work_mode_preference::jsonb) - group_id) = '{}'::jsonb THEN NULL
            ELSE ((work_mode_preference::jsonb) - group_id)::text
          END
        ELSE work_mode_preference
      END
    ELSE work_mode_preference
  END
  WHERE work_mode_preference IS NOT NULL;
END;
$$;
