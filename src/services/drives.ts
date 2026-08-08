import { supabase } from '@/lib/supabase';

export async function getDrives(options: { 
  search?: string; 
  status?: string;
  excludeCompleted?: boolean;
  type?: string;
  batch?: string;
} = {}) {
  let query = supabase
    .from('job_drives')
    .select(`
      *,
      companies (
        name,
        logo_url,
        theme_color
      )
    `);

  // Search filter is processed client-side to avoid PostgREST nested table join syntax errors

  if (options.status && options.status !== 'All') {
    query = query.eq('status', options.status.toLowerCase());
  } else if (options.excludeCompleted) {
    query = query.neq('status', 'completed');
  }

  if (options.type && options.type !== 'All') {
    query = query.eq('drive_type', options.type);
  }

  if (options.batch && options.batch !== 'All') {
    query = query.eq('batch', options.batch);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map(d => ({
    ...d,
    applications: [{ count: d.total_applicants || 0 }]
  }));
}

export async function getCompanies(options: { search?: string } = {}) {
  let query = supabase
    .from('companies')
    .select('*');

  if (options.search) {
    query = query.ilike('name', `%${options.search}%`);
  }

  const { data, error } = await query.order('name');
  if (error) throw error;
  return data;
}

export async function getDistinctBatches(): Promise<string[]> {
  const currentYear = new Date().getFullYear();
  const { data, error } = await supabase
    .from('job_drives')
    .select('batch');
  if (error) throw error;

  const years = new Set<string>();
  // Always include current year + next year as base options
  years.add(String(currentYear));
  years.add(String(currentYear + 1));

  // Add any years that actually have drives (treating null as current year)
  (data || []).forEach((row: any) => {
    const b = row.batch || String(currentYear);
    years.add(b);
  });

  // Sort descending (most recent first)
  return Array.from(years).sort((a, b) => Number(b) - Number(a));
}

export async function getDistinctDepartments(): Promise<string[]> {
  const { data, error } = await supabase.from('students').select('department');
  if (error) return ['AI&DS', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT'];
  const depts = new Set<string>();
  (data || []).forEach(s => { if (s.department) depts.add(s.department); });
  return Array.from(depts).sort();
}

async function triggerNoticeOnPublication(drive: any) {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', drive.company_id)
      .single();
    
    const companyName = company?.name || 'Partner Company';
    const noticeTitle = `New Placement Drive: ${companyName} is hiring for ${drive.role_title}!`;
    
    const startDateFormatted = drive.application_start 
      ? new Date(drive.application_start).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      : "Immediate";
    const deadlineFormatted = drive.application_end
      ? new Date(drive.application_end).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      : "N/A";
      
    await supabase
      .from('notices')
      .upsert([{
        title: noticeTitle,
        body: `${companyName} has launched a new recruitment drive for the position of ${drive.role_title}.\n\nPackage: ${drive.package_ctc} | Location: ${drive.location}\nApplication Window: ${startDateFormatted} to ${deadlineFormatted}\n\nHead over to the Job Opportunities hub to check eligibility and apply now!`,
        audience: 'All Students',
        priority: 'high',
        status: 'published',
        publish_at: new Date().toISOString(),
        pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'title',
        ignoreDuplicates: true
      });
  } catch (err) {
    console.error("Failed to automatically post notice for drive publication:", err);
  }
}

export async function createDrive(driveData: any) {
  const { data, error } = await supabase
    .from('job_drives')
    .insert([{
      company_id: driveData.company_id,
      role_title: driveData.role_title,
      drive_type: driveData.drive_type,
      package_ctc: driveData.package_ctc,
      location: driveData.location,
      application_start: driveData.application_start,
      application_end: driveData.application_end,
      batch: driveData.batch || null,
      eligibility_rules: driveData.eligibility_rules,
      status: driveData.status || 'published',
      title: driveData.title
    }])
    .select()
    .single();

  if (error) throw new Error(error.message || error.details || 'Failed to create drive');
  
  if (data && data.status === 'published') {
    await triggerNoticeOnPublication(data);
  }
  
  return data;
}

export async function updateDrive(id: string, driveData: any) {
  const { data, error } = await supabase
    .from('job_drives')
    .update({
      company_id: driveData.company_id,
      role_title: driveData.role_title,
      drive_type: driveData.drive_type,
      package_ctc: driveData.package_ctc,
      location: driveData.location,
      application_start: driveData.application_start,
      application_end: driveData.application_end,
      batch: driveData.batch || null,
      eligibility_rules: driveData.eligibility_rules,
      status: driveData.status || 'published',
      title: driveData.title
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message || error.details || 'Failed to update drive');
  
  if (data && data.status === 'published') {
    await triggerNoticeOnPublication(data);
  }
  
  return data;
}


export async function deleteDrive(id: string) {
  // Delete associated offers
  const { error: offersErr } = await supabase
    .from('offers')
    .delete()
    .eq('drive_id', id);
  if (offersErr) throw offersErr;

  // Delete associated applications
  const { error: appsErr } = await supabase
    .from('applications')
    .delete()
    .eq('drive_id', id);
  if (appsErr) throw appsErr;

  // Delete associated drive_rounds
  const { error: roundsErr } = await supabase
    .from('drive_rounds')
    .delete()
    .eq('drive_id', id);
  if (roundsErr) throw roundsErr;

  // Delete the drive itself
  const { error } = await supabase
    .from('job_drives')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function createCompany(companyData: any) {
  const { data, error } = await supabase
    .from('companies')
    .insert([companyData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCompany(id: string, companyData: any) {
  const { data, error } = await supabase
    .from('companies')
    .update(companyData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCompany(id: string) {
  // Fetch associated drives
  const { data: drives, error: fetchErr } = await supabase
    .from('job_drives')
    .select('id')
    .eq('company_id', id);
  if (fetchErr) throw fetchErr;

  // Delete each associated drive (with its dependent rounds/applications/offers)
  if (drives && drives.length > 0) {
    for (const drive of drives) {
      await deleteDrive(drive.id);
    }
  }

  // Delete the company
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

export async function getTemplates() {
  const { data, error } = await supabase
    .from('drive_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTemplate(templateData: any) {
  const { data, error } = await supabase
    .from('drive_templates')
    .insert([templateData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(id: string, templateData: any) {
  const { data, error } = await supabase
    .from('drive_templates')
    .update(templateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from('drive_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

export async function updateDriveStages(driveId: string, stages: any[]) {
  const { error } = await supabase.rpc('update_drive_stages', { 
    drive_id: driveId, 
    new_stages: stages 
  });
  if (error) throw error;
  return { success: true };
}

export async function updateAllDriveStages(stages: any[]) {
  const { error } = await supabase.rpc('update_all_drive_stages', { 
    new_stages: stages 
  });
  if (error) throw error;
  return { success: true };
}

