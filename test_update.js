const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://skkxftaqryezezfyrakr.supabase.co';
const supabaseKey = 'sb_publishable_odIEZjzcDB2y8ce5L7G6Yw_6EXKIvxz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log("Fetching first company...");
    const { data: companies, error: fetchError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error("Fetch Error:", fetchError);
      return;
    }

    if (!companies || companies.length === 0) {
      console.log("No companies found.");
      return;
    }

    const company = companies[0];
    console.log("Original Company:", company);

    console.log("Attempting to update company name...");
    const { data: updateData, error: updateError } = await supabase
      .from('companies')
      .update({ name: company.name + " (Updated)" })
      .eq('id', company.id)
      .select();

    if (updateError) {
      console.error("Update Error:", updateError);
    } else {
      console.log("Update Result:", updateData);
    }
  } catch (err) {
    console.error("Script Error:", err);
  }
}

test();
