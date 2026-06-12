import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing placement_group on student_profiles...');
  const { data: p1, error: e1 } = await supabase
    .from('student_profiles')
    .select('placement_group')
    .limit(1);
  console.log('Profiles placement_group test:', e1 ? e1.message : 'SUCCESS!');

  console.log('Testing placement_group on student_preferences...');
  const { data: p2, error: e2 } = await supabase
    .from('student_preferences')
    .select('placement_group')
    .limit(1);
  console.log('Preferences placement_group test:', e2 ? e2.message : 'SUCCESS!');

  console.log('Testing placement_group on students...');
  const { data: p3, error: e3 } = await supabase
    .from('students')
    .select('placement_group')
    .limit(1);
  console.log('Students placement_group test:', e3 ? e3.message : 'SUCCESS!');
}

run();
