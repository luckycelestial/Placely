-- Migration: Enable Row Level Security (RLS) CRUD Access for anonymous role
-- Since Placely is a single-college template, administrators and client portals interact
-- with the database directly under the anon role. To prevent silent failures when updating
-- or deleting, the database must have permissive policies configured for the anon role.

-- 1. Policies for 'offers' table
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous select on offers" ON public.offers;
CREATE POLICY "Allow anonymous select on offers" ON public.offers
FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on offers" ON public.offers;
CREATE POLICY "Allow anonymous insert on offers" ON public.offers
FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on offers" ON public.offers;
CREATE POLICY "Allow anonymous update on offers" ON public.offers
FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete on offers" ON public.offers;
CREATE POLICY "Allow anonymous delete on offers" ON public.offers
FOR DELETE TO anon USING (true);


-- 2. Policies for 'companies' table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous select on companies" ON public.companies;
CREATE POLICY "Allow anonymous select on companies" ON public.companies
FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on companies" ON public.companies;
CREATE POLICY "Allow anonymous insert on companies" ON public.companies
FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on companies" ON public.companies;
CREATE POLICY "Allow anonymous update on companies" ON public.companies
FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete on companies" ON public.companies;
CREATE POLICY "Allow anonymous delete on companies" ON public.companies
FOR DELETE TO anon USING (true);


-- 3. Policies for 'students' table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous select on students" ON public.students;
CREATE POLICY "Allow anonymous select on students" ON public.students
FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on students" ON public.students;
CREATE POLICY "Allow anonymous insert on students" ON public.students
FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on students" ON public.students;
CREATE POLICY "Allow anonymous update on students" ON public.students
FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete on students" ON public.students;
CREATE POLICY "Allow anonymous delete on students" ON public.students
FOR DELETE TO anon USING (true);


-- 4. Policies for 'student_academics' table
ALTER TABLE public.student_academics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous select on student_academics" ON public.student_academics;
CREATE POLICY "Allow anonymous select on student_academics" ON public.student_academics
FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on student_academics" ON public.student_academics;
CREATE POLICY "Allow anonymous insert on student_academics" ON public.student_academics
FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on student_academics" ON public.student_academics;
CREATE POLICY "Allow anonymous update on student_academics" ON public.student_academics
FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete on student_academics" ON public.student_academics;
CREATE POLICY "Allow anonymous delete on student_academics" ON public.student_academics
FOR DELETE TO anon USING (true);


-- 5. Policies for 'student_profiles' table
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous select on student_profiles" ON public.student_profiles;
CREATE POLICY "Allow anonymous select on student_profiles" ON public.student_profiles
FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert on student_profiles" ON public.student_profiles;
CREATE POLICY "Allow anonymous insert on student_profiles" ON public.student_profiles
FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update on student_profiles" ON public.student_profiles;
CREATE POLICY "Allow anonymous update on student_profiles" ON public.student_profiles
FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous delete on student_profiles" ON public.student_profiles;
CREATE POLICY "Allow anonymous delete on student_profiles" ON public.student_profiles
FOR DELETE TO anon USING (true);
