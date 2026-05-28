-- Migration: Add UNIQUE constraint on notices(title)
-- This avoids race conditions during automatic notification generation

ALTER TABLE public.notices ADD CONSTRAINT notices_title_key UNIQUE (title);
