import { supabase } from '@/lib/supabase';

export async function getApplications(options: { driveId?: string } = {}) {
  let query = supabase
    .from('applications')
    .select(`
      *,
      students (
        register_number,
        users (
          name
        )
      ),
      job_drives (
        role_title,
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
  return data;
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

export async function updateApplicationStage(id: string, stageId: string) {
  const { error } = await supabase
    .from('applications')
    .update({ status: stageId })
    .eq('id', id);
  if (error) throw error;
  return { success: true };
}

export async function bulkUpdateApplicationStage(ids: string[], stageId: string) {
  const { error } = await supabase
    .from('applications')
    .update({ status: stageId })
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
      // 1. Get student ID from register number
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('register_number', item.regNo)
        .single();

      if (studentError || !student) {
        console.error(`Student not found for regNo: ${item.regNo}`);
        continue;
      }

      // 2. Get or create company ID from name
      let companyId;
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('name', item.company)
        .maybeSingle();

      if (company && !companyError) {
        companyId = company.id;
      } else {
        // Insert new company if not found
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

      // 3. Optional: find matching job drive or default to null
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

      // 4. Insert offer
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

