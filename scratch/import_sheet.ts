import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const SUPABASE_URL = "https://vzwcbddpgjjfcrrelkbq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2NiZGRwZ2pqZmNycmVsa2JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDE0NDQsImV4cCI6MjEwMTMxNzQ0NH0.bMlWN0us4okbZqVQL971o1JXoris3KthAWUZxvucGTk";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanStr(val: any): string {
  if (!val) return '';
  return String(val).trim();
}

function cleanNum(val: any): number | null {
  if (!val) return null;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

function cleanInt(val: any): number {
  if (!val) return 0;
  const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function run() {
  const filePath = '/home/luckycelestial/.gemini/antigravity-ide/brain/2be375b6-45e9-4800-91de-5da5775b8900/.system_generated/steps/480/content.md';
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim().length > 0);
  
  // Find header line
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Reg No') && lines[i].includes('Name')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.error('Header line not found!');
    return;
  }

  console.log('Found header at line:', headerIndex);
  const dataLines = lines.slice(headerIndex + 1);

  let successCount = 0;
  let skippedCount = 0;

  for (const line of dataLines) {
    if (line.startsWith('---') || line.startsWith('Title:')) continue;
    const cols = parseCSVLine(line);
    const regNo = cleanStr(cols[1]);
    let name = cleanStr(cols[2]);
    const genderRaw = cleanStr(cols[3]);
    const dept = cleanStr(cols[4]) || 'AI&DS';
    const section = cleanStr(cols[5]);
    const tenthStr = cleanStr(cols[6]);
    const twelfthStr = cleanStr(cols[7]);
    const diplomaStr = cleanStr(cols[8]);
    const cgpaNum = cleanNum(cols[9]);
    const histArrearsStr = cleanStr(cols[10]);
    const backlogsStr = cleanStr(cols[11]);
    const collegeMail = cleanStr(cols[12]);
    const personalMail = cleanStr(cols[13]);
    const phone = cleanStr(cols[14]);
    const resume = cleanStr(cols[15]);
    const statusRaw = cleanStr(cols[16]);
    const companyName = cleanStr(cols[17]);
    const roleTitle = cleanStr(cols[18]);
    const pkg = cleanStr(cols[19]);

    if (!regNo) {
      skippedCount++;
      continue;
    }

    if (!name) {
      name = `Student ${regNo}`;
    }

    const email = collegeMail || personalMail || `${regNo.toLowerCase()}@sece.ac.in`;
    const gender = genderRaw.toLowerCase().startsWith('f') ? 'Female' : (genderRaw.toLowerCase().startsWith('m') ? 'Male' : null);
    
    let placementStatus = 'unplaced';
    if (statusRaw.toLowerCase().includes('placed') && !statusRaw.toLowerCase().includes('not') && !statusRaw.toLowerCase().includes('non')) {
      placementStatus = 'placed';
    }

    // 1. User
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        email,
        name,
        phone: phone || null,
        role: 'student',
        status: 'active'
      }, { onConflict: 'email' })
      .select('id')
      .single();

    if (userError || !userData) {
      console.error(`User error for ${regNo}:`, userError);
      continue;
    }

    // 2. Student
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .upsert({
        register_number: regNo,
        user_id: userData.id,
        name,
        department: dept,
        section: section || null,
        gender,
        year: 3,
        placement_status: placementStatus,
        profile_completion: 80,
        verification_status: 'verified'
      }, { onConflict: 'register_number' })
      .select('id')
      .single();

    if (studentError || !studentData) {
      console.error(`Student error for ${regNo}:`, studentError);
      continue;
    }

    const studentId = studentData.id;

    // 3. Contacts
    await supabase.from('student_contacts').upsert({
      student_id: studentId,
      college_email: collegeMail || null,
      personal_email: personalMail || null,
      phone: phone || null
    }, { onConflict: 'student_id' });

    // 4. Academics
    await supabase.from('student_academics').upsert({
      student_id: studentId,
      cgpa: cgpaNum,
      tenth_score: cleanNum(tenthStr),
      twelfth_score: cleanNum(twelfthStr),
      diploma_score: cleanNum(diplomaStr),
      active_arrears: cleanInt(backlogsStr),
      current_backlogs: cleanInt(backlogsStr),
      history_of_arrears: histArrearsStr === '1' || histArrearsStr.toLowerCase() === 'true' || histArrearsStr.toLowerCase() === 'yes'
    }, { onConflict: 'student_id' });

    // 5. Profile
    await supabase.from('student_profiles').upsert({
      student_id: studentId,
      resume_url: resume.startsWith('http') ? resume : null,
      profile_completion: 80,
      verification_status: 'verified'
    }, { onConflict: 'student_id' });

    // 6. Company & Offer if placed with company
    if (companyName) {
      const { data: compData } = await supabase
        .from('companies')
        .upsert({
          name: companyName,
          status: 'active'
        }, { onConflict: 'name' })
        .select('id')
        .single();

      if (compData) {
        await supabase.from('offers').upsert({
          student_id: studentId,
          company_id: compData.id,
          role_title: roleTitle || 'Software Engineer',
          package_ctc: pkg ? `${pkg} LPA` : '4.5 LPA',
          offer_status: 'issued',
          acceptance_status: 'accepted'
        });
      }
    }

    successCount++;
  }

  console.log(`IMPORT FINISHED: ${successCount} imported, ${skippedCount} skipped.`);
}

run();
