const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const { data: admins, error } = await supabase.from('users').select('*').eq('role', 'admin');
    if (error) {
      console.error('Error fetching admins:', error);
    } else {
      console.log('Admins in public.users:', admins);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
