-- Migration: Add validation rules and check constraints for Batch (Graduation Year) and Year of Study

-- 1. Ensure students.year stores a valid 4-digit graduation year, batch range (YYYY-YYYY), or legacy single digit (1-4)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_student_year_batch_format'
    ) THEN
        ALTER TABLE students 
        ADD CONSTRAINT check_student_year_batch_format 
        CHECK (year IS NULL OR year ~ '^(20[2-9][0-9]|20[2-9][0-9]-20[2-9][0-9]|[1-4])$');
    END IF;
END $$;

-- 2. Ensure job_drives.batch stores a valid 4-digit year or range if provided
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_job_drives_batch_format'
    ) THEN
        ALTER TABLE job_drives 
        ADD CONSTRAINT check_job_drives_batch_format 
        CHECK (batch IS NULL OR batch ~ '^(All|20[2-9][0-9]|20[2-9][0-9]-20[2-9][0-9])$');
    END IF;
END $$;
