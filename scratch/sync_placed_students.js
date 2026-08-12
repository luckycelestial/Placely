const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vzwcbddpgjjfcrrelkbq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2NiZGRwZ2pqZmNycmVsa2JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTc0MTQ0NCwiZXhwIjoyMTAxMzE3NDQ0fQ.BXQ1rIdKcQs9EI5kZdobHtooJBR6LBPapn6UjVIEvxo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const rawData = [
  { regNo: '722823243055', rollNo: '23AD055', name: 'JEEVANANTHAM S', section: 'A', company: 'Anthill Networks', ctc: 8.0, joiningDate: '2026-05-18' },
  { regNo: '722823243098', rollNo: '23AD098', name: 'Peer Mohideen Hameed A', section: 'A', company: 'Anthill Networks', ctc: 8.0, joiningDate: '2026-05-18' },
  { regNo: '722823243111', rollNo: '23AD111', name: 'Ramya T', section: 'B', company: 'ServiceNow', ctc: 44.0, joiningDate: '2026-05-11' },
  { regNo: '722823243120', rollNo: '23AD120', name: 'SANJANA S PILLAI', section: 'B', company: 'Metropolis Technologies', ctc: 14.0, joiningDate: '2026-06-01' },
  { regNo: '722823243140', rollNo: '23AD140', name: 'Sruthy Suji', section: 'C', company: 'Caterpillar', ctc: 10.0, joiningDate: '2026-02-09' },
  { regNo: '722823243149', rollNo: '23AD149', name: 'Tarun J', section: 'C', company: 'ServiceNow', ctc: 44.0, joiningDate: '2026-05-11' },
  { regNo: '722823243046', rollNo: '23AD046', name: 'Harish R', section: 'A', company: 'Akaike Technologies', ctc: 4.2, joiningDate: '2026-06-01' },
  { regNo: '722823243027', rollNo: '23AD027', name: 'CHANDRAMUHILAN M', section: 'A', company: 'Mr Cooper', ctc: 8.0, joiningDate: '2026-06-01' },
  { regNo: '722823243116', rollNo: '23AD116', name: 'SAKTHIVEL M', section: 'B', company: 'Amazon', ctc: 45.0, joiningDate: '2026-07-06' },
  { regNo: '722823243085', rollNo: '23AD085', name: 'NIDHISH M', section: 'B', company: 'Integra Connect', ctc: 3.0, joiningDate: '2026-05-18' },
  { regNo: '722823243009', rollNo: '23AD009', name: 'AKASH G', section: 'A', company: 'BIG VISION', ctc: 15.0, joiningDate: '2026-06-01' },
  { regNo: '722823243012', rollNo: '23AD012', name: 'ANANDHI G', section: 'A', company: 'Hyland', ctc: 10.0, joiningDate: '2026-07-06' },
  { regNo: '722823243079', rollNo: '23AD079', name: 'MUTHU VISALAKSHI M', section: 'B', company: 'Cloud Destinations', ctc: 8.0, joiningDate: null },
  { regNo: '722823243083', rollNo: '23AD083', name: 'NAVIYA DHARSHINI A S', section: 'B', company: 'Cloud Destinations', ctc: 8.0, joiningDate: null },
  { regNo: '722823243053', rollNo: '23AD053', name: 'JAGATH VISHNU', section: 'A', company: 'Schneider Electric', ctc: 5.5, joiningDate: '2026-07-01' },
  { regNo: '722823243101', rollNo: '23AD101', name: 'PRAJESH U R', section: 'B', company: 'Schneider Electric', ctc: 5.5, joiningDate: '2026-07-01' },
  { regNo: '722823243115', rollNo: '23AD115', name: 'SAKTHEESWAR KUMARAN', section: 'B', company: 'Schneider Electric', ctc: 5.5, joiningDate: '2026-07-01' },
  { regNo: '722823243135', rollNo: '23AD135', name: 'SNEYA B R', section: 'C', company: 'Schneider Electric', ctc: 5.5, joiningDate: '2026-07-13' },
  { regNo: '722823243086', rollNo: '23AD086', name: 'NISHAD N', section: 'B', company: 'Infinite Solutions', ctc: 4.5, joiningDate: null },
  { regNo: '722823243091', rollNo: '23AD091', name: 'NITHYA SREE G', section: 'B', company: 'Infinite Solutions', ctc: 4.5, joiningDate: null },
  { regNo: '722823243097', rollNo: '23AD097', name: 'PAVITHRA A', section: 'B', company: 'Infinite Solutions', ctc: 4.5, joiningDate: null },
  { regNo: '722823243126', rollNo: '23AD126', name: 'SARA DAWOOD S', section: 'B', company: 'Infinite Solutions', ctc: 4.5, joiningDate: null },
  { regNo: '722823243056', rollNo: '23AD056', name: 'KAMALESH G J', section: 'A', company: 'Infinite Solutions', ctc: 4.5, joiningDate: null },
  { regNo: '722823243080', rollNo: '23AD080', name: 'NANDHINI K P', section: 'B', company: 'Infinite Solutions', ctc: 4.5, joiningDate: null },
  { regNo: '722823243144', rollNo: '23AD144', name: 'SURIYA A', section: 'C', company: 'Caresoft', ctc: 4.5, joiningDate: '2026-06-22' },
  { regNo: '722823243024', rollNo: '23AD024', name: 'ATHITHYAN M', section: 'A', company: 'Caresoft', ctc: 4.5, joiningDate: '2026-06-22' },
  { regNo: '722823243023', rollNo: '23AD023', name: 'ATHIKESAVAN M', section: 'A', company: 'Caresoft', ctc: 4.5, joiningDate: '2026-06-22' },
  { regNo: '722823243048', rollNo: '23AD048', name: 'HARISMITA B', section: 'A', company: 'Jocata', ctc: 8.0, joiningDate: '2026-07-13' },
  { regNo: '722823243005', rollNo: '23AD005', name: 'ADHITHIYA G', section: 'A', company: 'Jocata', ctc: 8.0, joiningDate: '2026-07-13' },
  { regNo: '722823243153', rollNo: '23AD153', name: 'VASANTH R', section: 'C', company: 'Jocata', ctc: 8.0, joiningDate: '2026-07-13' },
  { regNo: '722823243038', rollNo: '23AD038', name: 'DIVYASREERITHA R', section: 'A', company: 'Hudsmer Business Solutions', ctc: 4.0, joiningDate: null },
  { regNo: '722823243158', rollNo: '23AD158', name: 'VISHNU YOGESH V K', section: 'C', company: 'Dassault Systems', ctc: 12.0, joiningDate: '2026-07-13' },
  { regNo: '722823243002', rollNo: '23AD002', name: 'ABHIRAMI T', section: 'A', company: 'PSIOG', ctc: 4.5, joiningDate: null },
  { regNo: '722823243130', rollNo: '23AD130', name: 'SHASTY VENKATESH G', section: 'B', company: 'PSIOG', ctc: 4.5, joiningDate: null },
  { regNo: '722823243121', rollNo: '23AD121', name: 'SANJAY P C', section: 'B', company: 'PSIOG', ctc: 4.5, joiningDate: null },
  { regNo: '722823243146', rollNo: '23AD146', name: 'SUSITHA C', section: 'C', company: 'cloudvice', ctc: 4.0, joiningDate: null },
  { regNo: '722823243047', rollNo: '23AD047', name: 'HARISH S', section: 'A', company: 'cloudvice', ctc: 4.0, joiningDate: null },
  { regNo: '722823243013', rollNo: '23AD013', name: 'ANBUCHEZHIYAN A M', section: 'A', company: 'Zoho', ctc: 5.0, joiningDate: null },
  { regNo: '722823243011', rollNo: '23AD011', name: 'AKSHAYA N', section: 'A', company: 'Digifortex', ctc: 5.0, joiningDate: '2026-07-27' },
  { regNo: '722823243118', rollNo: '23AD118', name: 'SANDHYA A', section: 'B', company: 'Danfoss', ctc: 5.5, joiningDate: '2026-08-03' },
  { regNo: '722823243104', rollNo: '23AD104', name: 'PRIYADHARSHINI M', section: 'B', company: 'Hexaware', ctc: 4.0, joiningDate: null },
  { regNo: '722823243123', rollNo: '23AD123', name: 'SANJEEVITHA C S', section: 'B', company: 'Hexaware', ctc: 4.0, joiningDate: null },
  { regNo: '722823243088', rollNo: '23AD088', name: 'NITHIN PRANAV R', section: 'B', company: 'Hexaware', ctc: 4.0, joiningDate: null },
  { regNo: '722823243032', rollNo: '23AD032', name: 'DEVDARSHAN A', section: 'A', company: 'Hexaware', ctc: 4.0, joiningDate: null },
  { regNo: '722823243022', rollNo: '23AD022', name: 'ATHARSHA P', section: 'A', company: 'Hexaware', ctc: 4.0, joiningDate: null },
  { regNo: '722823243125', rollNo: '23AD125', name: 'SANTHOSH S', section: 'B', company: 'Hexaware', ctc: 4.0, joiningDate: null },
  { regNo: '722823243050', rollNo: '23AD050', name: 'HARSHAVARSHINI P S', section: 'A', company: 'Hexaware', ctc: 4.0, joiningDate: null },
  { regNo: '722823243099', rollNo: '23AD099', name: 'POOJA M', section: 'B', company: 'Hexaware', ctc: 4.0, joiningDate: null },
  { regNo: '722823243143', rollNo: '23AD143', name: 'SURENDAR P S', section: 'C', company: 'Hexaware', ctc: 4.0, joiningDate: null },
  { regNo: '722823243129', rollNo: '23AD129', name: 'SHAAM S R', section: 'B', company: 'Hexaware', ctc: 4.0, joiningDate: null },
];

async function sync() {
  console.log('1. Resetting all students placement_status to unplaced...');
  const { error: resetErr } = await supabase
    .from('students')
    .update({ placement_status: 'unplaced' })
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (resetErr) console.error('Error resetting students:', resetErr);

  console.log('2. Deleting old/dummy offers...');
  const { error: delErr } = await supabase.from('offers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) console.error('Error deleting offers:', delErr);

  console.log('3. Ensuring all companies exist...');
  const companyMap = new Map();
  const { data: existingCos } = await supabase.from('companies').select('id, name');
  (existingCos || []).forEach(c => companyMap.set(c.name.toLowerCase().trim(), c.id));

  for (const item of rawData) {
    const key = item.company.toLowerCase().trim();
    if (!companyMap.has(key)) {
      console.log(`Creating company: ${item.company}`);
      const { data: newCo, error: coErr } = await supabase
        .from('companies')
        .insert([{ name: item.company, status: 'active' }])
        .select()
        .single();
      if (newCo) companyMap.set(key, newCo.id);
      if (coErr) console.error(`Error creating company ${item.company}:`, coErr);
    }
  }

  console.log('4. Fetching student IDs...');
  const { data: allStudents } = await supabase.from('students').select('id, register_number, name');
  const studentMap = new Map();
  (allStudents || []).forEach(s => studentMap.set(String(s.register_number).trim(), s.id));

  console.log('5. Inserting exact 50 offers & marking students placed...');
  const offersToInsert = [];
  const placedStudentIds = [];

  for (const item of rawData) {
    const studentId = studentMap.get(item.regNo);
    const companyId = companyMap.get(item.company.toLowerCase().trim());

    if (!studentId) {
      console.warn(`⚠️ Student not found in DB for regNo ${item.regNo} (${item.name})`);
      continue;
    }

    if (!companyId) {
      console.warn(`⚠️ Company not found in DB for ${item.company}`);
      continue;
    }

    placedStudentIds.push(studentId);

    offersToInsert.push({
      student_id: studentId,
      company_id: companyId,
      role_title: 'Software Engineer',
      package_ctc: item.ctc,
      offer_status: 'issued',
      acceptance_status: 'accepted',
      joining_status: 'pending',
    });
  }

  if (offersToInsert.length > 0) {
    const { error: insErr } = await supabase.from('offers').insert(offersToInsert);
    if (insErr) console.error('Error inserting offers:', insErr);
    else console.log(`✅ Successfully inserted ${offersToInsert.length} offers!`);
  }

  if (placedStudentIds.length > 0) {
    const { error: updateErr } = await supabase
      .from('students')
      .update({ placement_status: 'placed' })
      .in('id', placedStudentIds);

    if (updateErr) console.error('Error updating placement status:', updateErr);
    else console.log(`✅ Successfully updated ${placedStudentIds.length} students to 'placed'!`);
  }

  console.log('🎉 Clean sync complete!');
}

sync().catch(console.error);
