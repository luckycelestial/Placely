-- Local Development Permissions for Anon Role
-- Ensures demo users and students without GoTrue JWTs can perform UI edits

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role;', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = t AND policyname = 'dev_anon_all_' || t
    ) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true);', 'dev_anon_all_' || t, t);
    END IF;
  END LOOP;
END $$;
