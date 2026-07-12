-- SQL migration to add name column to students table and backfill from users

ALTER TABLE public.students ADD COLUMN name text;

-- Backfill existing names from users table
UPDATE public.students s
SET name = u.name
FROM public.users u
WHERE s.user_id = u.id;
