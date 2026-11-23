import { supabase } from '@/lib/supabase';

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

export async function upsertTableData(tableName: string, data: Record<string, unknown>[]) {
  const { data: result, error } = await supabase
    .from(tableName)
    .upsert(data);
  if (error) throw error;
  return result;
}

export async function getTableData(tableName: string, options?: { limit?: number; offset?: number; search?: string; year?: string }) {
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
