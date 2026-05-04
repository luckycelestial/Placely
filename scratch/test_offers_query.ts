
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://skkxftaqryezezfyrakr.supabase.co',
  'sb_publishable_odIEZjzcDB2y8ce5L7G6Yw_6EXKIvxz'
);

async function test() {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      students (
        register_number,
        users (
          name
        )
      ),
      companies (
        name
      ),
      job_drives (
        title
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
