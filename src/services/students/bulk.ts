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
    const email = s.email ? String(s.email).trim() : (regNo ? `${regNo}@careerbridge.com`.toLowerCase() : '');
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

  // Deduplicate and filter out any existing users/emails first to prevent batch collision
  const emails = processedStudents.map(s => s.email).filter(Boolean);
  const { data: existingUsers } = await supabase
    .from('users')
    .select('email')
    .in('email', emails);
  
  const existingEmails = new Set((existingUsers || []).map(u => u.email));
  const newStudentsData = processedStudents.filter(s => s.email && !existingEmails.has(s.email));

  if (newStudentsData.length === 0) return [];

  // 1. Batch insert users
  const usersPayload = newStudentsData.map(s => ({
    name: s.name,
    email: s.email,
    role: 'student',
    status: 'active'
  }));

  const { data: createdUsers, error: userError } = await supabase
    .from('users')
    .insert(usersPayload)
    .select();

  if (userError) throw userError;

  // Create a lookup map of email -> user.id
  const userMap = new Map<string, string>();
  (createdUsers || []).forEach(u => userMap.set(u.email, u.id));

  // 2. Batch insert students
  const studentsPayload = newStudentsData.map(s => {
    const userId = userMap.get(s.email);
    let dbYear = parseInt(s.year);
    if (!isNaN(dbYear) && dbYear >= 1 && dbYear <= 4) {
      dbYear = referenceYear + 4 - dbYear;
    }

    return {
      user_id: userId,
      register_number: s.register_number || s.regNo,
      roll_number: s.roll_number || s.rollNo || null,
      gender: s.gender || null,
      date_of_birth: s.date_of_birth || s.dob || null,
      department: s.department || s.dept,
      year: dbYear,
      placement_status: 'unplaced',
      profile_completion: 0,
      verification_status: 'pending'
    };
  }).filter(s => s.user_id); // Ensure we have user_id mapped

  const { data: createdStudents, error: studentError } = await supabase
    .from('students')
    .insert(studentsPayload)
    .select();

  if (studentError) throw studentError;

  // Create a lookup map of register_number -> student.id
  const studentMap = new Map<string, string>();
  (createdStudents || []).forEach(s => studentMap.set(s.register_number, s.id));

  // 3. Batch upsert academics
  const academicsPayload = newStudentsData.map(s => {
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
