import { supabase } from '@/lib/supabase';

export async function bulkCreateStudents(studentsData: any[]) {
  const results = [];
  for (const student of studentsData) {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          name: student.name,
          email: student.email,
          role: 'student',
          status: 'active'
        }])
        .select()
        .single();

      if (userError) throw userError;

      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .insert([{
          user_id: userData.id,
          register_number: student.register_number || student.regNo,
          roll_number: student.roll_number || student.rollNo || null,
          gender: student.gender || null,
          date_of_birth: student.date_of_birth || student.dob || null,
          department: student.department || student.dept,
          year: parseInt(student.year),
          placement_status: 'unplaced',
          profile_completion: 0,
          verification_status: 'pending'
        }])
        .select()
        .single();

      if (studentError) throw studentError;

      // Create academics row if any academic data is present
      const hasAcademics = student.cgpa || student.tenth_score || student.twelfth_score ||
        student.diploma_score || student.active_arrears !== undefined || student.backlog_count;
      
      if (hasAcademics) {
        const semObj = student.semester_cgpa || {};
        const semVals = Object.values(semObj).map(Number).filter((v: number) => !isNaN(v) && v > 0);
        const aggregateCgpa = semVals.length > 0
          ? parseFloat((semVals.reduce((a: number, b: number) => a + b, 0) / semVals.length).toFixed(2))
          : student.cgpa ? parseFloat(student.cgpa) : null;

        const historyRaw = String(student.history_of_arrears || '').toLowerCase();
        const historyVal = ['true','1','yes'].includes(historyRaw) ? true : false;

        await supabase.from('student_academics').upsert([{
          student_id: studentRecord.id,
          cgpa: aggregateCgpa,
          tenth_score: student.tenth_score ? parseFloat(student.tenth_score) : null,
          twelfth_score: student.twelfth_score ? parseFloat(student.twelfth_score) : null,
          diploma_score: student.diploma_score ? parseFloat(student.diploma_score) : null,
          backlog_count: student.backlog_count ? parseInt(student.backlog_count) : 0,
          active_arrears: student.active_arrears ? parseInt(student.active_arrears) : 0,
          history_of_arrears: historyVal,
          semester_cgpa: semObj,
          updated_at: new Date().toISOString()
        }], { onConflict: 'student_id' });
      }

      results.push(studentRecord);
    } catch (err) {
      console.error(`Error creating student ${student.email}:`, err);
    }
  }
  return results;
}

export async function bulkUploadResults(resultsData: any[]) {
  const results = [];
  for (const res of resultsData) {
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('register_number', res.regNo)
        .single();

      if (studentError || !student) {
        console.error(`Student not found for regNo: ${res.regNo}`);
        continue;
      }

      const { data: academic, error: academicError } = await supabase
        .from('student_academics')
        .upsert([{
          student_id: student.id,
          cgpa: parseFloat(res.cgpa),
          tenth_score: parseFloat(res.tenth_score || 0),
          twelfth_score: parseFloat(res.twelfth_score || 0),
          backlog_count: parseInt(res.backlog_count || 0),
          updated_at: new Date().toISOString()
        }], { onConflict: 'student_id' })
        .select()
        .single();

      if (academicError) throw academicError;
      results.push(academic);
    } catch (err) {
      console.error(`Error uploading results for ${res.regNo}:`, err);
    }
  }
  return results;
}
