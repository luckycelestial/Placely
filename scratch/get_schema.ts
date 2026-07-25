import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function run() {
  console.log('Fetching OpenAPI schema from Supabase rest/v1/ using fetch...');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (!res.ok) {
      console.error(`HTTP error: ${res.status}`);
      const text = await res.text();
      console.error('Response:', text);
      return;
    }
    const data = await res.json() as any;
    console.log('Schema retrieved successfully!');
    const paths = Object.keys(data.paths);
    console.log('Available tables/endpoints:', paths);
  } catch (err: any) {
    console.error('Error fetching schema:', err.message);
  }
}

run();
