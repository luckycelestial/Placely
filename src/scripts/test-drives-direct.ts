import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    let query = supabase
      .from('job_drives')
      .select(`
        *,
        companies (
          name,
          logo_url,
          theme_color
        ),
        applications ( count )
      `);

    const { data, error } = await query.order('created_at', { ascending: false }).limit(2);
    if (error) throw error;
    console.log('--- EXACT RESPONSE ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error running test:', err);
  }
}

run();
