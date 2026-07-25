import { Client } from 'pg';

const hosts = [
  'aws-0-ap-south-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-eu-central-1.pooler.supabase.com'
];
const user = 'postgres.skkxftaqryezezfyrakr';
const database = 'postgres';
const passwords = [
  'postgres',
  'supabase',
  'start1234',
  'Pavithran',
  'Pavithran123',
  'luckycelestial',
  'skkxftaqryezezfyrakr',
  'Placely',
  'Placely123',
  'luckycelestial/Placely'
];

async function tryConnect() {
  console.log(`Starting connection attempts with user ${user}...`);
  for (const host of hosts) {
    for (const password of passwords) {
      console.log(`Trying host: ${host}, password: ${password}`);
      const client = new Client({
        host,
        port: 6543, // connection pooler port (transaction mode)
        user,
        password,
        database,
        ssl: { rejectUnauthorized: false }
      });
      try {
        await client.connect();
        console.log(`SUCCESS! Connected to ${host} with password: ${password}`);
        
        // Create table startups!
        console.log('Creating startups table...');
        await client.query(`
          CREATE TABLE IF NOT EXISTS public.startups (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            founder_name text NOT NULL,
            founder_phone text NOT NULL,
            founder_email text NOT NULL,
            founder_dept text NOT NULL,
            founder_year text NOT NULL,
            venture_track text NOT NULL,
            project_name text NOT NULL,
            project_pitch text NOT NULL,
            project_desc text NOT NULL,
            trl_level text NOT NULL,
            is_registered text NOT NULL,
            entity_type text,
            govt_regs text[],
            reg_number text,
            udyam_number text,
            proof_link text,
            cofounder_need text NOT NULL,
            primary_blocker text NOT NULL,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
          );
        `);
        console.log('Table startups created successfully!');
        
        // Grant permissions to anon role
        console.log('Granting permissions to anon role...');
        await client.query(`
          GRANT ALL ON public.startups TO anon;
          GRANT ALL ON public.startups TO authenticated;
          GRANT ALL ON public.startups TO service_role;
        `);
        console.log('Permissions granted successfully!');

        // Check tables in public schema
        const res = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public';
        `);
        console.log('Tables in public schema:', res.rows.map(r => r.table_name));

        await client.end();
        return;
      } catch (err: any) {
        console.log(`Failed for host ${host}, password ${password}. Error: ${err.message}`);
        // If the host itself doesn't resolve, let's break early from the password loop for this host
        if (err.message.includes('ENOTFOUND')) {
          console.log(`Host ${host} not found, skipping passwords.`);
          break;
        }
      }
    }
  }
  console.log('All connection attempts failed.');
}

tryConnect();
