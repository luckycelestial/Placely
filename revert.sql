-- ==========================================
-- REVERT SCRIPT FOR DEMO SEED DATA
-- ==========================================

-- 1. Delete joinees
DELETE FROM public.joinees 
WHERE id::text LIKE 'e0000000-0000-0000-0000-0000000002%' 
   OR student_id::text LIKE 'b0000000-%' 
   OR company_id::text LIKE 'c0000000-%';

-- 2. Delete offers
DELETE FROM public.offers 
WHERE id::text LIKE 'e0000000-0000-0000-0000-0000000001%' 
   OR student_id::text LIKE 'b0000000-%' 
   OR company_id::text LIKE 'c0000000-%' 
   OR drive_id::text LIKE 'd0000000-%';

-- 3. Delete application timeline
DELETE FROM public.application_timeline 
WHERE id::text LIKE 'f0000000-%'
   OR application_id::text LIKE 'e0000000-%';

-- 4. Delete applications
DELETE FROM public.applications 
WHERE id::text LIKE 'e0000000-%' 
   OR student_id::text LIKE 'b0000000-%' 
   OR drive_id::text LIKE 'd0000000-%';

-- 5. Delete drive rounds
DELETE FROM public.drive_rounds 
WHERE drive_id::text LIKE 'd0000000-%';

-- 6. Delete job drives
DELETE FROM public.job_drives 
WHERE id::text LIKE 'd0000000-%';

-- 7. Delete companies
DELETE FROM public.companies 
WHERE id::text LIKE 'c0000000-%';

-- 8. Delete student relations
DELETE FROM public.student_preferences WHERE student_id::text LIKE 'b0000000-%';
DELETE FROM public.student_profiles WHERE student_id::text LIKE 'b0000000-%';
DELETE FROM public.student_academics WHERE student_id::text LIKE 'b0000000-%';
DELETE FROM public.student_contacts WHERE student_id::text LIKE 'b0000000-%';
DELETE FROM public.student_projects WHERE student_id::text LIKE 'b0000000-%';
DELETE FROM public.student_documents WHERE student_id::text LIKE 'b0000000-%';

-- 9. Delete students
DELETE FROM public.students WHERE id::text LIKE 'b0000000-%';

-- 10. Delete users
DELETE FROM public.users WHERE id::text LIKE 'a0000000-%';
