import { supabase } from '@/lib/supabase';

export async function getApplications(options: { 
  driveId?: string; 
  batch?: string; 
  department?: string; 
  startDate?: string; 
  endDate?: string; 
  search?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const hasDeptFilter = options.department && options.department !== "All Departments";
  const hasBatchFilter = options.batch && options.batch !== "All Batches";
  const hasSearch = options.search && options.search.trim() !== "";

  const studentsSelect = (hasDeptFilter || hasSearch)
    ? `students!inner(name, register_number, roll_number, department, year, users(name))`
    : `students(name, register_number, roll_number, department, year, users(name))`;

  const drivesSelect = hasBatchFilter
    ? `job_drives!inner(role_title, batch, companies(name))`
    : `job_drives(role_title, batch, companies(name))`;

  let query = supabase
    .from('applications')
    .select(`
      *,
      ${studentsSelect},
      ${drivesSelect}
    `);

  if (options.driveId && options.driveId !== "All Drives") {
    query = query.eq('drive_id', options.driveId);
  }

  if (hasDeptFilter) {
    query = query.eq('students.department', options.department);
  }

  if (hasSearch) {
    const searchVal = `%${options.search!.trim()}%`;
    query = query.or(`name.ilike.${searchVal},register_number.ilike.${searchVal},roll_number.ilike.${searchVal}`, { foreignTable: 'students' });
  }

  if (hasBatchFilter) {
    query = query.eq('job_drives.batch', options.batch);
  }

  if (options.startDate) {
    query = query.gte('applied_at', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('applied_at', options.endDate);
  }

  const limit = options.limit !== undefined ? options.limit : 1000;
  const offset = options.offset !== undefined ? options.offset : 0;

  query = query
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

export async function getStudentApplications(studentId: string) {
  if (!studentId || studentId.trim() === '') return [];
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job_drives (
          company_id,
          role_title,
          drive_type,
          package_ctc,
          location,
          eligibility_rules,
          companies (
            id,
            name,
            logo_url,
            theme_color
          )
        )
      `)
      .eq('student_id', studentId)
      .order('applied_at', { ascending: false });
    if (error) {
      console.error("getStudentApplications error:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("getStudentApplications exception:", err);
    return [];
  }
}

export async function applyToDrive(studentId: string, driveId: string) {
  let targetStudentId = studentId;

  if (!targetStudentId && typeof window !== 'undefined') {
    targetStudentId = localStorage.getItem('active_student_id') || '';
  }

  if (!targetStudentId) {
    const { data: firstStudent } = await supabase.from('students').select('id').limit(1).maybeSingle();
    if (firstStudent?.id) {
      targetStudentId = firstStudent.id;
    } else {
      throw new Error("Student ID is required to apply. Please select a student profile.");
    }
  }

  const { data, error } = await supabase
    .from('applications')
    .insert([{
      student_id: targetStudentId,
      drive_id: driveId,
      status: 'Applied',
      current_stage: 'applied',
      applied_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('[applyToDrive Error]', error);
    throw new Error(error.message || error.details || 'Failed to submit application');
  }
  return data;
}

export async function getStudentAppliedDriveIds(studentId: string): Promise<string[]> {
  if (!studentId || studentId.trim() === '') return [];
  const { data, error } = await supabase
    .from('applications')
    .select('drive_id')
    .eq('student_id', studentId);
  if (error) throw error;
  return (data || []).map((a: any) => a.drive_id);
}
export function resolveStatusFromStage(stageId: string): string {
  const id = stageId.toLowerCase();
  if (id === 'applied') return 'Applied';
  if (id === 'shortlisted') return 'Shortlisted';
  if (id.includes('reject')) return 'Rejected';
  if (id.includes('offer') || id.includes('select') || id.includes('accept')) return 'Offered';
  if (id.includes('join') || id.includes('place')) return 'Joined';
  return 'In Review';
}

async function autoCreateOfferAndPlaceStudent(studentId: string, driveId: string) {
  try {
    // 1. Get drive details
    const { data: drive, error: driveErr } = await supabase
      .from('job_drives')
      .select('company_id, role_title, package_ctc')
      .eq('id', driveId)
      .maybeSingle();
    
    if (driveErr || !drive) {
      console.error('Failed to get drive details for auto-offer:', driveErr);
      return;
    }

    // 2. Check if an offer already exists
    const { data: existing, error: existErr } = await supabase
      .from('offers')
      .select('id')
      .eq('student_id', studentId)
      .eq('drive_id', driveId)
      .maybeSingle();

    if (existErr) {
      console.error('Failed to check existing offer:', existErr);
    }

    if (!existing) {
      // 3. Create offer
      const { error: insertErr } = await supabase
        .from('offers')
        .insert([{
          student_id: studentId,
          drive_id: driveId,
          company_id: drive.company_id,
          role_title: drive.role_title,
          package_ctc: drive.package_ctc,
          offer_status: 'offered',
          acceptance_status: 'pending',
          verification_status: 'verified'
        }]);
      if (insertErr) {
        console.error('Failed to auto-create offer:', insertErr);
      }
    }

    // 4. Update student placement status to 'placed'
    const { error: studentErr } = await supabase
      .from('students')
      .update({ placement_status: 'placed', updated_at: new Date().toISOString() })
      .eq('id', studentId);
    
    if (studentErr) {
      console.error('Failed to update student placement status to placed:', studentErr);
    }

    // 5. Assign placement lock
    await assignPlacementLockIfEnabled(studentId);
  } catch (err) {
    console.error('Error in autoCreateOfferAndPlaceStudent:', err);
  }
}

export async function updateApplicationStage(id: string, stageId: string) {
  const status = resolveStatusFromStage(stageId);
  const { error } = await supabase
    .from('applications')
    .update({ 
      current_stage: stageId,
      status: status 
    })
    .eq('id', id);
  if (error) throw error;

  // Auto-assign Offer & Placement Lock when moved to Offered or Joined stage
  if (status === 'Offered' || status === 'Joined') {
    const { data: app } = await supabase
      .from('applications')
      .select('student_id, drive_id')
      .eq('id', id)
      .maybeSingle();
    if (app?.student_id && app?.drive_id) {
      await autoCreateOfferAndPlaceStudent(app.student_id, app.drive_id);
    }
  }

  return { success: true };
}

export async function bulkUpdateApplicationStage(ids: string[], stageId: string) {
  const status = resolveStatusFromStage(stageId);
  const { error } = await supabase
    .from('applications')
    .update({ 
      current_stage: stageId,
      status: status 
    })
    .in('id', ids);
  if (error) throw error;

  // Auto-assign Offer & Placement Lock when moved to Offered or Joined stage
  if (status === 'Offered' || status === 'Joined') {
    const { data: apps } = await supabase
      .from('applications')
      .select('student_id, drive_id')
      .in('id', ids);
    if (apps && apps.length > 0) {
      await Promise.all(apps.map(async (app: any) => {
        if (app.student_id && app.drive_id) {
          await autoCreateOfferAndPlaceStudent(app.student_id, app.drive_id);
        }
      }));
    }
  }

  return { success: true };
}

export async function resetApplicationsStage(driveId: string, oldStageId: string, newStageId: string = 'applied') {
  const status = resolveStatusFromStage(newStageId);
  const { error } = await supabase
    .from('applications')
    .update({ 
      current_stage: newStageId,
      status: status 
    })
    .eq('drive_id', driveId)
    .eq('current_stage', oldStageId);
  if (error) throw error;
  return { success: true };
}

export async function getOffers() {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      students (
        id,
        name,
        register_number,
        users (
          name
        )
      ),
      companies (
        name
      ),
      job_drives (
        title
      )
    `);
  if (error) throw error;
  return data;
}

export async function deleteOffer(id: string) {
  const { error } = await supabase
    .from('offers')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function updateOffer(
  id: string,
  updates: {
    offer_status?: string;
    verification_status?: string;
    joining_date?: string | null;
    acceptance_status?: string;
    mismatch_flag?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('offers')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

export async function updateOfferStatus(id: string, status: string) {
  return updateOffer(id, { offer_status: status });
}

export async function updateOfferVerification(id: string, status: string) {
  return updateOffer(id, { verification_status: status });
}

/**
 * Stamps the given student's custom-group preference with { placement_lock: "Active" }.
 * Uses direct PostgREST table update to mark student as placed.
 */
async function assignPlacementLockIfEnabled(studentId: string) {
  try {
    await supabase
      .from('students')
      .update({ placement_status: 'placed' })
      .eq('id', studentId);
  } catch (err) {
    console.error('Failed to update student placement status:', err);
  }
}

export async function bulkCreateOffers(offersData: any[]) {
  if (!offersData || offersData.length === 0) return [];

  // 1. Gather all unique register numbers, company names, and drive titles
  const regNos = Array.from(new Set(offersData.map(o => o.regNo).filter(Boolean)));
  const companyNames = Array.from(new Set(offersData.map(o => o.company).filter(Boolean)));
  const driveTitles = Array.from(new Set(offersData.map(o => o.driveTitle).filter(Boolean)));

  // 2. Batch fetch students
  const { data: students } = await supabase
    .from('students')
    .select('id, register_number')
    .in('register_number', regNos);
  const studentMap = new Map<string, string>();
  (students || []).forEach(s => studentMap.set(s.register_number, s.id));

  // 3. Batch fetch companies
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .in('name', companyNames);
  const companyMap = new Map<string, string>();
  (companies || []).forEach(c => companyMap.set(c.name, c.id));

  // 4. Identify and batch insert any missing companies
  const missingCompanyNames = companyNames.filter(name => !companyMap.has(name));
  if (missingCompanyNames.length > 0) {
    const { data: newCos, error: createCosError } = await supabase
      .from('companies')
      .insert(missingCompanyNames.map(name => ({ name, industry: 'Technology' })))
      .select();
    
    if (!createCosError && newCos) {
      newCos.forEach(c => companyMap.set(c.name, c.id));
    }
  }

  // 5. Batch fetch job drives
  const driveMap = new Map<string, string>();
  if (driveTitles.length > 0) {
    const { data: drives } = await supabase
      .from('job_drives')
      .select('id, title')
      .in('title', driveTitles);
    (drives || []).forEach(d => driveMap.set(d.title, d.id));
  }

  // 6. Construct batch offers payload
  const offersPayload = offersData.map(item => {
    const studentId = studentMap.get(item.regNo);
    if (!studentId) {
      console.error(`Student not found for regNo: ${item.regNo}`);
      return null;
    }
    const companyId = companyMap.get(item.company);
    if (!companyId) {
      console.error(`Failed to get/create company: ${item.company}`);
      return null;
    }
    const driveId = item.driveTitle ? (driveMap.get(item.driveTitle) || null) : null;

    return {
      student_id: studentId,
      company_id: companyId,
      drive_id: driveId,
      role_title: item.role || 'Software Engineer',
      package_ctc: item.package || '6 LPA',
      acceptance_status: item.status || 'accepted',
      joining_date: item.joiningDate || new Date().toISOString().split('T')[0],
      offer_status: item.outcome || 'accepted',
      verification_status: item.verification || 'verified'
    };
  }).filter(Boolean);

  if (offersPayload.length === 0) return [];

  // 7. Batch insert offers
  const { data: createdOffers, error: offerError } = await supabase
    .from('offers')
    .insert(offersPayload)
    .select();

  if (offerError) throw offerError;

  // Apply placement lock for each student who received an offer
  const placedStudentIds = Array.from(new Set(
    (offersPayload as any[]).map((o: any) => o.student_id).filter(Boolean)
  ));
  await Promise.all(placedStudentIds.map(id => assignPlacementLockIfEnabled(id)));

  return createdOffers || [];
}

export async function updateApplicationCtc(id: string, ctc: string) {
  const { error } = await supabase
    .from('applications')
    .update({ outcome: ctc })
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function getStudentOffers(studentId: string) {
  if (!studentId || studentId.trim() === '') return [];
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('student_id', studentId);
    if (error) {
      console.error("getStudentOffers error:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    return [];
  }
}

export async function acceptOffer(
  studentId: string,
  driveId: string,
  companyId: string,
  roleTitle: string,
  packageCtc: string,
  applicationId: string
) {
  // Check if offer exists
  const { data: existingOffers, error: findError } = await supabase
    .from('offers')
    .select('id')
    .eq('student_id', studentId)
    .eq('drive_id', driveId);
  
  if (findError) throw findError;

  let offerId = null;

  if (existingOffers && existingOffers.length > 0) {
    offerId = existingOffers[0].id;
    const { error: updateError } = await supabase
      .from('offers')
      .update({
        acceptance_status: 'accepted',
        offer_status: 'accepted'
      })
      .eq('id', offerId);
    if (updateError) throw updateError;
  } else {
    const { data: newOffer, error: insertError } = await supabase
      .from('offers')
      .insert([{
        student_id: studentId,
        drive_id: driveId,
        company_id: companyId,
        role_title: roleTitle,
        package_ctc: packageCtc,
        acceptance_status: 'accepted',
        offer_status: 'accepted'
      }])
      .select();
    if (insertError) throw insertError;
    offerId = newOffer?.[0]?.id;
  }

  // Update application status
  const { error: appError } = await supabase
    .from('applications')
    .update({ 
      status: 'Accepted',
      current_stage: 'accepted'
    })
    .eq('id', applicationId);
  if (appError) throw appError;

  // Update student placement status to placed
  await supabase
    .from('students')
    .update({ placement_status: 'placed', updated_at: new Date().toISOString() })
    .eq('id', studentId);

  // Apply placement lock if policy is enabled
  await assignPlacementLockIfEnabled(studentId);

  return { success: true, offerId };
}

export async function setOfferJoiningDate(
  studentId: string,
  driveId: string,
  companyId: string,
  roleTitle: string,
  packageCtc: string,
  joiningDate: string
) {
  const { data: existingOffers, error: findError } = await supabase
    .from('offers')
    .select('id')
    .eq('student_id', studentId)
    .eq('drive_id', driveId);

  if (findError) throw findError;

  if (existingOffers && existingOffers.length > 0) {
    const { error: updateError } = await supabase
      .from('offers')
      .update({ joining_date: joiningDate })
      .eq('id', existingOffers[0].id);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from('offers')
      .insert([{
        student_id: studentId,
        drive_id: driveId,
        company_id: companyId,
        role_title: roleTitle,
        package_ctc: packageCtc,
        joining_date: joiningDate,
        acceptance_status: 'pending',
        offer_status: 'offered'
      }]);
    if (insertError) throw insertError;
  }

  return { success: true };
}

export async function getStudentApplicationStats(studentId: string) {
  const defaultStats = { active_count: 0, placed_count: 0, offered_count: 0 };
  if (!studentId || studentId.trim() === '') return defaultStats;

  try {
    const [appsRes, offersRes] = await Promise.all([
      supabase.from('applications').select('status').eq('student_id', studentId),
      supabase.from('offers').select('id, acceptance_status').eq('student_id', studentId)
    ]);
    const apps = appsRes.data || [];
    const offers = offersRes.data || [];
    const activeCount = apps.filter(a => a.status !== 'Rejected' && a.status !== 'Withdrawn').length;
    const placedCount = offers.filter(o => o.acceptance_status === 'accepted').length;
    const offeredCount = offers.length;
    return { active_count: activeCount, placed_count: placedCount, offered_count: offeredCount };
  } catch (err) {
    return defaultStats;
  }
}
