import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching columns for job_drives...');
  const { data: p1 } = await supabase.from('job_drives').select('*').limit(1);
  console.log('job_drives record sample keys:', p1?.[0] ? Object.keys(p1[0]) : 'no records');
  if (p1?.[0]) {
    console.log('job_drives record sample values:', p1[0]);
  }
}

run();
