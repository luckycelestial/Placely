-- Migration: Disable Row Level Security on all tables (development only)
-- RLS will be re-enabled with proper auth-based policies before production.
-- Tables disabled: analytics_snapshots, application_timeline, applications,
-- audit_logs, companies, drive_rounds, drive_templates, events, job_drives,
-- joinees, notices, notifications, offers, settings, student_academics,
-- student_contacts, student_documents, student_preferences, student_profiles,
-- students, tasks, users

ALTER TABLE public.analytics_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_timeline DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_drives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.joinees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
