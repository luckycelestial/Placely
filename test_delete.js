const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://skkxftaqryezezfyrakr.supabase.co';
const supabaseKey = 'sb_publishable_odIEZjzcDB2y8ce5L7G6Yw_6EXKIvxz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const offerId = 'efebe0e0-7ae0-4af0-a0e9-a04e43e805cb';
    console.log("Attempting to delete offer...");
    const { data, error } = await supabase
      .from('offers')
      .delete()
      .eq('id', offerId)
      .select();
    
    if (error) {
      console.error("Delete Error:", error);
    } else {
      console.log("Delete Success:", data);
    }
  } catch (err) {
    console.error("Script Error:", err);
  }
}

test();
