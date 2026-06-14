import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching columns for student_preferences...');
  const { data: p1 } = await supabase.from('student_preferences').select('*').limit(1);
  if (p1?.[0]) {
    console.log('student_preferences record sample values:', p1[0]);
  }
}

run();
