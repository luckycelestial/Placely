import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectApps() {
  try {
    const { data: apps, error } = await supabase.from('applications').select('*').limit(1);
    console.log('--- applications columns ---');
    console.log(apps && apps.length > 0 ? Object.keys(apps[0]) : 'Empty');
    console.log('--- applications sample row ---');
    console.log(apps && apps.length > 0 ? apps[0] : 'None');

    const { data: timeline } = await supabase.from('application_timeline').select('*').limit(1);
    console.log('--- application_timeline columns ---');
    console.log(timeline && timeline.length > 0 ? Object.keys(timeline[0]) : 'Empty');
  } catch (err) {
    console.error(err);
  }
}

inspectApps();
