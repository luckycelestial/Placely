
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://skkxftaqryezezfyrakr.supabase.co',
  'sb_publishable_odIEZjzcDB2y8ce5L7G6Yw_6EXKIvxz'
);

async function seed() {
  console.log('Seeding data...');

  const { data: students } = await supabase.from('students').select('id');
  const { data: drives } = await supabase.from('job_drives').select('id, company_id');

  if (!students || !drives) {
    console.log('No students or drives found');
    return;
  }

  const stages = ['applied', 'shortlisted', 'interview1', 'interview2', 'selection'];
  const newApps = [];
  for (let i = 0; i < 20; i++) {
    const student = students[Math.floor(Math.random() * students.length)];
    const drive = drives[Math.floor(Math.random() * drives.length)];
    newApps.push({
      student_id: student.id,
      drive_id: drive.id,
      status: 'applied',
      current_stage: stages[Math.floor(Math.random() * stages.length)],
      applied_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  const { error: appError } = await supabase.from('applications').insert(newApps);
  if (appError) console.error('App Error:', appError);
  else console.log('Added 20 applications');

  const newOffers = [];
  for (let i = 0; i < 15; i++) {
    const student = students[Math.floor(Math.random() * students.length)];
    const drive = drives[Math.floor(Math.random() * drives.length)];
    newOffers.push({
      student_id: student.id,
      drive_id: drive.id,
      company_id: drive.company_id,
      role_title: 'Software Engineer',
      package_ctc: (Math.random() * 20 + 5).toFixed(1) + ' LPA',
      offer_status: 'issued',
      acceptance_status: Math.random() > 0.5 ? 'accepted' : 'pending',
      verification_status: Math.random() > 0.7 ? 'verified' : 'pending'
    });
  }
  
  const { data: createdOffers, error: offerError } = await supabase.from('offers').insert(newOffers).select();
  if (offerError) console.error('Offer Error:', offerError);
  else console.log('Added 15 offers');
}

seed();
