import 'server-only';
import { serverDb as supabase } from '@/lib/server-db';
import { formatRelativeTime } from './core';
import { enqueueJob } from './queue';

function formatTime12Hour(timeStr: string | null | undefined): string {
  if (!timeStr) return '10:00 AM';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

function parseTime12To24(time12: string | null | undefined): string | null {
  if (!time12) return null;
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

export interface NoticeInput {
  title: string;
  summary: string;
  audience?: string;
  priority?: 'Urgent' | 'Informational' | 'Reminder';
  status?: 'Published' | 'Scheduled' | 'Draft';
  date?: string;
  time?: string;
  pinned?: boolean;
}

export interface EventInput {
  title: string;
  description?: string | null;
  date: string;
  time?: string;
  venue?: string | null;
  status?: 'Upcoming' | 'Scheduled' | 'Completed' | 'Cancelled';
  type?: 'Webinar' | 'Offline' | 'Hybrid' | 'Online';
  maxAttendees?: number | null;
  audience?: string;
}

function dbRowToNotice(row: Record<string, unknown>) {
  const priorityMap: Record<string, string> = { high: 'Urgent', normal: 'Informational', low: 'Reminder' };
  const statusMap: Record<string, string> = { published: 'Published', scheduled: 'Scheduled', draft: 'Draft' };

  let date = '';
  let time = '10:00 AM';
  const src = (row.created_at || row.publish_at) as string | undefined;
  if (src) {
    const d = new Date(src);
    if (!isNaN(d.getTime())) {
      date = d.toISOString().split('T')[0];
      time = formatTime12Hour(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:00`);
    }
  }

  const dept = (row.target_department as string) || '';
  const audience = (row.audience as string) || (dept ? `Dept: ${dept}` : 'All Students');
  const summary = (row.content ?? row.body ?? row.summary ?? '') as string;
  const isPinned = Boolean(row.is_pinned ?? row.pinned ?? false);

  return {
    id: row.id as string,
    title: row.title as string,
    summary,
    content: summary,
    audience,
    target_department: row.target_department,
    target_year: row.target_year,
    category: dept || 'General',
    priority: (priorityMap[row.priority as string] ?? row.priority ?? 'Informational') as 'Urgent' | 'Informational' | 'Reminder',
    status: (statusMap[row.status as string] ?? row.status ?? 'Published') as 'Published' | 'Scheduled' | 'Draft',
    date,
    time,
    pinned: isPinned,
    is_pinned: isPinned,
    created_at: (row.created_at || new Date().toISOString()) as string,
    updated_at: (row.updated_at || new Date().toISOString()) as string,
  };
}

function noticeToDbRow(notice: NoticeInput, isNew: boolean) {
  let targetDept: string | null = null;
  if (notice.audience && notice.audience !== 'All Students') {
    targetDept = notice.audience.replace(/^Dept:\s*/i, '').trim();
  }

  const row: Record<string, unknown> = {
    title: notice.title,
    content: notice.summary || (notice as any).content || '',
    is_pinned: notice.pinned ?? (notice as any).is_pinned ?? false,
    target_department: targetDept || (notice as any).target_department || null,
    target_year: (notice as any).target_year ?? null,
    updated_at: new Date().toISOString(),
  };
  if (isNew) {
    row.created_at = new Date().toISOString();
  }
  return row;
}

function dbRowToEvent(row: Record<string, unknown>) {
  let date = '';
  let time = '10:00 AM';
  const startSrc = (row.start_at || row.event_date) as string | undefined;
  if (startSrc) {
    const d = new Date(startSrc);
    if (!isNaN(d.getTime())) {
      date = d.toISOString().split('T')[0];
      time = formatTime12Hour(`${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:00`);
    }
  }

  return {
    id: row.id as string,
    title: row.title as string,
    type: (row.event_type ?? row.type ?? 'Webinar') as 'Webinar' | 'Offline' | 'Hybrid' | 'Online',
    event_type: (row.event_type ?? row.type ?? 'Webinar') as string,
    date,
    event_date: startSrc || date,
    time,
    venue: (row.location ?? row.venue ?? '') as string,
    location: (row.location ?? row.venue ?? '') as string,
    status: 'Upcoming' as 'Upcoming' | 'Scheduled' | 'Completed' | 'Cancelled',
    description: (row.description ?? '') as string,
    maxAttendees: (row.max_attendees as number | undefined) ?? null,
    start_at: (row.start_at ?? startSrc) as string,
    end_at: row.end_at as string | null,
    created_at: (row.created_at || new Date().toISOString()) as string,
    updated_at: (row.updated_at || new Date().toISOString()) as string,
  };
}

function eventToDbRow(event: EventInput, isNew: boolean) {
  let startAt = new Date();
  if (event.date) {
    if (event.time) {
      const time24 = parseTime12To24(event.time.split(' - ')[0].trim()) || '10:00:00';
      startAt = new Date(`${event.date}T${time24}`);
    } else {
      startAt = new Date(event.date);
    }
  }

  const row: Record<string, unknown> = {
    title: event.title,
    description: event.description ?? null,
    event_type: event.type ?? (event as any).event_type ?? 'Webinar',
    location: event.venue ?? (event as any).location ?? null,
    start_at: startAt.toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (isNew) {
    row.created_at = new Date().toISOString();
  }
  return row;
}

export async function getNotices() {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map(dbRowToNotice);
}

export async function getNoticesAll() {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbRowToNotice);
}

export async function createNotice(notice: NoticeInput) {
  const { data, error } = await supabase
    .from('notices')
    .insert([noticeToDbRow(notice, true)])
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to create notice');

  // Enqueue background broadcast notification
  enqueueJob("SEND_BROADCAST_NOTICE", {
    noticeId: data.id,
    title: data.title,
    content: data.content,
    targetDepartment: data.target_department,
    targetYear: data.target_year,
  }).catch((err) => console.warn("[Queue] Notice broadcast enqueue warning:", err));

  return dbRowToNotice(data);
}

export async function updateNotice(id: string, notice: NoticeInput) {
  const { data, error } = await supabase
    .from('notices')
    .update(noticeToDbRow(notice, false))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to update notice');
  return dbRowToNotice(data);
}

export async function deleteNotice(id: string) {
  const { error } = await supabase
    .from('notices')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete notice');
  return true;
}

export async function toggleNoticePin(id: string, currentPinned: boolean) {
  const { data, error } = await supabase
    .from('notices')
    .update({ is_pinned: !currentPinned, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to toggle pin');
  return dbRowToNotice(data);
}

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(dbRowToEvent);
}

export async function getEventsAll() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(dbRowToEvent);
}

export async function createEvent(event: EventInput) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventToDbRow(event, true)])
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to create event');
  return dbRowToEvent(data);
}

export async function updateEvent(id: string, event: EventInput) {
  const { data, error } = await supabase
    .from('events')
    .update(eventToDbRow(event, false))
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to update event');
  return dbRowToEvent(data);
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete event');
  return true;
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

  return data.map(a => {
    let actionStr = 'Updated';
    if (a.action === 'INSERT') actionStr = 'Created';
    else if (a.action === 'DELETE') actionStr = 'Deleted';
    
    let entityStr = (a.entity_type || 'record').replace('_', ' ');
    entityStr = entityStr.charAt(0).toUpperCase() + entityStr.slice(1);

    return {
      id: a.id,
      title: `${actionStr} ${entityStr}`,
      time: formatRelativeTime(a.created_at),
      type: a.entity_type,
      created_at: a.created_at
    };
  });
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

