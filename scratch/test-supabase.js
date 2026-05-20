const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    const testId = 'efebe0e0-7ae0-4af0-a0e9-a04e43e805cb';
    console.log('Testing update with .select().single() on id:', testId);
    
    const { data, error } = await supabase
      .from('offers')
      .update({ verification_status: 'pending' })
      .eq('id', testId)
      .select()
      .single();

    if (error) {
      console.log('Error returned by Supabase:');
      console.log('Code:', error.code);
      console.log('Message:', error.message);
      console.log('Details:', error.details);
      console.log('Hint:', error.hint);
    } else {
      console.log('Update & select successful! Data:', data);
    }
  } catch (err) {
    console.error('Execution exception:', err);
  }
}

run();
