import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing startups table...');
  const { data, error } = await supabase
    .from('startups')
    .select('*')
    .limit(1);
  if (error) {
    console.log('Error querying startups:', error.message);
  } else {
    console.log('Startups table exists! Sample data:', data);
  }
}

run();
