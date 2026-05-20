import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connecting to:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  try {
    const { data: offers, error } = await supabase
      .from('offers')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('Error fetching offers:', error);
      return;
    }
    console.log('Sample offers:', JSON.stringify(offers, null, 2));

    if (offers && offers.length > 0) {
      const firstId = offers[0].id;
      console.log('Attempting update verification on id:', firstId);
      const updateResult1 = await supabase
        .from('offers')
        .update({ verification_status: 'verified' })
        .eq('id', firstId);
      
      console.log('Update verification result:', JSON.stringify(updateResult1, null, 2));

      console.log('Attempting update status on id:', firstId);
      const updateResult2 = await supabase
        .from('offers')
        .update({ offer_status: 'accepted' })
        .eq('id', firstId);
      
      console.log('Update status result:', JSON.stringify(updateResult2, null, 2));
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

check();
