import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const testId = 'efebe0e0-7ae0-4af0-a0e9-a04e43e805cb';
  
  // 1. Fetch initial state
  const { data: before } = await supabase.from('offers').select('*').eq('id', testId).single();
  console.log('Before update:', before);

  // 2. Perform update
  const updateRes = await supabase
    .from('offers')
    .update({ 
      verification_status: 'verified',
      offer_status: 'accepted'
    })
    .eq('id', testId);
  console.log('Update status code:', updateRes.status);
  
  // 3. Fetch after state
  const { data: after } = await supabase.from('offers').select('*').eq('id', testId).single();
  console.log('After update:', after);
}

check();
