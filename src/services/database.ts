import { supabase } from '@/lib/supabase';

// --- Helpers ---
export function formatRelativeTime(dateString: string) {
  if (!dateString) return 'N/A';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

// --- Students ---
export async function getStudents(options: { 
  page?: number; 
  pageSize?: number; 
  dept?: string; 
  status?: string;
} = {}) {
  const { page = 1, pageSize = 10, dept = "All Departments", status = "All Statuses" } = options;
  
  let query = supabase
    .from('students')
    .select(`
      id,
      register_number,
      department,
      year,
      placement_status,
      profile_completion,
      verification_status,
      users (name),
      student_academics (cgpa),
      offers (
        company:companies (name)
      )
    `, { count: 'exact' });

  if (dept !== "All Departments") {
    query = query.eq('department', dept);
  }

  if (status !== "All Statuses") {
    const statusMap: Record<string, string> = {
      'Placed': 'placed',
      'Applied': 'applied',
      'Unplaced': 'unplaced',
      'In-Process': 'applied'
    };
    const dbStatus = statusMap[status];
    if (dbStatus) {
      query = query.eq('placement_status', dbStatus);
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const formatted = (data || []).map(s => ({
    id: s.id,
    name: (s.users as any)?.name || (s.users as any)?.[0]?.name || 'Unknown',
    regNo: s.register_number,
    dept: s.department,
    year: `${s.year}${s.year === 1 ? 'st' : s.year === 2 ? 'nd' : s.year === 3 ? 'rd' : 'th'} Year`,
    cgpa: (s.student_academics as any)?.[0]?.cgpa || 0,
    status: s.placement_status === 'placed' ? 'Placed' : 
            s.placement_status === 'applied' ? 'Applied' : 'Unplaced',
    completeness: s.profile_completion || 0,
    verification: s.verification_status === 'verified' ? 'Verified' : 
                  s.verification_status === 'pending' ? 'Pending' : 'Rejected',
    company: (s.offers as any)?.[0]?.company?.name || (s.offers as any)?.[0]?.company?.[0]?.name || 'N/A',
    eligible: true
  }));

  return { data: formatted, total: count || 0 };
}

export async function createStudent(studentData: any) {
  // 1. Create User
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([{
      name: studentData.name,
      email: studentData.email,
      role: 'student',
      status: 'active'
    }])
    .select()
    .single();

  if (userError) throw userError;

  // 2. Create Student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert([{
      user_id: userData.id,
      register_number: studentData.regNo,
      department: studentData.dept,
      year: parseInt(studentData.year),
      placement_status: 'unplaced',
      profile_completion: 0,
      verification_status: 'pending'
    }])
    .select()
    .single();

  if (studentError) throw studentError;

  return student;
}

// --- Offers & Approvals ---
export async function getPendingApprovals() {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      id,
      verification_status,
      role_title,
      created_at,
      companies (name),
      students (
        department,
        users (name)
      )
    `)
    .eq('verification_status', 'pending')
    .limit(4);

  if (error) throw error;

  return data.map(o => ({
    id: o.id,
    type: 'Offer Letter',
    target: `${(o.students as any)?.users?.name || (o.students as any)?.[0]?.users?.[0]?.name || 'Unknown'} (${(o.students as any)?.department || (o.students as any)?.[0]?.department || 'N/A'})`,
    company: (o.companies as any)?.name || (o.companies as any)?.[0]?.name || 'N/A',
    time: formatRelativeTime(o.created_at),
    status: 'pending'
  }));
}

export async function getOffers() {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      students (
        register_number,
        users (
          name
        )
      ),
      companies (
        name
      ),
      job_drives (
        title
      )
    `);
  if (error) throw error;
  return data;
}

// --- Dashboard & Analytics ---
export async function getDashboardStats() {
  const [students, companies, drives, offers] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('job_drives').select('*', { count: 'exact', head: true }),
    supabase.from('offers').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalStudents: students.count || 0,
    totalCompanies: companies.count || 0,
    totalDrives: drives.count || 0,
    totalOffers: offers.count || 0,
  };
}

export async function getApplicationStats() {
  const [pending, shortlisted, interviewing, offered] = await Promise.all([
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'applied'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'shortlisted'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'interviewing'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'offered')
  ]);

  return {
    pending: pending.count || 0,
    shortlisted: shortlisted.count || 0,
    interviews: interviewing.count || 0,
    offers: offered.count || 0
  };
}

export async function getRecentActivity() {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    // Audit logs might not exist or be empty
    return [];
  }

  return data.map(a => ({
    id: a.id,
    title: a.action,
    time: formatRelativeTime(a.created_at),
    type: a.entity_type
  }));
}

// --- Job Drives & Applications ---
export async function getDrives() {
  const { data, error } = await supabase
    .from('job_drives')
    .select(`
      *,
      companies (
        name
      )
    `);
  if (error) throw error;
  return data;
}

export async function getApplications(options: { driveId?: string } = {}) {
  let query = supabase
    .from('applications')
    .select(`
      *,
      students (
        register_number,
        users (
          name
        )
      ),
      job_drives (
        role_title,
        companies (
          name
        )
      )
    `);
  
  if (options.driveId && options.driveId !== "All Drives") {
    query = query.eq('drive_id', options.driveId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getReportStats() {
  const [students, placed, offers] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('placement_status', 'placed'),
    supabase.from('offers').select('package_ctc')
  ]);

  const totalStudents = students.count || 0;
  const placedStudents = placed.count || 0;
  const placementRate = totalStudents ? (placedStudents / totalStudents) * 100 : 0;

  const avgCTC = (offers.data || []).reduce((acc, o) => {
    const val = parseFloat(o.package_ctc.replace(/[^0-9.]/g, ''));
    return acc + (isNaN(val) ? 0 : val);
  }, 0) / (offers.data?.length || 1);

  return {
    placementRate: placementRate.toFixed(1) + '%',
    avgCTC: avgCTC.toFixed(1) + ' LPA',
    totalOffers: offers.data?.length || 0,
    atRisk: 0
  };
}

// --- Student Portal Methods ---
export async function getStudentDashboardStats(studentId: string) {
  const [apps, offers, interviews, tasks] = await Promise.all([
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', studentId),
    supabase.from('offers').select('*', { count: 'exact', head: true }).eq('student_id', studentId),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('student_id', studentId).not('current_stage', 'eq', 'applied'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('student_id', studentId).eq('status', 'pending')
  ]);

  return {
    applicationsCount: apps.count || 0,
    offersCount: offers.count || 0,
    interviewsCount: interviews.count || 0,
    pendingTasks: tasks.count || 0
  };
}

export async function getTasks(studentId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('student_id', studentId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getStudentProfile(studentId: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      users (name, email, avatar_url)
    `)
    .eq('id', studentId)
    .single();
  if (error) throw error;
  return data;
}

export async function getStudentActivity(studentId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job_drives (
        role_title,
        companies (name)
      )
    `)
    .eq('student_id', studentId)
    .order('applied_at', { ascending: false })
    .limit(3);
  if (error) throw error;
  return data;
}

export async function getNotices() {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('status', 'published')
    .order('publish_at', { ascending: false })
    .limit(3);
  if (error) throw error;
  return data;
}

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'scheduled')
    .order('event_date', { ascending: true })
    .limit(3);
  if (error) throw error;
  return data;
}

export async function toggleTaskStatus(taskId: string, currentStatus: string) {
  const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function bulkCreateStudents(studentsData: any[]) {
  const results = [];
  for (const student of studentsData) {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          name: student.name,
          email: student.email,
          role: 'student',
          status: 'active'
        }])
        .select()
        .single();

      if (userError) throw userError;

      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .insert([{
          user_id: userData.id,
          register_number: student.regNo,
          department: student.dept,
          year: parseInt(student.year),
          placement_status: 'unplaced',
          profile_completion: 0,
          verification_status: 'pending'
        }])
        .select()
        .single();

      if (studentError) throw studentError;
      results.push(studentRecord);
    } catch (err) {
      console.error(`Error creating student ${student.email}:`, err);
    }
  }
  return results;
}

export async function bulkUploadResults(resultsData: any[]) {
  const results = [];
  for (const res of resultsData) {
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('register_number', res.regNo)
        .single();

      if (studentError || !student) {
        console.error(`Student not found for regNo: ${res.regNo}`);
        continue;
      }

      const { data: academic, error: academicError } = await supabase
        .from('student_academics')
        .upsert([{
          student_id: student.id,
          cgpa: parseFloat(res.cgpa),
          tenth_score: parseFloat(res.tenth_score || 0),
          twelfth_score: parseFloat(res.twelfth_score || 0),
          backlog_count: parseInt(res.backlog_count || 0),
          updated_at: new Date().toISOString()
        }], { onConflict: 'student_id' })
        .select()
        .single();

      if (academicError) throw academicError;
      results.push(academic);
    } catch (err) {
      console.error(`Error uploading results for ${res.regNo}:`, err);
    }
  }
  return results;
}

// Backward compatibility export
export const db = {
  getStudents,
  createStudent,
  getPendingApprovals,
  getOffers,
  getDashboardStats,
  getApplicationStats,
  getRecentActivity,
  getDrives,
  getApplications,
  getReportStats,
  getStudentDashboardStats,
  getTasks,
  getStudentProfile,
  getStudentActivity,
  getNotices,
  getEvents,
  formatRelativeTime,
  toggleTaskStatus,
  bulkCreateStudents,
  bulkUploadResults
};

