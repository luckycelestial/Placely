const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  try {
    // 1. Get current admin
    const { data: user, error: getErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'pavithran.poona@gmail.com')
      .single();

    if (getErr) {
      console.error('Error getting admin:', getErr);
      return;
    }

    console.log('Original Admin User:', user);

    // 2. Try to update id to a new temporary UUID
    const originalId = user.id;
    // Just toggle the last character of the UUID to test
    const newId = originalId.slice(0, -1) + (originalId.endsWith('2') ? '3' : '2');

    console.log(`Attempting to update user ID from ${originalId} to ${newId}...`);

    const { data: updateData, error: updateErr } = await supabase
      .from('users')
      .update({ id: newId })
      .eq('email', 'pavithran.poona@gmail.com')
      .select();

    if (updateErr) {
      console.error('Update failed. Error details:', updateErr);
    } else {
      console.log('Update succeeded!', updateData);
      
      // Restore the original ID
      console.log('Restoring original ID...');
      const { error: restoreErr } = await supabase
        .from('users')
        .update({ id: originalId })
        .eq('email', 'pavithran.poona@gmail.com');
      if (restoreErr) console.error('Restore failed:', restoreErr);
      else console.log('Restore succeeded!');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
