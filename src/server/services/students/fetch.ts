import 'server-only';
import { serverDb as supabase } from '@/lib/server-db';
import { getSystemSettings } from '@/services/settings';
import { getYearFromBatch, getBatchRangeFromYear, formatYearOfStudy, getBatchDetails } from '@/lib/batch-utils';

interface RawStudentProfile {
  profile_completion?: number | null;
  verification_status?: string | null;
  leetcode_count?: number | null;
  specializations?: string[] | null;
  placement_interest?: string | null;
  work_mode_preference?: string | null;
}

interface RawOfferCompany {
  name?: string | null;
}

interface RawOffer {
  package_ctc?: string | number | null;
  company?: RawOfferCompany | RawOfferCompany[] | null;
}

interface RawUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
}

interface RawStudentRecord {
  id: string;
  name?: string | null;
  register_number: string;
  roll_number?: string | null;
  department: string;
  section?: string | null;
  year: number;
  gender?: string | null;
  date_of_birth?: string | null;
  placement_status?: string | null;
  cgpa?: number | null;
  tenth_score?: number | null;
  twelfth_score?: number | null;
  diploma_score?: number | null;
  active_arrears?: number | null;
  history_of_backlogs?: boolean | null;
  semester_cgpa?: Record<string, unknown> | null;
  personal_email?: string | null;
  users?: RawUser | RawUser[] | null;
  student_profiles?: RawStudentProfile | RawStudentProfile[] | null;
  offers?: RawOffer[] | null;
}

function getProfile(profiles: RawStudentProfile | RawStudentProfile[] | null | undefined): RawStudentProfile | undefined {
  if (Array.isArray(profiles)) return profiles[0];
  return profiles ?? undefined;
}

function getUser(users: RawUser | RawUser[] | null | undefined): RawUser | undefined {
  if (Array.isArray(users)) return users[0];
  return users ?? undefined;
}

function getOfferCompany(offers: RawOffer[] | null | undefined): { name: string; package_ctc: string } {
  if (!offers || offers.length === 0) return { name: 'N/A', package_ctc: '' };
  const firstOffer = offers[0];
  let compName = 'N/A';
  if (Array.isArray(firstOffer?.company)) {
    compName = firstOffer.company[0]?.name || 'N/A';
  } else if (firstOffer?.company?.name) {
    compName = firstOffer.company.name;
  }
  return {
    name: compName,
    package_ctc: firstOffer?.package_ctc ? String(firstOffer.package_ctc) : ''
  };
}

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
      section,
      year,
      placement_status,
      cgpa,
      personal_email,
      users (name),
      student_profiles${hasProfileFilter || hasInterestFilter ? '!inner' : ''} (profile_completion, verification_status, leetcode_count, specializations, placement_interest),
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
    query = query.gte('cgpa', minCgpa);
  }
  if (maxCgpa !== undefined && maxCgpa < 10) {
    query = query.lte('cgpa', maxCgpa);
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
        query = query.eq('student_profiles.placement_interest', interests[0]);
      } else {
        query = query.eq('student_profiles.placement_interest', 'impossible_value_for_empty_results');
      }
    } else {
      query = query.in('student_profiles.placement_interest', interests);
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

  const formatted = ((data as unknown as RawStudentRecord[]) || []).map(s => {
    const batchInfo = getBatchDetails(s.year, isCompleted);
    const prof = getProfile(s.student_profiles);
    const u = getUser(s.users);
    const offer = getOfferCompany(s.offers);
    return {
      id: s.id,
      name: s.name || u?.name || 'Unknown',
      regNo: s.register_number,
      dept: s.department,
      section: s.section || '',
      year: batchInfo.formatLabel,
      batchYear: batchInfo.batchRange,
      graduationYear: batchInfo.graduationYear,
      yearOfStudy: batchInfo.yearOfStudy,
      yearOfStudyLabel: batchInfo.yearOfStudyLabel,
      cgpa: s.cgpa || 0,
      leetcode: prof?.leetcode_count || 0,
      specializations: prof?.specializations || [],
      status: s.placement_status === 'placed' ? 'Placed' : 
              s.placement_status === 'applied' ? 'Applied' : 'Unplaced',
      completeness: prof?.profile_completion || 0,
      verification: prof?.verification_status === 'verified' ? 'Verified' : 
                    prof?.verification_status === 'pending' ? 'Pending' : 'Rejected',
      company: offer.name,
      package_ctc: offer.package_ctc,
      personal_email: s.personal_email || '',
      eligible: true
    };
  });

  return { data: formatted, total: count || 0 };
}

export function clearStudentsCache() {
  // Cache invalidation hook maintained for API compatibility
}

export async function getAllStudents(options?: { lightweight?: boolean; limit?: number; offset?: number; search?: string; year?: string }) {
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
            student_profiles (specializations, work_mode_preference)
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
            section,
            year,
            placement_status,
            personal_email,
            cgpa,
            tenth_score,
            twelfth_score,
            diploma_score,
            active_arrears,
            history_of_backlogs,
            semester_cgpa,
            users (name, email, phone),
            student_profiles (profile_completion, verification_status, leetcode_count, specializations, work_mode_preference),
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

      return ((data as unknown as RawStudentRecord[]) || []).map((s) => {
        const yearNum = getYearFromBatch(s.year, isCompleted);
        const range = getBatchRangeFromYear(s.year);
        const prof = getProfile(s.student_profiles);
        const u = getUser(s.users);
        const offer = getOfferCompany(s.offers);

        if (isLightweight) {
          return {
            id: s.id,
            name: s.name || 'Unknown',
            regNo: s.register_number,
            rollNo: s.roll_number,
            dept: s.department,
            year: `${range.startYear}-${range.endYear} (${formatYearOfStudy(yearNum)})`,
            specializations: prof?.specializations || [],
            placementGroup: prof?.work_mode_preference || '',
            cgpa: 0,
            leetcode: 0,
            status: 'Unplaced',
            completeness: 0,
            verification: 'Verified',
            company: 'N/A',
            package_ctc: ''
          };
        } else {
          return {
            id: s.id,
            name: s.name || u?.name || 'Unknown',
            email: u?.email || 'N/A',
            personal_email: s.personal_email || '',
            regNo: s.register_number,
            rollNo: s.roll_number,
            gender: s.gender,
            dob: s.date_of_birth,
            dept: s.department,
            section: s.section || '',
            year: `${range.startYear}-${range.endYear} (${formatYearOfStudy(yearNum)})`,
            cgpa: s.cgpa || 0,
            tenth_score: s.tenth_score || 0,
            twelfth_score: s.twelfth_score || 0,
            diploma_score: s.diploma_score || null,
            active_arrears: s.active_arrears || 0,
            history_of_backlogs: s.history_of_backlogs || false,
            semester_cgpa: s.semester_cgpa || {},
            leetcode: prof?.leetcode_count || 0,
            specializations: prof?.specializations || [],
            placementGroup: prof?.work_mode_preference || '',
            status: s.placement_status === 'placed' ? 'Placed' : 
                    s.placement_status === 'applied' ? 'Applied' : 'Unplaced',
            completeness: prof?.profile_completion || 0,
            verification: prof?.verification_status === 'verified' ? 'Verified' : 
                          prof?.verification_status === 'pending' ? 'Pending' : 'Rejected',
            company: offer.name,
            package_ctc: offer.package_ctc
          };
        }
      });
    } catch (e) {
      throw e;
    }
  }

  const from = options?.offset || 0;
  const fetchLimit = Math.min(options?.limit || 100, 500);
  const to = from + fetchLimit - 1;

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
        student_profiles (specializations, work_mode_preference)
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
        section,
        year,
        placement_status,
        personal_email,
        cgpa,
        tenth_score,
        twelfth_score,
        diploma_score,
        active_arrears,
        history_of_backlogs,
        semester_cgpa,
        users (name, email, phone),
        student_profiles (profile_completion, verification_status, leetcode_count, specializations, work_mode_preference),
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

  return ((data as unknown as RawStudentRecord[]) || []).map((s) => {
    const yearNum = getYearFromBatch(s.year, isCompleted);
    const range = getBatchRangeFromYear(s.year);
    const prof = getProfile(s.student_profiles);
    const u = getUser(s.users);
    const offer = getOfferCompany(s.offers);

    if (isLightweight) {
      return {
        id: s.id,
        name: s.name || 'Unknown',
        regNo: s.register_number,
        rollNo: s.roll_number,
        dept: s.department,
        year: `${range.startYear}-${range.endYear} (${formatYearOfStudy(yearNum)})`,
        specializations: prof?.specializations || [],
        placementGroup: prof?.work_mode_preference || '',
        cgpa: 0,
        leetcode: 0,
        status: 'Unplaced',
        completeness: 0,
        verification: 'Verified',
        company: 'N/A',
        package_ctc: ''
      };
    }

    return {
      id: s.id,
      name: s.name || u?.name || 'Unknown',
      email: u?.email || 'N/A',
      personal_email: s.personal_email || '',
      regNo: s.register_number,
      rollNo: s.roll_number,
      gender: s.gender,
      dob: s.date_of_birth,
      dept: s.department,
      section: s.section || '',
      year: `${range.startYear}-${range.endYear} (${formatYearOfStudy(yearNum)})`,
      cgpa: s.cgpa || 0,
      tenth_score: s.tenth_score || 0,
      twelfth_score: s.twelfth_score || 0,
      diploma_score: s.diploma_score || null,
      active_arrears: s.active_arrears || 0,
      history_of_backlogs: s.history_of_backlogs || false,
      semester_cgpa: s.semester_cgpa || {},
      leetcode: prof?.leetcode_count || 0,
      specializations: prof?.specializations || [],
      placementGroup: prof?.work_mode_preference || '',
      status: s.placement_status === 'placed' ? 'Placed' : 
              s.placement_status === 'applied' ? 'Applied' : 'Unplaced',
      completeness: prof?.profile_completion || 0,
      verification: prof?.verification_status === 'verified' ? 'Verified' : 
                    prof?.verification_status === 'pending' ? 'Pending' : 'Rejected',
      company: offer.name,
      package_ctc: offer.package_ctc
    };
  });
}

export async function getStudentProfile(studentId: string) {
  if (!studentId || !studentId.trim()) return null;
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      users (id, name, email, phone, avatar_url),
      student_profiles (*)
    `)
    .eq('id', studentId)
    .maybeSingle();
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
    .select('id, cgpa, student_profiles(leetcode_count, specializations)', { count: 'exact', head: true });

  if (filters.dept && filters.dept !== "All Departments") {
    query = query.eq('department', filters.dept);
  }
  if (filters.minCgpa !== undefined && filters.minCgpa > 0) {
    query = query.gte('cgpa', filters.minCgpa);
  }
  if (filters.maxCgpa !== undefined && filters.maxCgpa < 10) {
    query = query.lte('cgpa', filters.maxCgpa);
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
