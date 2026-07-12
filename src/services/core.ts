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

export async function upsertTableData(tableName: string, data: any[]) {
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
      query = query.ilike('year', `%${options.year}%`);
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
      query = query.ilike('year', `%${options.year}%`);
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

export async function updateTableCell(tableName: string, id: string, updatedFields: any) {
  const { error } = await supabase
    .from(tableName)
    .update(updatedFields)
    .eq('id', id);
  if (error) throw error;
  return { id, success: true };
}

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
        name,
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
    target: `${(o.students as any)?.name || (o.students as any)?.users?.name || (o.students as any)?.[0]?.name || (o.students as any)?.[0]?.users?.[0]?.name || 'Unknown'} (${(o.students as any)?.department || (o.students as any)?.[0]?.department || 'N/A'})`,
    company: (o.companies as any)?.name || (o.companies as any)?.[0]?.name || 'N/A',
    time: formatRelativeTime(o.created_at),
    status: 'pending'
  }));
}
