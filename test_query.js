const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://skkxftaqryezezfyrakr.supabase.co';
const supabaseKey = 'sb_publishable_odIEZjzcDB2y8ce5L7G6Yw_6EXKIvxz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
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
      .limit(3);
    
    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Offers Data:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Script Error:", err);
  }
}

test();
