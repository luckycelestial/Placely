import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const firstId = "efebe0e0-7ae0-4af0-a0e9-a04e43e805cb";
  
  // 1. Fetch current status
  const { data: before } = await supabase
    .from('offers')
    .select('id, verification_status, offer_status')
    .eq('id', firstId)
    .single();
  console.log('Before update:', before);

  // 2. Try to update
  const newStatus = before.verification_status === 'verified' ? 'pending' : 'verified';
  console.log('Updating verification_status to:', newStatus);
  
  const res = await supabase
    .from('offers')
    .update({ verification_status: newStatus })
    .eq('id', firstId)
    .select(); // Ask for returned data
  
  console.log('Update result with select():', JSON.stringify(res, null, 2));

  // 3. Fetch again
  const { data: after } = await supabase
    .from('offers')
    .select('id, verification_status, offer_status')
    .eq('id', firstId)
    .single();
  console.log('After update:', after);
}

check();
