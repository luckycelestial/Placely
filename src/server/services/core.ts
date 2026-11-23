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

const ALLOWED_QUERY_TABLES = new Set([
  "students",
  "job_drives",
  "companies",
  "notices",
  "events",
  "applications",
  "offers",
  "student_profiles",
  "student_projects",
  "student_documents",
  "notice_rsvps",
  "audit_logs",
  "users",
]);

const ALLOWED_UPDATE_CELL_TABLES = new Set([
  "student_projects",
  "student_documents",
  "students",
]);

const FORBIDDEN_STUDENT_CELL_COLUMNS = new Set([
  "cgpa",
  "active_arrears",
  "history_of_backlogs",
  "placement_status",
  "verification_status",
  "user_id",
  "id",
]);

const ALLOWED_UPSERT_TABLES = new Set([
  "student_projects",
  "student_documents",
  "notice_rsvps",
]);

export async function upsertTableData(tableName: string, data: Record<string, unknown>[]) {
  if (!ALLOWED_UPSERT_TABLES.has(tableName)) {
    throw new Error(`Direct upsert to table '${tableName}' is forbidden.`);
  }

  const { data: result, error } = await supabase
    .from(tableName)
    .upsert(data);
  if (error) throw error;
  return result;
}

export async function getTableData(tableName: string, options?: { limit?: number; offset?: number; search?: string; year?: string }) {
  if (!ALLOWED_QUERY_TABLES.has(tableName)) {
    throw new Error(`Direct query to table '${tableName}' is forbidden.`);
  }

  let query = supabase
    .from(tableName)
    .select('*');

  if (tableName === "students") {
    if (options?.year) {
      const yearNum = parseInt(options.year, 10);
      if (!isNaN(yearNum)) query = query.eq('year', yearNum);
    }
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,register_number.ilike.%${options.search}%,roll_number.ilike.%${options.search}%`);
    }
  } else if (options?.search && tableName !== "settings") {
    if (tableName === "companies" || tableName === "job_drives" || tableName === "users") {
      query = query.ilike('name', `%${options.search}%`);
    }
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit !== undefined) {
    const from = options.offset || 0;
    const to = from + options.limit - 1;
    query = query.range(from, to);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTableCount(tableName: string, options?: { search?: string; year?: string }) {
  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (tableName === "students") {
    if (options?.year) {
      const yearNum = parseInt(options.year, 10);
      if (!isNaN(yearNum)) query = query.eq('year', yearNum);
    }
    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,register_number.ilike.%${options.search}%,roll_number.ilike.%${options.search}%`);
    }
  } else if (options?.search && tableName !== "settings") {
    if (tableName === "companies" || tableName === "job_drives" || tableName === "users") {
      query = query.ilike('name', `%${options.search}%`);
    }
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function updateTableCell(tableName: string, id: string, updatedFields: Record<string, unknown>) {
  if (!ALLOWED_UPDATE_CELL_TABLES.has(tableName)) {
    throw new Error(`Direct cell update on table '${tableName}' is forbidden.`);
  }

  // Prevent modifying critical security & academic columns via generic cell update
  if (tableName === "students") {
    for (const key of Object.keys(updatedFields)) {
      if (FORBIDDEN_STUDENT_CELL_COLUMNS.has(key)) {
        throw new Error(`Column '${key}' cannot be modified via updateTableCell.`);
      }
    }
  }

  const { error } = await supabase
    .from(tableName)
    .update(updatedFields)
    .eq('id', id);
  if (error) throw error;
  return { id, success: true };
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

export async function executeServerQuery(queryObj: {
  table: string;
  select?: string;
  filters?: Array<{ column: string; op: 'eq' | 'neq' | 'in' | 'ilike'; value: unknown }>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}) {
  if (!ALLOWED_QUERY_TABLES.has(queryObj.table)) {
    throw new Error(`Direct query to table '${queryObj.table}' is restricted.`);
  }

  let selectStr = queryObj.select || '*';

  // Sanitize user queries: Never expose password or internal metadata
  if (queryObj.table === "users") {
    if (selectStr === '*' || /password|secret|token|hash/i.test(selectStr)) {
      selectStr = 'id, name, email, role, avatar_url, phone, status, created_at';
    }
  }

  let query = supabase.from(queryObj.table).select(selectStr);
  if (queryObj.filters) {
    for (const f of queryObj.filters) {
      if (f.op === 'eq') query = query.eq(f.column, f.value as string);
      if (f.op === 'neq') query = query.neq(f.column, f.value as string);
      if (f.op === 'in') query = query.in(f.column, f.value as string[]);
      if (f.op === 'ilike') query = query.ilike(f.column, f.value as string);
    }
  }
  if (queryObj.order) {
    query = query.order(queryObj.order.column, { ascending: queryObj.order.ascending ?? true });
  }
  if (queryObj.limit) {
    query = query.limit(Math.min(queryObj.limit, 100));
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

