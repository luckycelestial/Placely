
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://skkxftaqryezezfyrakr.supabase.co',
  'sb_publishable_odIEZjzcDB2y8ce5L7G6Yw_6EXKIvxz'
);

async function seedJoinees() {
  console.log('Seeding joinees...');

  const { data: offers } = await supabase
    .from('offers')
    .select('id, student_id, company_id')
    .eq('acceptance_status', 'accepted')
    .limit(10);

  if (!offers) return;

  const newJoinees = offers.map(o => ({
    offer_id: o.id,
    student_id: o.student_id,
    company_id: o.company_id,
    joining_status: 'joined',
    joined_at: new Date().toISOString().split('T')[0]
  }));

  const { error } = await supabase.from('joinees').insert(newJoinees);
  if (error) console.error('Joinees Error:', error);
  else console.log(`Added ${newJoinees.length} joinees`);
}

seedJoinees();
