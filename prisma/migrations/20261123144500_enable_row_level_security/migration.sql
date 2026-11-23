-- Enable Row Level Security on all application tables
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

-- Allow service_role full access to all tables so server services can operate
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
