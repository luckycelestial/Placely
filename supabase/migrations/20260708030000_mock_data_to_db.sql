-- ============================================================
-- Migration: Mock data moved to DB
-- Tables: placement_history, admin_tasks, notice_rsvps
-- ============================================================

-- 1. placement_history
CREATE TABLE IF NOT EXISTS placement_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  year integer NOT NULL,
  dept_name text NOT NULL,
  company_name text NOT NULL,
  hires integer NOT NULL DEFAULT 0,
  avg_ctc decimal(6,2) NOT NULL DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_placement_history_year ON placement_history(year);
CREATE INDEX IF NOT EXISTS idx_placement_history_dept ON placement_history(dept_name);
CREATE INDEX IF NOT EXISTS idx_placement_history_company ON placement_history(company_name);

ALTER TABLE placement_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "placement_history_read_authenticated"
  ON placement_history FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "placement_history_write_admin_only"
  ON placement_history FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- 2. admin_tasks
CREATE TABLE IF NOT EXISTS admin_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_tasks_read_authenticated"
  ON admin_tasks FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_tasks_write_admin_only"
  ON admin_tasks FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- 3. notice_rsvps
CREATE TABLE IF NOT EXISTS notice_rsvps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id text,
  student_name text NOT NULL,
  roll_number text NOT NULL,
  branch text NOT NULL,
  status text NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Confirmed', 'Pending', 'Declined')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notice_rsvps_notice_id ON notice_rsvps(notice_id);

ALTER TABLE notice_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notice_rsvps_read_authenticated"
  ON notice_rsvps FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "notice_rsvps_write_admin_only"
  ON notice_rsvps FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- ============================================================
-- SEED: placement_history (current year mock data)
-- ============================================================
DO $$
DECLARE cur_year integer := EXTRACT(YEAR FROM NOW())::integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM placement_history LIMIT 1) THEN
    INSERT INTO placement_history (year, dept_name, company_name, hires, avg_ctc) VALUES
      (cur_year, 'CSE',   'TCS',        24,  7.2),
      (cur_year, 'CSE',   'Amazon',      8, 32.0),
      (cur_year, 'CSE',   'Google',      5, 24.5),
      (cur_year, 'CSE',   'Microsoft',   4, 18.2),
      (cur_year, 'CSE',   'Infosys',    14,  6.5),
      (cur_year, 'CSE',   'Wipro',       8,  6.0),
      (cur_year, 'CSE',   'Zomato',      6, 14.5),
      (cur_year, 'AI&DS', 'Google',      5, 24.5),
      (cur_year, 'AI&DS', 'Zomato',      9, 14.5),
      (cur_year, 'AI&DS', 'Amazon',      4, 32.0),
      (cur_year, 'AI&DS', 'Microsoft',   3, 18.2),
      (cur_year, 'AI&DS', 'TCS',        10,  7.2),
      (cur_year, 'AI&DS', 'Deloitte',    3, 10.5),
      (cur_year, 'AI&ML', 'Google',      4, 24.5),
      (cur_year, 'AI&ML', 'Microsoft',   4, 18.2),
      (cur_year, 'AI&ML', 'Amazon',      3, 32.0),
      (cur_year, 'AI&ML', 'TCS',        12,  7.2),
      (cur_year, 'AI&ML', 'Infosys',     8,  6.5),
      (cur_year, 'AI&ML', 'Zomato',      5, 14.5),
      (cur_year, 'IT',    'TCS',        20,  7.2),
      (cur_year, 'IT',    'Infosys',    15,  6.5),
      (cur_year, 'IT',    'Wipro',      10,  6.0),
      (cur_year, 'IT',    'Amazon',      5, 32.0),
      (cur_year, 'IT',    'Google',      3, 24.5),
      (cur_year, 'IT',    'Zomato',      4, 14.5),
      (cur_year, 'ECE',   'TCS',        18,  7.2),
      (cur_year, 'ECE',   'Infosys',    12,  6.5),
      (cur_year, 'ECE',   'Wipro',       8,  6.0),
      (cur_year, 'ECE',   'Amazon',      3, 32.0),
      (cur_year, 'ECE',   'Deloitte',    2, 10.5),
      (cur_year, 'EEE',   'TCS',        16,  7.2),
      (cur_year, 'EEE',   'Wipro',      10,  6.0),
      (cur_year, 'EEE',   'Infosys',     8,  6.5),
      (cur_year, 'EEE',   'Deloitte',    2, 10.5),
      (cur_year, 'MECH',  'TCS',        10,  7.2),
      (cur_year, 'MECH',  'Wipro',       8,  6.0),
      (cur_year, 'MECH',  'Infosys',     7,  6.5),
      (cur_year, 'MECH',  'Deloitte',    2,  9.0),
      (cur_year, 'CYS',   'Deloitte',    6, 10.5),
      (cur_year, 'CYS',   'Microsoft',   3, 18.2),
      (cur_year, 'CYS',   'TCS',        14,  7.2),
      (cur_year, 'CYS',   'Google',      2, 24.5),
      (cur_year, 'CYS',   'Amazon',      2, 32.0),
      (cur_year, 'CSBS',  'TCS',        14,  7.2),
      (cur_year, 'CSBS',  'Zomato',      8, 14.5),
      (cur_year, 'CSBS',  'Deloitte',    5, 10.5),
      (cur_year, 'CSBS',  'Infosys',     6,  6.5),
      (cur_year, 'CSBS',  'Amazon',      3, 32.0),
      (cur_year, 'CCE',   'TCS',        12,  7.2),
      (cur_year, 'CCE',   'Infosys',    10,  6.5),
      (cur_year, 'CCE',   'Wipro',       7,  6.0),
      (cur_year, 'CCE',   'Zomato',      4, 14.5),
      (cur_year, 'CCE',   'Amazon',      2, 32.0);
  END IF;
END $$;

-- ============================================================
-- SEED: admin_tasks
-- ============================================================
INSERT INTO admin_tasks (title, count)
SELECT * FROM (VALUES
  ('Verify student data',           12),
  ('Approve pending registrations', 45),
  ('Update interview results',       8)
) AS t(title, count)
WHERE NOT EXISTS (SELECT 1 FROM admin_tasks LIMIT 1);

-- ============================================================
-- SEED: notice_rsvps (demo entries; notice_id='__demo__')
-- ============================================================
INSERT INTO notice_rsvps (notice_id, student_name, roll_number, branch, status)
SELECT * FROM (VALUES
  ('__demo__', 'Arun Kumar',     '21CS001', 'CSE',   'Confirmed'),
  ('__demo__', 'Priya Sharma',   '21CS042', 'CSE',   'Confirmed'),
  ('__demo__', 'Rohit Verma',    '21EC015', 'ECE',   'Confirmed'),
  ('__demo__', 'Sneha Patel',    '21CS078', 'CSE',   'Pending'),
  ('__demo__', 'Kiran Raj',      '21ME023', 'MECH',  'Pending'),
  ('__demo__', 'Anjali Nair',    '21CS056', 'AI&DS', 'Declined'),
  ('__demo__', 'Vikram Singh',   '21EC031', 'ECE',   'Confirmed'),
  ('__demo__', 'Deepa Krishnan', '21CS089', 'CSE',   'Confirmed')
) AS t(notice_id, student_name, roll_number, branch, status)
WHERE NOT EXISTS (SELECT 1 FROM notice_rsvps LIMIT 1);
