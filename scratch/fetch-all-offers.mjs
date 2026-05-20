import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('offers')
    .select('id, offer_status, verification_status, joining_date');
  if (error) {
    console.error('Error fetching offers:', error);
    return;
  }
  console.log('All offers:', JSON.stringify(data, null, 2));
}

run();
