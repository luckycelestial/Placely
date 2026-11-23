-- 1. Ensure standard Supabase roles exist in plain PostgreSQL environments (such as CI/Docker)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END $$;

-- 2. Ensure auth schema and auth.uid() function exist for non-Supabase PostgreSQL environments (e.g. CI test runner)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS uuid AS $func$
    BEGIN
      RETURN NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
    $func$ LANGUAGE plpgsql STABLE;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 3. Helper functions for non-recursive RLS policy evaluation
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_student_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id FROM public.students
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 4. Role Escalation Protection: Non-admin callers cannot alter user roles
CREATE OR REPLACE FUNCTION public.prevent_user_role_escalation()
RETURNS trigger AS $$
BEGIN
  IF public.is_admin() OR current_user = 'service_role' OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    RAISE EXCEPTION 'Forbidden: Non-admin users cannot change user roles.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_user_role_escalation ON public.users;
CREATE TRIGGER trg_prevent_user_role_escalation
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_role_escalation();

-- 5. Academic Protection Trigger: Students can NEVER modify academic, verification, or institutional fields
CREATE OR REPLACE FUNCTION public.prevent_student_academic_modification()
RETURNS trigger AS $$
BEGIN
  -- If the caller is an admin or service_role, allow the update
  IF public.is_admin() OR current_user = 'service_role' OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- If called by student, verify no academic, verification or identifier columns were modified
  IF (OLD.cgpa IS DISTINCT FROM NEW.cgpa) OR
     (OLD.active_arrears IS DISTINCT FROM NEW.active_arrears) OR
     (OLD.history_of_backlogs IS DISTINCT FROM NEW.history_of_backlogs) OR
     (OLD.tenth_score IS DISTINCT FROM NEW.tenth_score) OR
     (OLD.twelfth_score IS DISTINCT FROM NEW.twelfth_score) OR
     (OLD.diploma_score IS DISTINCT FROM NEW.diploma_score) OR
     (OLD.semester_cgpa IS DISTINCT FROM NEW.semester_cgpa) OR
     (OLD.department IS DISTINCT FROM NEW.department) OR
     (OLD.year IS DISTINCT FROM NEW.year) OR
     (OLD.register_number IS DISTINCT FROM NEW.register_number) OR
     (OLD.placement_status IS DISTINCT FROM NEW.placement_status) THEN
    RAISE EXCEPTION 'Forbidden: Students are not authorized to modify academic or verification records.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_student_academic_mod ON public.students;
CREATE TRIGGER trg_prevent_student_academic_mod
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.prevent_student_academic_modification();

-- 6. Enable Row Level Security on all application tables
ALTER TABLE IF EXISTS public.admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.application_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drive_round_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drive_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drive_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notice_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.placement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.placement_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- 7. Grant basic schema usage and sequence permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role, authenticated;

-- 8. Service Role Policies: Full administrative access for server-side services
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'admin_tasks', 'analytics_snapshots', 'application_timeline', 'applications',
    'audit_logs', 'background_jobs', 'companies', 'drive_round_results', 'drive_rounds',
    'drive_templates', 'events', 'job_drives', 'notice_rsvps', 'notices', 'notifications',
    'offers', 'placement_history', 'placement_policies', 'settings', 'student_documents',
    'student_profiles', 'student_projects', 'students', 'users'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS service_role_all ON public.%I;', t);
    EXECUTE format('CREATE POLICY service_role_all ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;

-- 9. Table-specific RLS Policies for Authenticated & Anonymous Roles

-- USERS
DROP POLICY IF EXISTS admin_users_all ON public.users;
CREATE POLICY admin_users_all ON public.users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS user_read_self ON public.users;
CREATE POLICY user_read_self ON public.users FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS user_update_self ON public.users;
CREATE POLICY user_update_self ON public.users FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- STUDENTS
DROP POLICY IF EXISTS admin_students_all ON public.students;
CREATE POLICY admin_students_all ON public.students FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_read_self ON public.students;
CREATE POLICY student_read_self ON public.students FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS student_update_self ON public.students;
CREATE POLICY student_update_self ON public.students FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- STUDENT PROFILES
DROP POLICY IF EXISTS admin_student_profiles_all ON public.student_profiles;
CREATE POLICY admin_student_profiles_all ON public.student_profiles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_profiles_read_self ON public.student_profiles;
CREATE POLICY student_profiles_read_self ON public.student_profiles FOR SELECT TO authenticated USING (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_profiles_insert_self ON public.student_profiles;
CREATE POLICY student_profiles_insert_self ON public.student_profiles FOR INSERT TO authenticated WITH CHECK (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_profiles_update_self ON public.student_profiles;
CREATE POLICY student_profiles_update_self ON public.student_profiles FOR UPDATE TO authenticated USING (student_id = public.get_current_student_id()) WITH CHECK (student_id = public.get_current_student_id());

-- STUDENT DOCUMENTS
DROP POLICY IF EXISTS admin_student_docs_all ON public.student_documents;
CREATE POLICY admin_student_docs_all ON public.student_documents FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_docs_read_self ON public.student_documents;
CREATE POLICY student_docs_read_self ON public.student_documents FOR SELECT TO authenticated USING (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_docs_insert_self ON public.student_documents;
CREATE POLICY student_docs_insert_self ON public.student_documents FOR INSERT TO authenticated WITH CHECK (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_docs_update_self ON public.student_documents;
CREATE POLICY student_docs_update_self ON public.student_documents FOR UPDATE TO authenticated USING (student_id = public.get_current_student_id()) WITH CHECK (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_docs_delete_self ON public.student_documents;
CREATE POLICY student_docs_delete_self ON public.student_documents FOR DELETE TO authenticated USING (student_id = public.get_current_student_id());

-- STUDENT PROJECTS
DROP POLICY IF EXISTS admin_student_projects_all ON public.student_projects;
CREATE POLICY admin_student_projects_all ON public.student_projects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_projects_read_self ON public.student_projects;
CREATE POLICY student_projects_read_self ON public.student_projects FOR SELECT TO authenticated USING (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_projects_insert_self ON public.student_projects;
CREATE POLICY student_projects_insert_self ON public.student_projects FOR INSERT TO authenticated WITH CHECK (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_projects_update_self ON public.student_projects;
CREATE POLICY student_projects_update_self ON public.student_projects FOR UPDATE TO authenticated USING (student_id = public.get_current_student_id()) WITH CHECK (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_projects_delete_self ON public.student_projects;
CREATE POLICY student_projects_delete_self ON public.student_projects FOR DELETE TO authenticated USING (student_id = public.get_current_student_id());

-- APPLICATIONS
DROP POLICY IF EXISTS admin_applications_all ON public.applications;
CREATE POLICY admin_applications_all ON public.applications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_applications_read_self ON public.applications;
CREATE POLICY student_applications_read_self ON public.applications FOR SELECT TO authenticated USING (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_applications_insert_self ON public.applications;
CREATE POLICY student_applications_insert_self ON public.applications FOR INSERT TO authenticated WITH CHECK (student_id = public.get_current_student_id());

-- APPLICATION TIMELINE
DROP POLICY IF EXISTS admin_application_timeline_all ON public.application_timeline;
CREATE POLICY admin_application_timeline_all ON public.application_timeline FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_timeline_read ON public.application_timeline;
CREATE POLICY student_timeline_read ON public.application_timeline FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.student_id = public.get_current_student_id())
);

-- OFFERS
DROP POLICY IF EXISTS admin_offers_all ON public.offers;
CREATE POLICY admin_offers_all ON public.offers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_offers_read ON public.offers;
CREATE POLICY student_offers_read ON public.offers FOR SELECT TO authenticated USING (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_offers_update ON public.offers;
CREATE POLICY student_offers_update ON public.offers FOR UPDATE TO authenticated USING (student_id = public.get_current_student_id()) WITH CHECK (student_id = public.get_current_student_id());

-- NOTIFICATIONS
DROP POLICY IF EXISTS admin_notifications_all ON public.notifications;
CREATE POLICY admin_notifications_all ON public.notifications FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS user_notifications_read ON public.notifications;
CREATE POLICY user_notifications_read ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_notifications_update ON public.notifications;
CREATE POLICY user_notifications_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- NOTICE RSVPS
DROP POLICY IF EXISTS admin_notice_rsvps_all ON public.notice_rsvps;
CREATE POLICY admin_notice_rsvps_all ON public.notice_rsvps FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_rsvps_read ON public.notice_rsvps;
CREATE POLICY student_rsvps_read ON public.notice_rsvps FOR SELECT TO authenticated USING (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_rsvps_insert ON public.notice_rsvps;
CREATE POLICY student_rsvps_insert ON public.notice_rsvps FOR INSERT TO authenticated WITH CHECK (student_id = public.get_current_student_id());

DROP POLICY IF EXISTS student_rsvps_update ON public.notice_rsvps;
CREATE POLICY student_rsvps_update ON public.notice_rsvps FOR UPDATE TO authenticated USING (student_id = public.get_current_student_id()) WITH CHECK (student_id = public.get_current_student_id());

-- JOB DRIVES
DROP POLICY IF EXISTS admin_job_drives_all ON public.job_drives;
CREATE POLICY admin_job_drives_all ON public.job_drives FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS read_job_drives ON public.job_drives;
CREATE POLICY read_job_drives ON public.job_drives FOR SELECT TO authenticated USING (public.is_admin() OR status != 'draft');

-- DRIVE ROUNDS
DROP POLICY IF EXISTS admin_drive_rounds_all ON public.drive_rounds;
CREATE POLICY admin_drive_rounds_all ON public.drive_rounds FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS read_drive_rounds ON public.drive_rounds;
CREATE POLICY read_drive_rounds ON public.drive_rounds FOR SELECT TO authenticated USING (true);

-- DRIVE ROUND RESULTS
DROP POLICY IF EXISTS admin_round_results_all ON public.drive_round_results;
CREATE POLICY admin_round_results_all ON public.drive_round_results FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_round_results_read ON public.drive_round_results;
CREATE POLICY student_round_results_read ON public.drive_round_results FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.student_id = public.get_current_student_id())
);

-- COMPANIES, NOTICES, EVENTS
DROP POLICY IF EXISTS admin_companies_all ON public.companies;
CREATE POLICY admin_companies_all ON public.companies FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS read_companies ON public.companies;
CREATE POLICY read_companies ON public.companies FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS admin_notices_all ON public.notices;
CREATE POLICY admin_notices_all ON public.notices FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS read_notices ON public.notices;
CREATE POLICY read_notices ON public.notices FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS admin_events_all ON public.events;
CREATE POLICY admin_events_all ON public.events FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS read_events ON public.events;
CREATE POLICY read_events ON public.events FOR SELECT TO authenticated USING (true);

-- SETTINGS (Only whitelisted public keys are readable by non-admins or anonymous)
DROP POLICY IF EXISTS admin_settings_all ON public.settings;
CREATE POLICY admin_settings_all ON public.settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS settings_read_whitelisted ON public.settings;
CREATE POLICY settings_read_whitelisted ON public.settings FOR SELECT TO authenticated, anon USING (
  setting_key IN ('academic_year_completion', 'system_status', 'custom_groups', 'deleted_default_documents', 'branding')
);

-- RESTRICTED ADMIN TABLES
DO $$
DECLARE
  adm_table text;
  adm_tables text[] := ARRAY[
    'admin_tasks', 'analytics_snapshots', 'audit_logs', 'background_jobs',
    'drive_templates', 'placement_policies', 'placement_history'
  ];
BEGIN
  FOREACH adm_table IN ARRAY adm_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS admin_only_all ON public.%I;', adm_table);
    EXECUTE format('CREATE POLICY admin_only_all ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());', adm_table);
  END LOOP;
END $$;
