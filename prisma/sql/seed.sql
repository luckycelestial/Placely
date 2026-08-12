-- ==========================================
-- SEED DATA FOR DEMO DRIVE & ATS TRACKING
-- ==========================================

-- 1. Companies
INSERT INTO public.companies (id, name, website, industry, hr_name, hr_email, hr_phone, status, logo_url, theme_color)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Google Inc.', 'https://google.com', 'Technology', 'Sundar Pichai', 'sundar@google.com', '+1-650-253-0000', 'active', 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg', '#4285F4'),
  ('c0000000-0000-0000-0000-000000000002', 'Microsoft Corporation', 'https://microsoft.com', 'Technology', 'Satya Nadella', 'satya@microsoft.com', '+1-425-882-8080', 'active', 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg', '#F25022'),
  ('c0000000-0000-0000-0000-000000000003', 'Amazon.com, Inc.', 'https://amazon.com', 'E-commerce & Cloud', 'Andy Jassy', 'andy@amazon.com', '+1-206-266-1000', 'active', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', '#FF9900'),
  ('c0000000-0000-0000-0000-000000000004', 'Stripe, Inc.', 'https://stripe.com', 'Fintech', 'Patrick Collison', 'patrick@stripe.com', '+1-415-000-0000', 'active', 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg', '#635BFF');

-- 2. Job Drives
INSERT INTO public.job_drives (id, company_id, title, role_title, drive_type, package_ctc, location, job_description, eligibility_rules, application_start, application_end, drive_start, drive_end, status, batch)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001', 
    'c0000000-0000-0000-0000-000000000001', 
    'Google SWE Recruitment 2026', 
    'Software Engineer', 
    'Full-time', 
    '32 LPA', 
    'Bangalore, KA', 
    'Join our core engineering team to build scalable applications used by millions of users.', 
    '{"branches": ["CSE", "IT", "AI&DS"], "min_cgpa": 8.0, "backlogs_allowed": 0, "history_of_arrears": false}'::jsonb,
    now() - interval '5 days', 
    now() + interval '10 days', 
    now() + interval '15 days', 
    now() + interval '20 days', 
    'published', 
    '2026'
  ),
  (
    'd0000000-0000-0000-0000-000000000002', 
    'c0000000-0000-0000-0000-000000000002', 
    'Microsoft Analyst Recruitment 2026', 
    'Data Analyst', 
    'Full-time', 
    '24 LPA', 
    'Hyderabad, TS', 
    'Analyze large-scale datasets and generate insights that drive business decisions.', 
    '{"branches": ["CSE", "ECE", "EEE"], "min_cgpa": 7.5, "backlogs_allowed": 0, "history_of_arrears": false}'::jsonb,
    now() - interval '20 days', 
    now() - interval '2 days', 
    now() - interval '1 day', 
    now() + interval '5 days', 
    'completed', 
    '2026'
  ),
  (
    'd0000000-0000-0000-0000-000000000003', 
    'c0000000-0000-0000-0000-000000000003', 
    'Amazon Cloud Support Engineer 2026', 
    'Cloud Support Engineer', 
    'Full-time', 
    '18 LPA', 
    'Chennai, TN', 
    'Provide technical support for AWS cloud services and solve architecture scaling issues.', 
    '{"branches": ["CSE", "IT", "ECE", "EEE"], "min_cgpa": 7.0, "backlogs_allowed": 1, "history_of_arrears": true}'::jsonb,
    now() - interval '1 day', 
    now() + interval '8 days', 
    now() + interval '12 days', 
    now() + interval '16 days', 
    'published', 
    '2026'
  ),
  (
    'd0000000-0000-0000-0000-000000000004', 
    'c0000000-0000-0000-0000-000000000004', 
    'Stripe Frontend Engineer 2026', 
    'Frontend Developer', 
    'Internship', 
    '80k/Month', 
    'Remote', 
    'Design and build high-quality web interfaces for payment infrastructure products.', 
    '{"branches": ["CSE", "IT", "AI&DS", "CYS"], "min_cgpa": 7.5, "backlogs_allowed": 0, "history_of_arrears": false}'::jsonb,
    now() + interval '5 days', 
    now() + interval '20 days', 
    now() + interval '25 days', 
    now() + interval '30 days', 
    'draft', 
    '2026'
  );

-- 3. Demo Users (Students)
INSERT INTO public.users (id, role, name, email, phone, avatar_url, status)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'student', 'Amit Sharma', 'amit.sharma@demo.com', '+91-9876543210', null, 'active'),
  ('a0000000-0000-0000-0000-000000000002', 'student', 'Priya Patel', 'priya.patel@demo.com', '+91-9876543211', null, 'active'),
  ('a0000000-0000-0000-0000-000000000003', 'student', 'Rahul Verma', 'rahul.verma@demo.com', '+91-9876543212', null, 'active'),
  ('a0000000-0000-0000-0000-000000000004', 'student', 'Sneha Reddy', 'sneha.reddy@demo.com', '+91-9876543213', null, 'active'),
  ('a0000000-0000-0000-0000-000000000005', 'student', 'Vikram Singh', 'vikram.singh@demo.com', '+91-9876543214', null, 'active'),
  ('a0000000-0000-0000-0000-000000000006', 'student', 'Ananya Das', 'ananya.das@demo.com', '+91-9876543215', null, 'active'),
  ('a0000000-0000-0000-0000-000000000007', 'student', 'Kartik Rao', 'kartik.rao@demo.com', '+91-9876543216', null, 'active'),
  ('a0000000-0000-0000-0000-000000000008', 'student', 'Pooja Hegde', 'pooja.hegde@demo.com', '+91-9876543217', null, 'active'),
  ('a0000000-0000-0000-0000-000000000009', 'student', 'Arjun Nair', 'arjun.nair@demo.com', '+91-9876543218', null, 'active'),
  ('a0000000-0000-0000-0000-000000000010', 'student', 'Divya Menon', 'divya.menon@demo.com', '+91-9876543219', null, 'active');

-- 4. Demo Students
INSERT INTO public.students (id, user_id, register_number, roll_number, name, department, year, section, gender, date_of_birth, placement_status, profile_completion, verification_status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'REG2026CSE001', 'ROLL001', 'Amit Sharma', 'CSE', 4, 'A', 'Male', '2004-05-15', 'placed', 95, 'verified'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'REG2026IT001', 'ROLL002', 'Priya Patel', 'IT', 4, 'B', 'Female', '2004-08-22', 'not_placed', 90, 'verified'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'REG2026ECE001', 'ROLL003', 'Rahul Verma', 'ECE', 4, 'A', 'Male', '2004-03-10', 'not_placed', 85, 'verified'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'REG2026AIDS001', 'ROLL004', 'Sneha Reddy', 'AI&DS', 4, 'A', 'Female', '2004-11-05', 'not_placed', 92, 'verified'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'REG2026CSE002', 'ROLL005', 'Vikram Singh', 'CSE', 4, 'B', 'Male', '2004-01-19', 'not_placed', 80, 'verified'),
  ('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000006', 'REG2026EEE001', 'ROLL006', 'Ananya Das', 'EEE', 4, 'A', 'Female', '2004-06-30', 'not_placed', 88, 'verified'),
  ('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000007', 'REG2026MECH001', 'ROLL007', 'Kartik Rao', 'MECH', 4, 'A', 'Male', '2004-10-12', 'not_placed', 75, 'verified'),
  ('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000008', 'REG2026CSE003', 'ROLL008', 'Pooja Hegde', 'CSE', 4, 'C', 'Female', '2004-12-01', 'not_placed', 82, 'verified'),
  ('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000009', 'REG2026IT002', 'ROLL009', 'Arjun Nair', 'IT', 4, 'A', 'Male', '2004-07-14', 'not_placed', 70, 'pending'),
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'REG2026CYS001', 'ROLL010', 'Divya Menon', 'CYS', 4, 'A', 'Female', '2004-09-02', 'not_placed', 91, 'verified');

-- 5. Student Academics
INSERT INTO public.student_academics (id, student_id, cgpa, tenth_score, twelfth_score, diploma_score, backlog_count, current_backlogs, history_of_backlogs, history_of_arrears, active_arrears)
VALUES
  ('b0000000-0000-0000-0000-000000000201', 'b0000000-0000-0000-0000-000000000001', 9.20, 95.50, 93.00, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000202', 'b0000000-0000-0000-0000-000000000002', 8.40, 88.00, 86.50, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000203', 'b0000000-0000-0000-0000-000000000003', 7.80, 82.00, 80.00, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000204', 'b0000000-0000-0000-0000-000000000004', 8.10, 91.00, 89.00, null, 1, 0, true, true, 0),
  ('b0000000-0000-0000-0000-000000000205', 'b0000000-0000-0000-0000-000000000005', 7.20, 78.00, 75.00, null, 1, 1, true, true, 1),
  ('b0000000-0000-0000-0000-000000000206', 'b0000000-0000-0000-0000-000000000006', 7.60, 85.00, 82.00, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000207', 'b0000000-0000-0000-0000-000000000007', 8.50, 92.00, 90.00, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000208', 'b0000000-0000-0000-0000-000000000008', 6.80, 79.00, 76.00, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000209', 'b0000000-0000-0000-0000-000000000009', 7.40, 81.00, 78.00, null, 2, 2, true, true, 2),
  ('b0000000-0000-0000-0000-000000000210', 'b0000000-0000-0000-0000-000000000010', 8.00, 89.00, 87.00, null, 0, 0, false, false, 0);

-- 6. Student Contacts
INSERT INTO public.student_contacts (id, student_id, college_email, personal_email, phone, address, city, state, pincode)
VALUES
  ('b0000000-0000-0000-0000-000000000101', 'b0000000-0000-0000-0000-000000000001', 'amit.sharma2026cse@sece.ac.in', 'amit.sharma@gmail.com', '+91-9876543210', '123, Main Rd', 'Coimbatore', 'Tamil Nadu', '641001'),
  ('b0000000-0000-0000-0000-000000000102', 'b0000000-0000-0000-0000-000000000002', 'priya.patel2026it@sece.ac.in', 'priya.patel@gmail.com', '+91-9876543211', '456, Cross St', 'Coimbatore', 'Tamil Nadu', '641002');

-- 7. Student Profiles
INSERT INTO public.student_profiles (id, student_id, resume_url, linkedin_url, github_url, portfolio_url, leetcode_count, specializations)
VALUES
  ('b0000000-0000-0000-0000-000000000301', 'b0000000-0000-0000-0000-000000000001', 'https://resume.com/amit', 'https://linkedin.com/in/amit', 'https://github.com/amit', 'https://amit.dev', 320, '{"Backend", "System Design"}'),
  ('b0000000-0000-0000-0000-000000000302', 'b0000000-0000-0000-0000-000000000002', 'https://resume.com/priya', 'https://linkedin.com/in/priya', 'https://github.com/priya', 'https://priya.dev', 180, '{"Frontend", "Mobile UI"}'),
  ('b0000000-0000-0000-0000-000000000303', 'b0000000-0000-0000-0000-000000000003', 'https://resume.com/rahul', 'https://linkedin.com/in/rahul', 'https://github.com/rahul', null, 50, '{"Embedded Systems", "IoT"}'),
  ('b0000000-0000-0000-0000-000000000304', 'b0000000-0000-0000-0000-000000000004', 'https://resume.com/sneha', 'https://linkedin.com/in/sneha', 'https://github.com/sneha', 'https://sneha.dev', 210, '{"Machine Learning", "NLP"}');

-- 8. Applications
-- Amit Sharma (Student 1) applied to Google, Microsoft, Amazon.
-- Priya Patel (Student 2) applied to Google, Amazon.
-- Rahul Verma (Student 3) applied to Microsoft, Amazon.
-- Sneha Reddy (Student 4) applied to Amazon.
-- Vikram Singh (Student 5) applied to Amazon.
-- Pooja Hegde (Student 8) applied to Google (but is NOT eligible).
INSERT INTO public.applications (id, student_id, drive_id, status, current_stage, next_step, outcome)
VALUES
  -- Student 1 (Amit) applications
  (
    'e0000000-0000-0000-0000-000000000001', 
    'b0000000-0000-0000-0000-000000000001', 
    'd0000000-0000-0000-0000-000000000001', 
    'applied', 
    'interview2', 
    'Awaiting HR round schedule', 
    'pending'
  ),
  (
    'e0000000-0000-0000-0000-000000000002', 
    'b0000000-0000-0000-0000-000000000001', 
    'd0000000-0000-0000-0000-000000000002', 
    'placed', 
    'selection', 
    'Documentation complete', 
    'selected'
  ),
  (
    'e0000000-0000-0000-0000-000000000003', 
    'b0000000-0000-0000-0000-000000000001', 
    'd0000000-0000-0000-0000-000000000003', 
    'applied', 
    'applied', 
    'Awaiting shortlist release', 
    'pending'
  ),
  -- Student 2 (Priya) applications
  (
    'e0000000-0000-0000-0000-000000000004', 
    'b0000000-0000-0000-0000-000000000002', 
    'd0000000-0000-0000-0000-000000000001', 
    'applied', 
    'interview1', 
    'Technical Interview Round 1 on July 10', 
    'pending'
  ),
  -- Student 3 (Rahul) applications
  (
    'e0000000-0000-0000-0000-000000000005', 
    'b0000000-0000-0000-0000-000000000003', 
    'd0000000-0000-0000-0000-000000000002', 
    'applied', 
    'shortlisted', 
    'Awaiting interview panel allocation', 
    'pending'
  ),
  -- Student 4 (Sneha) applications
  (
    'e0000000-0000-0000-0000-000000000006', 
    'b0000000-0000-0000-0000-000000000004', 
    'd0000000-0000-0000-0000-000000000003', 
    'applied', 
    'applied', 
    'Awaiting test credentials', 
    'pending'
  ),
  -- Student 5 (Vikram) applications
  (
    'e0000000-0000-0000-0000-000000000007', 
    'b0000000-0000-0000-0000-000000000005', 
    'd0000000-0000-0000-0000-000000000003', 
    'applied', 
    'shortlisted', 
    'Shortlisted for online assessment', 
    'pending'
  ),
  -- Student 8 (Pooja - Ineligible) applications
  (
    'e0000000-0000-0000-0000-000000000008', 
    'b0000000-0000-0000-0000-000000000008', 
    'd0000000-0000-0000-0000-000000000001', 
    'rejected', 
    'applied', 
    'Did not meet minimum CGPA requirement (8.0)', 
    'rejected'
  ),
  -- Student 6 (Ananya) applications
  (
    'e0000000-0000-0000-0000-000000000021', 
    'b0000000-0000-0000-0000-000000000006', 
    'd0000000-0000-0000-0000-000000000002', 
    'applied', 
    'interview1', 
    'Technical Interview Round 1 on July 15', 
    'pending'
  ),
  -- Student 7 (Kartik) applications
  (
    'e0000000-0000-0000-0000-000000000022', 
    'b0000000-0000-0000-0000-000000000007', 
    'd0000000-0000-0000-0000-000000000003', 
    'applied', 
    'interview2', 
    'Awaiting manager interview schedule', 
    'pending'
  ),
  -- Student 9 (Arjun) applications
  (
    'e0000000-0000-0000-0000-000000000023', 
    'b0000000-0000-0000-0000-000000000009', 
    'd0000000-0000-0000-0000-000000000001', 
    'applied', 
    'shortlisted', 
    'Coding assessment scheduled', 
    'pending'
  ),
  -- Student 10 (Divya) applications
  (
    'e0000000-0000-0000-0000-000000000024', 
    'b0000000-0000-0000-0000-000000000010', 
    'd0000000-0000-0000-0000-000000000004', 
    'placed', 
    'selection', 
    'Selected as Intern', 
    'selected'
  ),
  (
    'e0000000-0000-0000-0000-000000000025', 
    'b0000000-0000-0000-0000-000000000010', 
    'd0000000-0000-0000-0000-000000000001', 
    'applied', 
    'interview2', 
    'System Design interview scheduled', 
    'pending'
  );

-- 9. Application Timeline (ATS Rounds Tracking)
INSERT INTO public.application_timeline (id, application_id, stage_name, stage_order, event_type, notes, event_at)
VALUES
  -- Student 1 (Amit) Timeline for Microsoft (Selected)
  ('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'applied', 1, 'system', 'Application submitted', now() - interval '20 days'),
  ('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'shortlisted', 2, 'admin', 'Profile shortlisted by HR panel', now() - interval '18 days'),
  ('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'interview1', 3, 'interview', 'Cleared Technical Round 1', now() - interval '15 days'),
  ('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'interview2', 4, 'interview', 'Cleared Technical Round 2', now() - interval '12 days'),
  ('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000002', 'selection', 5, 'admin', 'Selected for employment', now() - interval '10 days'),

  -- Student 1 (Amit) Timeline for Google (In Progress)
  ('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000001', 'applied', 1, 'system', 'Application submitted', now() - interval '5 days'),
  ('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000001', 'shortlisted', 2, 'admin', 'Eligible and shortlisted for coding round', now() - interval '4 days'),
  ('f0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000001', 'interview1', 3, 'interview', 'Passed technical coding interview', now() - interval '2 days'),

  -- Student 2 (Priya) Timeline for Google (In Progress)
  ('f0000000-0000-0000-0000-000000000009', 'e0000000-0000-0000-0000-000000000004', 'applied', 1, 'system', 'Application submitted', now() - interval '5 days'),
  ('f0000000-0000-0000-0000-000000000010', 'e0000000-0000-0000-0000-000000000004', 'shortlisted', 2, 'admin', 'Profile matched eligibility criteria', now() - interval '3 days'),

  -- Student 8 (Pooja) Timeline for Google (Rejected)
  ('f0000000-0000-0000-0000-000000000011', 'e0000000-0000-0000-0000-000000000008', 'applied', 1, 'system', 'Application submitted', now() - interval '5 days'),
  ('f0000000-0000-0000-0000-000000000012', 'e0000000-0000-0000-0000-000000000008', 'applied', 1, 'system', 'Auto-rejected: CGPA (6.8) is below the minimum requirement (8.0)', now() - interval '5 days');

-- 10. Offers
INSERT INTO public.offers (id, student_id, drive_id, company_id, role_title, package_ctc, offer_status, acceptance_status, joining_date, verification_status, mismatch_flag)
VALUES
  (
    'e0000000-0000-0000-0000-000000000101', 
    'b0000000-0000-0000-0000-000000000001', 
    'd0000000-0000-0000-0000-000000000002', 
    'c0000000-0000-0000-0000-000000000002', 
    'Data Analyst', 
    '24 LPA', 
    'issued', 
    'accepted', 
    '2026-08-01', 
    'verified', 
    false
  ),
  (
    'e0000000-0000-0000-0000-000000000102', 
    'b0000000-0000-0000-0000-000000000010', 
    'd0000000-0000-0000-0000-000000000004', 
    'c0000000-0000-0000-0000-000000000004', 
    'Frontend Developer', 
    '80k/Month', 
    'issued', 
    'accepted', 
    '2026-08-01', 
    'verified', 
    false
  );

-- 11. Joinees
INSERT INTO public.joinees (id, offer_id, student_id, company_id, joining_status, joined_at, remarks)
VALUES
  (
    'e0000000-0000-0000-0000-000000000201', 
    'e0000000-0000-0000-0000-000000000101', 
    'b0000000-0000-0000-0000-000000000001', 
    'c0000000-0000-0000-0000-000000000002', 
    'joined', 
    '2026-08-01', 
    'Onboarded at Microsoft Hyderabad campus'
  );

-- ============================================================
-- HISTORICAL SEED DATA (BATCHES 2024 & 2025)
-- ============================================================

-- 1H. Additional Companies
INSERT INTO public.companies (id, name, website, industry, hr_name, hr_email, hr_phone, status, logo_url, theme_color)
VALUES
  ('c0000000-0000-0000-0000-000000000005', 'Meta Platforms', 'https://meta.com', 'Technology', 'Mark Zuckerberg', 'mark@meta.com', '+1-650-543-4800', 'active', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg', '#0668E1'),
  ('c0000000-0000-0000-0000-000000000006', 'Netflix Inc.', 'https://netflix.com', 'Entertainment & Cloud', 'Ted Sarandos', 'ted@netflix.com', '+1-408-540-3700', 'active', 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', '#E50914');

-- 2H. Historical Job Drives (Completed)
INSERT INTO public.job_drives (id, company_id, title, role_title, drive_type, package_ctc, location, job_description, eligibility_rules, application_start, application_end, drive_start, drive_end, status, batch)
VALUES
  (
    'd0000000-0000-0000-0000-000000000005', 
    'c0000000-0000-0000-0000-000000000001', 
    'Google SWE Recruitment 2025', 
    'Software Engineer', 
    'Full-time', 
    '30 LPA', 
    'Bangalore, KA', 
    'Join Google as a software engineer for the 2025 batch.', 
    '{"branches": ["CSE", "IT", "AI&DS"], "min_cgpa": 8.0, "backlogs_allowed": 0, "history_of_arrears": false}'::jsonb,
    now() - interval '380 days', 
    now() - interval '370 days', 
    now() - interval '365 days', 
    now() - interval '360 days', 
    'completed', 
    '2025'
  ),
  (
    'd0000000-0000-0000-0000-000000000006', 
    'c0000000-0000-0000-0000-000000000002', 
    'Microsoft Analyst Recruitment 2025', 
    'Data Analyst', 
    'Full-time', 
    '22 LPA', 
    'Hyderabad, TS', 
    'Microsoft data analyst recruitment for the 2025 batch.', 
    '{"branches": ["CSE", "ECE", "EEE"], "min_cgpa": 7.5, "backlogs_allowed": 0, "history_of_arrears": false}'::jsonb,
    now() - interval '390 days', 
    now() - interval '380 days', 
    now() - interval '375 days', 
    now() - interval '370 days', 
    'completed', 
    '2025'
  ),
  (
    'd0000000-0000-0000-0000-000000000007', 
    'c0000000-0000-0000-0000-000000000004', 
    'Stripe Frontend Engineer 2024', 
    'Frontend Developer', 
    'Full-time', 
    '16 LPA', 
    'Remote', 
    'Stripe Frontend engineering hiring for the 2024 batch.', 
    '{"branches": ["CSE", "IT", "AI&DS"], "min_cgpa": 7.5, "backlogs_allowed": 0, "history_of_arrears": false}'::jsonb,
    now() - interval '750 days', 
    now() - interval '740 days', 
    now() - interval '735 days', 
    now() - interval '730 days', 
    'completed', 
    '2024'
  ),
  (
    'd0000000-0000-0000-0000-000000000008', 
    'c0000000-0000-0000-0000-000000000005', 
    'Meta Product Engineer 2025', 
    'Product Engineer', 
    'Full-time', 
    '28 LPA', 
    'Bangalore, KA', 
    'Meta Product Engineer hiring for the 2025 batch.', 
    '{"branches": ["CSE", "IT", "ECE"], "min_cgpa": 8.0, "backlogs_allowed": 0, "history_of_arrears": false}'::jsonb,
    now() - interval '340 days', 
    now() - interval '330 days', 
    now() - interval '325 days', 
    now() - interval '320 days', 
    'completed', 
    '2025'
  );

-- 3H. Historical Users
INSERT INTO public.users (id, role, name, email, phone, avatar_url, status)
VALUES
  ('a0000000-0000-0000-0000-000000000011', 'student', 'Rohit Kumar', 'rohit.kumar@demo.com', '+91-9876543220', null, 'active'),
  ('a0000000-0000-0000-0000-000000000012', 'student', 'Pooja Sharma', 'pooja.sharma@demo.com', '+91-9876543221', null, 'active'),
  ('a0000000-0000-0000-0000-000000000013', 'student', 'Yash Gupta', 'yash.gupta@demo.com', '+91-9876543222', null, 'active'),
  ('a0000000-0000-0000-0000-000000000014', 'student', 'Neha Patel', 'neha.patel@demo.com', '+91-9876543223', null, 'active'),
  ('a0000000-0000-0000-0000-000000000015', 'student', 'Rohan Singh', 'rohan.singh@demo.com', '+91-9876543224', null, 'active'),
  ('a0000000-0000-0000-0000-000000000016', 'student', 'Tanvi Rao', 'tanvi.rao@demo.com', '+91-9876543225', null, 'active');

-- 4H. Historical Students
INSERT INTO public.students (id, user_id, register_number, roll_number, name, department, year, section, gender, date_of_birth, placement_status, profile_completion, verification_status)
VALUES
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'REG2025CSE011', 'ROLL011', 'Rohit Kumar', 'CSE', 4, 'A', 'Male', '2003-04-12', 'placed', 90, 'verified'),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000012', 'REG2025IT012', 'ROLL012', 'Pooja Sharma', 'IT', 4, 'B', 'Female', '2003-09-18', 'placed', 88, 'verified'),
  ('b0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000013', 'REG2024ECE013', 'ROLL013', 'Yash Gupta', 'ECE', 4, 'A', 'Male', '2002-06-25', 'placed', 92, 'verified'),
  ('b0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000014', 'REG2024AIDS014', 'ROLL014', 'Neha Patel', 'AI&DS', 4, 'A', 'Female', '2002-10-02', 'placed', 94, 'verified'),
  ('b0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000015', 'REG2025CSE015', 'ROLL015', 'Rohan Singh', 'CSE', 4, 'B', 'Male', '2003-02-14', 'placed', 85, 'verified'),
  ('b0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000016', 'REG2025EEE016', 'ROLL016', 'Tanvi Rao', 'EEE', 4, 'A', 'Female', '2003-07-28', 'placed', 89, 'verified');

-- 5H. Historical Student Academics
INSERT INTO public.student_academics (id, student_id, cgpa, tenth_score, twelfth_score, diploma_score, backlog_count, current_backlogs, history_of_backlogs, history_of_arrears, active_arrears)
VALUES
  ('b0000000-0000-0000-0000-000000000211', 'b0000000-0000-0000-0000-000000000011', 8.80, 92.00, 90.00, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000212', 'b0000000-0000-0000-0000-000000000012', 8.10, 85.00, 84.00, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000213', 'b0000000-0000-0000-0000-000000000013', 8.50, 89.00, 87.00, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000214', 'b0000000-0000-0000-0000-000000000014', 9.10, 94.00, 92.00, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000215', 'b0000000-0000-0000-0000-000000000015', 7.90, 81.00, 80.00, null, 0, 0, false, false, 0),
  ('b0000000-0000-0000-0000-000000000216', 'b0000000-0000-0000-0000-000000000016', 8.30, 86.00, 85.00, null, 0, 0, false, false, 0);

-- 6H. Historical Student Profiles
INSERT INTO public.student_profiles (id, student_id, resume_url, linkedin_url, github_url, portfolio_url, leetcode_count, specializations)
VALUES
  ('b0000000-0000-0000-0000-000000000311', 'b0000000-0000-0000-0000-000000000011', 'https://resume.com/rohit', 'https://linkedin.com/in/rohit', 'https://github.com/rohit', null, 250, '{"Backend"}'),
  ('b0000000-0000-0000-0000-000000000312', 'b0000000-0000-0000-0000-000000000012', 'https://resume.com/poojasharma', 'https://linkedin.com/in/poojasharma', 'https://github.com/poojasharma', null, 150, '{"Frontend"}');

-- 7H. Historical Applications
INSERT INTO public.applications (id, student_id, drive_id, status, current_stage, next_step, outcome)
VALUES
  -- Student 11 (Rohit)
  ('e0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000005', 'Joined', 'selection', 'Joined Google', '30'),
  ('e0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000008', 'Offered', 'selection', 'Offer letter received', '28'),
  
  -- Student 12 (Pooja)
  ('e0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000005', 'Joined', 'selection', 'Joined Google', '30'),
  
  -- Student 13 (Yash)
  ('e0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000007', 'Joined', 'selection', 'Joined Stripe', '16'),
  
  -- Student 14 (Neha)
  ('e0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000007', 'Joined', 'selection', 'Joined Stripe', '16'),
  
  -- Student 15 (Rohan)
  ('e0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000006', 'Joined', 'selection', 'Joined Microsoft', '22'),
  
  -- Student 16 (Tanvi)
  ('e0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000006', 'Joined', 'selection', 'Joined Microsoft', '22');

-- 8H. Historical Offers
INSERT INTO public.offers (id, student_id, drive_id, company_id, role_title, package_ctc, offer_status, acceptance_status, joining_date, verification_status, mismatch_flag)
VALUES
  ('e0000000-0000-0000-0000-000000000111', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Software Engineer', '30', 'issued', 'accepted', '2025-08-01', 'verified', false),
  ('e0000000-0000-0000-0000-000000000112', 'b0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 'Product Engineer', '28', 'issued', 'accepted', '2025-08-01', 'verified', false),
  ('e0000000-0000-0000-0000-000000000113', 'b0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Software Engineer', '30', 'issued', 'accepted', '2025-08-01', 'verified', false),
  ('e0000000-0000-0000-0000-000000000114', 'b0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'Frontend Developer', '16', 'issued', 'accepted', '2024-08-01', 'verified', false),
  ('e0000000-0000-0000-0000-000000000115', 'b0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'Frontend Developer', '16', 'issued', 'accepted', '2024-08-01', 'verified', false),
  ('e0000000-0000-0000-0000-000000000116', 'b0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'Data Analyst', '22', 'issued', 'accepted', '2025-08-01', 'verified', false),
  ('e0000000-0000-0000-0000-000000000117', 'b0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002', 'Data Analyst', '22', 'issued', 'accepted', '2025-08-01', 'verified', false);

-- 9H. Historical Joinees
INSERT INTO public.joinees (id, offer_id, student_id, company_id, joining_status, joined_at, remarks)
VALUES
  ('e0000000-0000-0000-0000-000000000211', 'e0000000-0000-0000-0000-000000000111', 'b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'joined', '2025-08-01', 'Onboarded at Google Bangalore'),
  ('e0000000-0000-0000-0000-000000000212', 'e0000000-0000-0000-0000-000000000113', 'b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'joined', '2025-08-01', 'Onboarded at Google Bangalore'),
  ('e0000000-0000-0000-0000-000000000213', 'e0000000-0000-0000-0000-000000000114', 'b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000004', 'joined', '2024-08-01', 'Joined Stripe Remote'),
  ('e0000000-0000-0000-0000-000000000214', 'e0000000-0000-0000-0000-000000000115', 'b0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000004', 'joined', '2024-08-01', 'Joined Stripe Remote'),
  ('e0000000-0000-0000-0000-000000000215', 'e0000000-0000-0000-0000-000000000116', 'b0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000002', 'joined', '2025-08-01', 'Onboarded at Microsoft Hyderabad'),
  ('e0000000-0000-0000-0000-000000000216', 'e0000000-0000-0000-0000-000000000117', 'b0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000002', 'joined', '2025-08-01', 'Onboarded at Microsoft Hyderabad');
