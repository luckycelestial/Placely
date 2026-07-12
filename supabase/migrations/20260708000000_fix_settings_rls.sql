-- Migration: Fix RLS policies for settings table to allow public/anonymous read and write access

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public insert on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public update on settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public delete on settings" ON public.settings;

CREATE POLICY "Allow public select on settings" ON public.settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on settings" ON public.settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on settings" ON public.settings FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on settings" ON public.settings FOR DELETE TO public USING (true);
