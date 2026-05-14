
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const companies = [
  { name: 'Google', industry: 'Technology', website: 'https://google.com', logo_url: 'https://logo.clearbit.com/google.com', hr_name: 'Sundar Pichai', hr_email: 'sundar@google.com', hr_phone: '1234567890', theme_color: '#4285F4' },
  { name: 'Microsoft', industry: 'Technology', website: 'https://microsoft.com', logo_url: 'https://logo.clearbit.com/microsoft.com', hr_name: 'Satya Nadella', hr_email: 'satya@microsoft.com', hr_phone: '1234567891', theme_color: '#00A4EF' },
  { name: 'Apple', industry: 'Technology', website: 'https://apple.com', logo_url: 'https://logo.clearbit.com/apple.com', hr_name: 'Tim Cook', hr_email: 'tim@apple.com', hr_phone: '1234567892', theme_color: '#555555' },
  { name: 'Amazon', industry: 'E-commerce', website: 'https://amazon.com', logo_url: 'https://logo.clearbit.com/amazon.com', hr_name: 'Andy Jassy', hr_email: 'andy@amazon.com', hr_phone: '1234567893', theme_color: '#FF9900' },
  { name: 'Meta', industry: 'Technology', website: 'https://meta.com', logo_url: 'https://logo.clearbit.com/meta.com', hr_name: 'Mark Zuckerberg', hr_email: 'mark@meta.com', hr_phone: '1234567894', theme_color: '#0668E1' },
  { name: 'Netflix', industry: 'Entertainment', website: 'https://netflix.com', logo_url: 'https://logo.clearbit.com/netflix.com', hr_name: 'Ted Sarandos', hr_email: 'ted@netflix.com', hr_phone: '1234567895', theme_color: '#E50914' },
  { name: 'Tesla', industry: 'Automotive', website: 'https://tesla.com', logo_url: 'https://logo.clearbit.com/tesla.com', hr_name: 'Elon Musk', hr_email: 'elon@tesla.com', hr_phone: '1234567896', theme_color: '#E81010' },
  { name: 'SpaceX', industry: 'Aerospace', website: 'https://spacex.com', logo_url: 'https://logo.clearbit.com/spacex.com', hr_name: 'Gwynne Shotwell', hr_email: 'gwynne@spacex.com', hr_phone: '1234567897', theme_color: '#005288' },
  { name: 'OpenAI', industry: 'Technology', website: 'https://openai.com', logo_url: 'https://logo.clearbit.com/openai.com', hr_name: 'Sam Altman', hr_email: 'sam@openai.com', hr_phone: '1234567898', theme_color: '#000000' },
  { name: 'Anthropic', industry: 'Technology', website: 'https://anthropic.com', logo_url: 'https://logo.clearbit.com/anthropic.com', hr_name: 'Dario Amodei', hr_email: 'dario@anthropic.com', hr_phone: '1234567899', theme_color: '#7B61FF' },
  { name: 'NVIDIA', industry: 'Technology', website: 'https://nvidia.com', logo_url: 'https://logo.clearbit.com/nvidia.com', hr_name: 'Jensen Huang', hr_email: 'jensen@nvidia.com', hr_phone: '1234567800', theme_color: '#76B900' },
  { name: 'Adobe', industry: 'Technology', website: 'https://adobe.com', logo_url: 'https://logo.clearbit.com/adobe.com', hr_name: 'Shantanu Narayen', hr_email: 'shantanu@adobe.com', hr_phone: '1234567801', theme_color: '#FF0000' },
  { name: 'Salesforce', industry: 'Technology', website: 'https://salesforce.com', logo_url: 'https://logo.clearbit.com/salesforce.com', hr_name: 'Marc Benioff', hr_email: 'marc@salesforce.com', hr_phone: '1234567802', theme_color: '#00A1E0' },
  { name: 'Intel', industry: 'Technology', website: 'https://intel.com', logo_url: 'https://logo.clearbit.com/intel.com', hr_name: 'Pat Gelsinger', hr_email: 'pat@intel.com', hr_phone: '1234567803', theme_color: '#0068B5' },
  { name: 'AMD', industry: 'Technology', website: 'https://amd.com', logo_url: 'https://logo.clearbit.com/amd.com', hr_name: 'Lisa Su', hr_email: 'lisa@amd.com', hr_phone: '1234567804', theme_color: '#ED1C24' },
  { name: 'Oracle', industry: 'Technology', website: 'https://oracle.com', logo_url: 'https://logo.clearbit.com/oracle.com', hr_name: 'Safra Catz', hr_email: 'safra@oracle.com', hr_phone: '1234567805', theme_color: '#F80000' },
  { name: 'Cisco', industry: 'Networking', website: 'https://cisco.com', logo_url: 'https://logo.clearbit.com/cisco.com', hr_name: 'Chuck Robbins', hr_email: 'chuck@cisco.com', hr_phone: '1234567806', theme_color: '#049FD9' },
  { name: 'IBM', industry: 'Technology', website: 'https://ibm.com', logo_url: 'https://logo.clearbit.com/ibm.com', hr_name: 'Arvind Krishna', hr_email: 'arvind@ibm.com', hr_phone: '1234567807', theme_color: '#052D84' },
  { name: 'Goldman Sachs', industry: 'Finance', website: 'https://goldmansachs.com', logo_url: 'https://logo.clearbit.com/goldmansachs.com', hr_name: 'David Solomon', hr_email: 'david@gs.com', hr_phone: '1234567808', theme_color: '#7399C6' },
  { name: 'Morgan Stanley', industry: 'Finance', website: 'https://morganstanley.com', logo_url: 'https://logo.clearbit.com/morganstanley.com', hr_name: 'James Gorman', hr_email: 'james@ms.com', hr_phone: '1234567809', theme_color: '#004B8D' }
];

const driveTemplates = [
  { 
    name: 'Standard SDE-1', 
    role_title: 'Software Development Engineer', 
    drive_type: 'Full-time', 
    package_ctc: '12 - 18 LPA', 
    location: 'Bangalore / Remote',
    eligibility_rules: { min_cgpa: 7.5, backlogs_allowed: 0, branches: ['CSE', 'AI&DS', 'ECE'], history_of_arrears: false }
  },
  { 
    name: 'SDE Intern', 
    role_title: 'Software Engineer Intern', 
    drive_type: 'Internship', 
    package_ctc: '50k - 80k / month', 
    location: 'Office (Various Locations)',
    eligibility_rules: { min_cgpa: 8.0, backlogs_allowed: 0, branches: ['CSE', 'AI&DS'], history_of_arrears: false }
  },
  { 
    name: 'ML Engineer', 
    role_title: 'Machine Learning Engineer', 
    drive_type: 'Full-time', 
    package_ctc: '15 - 25 LPA', 
    location: 'Hyderabad / Pune',
    eligibility_rules: { min_cgpa: 8.5, backlogs_allowed: 0, branches: ['CSE', 'AI&ML', 'CYS'], history_of_arrears: false }
  }
];

async function seed() {
  console.log('🚀 Starting Deep Seeding...');

  // 1. Upsert Companies
  console.log('🏢 Seeding Companies...');
  const { data: seededCompanies, error: compError } = await supabase
    .from('companies')
    .upsert(companies, { onConflict: 'name' })
    .select();

  if (compError) {
    console.error('Error seeding companies:', compError);
    return;
  }
  console.log(`✅ Seeded ${seededCompanies.length} companies`);

  // 2. Upsert Templates
  console.log('📄 Seeding Templates...');
  const { data: seededTemplates, error: tempError } = await supabase
    .from('drive_templates')
    .upsert(driveTemplates, { onConflict: 'name' })
    .select();

  if (tempError) {
    console.error('Error seeding templates:', tempError);
    return;
  }
  console.log(`✅ Seeded ${seededTemplates.length} templates`);

  // 3. Create Drives
  console.log('🚗 Seeding Drives...');
  const drives = [];
  const roles = [
    'Software Engineer', 'Frontend Developer', 'Backend Engineer', 
    'Full Stack Developer', 'Data Scientist', 'ML Engineer', 
    'Cloud Architect', 'DevOps Engineer', 'QA Automation Engineer',
    'Product Manager', 'UX Designer', 'Mobile App Developer'
  ];
  const locations = ['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Gurgaon', 'Noida', 'Mumbai', 'Remote'];

  for (let i = 0; i < 30; i++) {
    const company = seededCompanies[Math.floor(Math.random() * seededCompanies.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const packageVal = (Math.floor(Math.random() * 15) + 6) + ' - ' + (Math.floor(Math.random() * 10) + 20) + ' LPA';
    
    // Future dates
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 30) + 5);

    drives.push({
      company_id: company.id,
      role_title: role,
      drive_type: Math.random() > 0.3 ? 'Full-time' : 'Internship',
      package_ctc: packageVal,
      location: loc,
      application_end: deadline.toISOString(),
      status: 'published',
      eligibility_rules: {
        min_cgpa: 6.5 + (Math.random() * 2),
        backlogs_allowed: Math.floor(Math.random() * 2),
        branches: ['CSE', 'AI&DS', 'ECE', 'EEE', 'MECH', 'IT'].slice(0, Math.floor(Math.random() * 3) + 2),
        history_of_arrears: Math.random() > 0.8
      }
    });
  }

  const { error: driveError } = await supabase
    .from('job_drives')
    .insert(drives);

  if (driveError) {
    console.error('Error seeding drives:', driveError);
    return;
  }
  console.log('✅ Seeded 30+ drives');

  console.log('✨ Seeding Completed Successfully!');
}

seed();
