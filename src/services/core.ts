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

export async function getTableData(tableName: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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

