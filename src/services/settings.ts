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

export const DEFAULT_DOMAINS = ["Cloud", "Frontend", "Backend", "Fullstack", "DevOps", "AI/ML", "Data Science", "Cybersecurity", "Python", "Java"];
export const DEFAULT_GROUPS = ["Tier 1 (Product)", "Tier 2 (Service)", "Core Engineering", "Dream Offer Group", "Mass Recruiter"];

export interface CustomGroup {
  id: string;
  name: string;
  type: 'student_selectable' | 'admin_assigned';
  options: string[];
}

export const DEFAULT_CUSTOM_GROUPS: CustomGroup[] = [
  {
    id: "tech_domains",
    name: "Tech Domains",
    type: "student_selectable",
    options: ["Cloud", "Frontend", "Backend", "Fullstack", "DevOps", "AI/ML", "Data Science", "Cybersecurity", "Python", "Java"]
  },
  {
    id: "placement_group",
    name: "Placement Group",
    type: "admin_assigned",
    options: ["Group A", "Group B", "Group C"]
  },
  {
    id: "departments",
    name: "Departments",
    type: "admin_assigned",
    options: ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"]
  },
  {
    id: "batches",
    name: "Batches",
    type: "admin_assigned",
    options: (() => {
      const currentYear = new Date().getFullYear();
      const options = [];
      for (let i = 4; i >= 1; i--) {
        const startYear = currentYear - (i - 1);
        const endYear = startYear + 4;
        options.push(`${startYear}-${endYear}`);
      }
      return options;
    })()
  },
  {
    id: "placement_lock",
    name: "Placement Lock",
    type: "admin_assigned",
    options: ["Active", "Deactive"]
  }
];

export async function getSettingByKey<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('setting_value_json')
      .eq('setting_key', key)
      .maybeSingle();

    if (error) {
      console.warn(`Error fetching setting key ${key}:`, error);
    }

    if (data?.setting_value_json) {
      return data.setting_value_json as T;
    }

    // Check localStorage fallback for client side
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(`setting_${key}`);
      if (local) {
        return JSON.parse(local) as T;
      }
    }
    return defaultValue;
  } catch (e) {
    console.error(`Error fetching setting key ${key}:`, e);
    // fallback to localStorage
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(`setting_${key}`);
      if (local) {
        return JSON.parse(local) as T;
      }
    }
    return defaultValue;
  }
}

export async function updateSettingByKey<T>(key: string, value: T): Promise<void> {
  // Sync to localStorage immediately for instant UI response
  if (typeof window !== 'undefined') {
    localStorage.setItem(`setting_${key}`, JSON.stringify(value));
  }

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('settings')
      .select('id')
      .eq('setting_key', key)
      .maybeSingle();

    if (fetchError) {
      console.warn(`Error fetching existing setting ${key}, attempting upsert:`, fetchError);
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('settings')
        .update({
          setting_value_json: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from('settings')
        .insert([{
          setting_key: key,
          setting_value_json: value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (insertError) throw insertError;
    }
  } catch (e) {
    console.error(`Failed to sync setting ${key} to Supabase:`, e);
  }
}

