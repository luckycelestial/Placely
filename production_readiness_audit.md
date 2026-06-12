# 🚀 CareerBridge Production Readiness Audit Report

This report outlines critical issues and architectural enhancements required before deploying the application to production for 5000+ active staff and student users.

---

## 🔒 1. Security & Authentication

> [!CAUTION]
> **Disabled Row Level Security (RLS) & Local Storage User Simulation**:
> The application currently relies on a simulated user (`DEV_STUDENT_ID`) read from `localStorage`. RLS policies are disabled across all tables.
> **Action Required**:
> - Implement real authentication (e.g., Supabase Auth / Next-Auth).
> - Enable RLS on all 22 tables.
> - Configure policy controls such that users can only select/update their own data:
>   ```sql
>   ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
>   CREATE POLICY "Students can read own profile" ON public.students
>     FOR SELECT TO authenticated USING (auth.uid() = user_id);
>   ```

---

## 💾 2. Database Quality & Performance

### A. Missing Foreign Key Indexes
With 5,000 users, relational tables (`applications`, `joinees`, `notices`, `events`) will grow rapidly. Missing indexes on foreign keys will cause full-table scans during JOINs:
- Add index on `events(created_by)`
- Add index on `job_drives(created_by)`
- Add index on `joinees(company_id)`
- Add index on `notices(created_by)`

### B. Connection Pooling
Since the client application connects to Supabase over HTTP REST (`supabase-js` client SDK), direct Postgres TCP connections are not established by the client. PostgREST (Supabase REST API gateway) handles connection pooling automatically.
- **Action**: No application-level PG connection pooling configuration is required. Ensure database-side pooling limit is monitored on the Supabase dashboard.

---

## ⚡ 3. Code Quality & Scaling

### A. Server-Side Calculations
Currently, statistics (e.g., active counts, placed counts, offered counts) are computed client-side in `progress/page.tsx` and `dashboard/page.tsx` by loading complete array sets.
- **Action**: Replace client-side filters with Supabase RPC functions (`postgres functions`) that return aggregated counts directly, reducing payload size by 99%.

### B. Notice Feed Pagination
The `NotificationInbox` and header notification lists fetch all notices from the database.
- **Action**: Implement pagination or date-based limits (e.g., `LIMIT 20` or only notices from the last 30 days) to prevent large data transfers.

### C. Private File Storage
Document onboarding actions (ID proofs, medical certificates) must not use public Supabase buckets.
- **Action**: Save uploads to a private bucket and retrieve them via transient signed URLs (`supabase.storage.from('documents').createSignedUrl(...)`).