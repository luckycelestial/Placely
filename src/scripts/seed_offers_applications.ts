import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedOffersAndApplications() {
  console.log('🚀 Seeding comprehensive offers, applications, and student academic variety...');

  try {
    // 1. Fetch all students
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id, placement_status, department');

    if (studentError) throw studentError;
    console.log(`ℹ️ Loaded ${students?.length || 0} students from database.`);

    // 2. Fetch all companies
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, name');

    if (companyError) throw companyError;
    console.log(`ℹ️ Loaded ${companies?.length || 0} companies from database.`);

    if (!companies || companies.length === 0) {
      console.error('❌ No companies found. Please run seed_final.ts first to seed companies.');
      return;
    }

    // 3. Fetch all job drives
    const { data: drives, error: driveError } = await supabase
      .from('job_drives')
      .select('id, company_id, role_title, package_ctc');

    if (driveError) throw driveError;
    console.log(`ℹ️ Loaded ${drives?.length || 0} job drives from database.`);

    if (!drives || drives.length === 0) {
      console.error('❌ No job drives found. Please run seed_final.ts first to seed drives.');
      return;
    }

    let offersCount = 0;
    let appsCount = 0;

    for (const student of (students || [])) {
      // Find existing offers for this student
      const { data: existingOffers } = await supabase
        .from('offers')
        .select('id')
        .eq('student_id', student.id);

      if (student.placement_status === 'placed') {
        if (!existingOffers || existingOffers.length === 0) {
          // Select a random drive and its corresponding company
          const drive = drives[Math.floor(Math.random() * drives.length)];
          const packageCtc = drive.package_ctc || `${(Math.random() * 20 + 8).toFixed(1)} LPA`;
          
          // Insert offer
          const { error: offerError } = await supabase
            .from('offers')
            .insert([{
              student_id: student.id,
              company_id: drive.company_id,
              drive_id: drive.id,
              role_title: drive.role_title || 'Software Engineer',
              package_ctc: packageCtc,
              offer_status: 'accepted',
              verification_status: 'verified',
              acceptance_status: 'accepted'
            }]);

          if (offerError) {
            console.error(`Error inserting offer for student ${student.id}:`, offerError);
          } else {
            offersCount++;
          }

          // Insert matching application
          const { error: appError } = await supabase
            .from('applications')
            .insert([{
              student_id: student.id,
              drive_id: drive.id,
              current_stage: 'offered',
              status: 'offered'
            }]);

          if (appError) {
            console.error(`Error inserting placement application for student ${student.id}:`, appError);
          } else {
            appsCount++;
          }
        }
      } else {
        // Unplaced or Applied students - give them some rich application history!
        // Seed 1-3 applications in various intermediate stages
        const numApps = Math.floor(Math.random() * 3);
        const stages = ['applied', 'shortlisted', 'aptitude', 'interview1', 'interview2', 'rejected'];
        
        // Pick unique random drives
        const selectedDrives = drives.sort(() => 0.5 - Math.random()).slice(0, numApps);

        for (const drive of selectedDrives) {
          const stage = stages[Math.floor(Math.random() * stages.length)];
          const status = stage === 'rejected' ? 'rejected' : 'applied';

          const { error: appError } = await supabase
            .from('applications')
            .insert([{
              student_id: student.id,
              drive_id: drive.id,
              current_stage: stage,
              status: status
            }]);

          if (!appError) {
            appsCount++;
          }
        }
      }
    }

    console.log(`✨ Seeded ${offersCount} new student placement offers.`);
    console.log(`✨ Seeded ${appsCount} new student drive applications.`);
  } catch (err) {
    console.error('❌ Error executing seeder:', err);
  }
}

seedOffersAndApplications();
