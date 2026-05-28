import { supabase } from '@/lib/supabase';
import { getSystemSettings } from '@/services/settings';
import { getYearFromBatch, getBatchRangeFromYear, formatYearOfStudy } from '@/lib/batch-utils';

export async function getStudents(options: { 
  page?: number; 
  pageSize?: number; 
  dept?: string; 
  status?: string;
  minCgpa?: number;
  maxCgpa?: number;
  minLeetcode?: number;
  specialization?: string;
} = {}) {
  const { 
    page = 1, 
    pageSize = 10, 
    dept = "All Departments", 
    status = "All Statuses",
    minCgpa,
    maxCgpa,
    minLeetcode,
    specialization
  } = options;
  
  // Base query with necessary joins for filtering
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
      student_profiles (leetcode_count, specializations),
      offers (
        package_ctc,
        company:companies (name)
      )
    `, { count: 'exact' });

  // Apply filters
  if (dept !== "All Departments") {
    query = query.eq('department', dept);
  }

  if (status !== "All Statuses") {
    const statusMap: Record<string, string> = {
      'Placed': 'placed',
      'Applied': 'applied',
      'Unplaced': 'not_placed',
      'In-Process': 'applied'
    };
    const dbStatus = statusMap[status];
    if (dbStatus) {
      query = query.eq('placement_status', dbStatus);
    }
  }

  if (minCgpa !== undefined && minCgpa > 0) {
    query = query.gte('student_academics.cgpa', minCgpa);
  }
  if (maxCgpa !== undefined && maxCgpa < 10) {
    query = query.lte('student_academics.cgpa', maxCgpa);
  }

  if (minLeetcode !== undefined && minLeetcode > 0) {
    query = query.gte('student_profiles.leetcode_count', minLeetcode);
  }

  if (specialization && specialization !== "All Domains") {
    query = query.contains('student_profiles.specializations', [specialization]);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .range(from, to)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const settings = await getSystemSettings();
  const isCompleted = settings.isAcademicYearCompleted;

  const formatted = (data || []).map(s => {
    const yearNum = getYearFromBatch(s.year, isCompleted);
    const range = getBatchRangeFromYear(s.year);
    return {
      id: s.id,
      name: (s.users as any)?.name || (s.users as any)?.[0]?.name || 'Unknown',
      regNo: s.register_number,
      dept: s.department,
      year: `${range.startYear}-${range.endYear} (${formatYearOfStudy(yearNum)})`,
      cgpa: (s.student_academics as any)?.[0]?.cgpa || (s.student_academics as any)?.cgpa || 0,
      leetcode: (s.student_profiles as any)?.[0]?.leetcode_count || (s.student_profiles as any)?.leetcode_count || 0,
      specializations: (s.student_profiles as any)?.[0]?.specializations || (s.student_profiles as any)?.specializations || [],
      status: s.placement_status === 'placed' ? 'Placed' : 
              s.placement_status === 'applied' ? 'Applied' : 'Unplaced',
      completeness: s.profile_completion || 0,
      verification: s.verification_status === 'verified' ? 'Verified' : 
                    s.verification_status === 'pending' ? 'Pending' : 'Rejected',
      company: (s.offers as any)?.[0]?.company?.name || (s.offers as any)?.[0]?.company?.[0]?.name || 'N/A',
      package_ctc: (s.offers as any)?.[0]?.package_ctc || '',
      eligible: true
    };
  });

  return { data: formatted, total: count || 0 };
}

export async function getAllStudents() {
  const allData: any[] = [];
  let pageNum = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = pageNum * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        register_number,
        roll_number,
        gender,
        date_of_birth,
        department,
        year,
        placement_status,
        profile_completion,
        verification_status,
        users (name, email, phone),
        student_academics (cgpa, tenth_score, twelfth_score, diploma_score, backlog_count, active_arrears, history_of_arrears, semester_cgpa),
        student_profiles (leetcode_count, specializations),
        offers (
          package_ctc,
          company:companies (name)
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        pageNum++;
      }
    }
  }

  const settings = await getSystemSettings();
  const isCompleted = settings.isAcademicYearCompleted;

  return allData.map(s => {
    const acad = (s.student_academics as any)?.[0] || (s.student_academics as any) || {};
    const yearNum = getYearFromBatch(s.year, isCompleted);
    const range = getBatchRangeFromYear(s.year);
    return {
      id: s.id,
      name: (s.users as any)?.name || (s.users as any)?.[0]?.name || 'Unknown',
      email: (s.users as any)?.email || (s.users as any)?.[0]?.email || 'N/A',
      regNo: s.register_number,
      rollNo: s.roll_number,
      gender: s.gender,
      dob: s.date_of_birth,
      dept: s.department,
      year: `${range.startYear}-${range.endYear} (${formatYearOfStudy(yearNum)})`,
      cgpa: acad.cgpa || 0,
      tenth_score: acad.tenth_score || 0,
      twelfth_score: acad.twelfth_score || 0,
      diploma_score: acad.diploma_score || null,
      backlog_count: acad.backlog_count || 0,
      active_arrears: acad.active_arrears || 0,
      history_of_arrears: acad.history_of_arrears || false,
      semester_cgpa: acad.semester_cgpa || {},
      leetcode: (s.student_profiles as any)?.[0]?.leetcode_count || (s.student_profiles as any)?.leetcode_count || 0,
      specializations: (s.student_profiles as any)?.[0]?.specializations || (s.student_profiles as any)?.specializations || [],
      status: s.placement_status === 'placed' ? 'Placed' : 
              s.placement_status === 'applied' ? 'Applied' : 'Unplaced',
      completeness: s.profile_completion || 0,
      verification: s.verification_status === 'verified' ? 'Verified' : 
                    s.verification_status === 'pending' ? 'Pending' : 'Rejected',
      company: (s.offers as any)?.[0]?.company?.name || (s.offers as any)?.[0]?.company?.[0]?.name || 'N/A',
      package_ctc: (s.offers as any)?.[0]?.package_ctc || ''
    };
  });
}

export async function getStudentProfile(studentId: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      users (id, name, email, phone, avatar_url),
      student_academics (*),
      student_profiles (*),
      student_contacts (*),
      student_preferences (*)
    `)
    .eq('id', studentId)
    .single();
  if (error) throw error;
  return data;
}

export async function getFilteredStudentCount(filters: {
  minCgpa?: number;
  maxCgpa?: number;
  minLeetcode?: number;
  specialization?: string;
  dept?: string;
}) {
  let query = supabase
    .from('students')
    .select('id, student_academics(cgpa), student_profiles(leetcode_count, specializations)', { count: 'exact', head: true });

  if (filters.dept && filters.dept !== "All Departments") {
    query = query.eq('department', filters.dept);
  }
  if (filters.minCgpa !== undefined && filters.minCgpa > 0) {
    query = query.gte('student_academics.cgpa', filters.minCgpa);
  }
  if (filters.maxCgpa !== undefined && filters.maxCgpa < 10) {
    query = query.lte('student_academics.cgpa', filters.maxCgpa);
  }
  if (filters.minLeetcode !== undefined && filters.minLeetcode > 0) {
    query = query.gte('student_profiles.leetcode_count', filters.minLeetcode);
  }
  if (filters.specialization && filters.specialization !== "All Domains") {
    query = query.contains('student_profiles.specializations', [filters.specialization]);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}
