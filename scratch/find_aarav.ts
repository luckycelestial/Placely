
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findAarav() {
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('*')
    .ilike('name', '%Aarav%');

  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  if (users && users.length > 0) {
    console.log('Found Aarav users:', JSON.stringify(users, null, 2));
    
    // Get student record
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*, users(*)')
      .in('user_id', users.map(u => u.id));

    if (studentError) {
        console.error('Error fetching students:', studentError);
        return;
    }
    console.log('Found Aarav student records:', JSON.stringify(students, null, 2));
  } else {
    console.log('No user found with name Aarav');
    
    // List all users to see what we have
    const { data: allUsers } = await supabase.from('users').select('id, name').limit(5);
    console.log('Sample users in DB:', JSON.stringify(allUsers, null, 2));
  }
}

findAarav();
