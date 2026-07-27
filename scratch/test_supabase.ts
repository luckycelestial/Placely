import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        name,
        register_number,
        department,
        year,
        placement_status,
        profile_completion,
        verification_status,
        users (name),
        student_contacts (personal_email),
        student_academics (cgpa),
        student_profiles (leetcode_count, specializations),
        student_preferences (placement_interest),
        offers (
          package_ctc,
          company:companies (name)
        )
      `, { count: 'exact' })
      .range(0, 14);

    if (error) {
      console.error('PostgrestError:', error);
    } else {
      console.log('Success! Data length:', data?.length);
      console.log('First student sample:', JSON.stringify(data?.[0], null, 2));
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

test();
