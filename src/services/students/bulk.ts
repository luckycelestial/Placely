import { supabase } from '@/lib/supabase';
import { getSystemSettings } from '@/services/settings';

export async function bulkCreateStudents(studentsData: any[]) {
  if (!studentsData || studentsData.length === 0) return [];

  const settings = await getSystemSettings();
  const isCompleted = settings.isAcademicYearCompleted;
  const cy = new Date().getFullYear();
  const referenceYear = isCompleted ? cy + 1 : cy;

  // Clean and prepare student data, generating emails & names if missing
  const processedStudents = studentsData.map(s => {
    const regNo = String(s.register_number || s.regNo || '').trim();
    const email = s.email ? String(s.email).trim().toLowerCase() : (regNo ? `${regNo}@careerbridge.com`.toLowerCase() : '');
    const name = s.name ? String(s.name).trim() : `Student ${regNo}`;
    const department = s.department || s.dept || 'General';
    return {
      ...s,
      register_number: regNo,
      email,
      name,
      department
    };
  }).filter(s => s.register_number && s.email);

  if (processedStudents.length === 0) return [];

  // 1. Fetch existing users by email to avoid inserting duplicates
  const emails = processedStudents.map(s => s.email).filter(Boolean);
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id, email')
    .in('email', emails);
  
  const userMap = new Map<string, string>(); // email -> id
  (existingUsers || []).forEach(u => userMap.set(u.email.toLowerCase(), u.id));

  // Determine which students need user records created
  const studentsNeedUser = processedStudents.filter(s => s.email && !userMap.has(s.email.toLowerCase()));

  if (studentsNeedUser.length > 0) {
    const usersPayload = studentsNeedUser.map(s => ({
      name: s.name,
      email: s.email,
      role: 'student',
      status: 'active',
      phone: s.phone || null
    }));

    const { data: createdUsers, error: userError } = await supabase
      .from('users')
      .insert(usersPayload)
      .select();

    if (userError) throw userError;

    (createdUsers || []).forEach(u => userMap.set(u.email.toLowerCase(), u.id));
  }

  // 2. Batch insert students (for all processedStudents, using their mapped user_id)
  const studentsPayload = processedStudents.map(s => {
    const userId = userMap.get(s.email.toLowerCase());
    let dbYear = parseInt(s.year);
    if (!isNaN(dbYear) && dbYear >= 1 && dbYear <= 4) {
      dbYear = referenceYear + 4 - dbYear;
    }

    const semObj = s.semester_cgpa || {};
    const semVals = Object.values(semObj).map(Number).filter((v: number) => !isNaN(v) && v > 0);
    const aggregateCgpa = semVals.length > 0
      ? parseFloat((semVals.reduce((a: number, b: number) => a + b, 0) / semVals.length).toFixed(2))
      : s.cgpa ? parseFloat(s.cgpa) : null;

    const historyRaw = String(s.history_of_arrears || s.history_of_backlogs || s.historyOfBacklogs || '').toLowerCase();
    const historyVal = ['true', '1', 'yes'].includes(historyRaw) ? true : false;
    const activeArrears = s.active_arrears !== undefined ? parseInt(s.active_arrears) : (s.backlog_count ? parseInt(s.backlog_count) : 0);

    return {
      user_id: userId,
      name: s.name,
      register_number: s.register_number || s.regNo,
      roll_number: s.roll_number || s.rollNo || null,
      gender: s.gender || null,
      date_of_birth: s.date_of_birth || s.dob || null,
      department: s.department || s.dept,
      year: dbYear,
      section: s.section || null,
      placement_status: 'unplaced',
      college_email: s.email || s.college_email || null,
      personal_email: s.personal_email || s.personalEmail || null,
      phone: s.phone || null,
      address: s.address || null,
      permanent_address: s.permanent_address || null,
      city: s.city || null,
      state: s.state || null,
      pincode: s.pincode || null,
      cgpa: aggregateCgpa,
      tenth_score: s.tenth_score ? parseFloat(s.tenth_score) : null,
      twelfth_score: s.twelfth_score ? parseFloat(s.twelfth_score) : null,
      diploma_score: s.diploma_score ? parseFloat(s.diploma_score) : null,
      active_arrears: isNaN(activeArrears) ? 0 : activeArrears,
      history_of_backlogs: historyVal || (activeArrears > 0),
      semester_cgpa: semObj && Object.keys(semObj).length > 0 ? semObj : null
    };
  }).filter(s => s.user_id); // Ensure we have user_id mapped

  if (studentsPayload.length === 0) return [];

  const { data: createdStudents, error: studentError } = await supabase
    .from('students')
    .insert(studentsPayload)
    .select();

  if (studentError) throw studentError;

  // Create a lookup map of register_number -> student.id
  const studentMap = new Map<string, string>();
  (createdStudents || []).forEach(s => studentMap.set(s.register_number, s.id));

  // Batch insert profiles
  const profilesPayload = processedStudents.map(s => {
    const regNo = s.register_number || s.regNo;
    const studentId = studentMap.get(regNo);
    if (!studentId) return null;

    const hasProfile = s.linkedin_url || s.github_url || s.portfolio_url || s.resume_url || s.placement_interest || s.work_mode_preference;
    if (!hasProfile) return null;

    return {
      student_id: studentId,
      linkedin_url: s.linkedin_url || null,
      github_url: s.github_url || null,
      portfolio_url: s.portfolio_url || null,
      resume_url: s.resume_url || null,
      placement_interest: s.placement_interest || null,
      work_mode_preference: s.work_mode_preference || null,
      preferred_roles: s.preferred_roles || null,
      preferred_locations: s.preferred_locations || null,
      specializations: s.specializations || null,
      updated_at: new Date().toISOString()
    };
  }).filter(Boolean);

  if (profilesPayload.length > 0) {
    const { error: profilesError } = await supabase
      .from('student_profiles')
      .insert(profilesPayload);
    
    if (profilesError) console.error('Error inserting student profiles in bulkCreateStudents:', profilesError);
  }

  return createdStudents || [];
}

export async function bulkUploadResults(resultsData: any[]) {
  if (!resultsData || resultsData.length === 0) return [];

  const regNos = resultsData.map(r => r.regNo || r.register_number).filter(Boolean);
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, register_number')
    .in('register_number', regNos);

  if (studentError || !students) {
    console.error('Error fetching students for bulkUploadResults:', studentError);
    return [];
  }

  const studentMap = new Map<string, string>();
  students.forEach(s => studentMap.set(s.register_number, s.id));

  const updatePromises = resultsData.map(async (res) => {
    const regNo = res.regNo || res.register_number;
    const studentId = studentMap.get(regNo);
    if (!studentId) return null;

    const backlogs = parseInt(res.backlog_count ?? res.active_arrears ?? 0);
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (res.cgpa !== undefined && res.cgpa !== '') updateData.cgpa = parseFloat(res.cgpa);
    if (res.tenth_score !== undefined && res.tenth_score !== '') updateData.tenth_score = parseFloat(res.tenth_score);
    if (res.twelfth_score !== undefined && res.twelfth_score !== '') updateData.twelfth_score = parseFloat(res.twelfth_score);
    if (res.diploma_score !== undefined && res.diploma_score !== '') updateData.diploma_score = parseFloat(res.diploma_score);
    if (!isNaN(backlogs)) {
      updateData.active_arrears = backlogs;
      if (backlogs > 0) updateData.history_of_backlogs = true;
    }

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', studentId)
      .select();

    if (error) {
      console.error(`Error updating student ${regNo}:`, error);
      return null;
    }
    return data?.[0] || null;
  });

  const results = await Promise.all(updatePromises);
  return results.filter(Boolean);
}
