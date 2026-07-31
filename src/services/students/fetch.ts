import { supabase } from '@/lib/supabase';
import { getSystemSettings } from '@/services/settings';
import { getYearFromBatch, getBatchRangeFromYear, formatYearOfStudy, getBatchDetails } from '@/lib/batch-utils';

export async function getStudents(options: { 
  page?: number; 
  pageSize?: number; 
  dept?: string | string[]; 
  status?: string;
  minCgpa?: number;
  maxCgpa?: number;
  minLeetcode?: number;
  specialization?: string | string[];
  specializationMode?: 'any' | 'all';
  company?: string;
  interest?: string | string[];
  interestMode?: 'any' | 'all';
} = {}) {
  const { 
    page = 1, 
    pageSize = 10, 
    status = "All Statuses",
    minCgpa,
    maxCgpa,
    minLeetcode,
    company
  } = options;

  const depts = typeof options.dept === 'string' 
    ? (options.dept === "All Departments" ? [] : options.dept.split(',').map(d => d.trim()).filter(Boolean))
    : (options.dept || []);

  const specs = typeof options.specialization === 'string'
    ? (options.specialization === "All Domains" ? [] : options.specialization.split(',').map(s => s.trim()).filter(Boolean))
    : (options.specialization || []);

  const interests = typeof options.interest === 'string'
    ? (options.interest === "All Preferences" ? [] : options.interest.split(',').map(i => i.trim()).filter(Boolean))
    : (options.interest || []);

  const hasProfileFilter = (minLeetcode !== undefined && minLeetcode > 0) || (specs.length > 0);
  const hasInterestFilter = (interests.length > 0);
  
  // Base query with necessary joins for filtering
  let query = supabase
    .from('students')
    .select(`
      id,
      name,
      register_number,
      department,
      year,
      placement_status,
      profile_completion,
      verification_status,
      users (name),
      student_contacts (personal_email),
      student_academics (cgpa),
      student_profiles${hasProfileFilter ? '!inner' : ''} (leetcode_count, specializations),
      student_preferences${hasInterestFilter ? '!inner' : ''} (placement_interest),
      offers (
        package_ctc,
        company:companies (name)
      )
    `, { count: 'exact' });

  // Apply filters
  if (depts.length > 0) {
    query = query.in('department', depts);
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

  if (company && company !== "All Companies") {
    // 1. Get company ID
    const { data: cos } = await supabase.from('companies').select('id').ilike('name', company);
    const coIds = (cos || []).map(c => c.id);
    
    // 2. Get student IDs from offers table
    const { data: offs } = await supabase.from('offers').select('student_id').in('company_id', coIds);
    const studentIds = (offs || []).map(o => o.student_id);
    
    // Filter primary query by these student IDs
    query = query.in('id', studentIds);
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

  if (specs.length > 0) {
    const specMode = options.specializationMode || 'any';
    if (specMode === 'all') {
      query = query.contains('student_profiles.specializations', specs);
    } else {
      query = query.overlaps('student_profiles.specializations', specs);
    }
  }

  if (interests.length > 0) {
    const interestMode = options.interestMode || 'any';
    if (interestMode === 'all') {
      if (interests.length === 1) {
        query = query.eq('student_preferences.placement_interest', interests[0]);
      } else {
        query = query.eq('student_preferences.placement_interest', 'impossible_value_for_empty_results');
      }
    } else {
      query = query.in('student_preferences.placement_interest', interests);
    }
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
    const batchInfo = getBatchDetails(s.year, isCompleted);
    return {
      id: s.id,
      name: s.name || (s.users as any)?.name || (s.users as any)?.[0]?.name || 'Unknown',
      regNo: s.register_number,
      dept: s.department,
      year: batchInfo.formatLabel,
      batchYear: batchInfo.batchRange,
      graduationYear: batchInfo.graduationYear,
      yearOfStudy: batchInfo.yearOfStudy,
      yearOfStudyLabel: batchInfo.yearOfStudyLabel,
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
      personal_email: (s.student_contacts as any)?.[0]?.personal_email || (s.student_contacts as any)?.personal_email || '',
      eligible: true
    };
  });

  return { data: formatted, total: count || 0 };
}

let cachedStudentsPromise: Promise<any[]> | null = null;
let cachedLightweightPromise: Promise<any[]> | null = null;
let lastFetchTime = 0;
let lastLightweightFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds TTL

export function clearStudentsCache() {
  cachedStudentsPromise = null;
  cachedLightweightPromise = null;
  lastFetchTime = 0;
  lastLightweightFetchTime = 0;
}

export async function getAllStudents(options?: { lightweight?: boolean; limit?: number; offset?: number; search?: string; year?: string }) {
  const now = Date.now();
  const isLightweight = !!options?.lightweight;
  const hasLimit = options?.limit !== undefined;

  if (hasLimit) {
    try {
      const limitVal = options!.limit!;
      const from = options?.offset || 0;
      const to = from + limitVal - 1;
      
      let query;
      if (isLightweight) {
        query = supabase
          .from('students')
          .select(`
            id,
            name,
            register_number,
            roll_number,
            department,
            year,
            student_profiles (specializations),
            student_preferences (work_mode_preference)
          `);
      } else {
        query = supabase
          .from('students')
          .select(`
            id,
            name,
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
            student_contacts (personal_email),
            student_academics (cgpa, tenth_score, twelfth_score, diploma_score, backlog_count, active_arrears, history_of_arrears, semester_cgpa),
            student_profiles (leetcode_count, specializations),
            student_preferences (work_mode_preference),
            offers (
              package_ctc,
              company:companies (name)
            )
          `);
      }

      if (options?.year) {
        const yearNum = parseInt(options.year, 10);
        if (!isNaN(yearNum)) query = query.eq('year', yearNum);
      }
      if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,register_number.ilike.%${options.search}%,roll_number.ilike.%${options.search}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const settings = await getSystemSettings();
      const isCompleted = settings.isAcademicYearCompleted;

      return (data || []).map((s: any) => {
        if (isLightweight) {
          const yearNum = getYearFromBatch(s.year, isCompleted);
          const range = getBatchRangeFromYear(s.year);
          return {
            id: s.id,
            name: s.name || 'Unknown',
            regNo: s.register_number,
            rollNo: s.roll_number,
            dept: s.department,
            year: `${range.startYear}-${range.endYear} (${formatYearOfStudy(yearNum)})`,
            specializations: (s.student_profiles as any)?.[0]?.specializations || (s.student_profiles as any)?.specializations || [],
            placementGroup: (s.student_preferences as any)?.[0]?.work_mode_preference || (s.student_preferences as any)?.work_mode_preference || '',
            cgpa: 0,
            leetcode: 0,
            status: 'Unplaced',
            completeness: 0,
            verification: 'Verified',
            company: 'N/A',
            package_ctc: ''
          };
        } else {
          const acad = (s.student_academics as any)?.[0] || (s.student_academics as any) || {};
          const yearNum = getYearFromBatch(s.year, isCompleted);
          const range = getBatchRangeFromYear(s.year);
          return {
            id: s.id,
            name: s.name || (s.users as any)?.name || (s.users as any)?.[0]?.name || 'Unknown',
            email: (s.users as any)?.email || (s.users as any)?.[0]?.email || 'N/A',
            personal_email: (s.student_contacts as any)?.[0]?.personal_email || (s.student_contacts as any)?.personal_email || '',
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
            placementGroup: (s.student_preferences as any)?.[0]?.work_mode_preference || (s.student_preferences as any)?.work_mode_preference || '',
            status: s.placement_status === 'placed' ? 'Placed' : 
                    s.placement_status === 'applied' ? 'Applied' : 'Unplaced',
            completeness: s.profile_completion || 0,
            verification: s.verification_status === 'verified' ? 'Verified' : 
                          s.verification_status === 'pending' ? 'Pending' : 'Rejected',
            company: (s.offers as any)?.[0]?.company?.name || (s.offers as any)?.[0]?.company?.[0]?.name || 'N/A',
            package_ctc: (s.offers as any)?.[0]?.package_ctc || ''
          };
        }
      });
    } catch (e) {
      throw e;
    }
  }

  if (isLightweight) {
    if (!cachedLightweightPromise || (now - lastLightweightFetchTime > CACHE_TTL_MS)) {
      lastLightweightFetchTime = now;
      cachedLightweightPromise = (async () => {
        try {
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
                name,
                register_number,
                roll_number,
                department,
                year,
                student_profiles (specializations),
                student_preferences (work_mode_preference)
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
            const yearNum = getYearFromBatch(s.year, isCompleted);
            const range = getBatchRangeFromYear(s.year);
            return {
              id: s.id,
              name: s.name || 'Unknown',
              regNo: s.register_number,
              rollNo: s.roll_number,
              dept: s.department,
              year: `${range.startYear}-${range.endYear} (${formatYearOfStudy(yearNum)})`,
              specializations: (s.student_profiles as any)?.[0]?.specializations || (s.student_profiles as any)?.specializations || [],
              placementGroup: (s.student_preferences as any)?.[0]?.work_mode_preference || (s.student_preferences as any)?.work_mode_preference || '',
              cgpa: 0,
              leetcode: 0,
              status: 'Unplaced',
              completeness: 0,
              verification: 'Verified',
              company: 'N/A',
              package_ctc: ''
            };
          });
        } catch (e) {
          cachedLightweightPromise = null;
          throw e;
        }
      })();
    }
    return cachedLightweightPromise;
  }

  if (!cachedStudentsPromise || (now - lastFetchTime > CACHE_TTL_MS)) {
    lastFetchTime = now;
    cachedStudentsPromise = (async () => {
      try {
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
              name,
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
              student_contacts (personal_email),
              student_academics (cgpa, tenth_score, twelfth_score, diploma_score, backlog_count, active_arrears, history_of_arrears, semester_cgpa),
              student_profiles (leetcode_count, specializations),
              student_preferences (work_mode_preference),
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
            name: s.name || (s.users as any)?.name || (s.users as any)?.[0]?.name || 'Unknown',
            email: (s.users as any)?.email || (s.users as any)?.[0]?.email || 'N/A',
            personal_email: (s.student_contacts as any)?.[0]?.personal_email || (s.student_contacts as any)?.personal_email || '',
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
            placementGroup: (s.student_preferences as any)?.[0]?.work_mode_preference || (s.student_preferences as any)?.work_mode_preference || '',
            status: s.placement_status === 'placed' ? 'Placed' : 
                    s.placement_status === 'applied' ? 'Applied' : 'Unplaced',
            completeness: s.profile_completion || 0,
            verification: s.verification_status === 'verified' ? 'Verified' : 
                          s.verification_status === 'pending' ? 'Pending' : 'Rejected',
            company: (s.offers as any)?.[0]?.company?.name || (s.offers as any)?.[0]?.company?.[0]?.name || 'N/A',
            package_ctc: (s.offers as any)?.[0]?.package_ctc || ''
          };
        });
      } catch (e) {
        cachedStudentsPromise = null;
        throw e;
      }
    })();
  }
  return cachedStudentsPromise;
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
