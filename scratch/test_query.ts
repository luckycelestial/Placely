
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://skkxftaqryezezfyrakr.supabase.co',
  'sb_publishable_odIEZjzcDB2y8ce5L7G6Yw_6EXKIvxz'
);

async function test() {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      students (
        register_number,
        users (
          name
        )
      ),
      job_drives (
        role_title,
        companies (
          name
        )
      )
    `)
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}

test();
