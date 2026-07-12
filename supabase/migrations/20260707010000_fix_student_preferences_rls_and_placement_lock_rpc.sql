-- Migration: Fix RLS on student_preferences for placement lock writes
-- The disable_rls migration may not have been applied in production.
-- Add explicit permissive policies for anon role on student_preferences.

ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous select on student_preferences" ON public.student_preferences;
CREATE POLICY "Allow anonymous select on student_preferences" ON public.student_preferences
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on student_preferences" ON public.student_preferences;
CREATE POLICY "Allow anonymous insert on student_preferences" ON public.student_preferences
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on student_preferences" ON public.student_preferences;
CREATE POLICY "Allow anonymous update on student_preferences" ON public.student_preferences
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete on student_preferences" ON public.student_preferences;
CREATE POLICY "Allow anonymous delete on student_preferences" ON public.student_preferences
  FOR DELETE TO anon USING (true);

-- Also create a security-definer RPC function to assign placement lock
-- so it always has permission regardless of RLS state.
CREATE OR REPLACE FUNCTION public.assign_placement_lock(p_student_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pref_id UUID;
  v_current TEXT;
  v_map JSONB;
BEGIN
  -- Get existing preference row
  SELECT id, work_mode_preference
  INTO v_pref_id, v_current
  FROM public.student_preferences
  WHERE student_id = p_student_id;

  -- Parse existing JSON or initialise
  IF v_current IS NOT NULL AND v_current ~ '^\s*\{' THEN
    BEGIN
      v_map := v_current::jsonb;
    EXCEPTION WHEN others THEN
      v_map := '{}'::jsonb;
    END;
  ELSIF v_current IS NOT NULL AND v_current <> '' THEN
    v_map := jsonb_build_object('placement_group', v_current);
  ELSE
    v_map := '{}'::jsonb;
  END IF;

  v_map := jsonb_set(v_map, '{placement_lock}', '"Active"');

  IF v_pref_id IS NOT NULL THEN
    UPDATE public.student_preferences
    SET work_mode_preference = v_map::text,
        updated_at = now()
    WHERE id = v_pref_id;
  ELSE
    INSERT INTO public.student_preferences (student_id, work_mode_preference, updated_at)
    VALUES (p_student_id, v_map::text, now());
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_placement_lock(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.assign_placement_lock(UUID) TO authenticated;
