import { supabase } from '@/lib/supabase';

export async function getApplications(options: { 
  driveId?: string; 
  batch?: string; 
  department?: string; 
  startDate?: string; 
  endDate?: string; 
} = {}) {
  let query = supabase
    .from('applications')
    .select(`
      *,
      students (
        register_number,
        department,
        year,
        users (
          name
        )
      ),
      job_drives (
        role_title,
        batch,
        companies (
          name
        )
      )
    `);
  
  if (options.driveId && options.driveId !== "All Drives") {
    query = query.eq('drive_id', options.driveId);
  }

  const { data, error } = await query;
  if (error) throw error;

  let filteredData = data || [];

  if (options.batch && options.batch !== "All Batches") {
    filteredData = filteredData.filter((app: any) => {
      const drive = Array.isArray(app.job_drives) ? app.job_drives[0] : app.job_drives;
      return drive?.batch === options.batch;
    });
  }

  if (options.department && options.department !== "All Departments") {
    filteredData = filteredData.filter((app: any) => {
      const student = Array.isArray(app.students) ? app.students[0] : app.students;
      return student?.department === options.department;
    });
  }

  if (options.startDate) {
    const start = new Date(options.startDate).getTime();
    filteredData = filteredData.filter((app: any) => {
      return app.applied_at && new Date(app.applied_at).getTime() >= start;
    });
  }

  if (options.endDate) {
    const end = new Date(options.endDate).getTime();
    filteredData = filteredData.filter((app: any) => {
      return app.applied_at && new Date(app.applied_at).getTime() <= end;
    });
  }

  return filteredData;
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
  const results = [];
  for (const item of offersData) {
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('register_number', item.regNo)
        .single();

      if (studentError || !student) {
        console.error(`Student not found for regNo: ${item.regNo}`);
        continue;
      }

      let companyId;
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', item.company)
        .maybeSingle();

      if (company && !companyError) {
        companyId = company.id;
      } else {
        const { data: newCompany, error: createCompanyError } = await supabase
          .from('companies')
          .insert([{ name: item.company, industry: 'Technology' }])
          .select()
          .single();
        if (!createCompanyError && newCompany) {
          companyId = newCompany.id;
        } else {
          console.error(`Failed to get/create company: ${item.company}`);
          continue;
        }
      }

      let driveId = null;
      if (item.driveTitle) {
        const { data: drive } = await supabase
          .from('job_drives')
          .select('id')
          .eq('title', item.driveTitle)
          .maybeSingle();
        if (drive) {
          driveId = drive.id;
        }
      }

      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .insert([{
          student_id: student.id,
          company_id: companyId,
          job_drive_id: driveId,
          role_title: item.role || 'Software Engineer',
          package_ctc: item.package || '6 LPA',
          acceptance_status: item.status || 'accepted',
          joining_date: item.joiningDate || new Date().toISOString().split('T')[0],
          offer_status: item.outcome || 'accepted',
          verification_status: item.verification || 'pending'
        }])
        .select()
        .single();

      if (offerError) throw offerError;
      results.push(offer);
    } catch (err) {
      console.error(`Error uploading offer for ${item.regNo}:`, err);
    }
  }
  return results;
}

export async function updateApplicationCtc(id: string, ctc: string) {
  const { error } = await supabase
    .from('applications')
    .update({ outcome: ctc })
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}
