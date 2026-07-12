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
      placement_status: 'not_placed',
      profile_completion: 0,
      verification_status: 'verified'
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

  // Batch insert contacts
  const contactsPayload = processedStudents.map(s => {
    const regNo = s.register_number || s.regNo;
    const studentId = studentMap.get(regNo);
    if (!studentId) return null;

    return {
      student_id: studentId,
      college_email: s.email || s.college_email || null,
      personal_email: s.personal_email || s.personalEmail || null,
      phone: s.phone || null,
      address: s.address || null,
      permanent_address: s.permanent_address || null,
      city: s.city || null,
      state: s.state || null,
      pincode: s.pincode || null,
      updated_at: new Date().toISOString()
    };
  }).filter(Boolean);

  if (contactsPayload.length > 0) {
    const { error: contactsError } = await supabase
      .from('student_contacts')
      .insert(contactsPayload);
    
    if (contactsError) throw contactsError;
  }

  // Batch insert profiles
  const profilesPayload = processedStudents.map(s => {
    const regNo = s.register_number || s.regNo;
    const studentId = studentMap.get(regNo);
    if (!studentId) return null;

    const hasProfile = s.linkedin_url || s.github_url || s.portfolio_url || s.resume_url;
    if (!hasProfile) return null;

    return {
      student_id: studentId,
      linkedin_url: s.linkedin_url || null,
      github_url: s.github_url || null,
      portfolio_url: s.portfolio_url || null,
      resume_url: s.resume_url || null,
      updated_at: new Date().toISOString()
    };
  }).filter(Boolean);

  if (profilesPayload.length > 0) {
    const { error: profilesError } = await supabase
      .from('student_profiles')
      .insert(profilesPayload);
    
    if (profilesError) throw profilesError;
  }

  // 3. Batch upsert academics
  const academicsPayload = processedStudents.map(s => {
    const regNo = s.register_number || s.regNo;
    const studentId = studentMap.get(regNo);
    if (!studentId) return null;

    const hasAcademics = s.cgpa || s.tenth_score || s.twelfth_score ||
      s.diploma_score || s.active_arrears !== undefined || s.backlog_count;

    if (!hasAcademics) return null;

    const semObj = s.semester_cgpa || {};
    const semVals = Object.values(semObj).map(Number).filter((v: number) => !isNaN(v) && v > 0);
    const aggregateCgpa = semVals.length > 0
      ? parseFloat((semVals.reduce((a: number, b: number) => a + b, 0) / semVals.length).toFixed(2))
      : s.cgpa ? parseFloat(s.cgpa) : null;

    const historyRaw = String(s.history_of_arrears || '').toLowerCase();
    const historyVal = ['true','1','yes'].includes(historyRaw) ? true : false;

    return {
      student_id: studentId,
      cgpa: aggregateCgpa,
      tenth_score: s.tenth_score ? parseFloat(s.tenth_score) : null,
      twelfth_score: s.twelfth_score ? parseFloat(s.twelfth_score) : null,
      diploma_score: s.diploma_score ? parseFloat(s.diploma_score) : null,
      backlog_count: s.backlog_count ? parseInt(s.backlog_count) : 0,
      active_arrears: s.active_arrears ? parseInt(s.active_arrears) : 0,
      history_of_arrears: historyVal,
      semester_cgpa: semObj,
      updated_at: new Date().toISOString()
    };
  }).filter(Boolean);

  if (academicsPayload.length > 0) {
    const { error: academicsError } = await supabase
      .from('student_academics')
      .upsert(academicsPayload, { onConflict: 'student_id' });
    
    if (academicsError) throw academicsError;
  }

  return createdStudents || [];
}

export async function bulkUploadResults(resultsData: any[]) {
  if (!resultsData || resultsData.length === 0) return [];

  const regNos = resultsData.map(r => r.regNo).filter(Boolean);
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

  const academicsPayload = resultsData.map(res => {
    const studentId = studentMap.get(res.regNo);
    if (!studentId) return null;

    return {
      student_id: studentId,
      cgpa: parseFloat(res.cgpa),
      tenth_score: parseFloat(res.tenth_score || 0),
      twelfth_score: parseFloat(res.twelfth_score || 0),
      backlog_count: parseInt(res.backlog_count || 0),
      updated_at: new Date().toISOString()
    };
  }).filter(Boolean);

  if (academicsPayload.length === 0) return [];

  const { data, error: academicError } = await supabase
    .from('student_academics')
    .upsert(academicsPayload, { onConflict: 'student_id' })
    .select();

  if (academicError) throw academicError;
  return data || [];
}
