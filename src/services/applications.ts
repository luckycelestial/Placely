import { supabase } from '@/lib/supabase';

export async function getApplications(options: { 
  driveId?: string; 
  batch?: string; 
  department?: string; 
  startDate?: string; 
  endDate?: string; 
} = {}) {
  const hasDeptFilter = options.department && options.department !== "All Departments";
  const hasBatchFilter = options.batch && options.batch !== "All Batches";

  const studentsSelect = hasDeptFilter
    ? `students!inner(register_number, department, year, users(name))`
    : `students(register_number, department, year, users(name))`;

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

  if (hasBatchFilter) {
    query = query.eq('job_drives.batch', options.batch);
  }

  if (options.startDate) {
    query = query.gte('applied_at', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('applied_at', options.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data || [];
}

export async function getStudentApplications(studentId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      job_drives (
        role_title,
        drive_type,
        package_ctc,
        location,
        eligibility_rules,
        companies (
          name,
          logo_url,
          theme_color
        )
      )
    `)
    .eq('student_id', studentId)
    .order('applied_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function applyToDrive(studentId: string, driveId: string) {
  const { data, error } = await supabase
    .from('applications')
    .insert([{
      student_id: studentId,
      drive_id: driveId,
      status: 'Applied',
      current_stage: 'applied',
      applied_at: new Date().toISOString()
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getStudentAppliedDriveIds(studentId: string): Promise<string[]> {
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
  return { success: true };
}

export async function getOffers() {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      students (
        id,
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
      verification_status: item.verification || 'pending'
    };
  }).filter(Boolean);

  if (offersPayload.length === 0) return [];

  // 7. Batch insert offers
  const { data: createdOffers, error: offerError } = await supabase
    .from('offers')
    .insert(offersPayload)
    .select();

  if (offerError) throw offerError;
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
