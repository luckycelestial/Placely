const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    // 1. Get a student user and their student profile
    const { data: user, error: getErr } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .limit(1)
      .single();

    if (getErr) {
      console.error('Error getting student user:', getErr);
      return;
    }

    const { data: student, error: getStudentErr } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (getStudentErr) {
      console.error('Error getting student:', getStudentErr);
      return;
    }

    console.log('Original User ID:', user.id);
    console.log('Original Student user_id:', student.user_id);

    const originalId = user.id;
    // Switch the last character of the UUID
    const newId = originalId.slice(0, -1) + (originalId.endsWith('2') ? '3' : '2');

    console.log(`Attempting to update user ID to ${newId}...`);

    const { error: updateErr } = await supabase
      .from('users')
      .update({ id: newId })
      .eq('id', originalId);

    if (updateErr) {
      console.error('Update user ID failed:', updateErr);
      return;
    }

    // 2. Fetch updated user and student to verify cascade
    const { data: updatedUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', newId)
      .single();

    const { data: updatedStudent } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', newId)
      .single();

    console.log('Updated User in DB:', updatedUser ? 'Found' : 'NOT FOUND');
    console.log('Updated Student user_id in DB:', updatedStudent ? updatedStudent.user_id : 'NOT FOUND');

    // Restore
    console.log('Restoring...');
    const { error: restoreErr } = await supabase
      .from('users')
      .update({ id: originalId })
      .eq('id', newId);

    if (restoreErr) console.error('Restore failed:', restoreErr);
    else console.log('Restore succeeded!');

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
