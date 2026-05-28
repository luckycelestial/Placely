-- ============================================================
-- Migration: Add UNIQUE constraint on student_id in student_academics
-- Enables high-performance bulk upserts and ensures 1-to-1 integrity
-- ============================================================

ALTER TABLE public.student_academics 
  ADD CONSTRAINT student_academics_student_id_key UNIQUE (student_id);
