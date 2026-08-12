import { supabase } from '@/lib/supabase';

export async function createStudent(studentData: any) {
  // 1. Create User
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([{
      name: studentData.name,
      email: studentData.email,
      role: 'student',
      status: 'active'
    }])
    .select()
    .single();

  if (userError) throw userError;

  // 2. Create Student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert([{
      user_id: userData.id,
      name: studentData.name,
      register_number: studentData.regNo,
      department: studentData.dept,
      year: parseInt(studentData.year),
      placement_status: 'unplaced',
      college_email: studentData.email || null,
      personal_email: studentData.personalEmail || studentData.personal_email || null,
    }])
    .select()
    .single();

  if (studentError) throw studentError;

  // 3. Create Student Profile
  const { error: profileError } = await supabase
    .from('student_profiles')
    .insert([{
      student_id: student.id,
      profile_completion: 0,
      verification_status: 'verified',
    }]);

  if (profileError) throw profileError;

  return student;
}

export async function syncStudentRow(studentId: string, updatedFields: any) {
  // 1. Fetch user_id of the student to update users table if name/email changed
  const { data: student, error: fetchError } = await supabase
    .from('students')
    .select('user_id')
    .eq('id', studentId)
    .single();
  
  if (fetchError) throw fetchError;

  // 2. Update users table
  const userUpdates: any = {};
  if ('name' in updatedFields) userUpdates.name = updatedFields.name;
  if ('email' in updatedFields) userUpdates.email = updatedFields.email;
  if (Object.keys(userUpdates).length > 0 && student?.user_id) {
    const { error: userError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', student.user_id);
    if (userError) throw userError;
  }

  // 3. Update students table
  const studentUpdates: any = {};
  if ('name' in updatedFields) studentUpdates.name = updatedFields.name;
  if ('regNo' in updatedFields || 'register_number' in updatedFields) {
    studentUpdates.register_number = updatedFields.regNo !== undefined ? updatedFields.regNo : updatedFields.register_number;
  }
  if ('rollNo' in updatedFields || 'roll_number' in updatedFields) {
    studentUpdates.roll_number = updatedFields.rollNo !== undefined ? updatedFields.rollNo : updatedFields.roll_number;
  }
  if ('gender' in updatedFields) studentUpdates.gender = updatedFields.gender;
  if ('dob' in updatedFields || 'date_of_birth' in updatedFields) {
    studentUpdates.date_of_birth = updatedFields.dob !== undefined ? updatedFields.dob : updatedFields.date_of_birth;
    if (studentUpdates.date_of_birth === '') studentUpdates.date_of_birth = null;
  }
  if ('dept' in updatedFields || 'department' in updatedFields) {
    studentUpdates.department = updatedFields.dept !== undefined ? updatedFields.dept : updatedFields.department;
  }
  if ('year' in updatedFields) studentUpdates.year = parseInt(updatedFields.year);
  if ('status' in updatedFields) {
    const statusMap: Record<string, string> = {
      'Placed': 'placed',
      'Unplaced': 'not_placed',
      'Applied': 'applied',
      'In-Process': 'applied',
      'placed': 'placed',
      'unplaced': 'not_placed',
      'not_placed': 'not_placed',
      'applied': 'applied'
    };
    studentUpdates.placement_status = statusMap[updatedFields.status] || updatedFields.status;
  }
  if ('completeness' in updatedFields) studentUpdates.profile_completion = parseInt(updatedFields.completeness);
  if ('verification' in updatedFields) {
    const verMap: Record<string, string> = {
      'Verified': 'verified',
      'Pending': 'pending',
      'Rejected': 'rejected',
      'verified': 'verified',
      'pending': 'pending',
      'rejected': 'rejected'
    };
    studentUpdates.verification_status = verMap[updatedFields.verification] || updatedFields.verification;
  }

  if (Object.keys(studentUpdates).length > 0) {
    const { error: studentError } = await supabase
      .from('students')
      .update({ ...studentUpdates, updated_at: new Date().toISOString() })
      .eq('id', studentId);
    if (studentError) throw studentError;
  }

  // 4. Update academics
  const academicUpdates: any = {};
  if ('cgpa' in updatedFields) academicUpdates.cgpa = parseFloat(updatedFields.cgpa);
  if ('tenth_score' in updatedFields) academicUpdates.tenth_score = parseFloat(updatedFields.tenth_score);
  if ('twelfth_score' in updatedFields) academicUpdates.twelfth_score = parseFloat(updatedFields.twelfth_score);
  if ('diploma_score' in updatedFields) academicUpdates.diploma_score = updatedFields.diploma_score !== '' ? parseFloat(updatedFields.diploma_score) : null;
  if ('backlog_count' in updatedFields) studentUpdates.backlog_count = parseInt(updatedFields.backlog_count);
  if ('active_arrears' in updatedFields) studentUpdates.active_arrears = parseInt(updatedFields.active_arrears) || 0;
  if ('history_of_arrears' in updatedFields || 'history_of_backlogs' in updatedFields) {
    studentUpdates.history_of_backlogs = Boolean(updatedFields.history_of_arrears ?? updatedFields.history_of_backlogs);
  }
  if ('cgpa' in updatedFields) studentUpdates.cgpa = parseFloat(updatedFields.cgpa);
  if ('tenth_score' in updatedFields) studentUpdates.tenth_score = parseFloat(updatedFields.tenth_score);
  if ('twelfth_score' in updatedFields) studentUpdates.twelfth_score = parseFloat(updatedFields.twelfth_score);
  if ('diploma_score' in updatedFields) studentUpdates.diploma_score = parseFloat(updatedFields.diploma_score);
  if ('address' in updatedFields) studentUpdates.address = updatedFields.address;
  if ('permanent_address' in updatedFields) studentUpdates.permanent_address = updatedFields.permanent_address;
  if ('city' in updatedFields) studentUpdates.city = updatedFields.city;
  if ('state' in updatedFields) studentUpdates.state = updatedFields.state;
  if ('pincode' in updatedFields) studentUpdates.pincode = updatedFields.pincode;
  if ('college_email' in updatedFields || 'email' in updatedFields) {
    studentUpdates.college_email = updatedFields.college_email || updatedFields.email;
  }
  if ('personal_email' in updatedFields || 'personalEmail' in updatedFields) {
    studentUpdates.personal_email = updatedFields.personal_email || updatedFields.personalEmail;
  }
  if ('phone' in updatedFields) {
    studentUpdates.phone = updatedFields.phone;
    if (student?.user_id) {
      await supabase.from('users').update({ phone: updatedFields.phone }).eq('id', student.user_id);
    }
  }

  if (Object.keys(studentUpdates).length > 0) {
    const { error: studentError } = await supabase.from('students').update(studentUpdates).eq('id', studentId);
    if (studentError) throw studentError;
  }

  // Update profiles if profile-specific fields present
  const profileUpdates: any = {};
  if ('leetcode' in updatedFields) profileUpdates.leetcode_count = parseInt(updatedFields.leetcode);
  if ('specializations' in updatedFields) {
    let specs = updatedFields.specializations;
    if (typeof specs === 'string') {
      try { specs = JSON.parse(specs); } catch (e) { specs = specs.split(',').map((s: string) => s.trim()); }
    }
    profileUpdates.specializations = specs;
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { data: eP } = await supabase.from('student_profiles').select('id').eq('student_id', studentId).single();
    if (eP) {
      await supabase.from('student_profiles').update({ ...profileUpdates, updated_at: new Date().toISOString() }).eq('id', eP.id);
    } else {
      await supabase.from('student_profiles').insert([{ student_id: studentId, ...profileUpdates, updated_at: new Date().toISOString() }]);
    }
  }

  return { id: studentId, success: true };
}

export async function updateStudentVerification(studentId: string, status: 'verified' | 'pending' | 'rejected') {
    const { error } = await supabase
      .from('students')
      .update({ verification_status: status })
      .eq('id', studentId);
    if (error) throw error;
    return { id: studentId, verification_status: status };
  }

export async function flagStudent(studentId: string, reason: string) {
    const { error } = await supabase
      .from('students')
      .update({ 
        verification_status: 'rejected',
      })
      .eq('id', studentId);
    if (error) throw error;
    return { id: studentId, verification_status: 'rejected' };
  }

export async function updateStudentProfile(studentId: string, profileData: any) {
    // 0. Update users table if name/email are in profileData
    const { data: studentRecord } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    const userUpdates: any = {};
    if (profileData.name) userUpdates.name = profileData.name;
    if (profileData.email || profileData.college_email) {
      userUpdates.email = String(profileData.email || profileData.college_email).trim().toLowerCase();
    }
    if (Object.keys(userUpdates).length > 0 && studentRecord?.user_id) {
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', studentRecord.user_id);
      if (userError) throw userError;
    }

    // Update students table
    const studentUpdates: any = {};
    if (profileData.name) {
      studentUpdates.name = profileData.name;
    }
    if (profileData.department || profileData.dept) {
      studentUpdates.department = profileData.department || profileData.dept;
    }
    if (profileData.year) studentUpdates.year = parseInt(profileData.year);
    if (profileData.gender) studentUpdates.gender = profileData.gender;
    if (profileData.date_of_birth !== undefined || profileData.dob !== undefined) {
      studentUpdates.date_of_birth = profileData.date_of_birth !== undefined ? profileData.date_of_birth : profileData.dob;
      if (studentUpdates.date_of_birth === '') studentUpdates.date_of_birth = null;
    }
    if (profileData.roll_number !== undefined || profileData.rollNo !== undefined) {
      studentUpdates.roll_number = profileData.roll_number !== undefined ? profileData.roll_number : profileData.rollNo;
    }
    if (profileData.register_number || profileData.regNo) {
      studentUpdates.register_number = profileData.register_number || profileData.regNo;
    }

    if (Object.keys(studentUpdates).length > 0) {
      const { error: studentError } = await supabase
        .from('students')
        .update({ ...studentUpdates, updated_at: new Date().toISOString() })
        .eq('id', studentId);
      if (studentError) throw studentError;
    }

    // Update academics with auto-aggregate CGPA
    const academicUpdates: any = {};
    if (profileData.cgpa !== undefined) academicUpdates.cgpa = parseFloat(profileData.cgpa);
    if (profileData.tenth_score !== undefined) academicUpdates.tenth_score = parseFloat(profileData.tenth_score) || null;
    if (profileData.twelfth_score !== undefined) academicUpdates.twelfth_score = parseFloat(profileData.twelfth_score) || null;
    if (profileData.diploma_score !== undefined) academicUpdates.diploma_score = profileData.diploma_score ? parseFloat(profileData.diploma_score) : null;
    if (profileData.active_arrears !== undefined) academicUpdates.active_arrears = parseInt(profileData.active_arrears) || 0;
    if (profileData.history_of_arrears !== undefined) academicUpdates.history_of_arrears = Boolean(profileData.history_of_arrears);
    if (profileData.semester_cgpa !== undefined) {
      academicUpdates.semester_cgpa = profileData.semester_cgpa;
      // Auto-compute aggregate CGPA from semesters
      const vals = Object.values(profileData.semester_cgpa as Record<string, number>)
        .map(Number).filter(v => !isNaN(v) && v > 0);
      if (vals.length > 0) {
        academicUpdates.cgpa = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
      }
    }

    if (Object.keys(academicUpdates).length > 0) {
      const { data: eA } = await supabase.from('student_academics').select('id').eq('student_id', studentId).single();
      if (eA) {
        const { error: academicError } = await supabase.from('student_academics').update({ ...academicUpdates, updated_at: new Date().toISOString() }).eq('id', eA.id);
        if (academicError) throw academicError;
      } else {
        const { error: academicError } = await supabase.from('student_academics').insert([{ student_id: studentId, ...academicUpdates, updated_at: new Date().toISOString() }]);
        if (academicError) throw academicError;
      }
    }

    // Update profile (leetcode, specializations, links)
    const profileUpdates: any = {};
    if (profileData.leetcode !== undefined) profileUpdates.leetcode_count = parseInt(profileData.leetcode) || 0;
    if (profileData.specializations !== undefined) profileUpdates.specializations = profileData.specializations;
    if (profileData.linkedin_url !== undefined) profileUpdates.linkedin_url = profileData.linkedin_url;
    if (profileData.github_url !== undefined) profileUpdates.github_url = profileData.github_url;
    if (profileData.portfolio_url !== undefined) profileUpdates.portfolio_url = profileData.portfolio_url;
    if (profileData.notes !== undefined) profileUpdates.notes = profileData.notes;

    if (Object.keys(profileUpdates).length > 0) {
      const { data: eP } = await supabase.from('student_profiles').select('id').eq('student_id', studentId).single();
      if (eP) {
        const { error: profileError } = await supabase.from('student_profiles').update({ ...profileUpdates }).eq('id', eP.id);
        if (profileError) throw profileError;
      } else {
        const { error: profileError } = await supabase.from('student_profiles').insert([{ student_id: studentId, ...profileUpdates }]);
        if (profileError) throw profileError;
      }
    }

    // Update contacts (address)
    const contactUpdates: any = {};
    if (profileData.address !== undefined) contactUpdates.address = profileData.address;
    if (profileData.permanent_address !== undefined) contactUpdates.permanent_address = profileData.permanent_address;
    if (profileData.city !== undefined) contactUpdates.city = profileData.city;
    if (profileData.state !== undefined) contactUpdates.state = profileData.state;
    if (profileData.pincode !== undefined) contactUpdates.pincode = profileData.pincode;
    if (profileData.email !== undefined || profileData.college_email !== undefined) {
      contactUpdates.college_email = profileData.email !== undefined ? profileData.email : profileData.college_email;
    }
    if (profileData.personal_email !== undefined || profileData.personalEmail !== undefined) {
      contactUpdates.personal_email = profileData.personal_email !== undefined ? profileData.personal_email : profileData.personalEmail;
    }

    if (Object.keys(contactUpdates).length > 0) {
      const { data: eC } = await supabase.from('student_contacts').select('id').eq('student_id', studentId).single();
      if (eC) {
        const { error: contactError } = await supabase.from('student_contacts').update({ ...contactUpdates, updated_at: new Date().toISOString() }).eq('id', eC.id);
        if (contactError) throw contactError;
      } else {
        const { error: contactError } = await supabase.from('student_contacts').insert([{ student_id: studentId, ...contactUpdates, updated_at: new Date().toISOString() }]);
        if (contactError) throw contactError;
      }
    }

    // Update preferences (placement interest, roles, locations)
    const preferenceUpdates: any = {};
    if (profileData.placement_interest !== undefined) preferenceUpdates.placement_interest = profileData.placement_interest;
    if (profileData.preferred_roles !== undefined) preferenceUpdates.preferred_roles = profileData.preferred_roles;
    if (profileData.preferred_locations !== undefined) preferenceUpdates.preferred_locations = profileData.preferred_locations;
    if (profileData.placement_group !== undefined) preferenceUpdates.work_mode_preference = profileData.placement_group;

    if (Object.keys(preferenceUpdates).length > 0) {
      const { data: ePref } = await supabase.from('student_preferences').select('id').eq('student_id', studentId).single();
      if (ePref) {
        const { error: prefError } = await supabase.from('student_preferences').update({ ...preferenceUpdates, updated_at: new Date().toISOString() }).eq('id', ePref.id);
        if (prefError) throw prefError;
      } else {
        const { error: prefError } = await supabase.from('student_preferences').insert([{ student_id: studentId, ...preferenceUpdates, updated_at: new Date().toISOString() }]);
        if (prefError) throw prefError;
      }
    }

    return { success: true };
  }

export async function updateProfilePicture(userId: string, avatarUrl: string) {
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);
    
    if (error) throw error;
    return { id: userId, avatar_url: avatarUrl };
  }
