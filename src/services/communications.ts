import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from './core';

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

function dbRowToNotice(row: any) {
  const priorityMap: Record<string, string> = { high: 'Urgent', normal: 'Informational', low: 'Reminder' };
  const statusMap: Record<string, string> = { published: 'Published', scheduled: 'Scheduled', draft: 'Draft' };

  let date = '';
  let time = '10:00 AM';
  const src = row.publish_at || row.created_at;
  if (src) {
    const d = new Date(src);
    if (!isNaN(d.getTime())) {
      date = d.toISOString().split('T')[0];
      time = formatTime12Hour(`${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}:00`);
    }
  }

  return {
    id: row.id as string,
    title: row.title as string,
    summary: (row.body ?? '') as string,
    audience: (row.audience ?? 'All Students') as string,
    priority: (priorityMap[row.priority] ?? row.priority ?? 'Informational') as 'Urgent' | 'Informational' | 'Reminder',
    status: (statusMap[row.status] ?? row.status ?? 'Draft') as 'Published' | 'Scheduled' | 'Draft',
    date,
    time,
    pinned: (row.pinned ?? false) as boolean,
  };
}

function noticeToDbRow(notice: any, isNew: boolean) {
  const priorityMap: Record<string, string> = { Urgent: 'high', Informational: 'normal', Reminder: 'low' };
  const statusMap: Record<string, string> = { Published: 'published', Scheduled: 'scheduled', Draft: 'draft' };

  const time24 = parseTime12To24(notice.time);
  const publishAt = (notice.date && time24)
    ? new Date(`${notice.date}T${time24}`).toISOString()
    : null;

  const row: any = {
    title: notice.title,
    body: notice.summary,
    audience: notice.audience,
    priority: priorityMap[notice.priority] ?? 'normal',
    status: statusMap[notice.status] ?? 'draft',
    publish_at: publishAt,
    pinned: notice.pinned ?? false,
    updated_at: new Date().toISOString(),
  };
  if (isNew) {
    row.created_at = new Date().toISOString();
  }
  return row;
}

function dbRowToEvent(row: any) {
  const startFormatted = formatTime12Hour(row.start_time);
  const endFormatted = row.end_time ? formatTime12Hour(row.end_time) : '';
  const time = endFormatted ? `${startFormatted} - ${endFormatted}` : startFormatted;

  const statusMap: Record<string, string> = {
    upcoming: 'Upcoming', scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled',
  };

  return {
    id: row.id as string,
    title: row.title as string,
    type: (row.type ?? 'Webinar') as 'Webinar' | 'Offline' | 'Hybrid' | 'Online',
    date: (row.event_date ?? '') as string,
    time,
    venue: (row.venue ?? '') as string,
    status: (statusMap[row.status] ?? row.status ?? 'Upcoming') as 'Upcoming' | 'Scheduled' | 'Completed' | 'Cancelled',
    description: (row.description ?? '') as string,
    maxAttendees: row.max_attendees as number | undefined,
  };
}

function eventToDbRow(event: any, isNew: boolean) {
  const statusMap: Record<string, string> = {
    Upcoming: 'upcoming', Scheduled: 'scheduled', Completed: 'completed', Cancelled: 'cancelled',
  };

  let startTime: string | null = null;
  let endTime: string | null = null;
  if (event.time) {
    if (event.time.includes(' - ')) {
      const [s, e] = event.time.split(' - ');
      startTime = parseTime12To24(s.trim());
      endTime = parseTime12To24(e.trim());
    } else {
      startTime = parseTime12To24(event.time.trim());
    }
  }

  const row: any = {
    title: event.title,
    description: event.description ?? null,
    event_date: event.date,
    start_time: startTime,
    end_time: endTime,
    audience: event.audience ?? 'All Students',
    status: statusMap[event.status] ?? 'upcoming',
    type: event.type ?? 'Webinar',
    venue: event.venue ?? null,
    max_attendees: event.maxAttendees ?? null,
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
    .eq('status', 'published')
    .order('publish_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}

export async function getNoticesAll() {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('pinned', { ascending: false })
    .order('publish_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbRowToNotice);
}

export async function createNotice(notice: any) {
  const { data, error } = await supabase
    .from('notices')
    .insert([noticeToDbRow(notice, true)])
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to create notice');
  return dbRowToNotice(data);
}

export async function updateNotice(id: string, notice: any) {
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
    .update({ pinned: !currentPinned, updated_at: new Date().toISOString() })
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
    .eq('status', 'scheduled')
    .order('event_date', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getEventsAll() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(dbRowToEvent);
}

export async function createEvent(event: any) {
  const { data, error } = await supabase
    .from('events')
    .insert([eventToDbRow(event, true)])
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to create event');
  return dbRowToEvent(data);
}

export async function updateEvent(id: string, event: any) {
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

