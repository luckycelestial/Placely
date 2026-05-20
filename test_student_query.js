const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://skkxftaqryezezfyrakr.supabase.co';
const supabaseKey = 'sb_publishable_odIEZjzcDB2y8ce5L7G6Yw_6EXKIvxz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const studentId = '5d2eb3d7-a63f-496a-a05d-8b10337a7831'; // Akash Gupta
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        *,
        users (name, email),
        student_academics (*),
        student_profiles (*)
      `)
      .eq('id', studentId)
      .single();

    if (error) {
      console.error("Query Error:", error);
    } else {
      console.log("Student Data:", JSON.stringify(student, null, 2));
    }
  } catch (err) {
    console.error("Script Error:", err);
  }
}

test();
