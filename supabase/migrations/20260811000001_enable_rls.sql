-- Migration: Enable Row-Level Security (RLS) & Define Access Policies
-- Target: Security Hardening for PostgreSQL / Supabase Schema

-- 1. Enable RLS on all core tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "placement_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_drives" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "drive_rounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "drive_round_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "application_timeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "offers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "analytics_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "drive_templates" ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current JWT user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(current_setting('request.jwt.claims', true)::json ->> 'role', '') = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE email = COALESCE(current_setting('request.jwt.claims', true)::json ->> 'email', '')
        AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. USERS TABLE POLICIES
CREATE POLICY "Admins full access to users"
  ON "users" FOR ALL
  USING (public.is_admin());

CREATE POLICY "Users view own record"
  ON "users" FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json ->> 'email' OR is_admin());

-- 3. STUDENTS TABLE POLICIES
CREATE POLICY "Admins full access to students"
  ON "students" FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students view own profile record"
  ON "students" FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE email = current_setting('request.jwt.claims', true)::json ->> 'email'
    ) OR public.is_admin()
  );

-- 4. STUDENT PROFILES & DOCUMENTS POLICIES
CREATE POLICY "Students manage own profiles"
  ON "student_profiles" FOR ALL
  USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.users u ON s.user_id = u.id
      WHERE u.email = current_setting('request.jwt.claims', true)::json ->> 'email'
    ) OR public.is_admin()
  );

CREATE POLICY "Students manage own documents"
  ON "student_documents" FOR ALL
  USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.users u ON s.user_id = u.id
      WHERE u.email = current_setting('request.jwt.claims', true)::json ->> 'email'
    ) OR public.is_admin()
  );

-- 5. READ-ONLY PUBLIC PLACEMENT DATA POLICIES (Companies, Drives, Notices, Events, Policies)
CREATE POLICY "Authenticated users view active companies"
  ON "companies" FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY "Admins manage companies"
  ON "companies" FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users view job drives"
  ON "job_drives" FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY "Admins manage job drives"
  ON "job_drives" FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users view drive rounds"
  ON "drive_rounds" FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY "Admins manage drive rounds"
  ON "drive_rounds" FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users view notices"
  ON "notices" FOR SELECT
  USING (status = 'published' OR public.is_admin());

CREATE POLICY "Admins manage notices"
  ON "notices" FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users view events"
  ON "events" FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY "Admins manage events"
  ON "events" FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users view placement policies"
  ON "placement_policies" FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY "Admins manage placement policies"
  ON "placement_policies" FOR ALL
  USING (public.is_admin());

-- 6. APPLICATIONS & OFFERS POLICIES
CREATE POLICY "Students view and submit own applications"
  ON "applications" FOR ALL
  USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.users u ON s.user_id = u.id
      WHERE u.email = current_setting('request.jwt.claims', true)::json ->> 'email'
    ) OR public.is_admin()
  );

CREATE POLICY "Students view own offers"
  ON "offers" FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.users u ON s.user_id = u.id
      WHERE u.email = current_setting('request.jwt.claims', true)::json ->> 'email'
    ) OR public.is_admin()
  );

CREATE POLICY "Admins manage offers"
  ON "offers" FOR ALL
  USING (public.is_admin());

-- 7. NOTIFICATIONS POLICIES
CREATE POLICY "Users view own notifications"
  ON "notifications" FOR ALL
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE email = current_setting('request.jwt.claims', true)::json ->> 'email'
    ) OR public.is_admin()
  );

-- 8. SETTINGS & SYSTEM POLICIES
CREATE POLICY "Authenticated users view settings"
  ON "settings" FOR SELECT
  USING (auth.role() = 'authenticated' OR public.is_admin());

CREATE POLICY "Admins manage settings"
  ON "settings" FOR ALL
  USING (public.is_admin());
