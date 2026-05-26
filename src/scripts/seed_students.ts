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

const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Sia', 'Ananya', 'Rohan', 'Kabir', 'Ishaan', 'Rahul', 'Varun', 'Neha', 'Priya', 'Meera', 'Arjun', 'Tanmay', 'Karan', 'Sneha', 'Riya', 'Kavya', 'Dev'];
const lastNames = ['Sharma', 'Gupta', 'Sen', 'Kumar', 'Das', 'Malhotra', 'Nair', 'Mehta', 'Iyer', 'Patel', 'Reddy', 'Singh', 'Joshi', 'Choudhury', 'Bose', 'Verma', 'Gill', 'Rao', 'Pandey', 'Saxena'];
const departments = ['CSE', 'IT', 'ECE', 'AI&DS', 'AI&ML', 'CYS', 'CSBS', 'CCE'];
const specializationsPool = ['Frontend', 'Backend', 'Fullstack', 'Data Science', 'Machine Learning', 'Cloud', 'DevOps', 'Cybersecurity'];

async function seedStudents() {
  console.log('🚀 Starting Student Seeding across all batches...');

  try {
    // 1. Fetch current settings to identify the reference academic year
    let isCompleted = false;
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'academic_year_completion')
      .single();

    if (!settingsError && settingsData?.value) {
      isCompleted = !!settingsData.value.isAcademicYearCompleted;
    }
    console.log(`ℹ️ Settings read: isAcademicYearCompleted = ${isCompleted}`);

    const cy = new Date().getFullYear();
    const referenceYear = isCompleted ? cy + 1 : cy;

    // We will generate students for all 4 batches (years 1 to 4)
    // 4th year -> referenceYear
    // 3rd year -> referenceYear + 1
    // 2nd year -> referenceYear + 2
    // 1st year -> referenceYear + 3
    const batches = [
      { yearNum: 4, endYear: referenceYear, label: 'IV Year' },
      { yearNum: 3, endYear: referenceYear + 1, label: 'III Year' },
      { yearNum: 2, endYear: referenceYear + 2, label: 'II Year' },
      { yearNum: 1, endYear: referenceYear + 3, label: 'I Year' },
    ];

    let totalSeeded = 0;

    for (const batch of batches) {
      console.log(`🎓 Seeding 5 students for ${batch.label} (Batch end year: ${batch.endYear})...`);

      for (let i = 0; i < 5; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${batch.yearNum}.${i}@placely.edu`;
        const phone = `9${Math.floor(Math.random() * 900000000) + 100000000}`;
        const dept = departments[Math.floor(Math.random() * departments.length)];
        const regNo = `202${batch.endYear % 10}${dept}${Math.floor(Math.random() * 900) + 100}`;
        const rollNo = `${batch.endYear % 100}${dept}${Math.floor(Math.random() * 90) + 10}`;
        const dob = `200${8 - batch.yearNum}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`;
        const gender = Math.random() > 0.5 ? 'Male' : 'Female';

        // A. Insert User
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{
            name: fullName,
            email: email,
            role: 'student',
            status: 'active',
            phone: phone
          }])
          .select()
          .single();

        if (userError) {
          console.error(`Error inserting user ${email}:`, userError);
          continue;
        }

        // B. Insert Student
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .insert([{
            user_id: userData.id,
            register_number: regNo,
            roll_number: rollNo,
            gender: gender,
            date_of_birth: dob,
            department: dept,
            year: batch.endYear,
            placement_status: batch.yearNum === 4 && Math.random() > 0.5 ? 'placed' : 'not_placed',
            profile_completion: Math.floor(Math.random() * 30) + 70,
            verification_status: Math.random() > 0.2 ? 'verified' : 'pending'
          }])
          .select()
          .single();

        if (studentError) {
          console.error(`Error inserting student ${regNo}:`, studentError);
          continue;
        }

        // C. Insert Student Academics
        const cgpa = parseFloat((6.5 + Math.random() * 3.3).toFixed(2));
        const activeArrears = Math.random() > 0.85 ? Math.floor(Math.random() * 2) + 1 : 0;
        const historyOfArrears = activeArrears > 0 || Math.random() > 0.8;
        const semObj: Record<string, number> = {};
        for (let sem = 1; sem <= (batch.yearNum * 2) - 1; sem++) {
          semObj[`sem_${sem}`] = parseFloat((6.2 + Math.random() * 3.5).toFixed(2));
        }

        const { error: acadError } = await supabase
          .from('student_academics')
          .insert([{
            student_id: studentData.id,
            cgpa: cgpa,
            tenth_score: parseFloat((75 + Math.random() * 23).toFixed(2)),
            twelfth_score: parseFloat((70 + Math.random() * 28).toFixed(2)),
            backlog_count: activeArrears,
            active_arrears: activeArrears,
            history_of_arrears: historyOfArrears,
            semester_cgpa: semObj,
            updated_at: new Date().toISOString()
          }]);

        if (acadError) {
          console.error(`Error inserting academics for ${regNo}:`, acadError);
        }

        // D. Insert Student Profiles
        const leetcode = Math.floor(Math.random() * 280) + 15;
        const specs = specializationsPool.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);

        const { error: profileError } = await supabase
          .from('student_profiles')
          .insert([{
            student_id: studentData.id,
            leetcode_count: leetcode,
            specializations: specs,
            updated_at: new Date().toISOString()
          }]);

        if (profileError) {
          console.error(`Error inserting profile for ${regNo}:`, profileError);
        }

        totalSeeded++;
      }
    }

    console.log(`✨ Seeding completed successfully! Seeded ${totalSeeded} students.`);
  } catch (err) {
    console.error('❌ General execution error:', err);
  }
}

seedStudents();
