import 'server-only';
import { serverDb as supabase } from '@/lib/server-db';

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

interface PendingApprovalRow {
  id: string;
  offer_status: string;
  acceptance_status: string;
  role_title: string;
  created_at: string;
  companies?: { name?: string | null } | { name?: string | null }[] | null;
  students?: {
    name?: string | null;
    department?: string | null;
    users?: { name?: string | null } | { name?: string | null }[] | null;
  } | {
    name?: string | null;
    department?: string | null;
    users?: { name?: string | null } | { name?: string | null }[] | null;
  }[] | null;
}

export async function getPendingApprovals() {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        id,
        offer_status,
        acceptance_status,
        role_title,
        created_at,
        companies (name),
        students (
          name,
          department,
          users (name)
        )
      `)
      .eq('acceptance_status', 'pending')
      .limit(4);

    if (error || !data) return [];

    const rows = data as unknown as PendingApprovalRow[];

    return rows.map(o => {
      const studentObj = Array.isArray(o.students) ? o.students[0] : o.students;
      const userObj = Array.isArray(studentObj?.users) ? studentObj?.users[0] : studentObj?.users;
      const studentName = studentObj?.name || userObj?.name || 'Unknown';
      const dept = studentObj?.department || 'N/A';
      const companyObj = Array.isArray(o.companies) ? o.companies[0] : o.companies;
      const companyName = companyObj?.name || 'N/A';

      return {
        id: o.id,
        type: 'Offer Letter',
        target: `${studentName} (${dept})`,
        company: companyName,
        time: formatRelativeTime(o.created_at),
        status: 'pending'
      };
    });
  } catch {
    return [];
  }
}

export async function getStudentProjects(studentId: string) {
  const { data, error } = await supabase
    .from('student_projects')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createStudentProject(payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('student_projects')
    .insert([payload])
    .select();
  if (error) throw error;
  return data?.[0] || payload;
}

export async function updateStudentProject(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('student_projects')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0] || payload;
}

export async function deleteStudentProject(id: string) {
  const { error } = await supabase
    .from('student_projects')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function getAdminTasks() {
  const { data, error } = await supabase
    .from('admin_tasks')
    .select('id, title, count')
    .eq('is_active', true)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function getNoticeRsvps(noticeId: string) {
  const { data, error } = await supabase
    .from('notice_rsvps')
    .select('id, student_name, roll_number, branch, status')
    .eq('notice_id', noticeId);
  if (error) throw error;
  if (data && data.length > 0) return data;
  
  const { data: demo } = await supabase
    .from('notice_rsvps')
    .select('id, student_name, roll_number, branch, status')
    .eq('notice_id', '__demo__');
  return demo || [];
}

export async function getLeaderboardData() {
  const [studentsRes, profilesRes, projectsRes, offersRes, appsRes] = await Promise.all([
    supabase.from('students').select('id, name, department, year'),
    supabase.from('student_profiles').select('student_id, leetcode_count'),
    supabase.from('student_projects').select('student_id'),
    supabase.from('offers').select('student_id, acceptance_status'),
    supabase.from('applications').select('student_id'),
  ]);

  return {
    students: studentsRes.data || [],
    profiles: profilesRes.data || [],
    projects: projectsRes.data || [],
    offers: offersRes.data || [],
    applications: appsRes.data || [],
  };
}

export async function logAudit(data: Record<string, unknown>) {
  const { error } = await supabase.from('audit_logs').insert(data);
  if (error) console.error('Failed to log audit:', error);
  return { success: true };
}

export async function getStudentDocuments(studentId: string) {
  const { data, error } = await supabase
    .from('student_documents')
    .select('*')
    .eq('student_id', studentId);
  if (error) throw error;
  return data || [];
}

export async function upsertStudentDocument(payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('student_documents')
    .upsert({ ...payload, updated_at: new Date().toISOString() })
    .select();
  if (error) throw error;
  return data?.[0] || payload;
}

export async function deleteStudentDocument(id: string) {
  const { error } = await supabase
    .from('student_documents')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function getAllStudentDocuments() {
  const { data, error } = await supabase
    .from('student_documents')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function updateStudentDocumentVerification(id: string, status: string) {
  const { data, error } = await supabase
    .from('student_documents')
    .update({ verification_status: status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data?.[0];
}

