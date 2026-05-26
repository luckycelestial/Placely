import { supabase } from '@/lib/supabase';

export interface SystemSettings {
  isAcademicYearCompleted: boolean;
  updated_at?: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('setting_value_json')
      .eq('setting_key', 'academic_year_completion')
      .maybeSingle();

    if (error) {
      console.warn('Supabase settings query error, checking localStorage:', error);
    }

    if (data?.setting_value_json) {
      return data.setting_value_json as SystemSettings;
    }

    // Check localStorage fallback for client side
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('academic_year_completion');
      if (local) {
        return JSON.parse(local);
      }
    }
    return { isAcademicYearCompleted: false };
  } catch (e) {
    console.error('Error fetching settings:', e);
    // fallback to localStorage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('academic_year_completion');
      if (local) {
        return JSON.parse(local);
      }
    }
    return { isAcademicYearCompleted: false };
  }
}

export async function updateSystemSettings(settings: SystemSettings): Promise<void> {
  const payload = {
    isAcademicYearCompleted: settings.isAcademicYearCompleted,
    updated_at: new Date().toISOString()
  };

  // Sync to localStorage immediately for instant UI response
  if (typeof window !== 'undefined') {
    localStorage.setItem('academic_year_completion', JSON.stringify(payload));
  }

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('settings')
      .select('id')
      .eq('setting_key', 'academic_year_completion')
      .maybeSingle();

    if (fetchError) {
      console.warn('Error fetching existing settings, attempting upsert:', fetchError);
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('settings')
        .update({
          setting_value_json: payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('settings')
        .insert([{
          setting_key: 'academic_year_completion',
          setting_value_json: payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (insertError) throw insertError;
    }
  } catch (e) {
    console.error('Failed to sync settings to Supabase, local-only update applied:', e);
  }
}
