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

  // 1. Update students table (identity, academics, contacts)
  const studentUpdates: any = {};
  if (profileData.name) studentUpdates.name = profileData.name;
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

  // Academics
  if (profileData.cgpa !== undefined) studentUpdates.cgpa = parseFloat(profileData.cgpa);
  if (profileData.tenth_score !== undefined) studentUpdates.tenth_score = parseFloat(profileData.tenth_score) || null;
  if (profileData.twelfth_score !== undefined) studentUpdates.twelfth_score = parseFloat(profileData.twelfth_score) || null;
  if (profileData.diploma_score !== undefined) studentUpdates.diploma_score = profileData.diploma_score ? parseFloat(profileData.diploma_score) : null;
  if (profileData.active_arrears !== undefined) studentUpdates.active_arrears = parseInt(profileData.active_arrears) || 0;
  if (profileData.history_of_arrears !== undefined || profileData.history_of_backlogs !== undefined) {
    studentUpdates.history_of_backlogs = Boolean(profileData.history_of_arrears ?? profileData.history_of_backlogs);
  }
  if (profileData.semester_cgpa !== undefined) {
    studentUpdates.semester_cgpa = profileData.semester_cgpa;
    if (profileData.cgpa === undefined) {
      const vals = Object.values(profileData.semester_cgpa as Record<string, number>)
        .map(Number).filter(v => !isNaN(v) && v > 0);
      if (vals.length > 0) {
        studentUpdates.cgpa = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
      }
    }
  }

  // Contacts
  if (profileData.address !== undefined) studentUpdates.address = profileData.address;
  if (profileData.permanent_address !== undefined) studentUpdates.permanent_address = profileData.permanent_address;
  if (profileData.city !== undefined) studentUpdates.city = profileData.city;
  if (profileData.state !== undefined) studentUpdates.state = profileData.state;
  if (profileData.pincode !== undefined) studentUpdates.pincode = profileData.pincode;
  if (profileData.college_email !== undefined || profileData.email !== undefined) {
    studentUpdates.college_email = profileData.college_email || profileData.email;
  }
  if (profileData.personal_email !== undefined || profileData.personalEmail !== undefined) {
    studentUpdates.personal_email = profileData.personal_email || profileData.personalEmail;
  }
  if (profileData.phone !== undefined) studentUpdates.phone = profileData.phone;

  if (Object.keys(studentUpdates).length > 0) {
    const { error: studentError } = await supabase
      .from('students')
      .update({ ...studentUpdates, updated_at: new Date().toISOString() })
      .eq('id', studentId);
    if (studentError) throw studentError;
  }

  // 2. Update student_profiles table (leetcode, specializations, links, preferences)
  const profileUpdates: any = {};
  if (profileData.leetcode !== undefined || profileData.leetcode_count !== undefined) {
    profileUpdates.leetcode_count = parseInt(profileData.leetcode ?? profileData.leetcode_count) || 0;
  }
  if (profileData.specializations !== undefined) {
    let specs = profileData.specializations;
    if (typeof specs === 'string') {
      try { specs = JSON.parse(specs); } catch (e) { specs = specs.split(',').map((s: string) => s.trim()).filter(Boolean); }
    }
    profileUpdates.specializations = specs;
  }
  if (profileData.linkedin_url !== undefined) profileUpdates.linkedin_url = profileData.linkedin_url;
  if (profileData.github_url !== undefined) profileUpdates.github_url = profileData.github_url;
  if (profileData.portfolio_url !== undefined) profileUpdates.portfolio_url = profileData.portfolio_url;
  if (profileData.resume_url !== undefined) profileUpdates.resume_url = profileData.resume_url;
  if (profileData.notes !== undefined) profileUpdates.notes = profileData.notes;
  if (profileData.placement_interest !== undefined) profileUpdates.placement_interest = profileData.placement_interest;
  if (profileData.preferred_roles !== undefined) profileUpdates.preferred_roles = profileData.preferred_roles;
  if (profileData.preferred_locations !== undefined) profileUpdates.preferred_locations = profileData.preferred_locations;
  if (profileData.placement_group !== undefined || profileData.work_mode_preference !== undefined) {
    profileUpdates.work_mode_preference = profileData.placement_group ?? profileData.work_mode_preference;
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { data: eP } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (eP?.id) {
      const { error: profileError } = await supabase
        .from('student_profiles')
        .update({ ...profileUpdates, updated_at: new Date().toISOString() })
        .eq('id', eP.id);
      if (profileError) throw profileError;
    } else {
      const { error: profileError } = await supabase
        .from('student_profiles')
        .insert([{ student_id: studentId, ...profileUpdates, updated_at: new Date().toISOString() }]);
      if (profileError) throw profileError;
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

export async function uploadAvatar(userId: string, file: File | Blob): Promise<string> {
  try {
    const fileExt = (file as File).name ? (file as File).name.split('.').pop() : 'png';
    const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (data?.publicUrl) {
        await updateProfilePicture(userId, data.publicUrl);
        return data.publicUrl;
      }
    }
  } catch (e) {
    console.warn("Storage upload failed, falling back to direct URL:", e);
  }

  // Fallback: read as base64 if storage is unconfigured
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        await updateProfilePicture(userId, base64);
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
