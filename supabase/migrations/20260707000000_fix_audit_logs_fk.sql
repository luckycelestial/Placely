-- Migration: Fix audit_logs foreign key constraint
-- The actor_user_id in audit_logs receives auth.uid() from triggers.
-- Since auth.uid() references auth.users(id), the foreign key in public.audit_logs
-- should reference auth.users(id) instead of public.users(id) to prevent constraint violations.

ALTER TABLE public.audit_logs 
  DROP CONSTRAINT IF EXISTS audit_logs_actor_user_id_fkey;

UPDATE public.audit_logs 
  SET actor_user_id = NULL 
  WHERE actor_user_id NOT IN (SELECT id FROM auth.users);

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_actor_user_id_fkey 
  FOREIGN KEY (actor_user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;
