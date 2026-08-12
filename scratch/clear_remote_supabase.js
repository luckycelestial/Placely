const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vzwcbddpgjjfcrrelkbq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6d2NiZGRwZ2pqZmNycmVsa2JxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTc0MTQ0NCwiZXhwIjoyMTAxMzE3NDQ0fQ.BXQ1rIdKcQs9EI5kZdobHtooJBR6LBPapn6UjVIEvxo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function clearRemote() {
  console.log('Clearing remote Supabase database...');

  await supabase.from('offers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('job_drives').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('companies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('student_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('student_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('✅ Remote Supabase database cleared!');
}

clearRemote().catch(console.error);
