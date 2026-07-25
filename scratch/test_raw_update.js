const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const before = await supabase.from('users').select('name').eq('email', 'neyaa.u2025aids@sece.ac.in').single();
  console.log('Before:', before.data);

  const updateRes = await supabase.from('users').update({ name: 'NEYAA U TEST' }).eq('email', 'neyaa.u2025aids@sece.ac.in');
  console.log('Update status:', updateRes.status, updateRes.error);

  const after = await supabase.from('users').select('name').eq('email', 'neyaa.u2025aids@sece.ac.in').single();
  console.log('After:', after.data);

  // Restore name
  await supabase.from('users').update({ name: 'NEYAA U' }).eq('email', 'neyaa.u2025aids@sece.ac.in');
}

run();
