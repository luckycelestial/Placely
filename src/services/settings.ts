import { apiCall } from "@/lib/api-client";

export interface SystemSettings {
  isAcademicYearCompleted: boolean;
  updated_at?: string;
}

export const DEFAULT_DOMAINS = ["Cloud", "Frontend", "Backend", "Fullstack", "DevOps", "AI/ML", "Data Science", "Cybersecurity", "Python", "Java"];
export const DEFAULT_GROUPS = ["Tier 1 (Product)", "Tier 2 (Service)", "Core Engineering", "Dream Offer Group", "Mass Recruiter"];

export interface CustomGroup {
  id: string;
  name: string;
  type: 'student_selectable' | 'admin_assigned';
  options: string[];
  color?: string;
  rules?: {
    minCgpa?: number;
    maxCgpa?: number;
    minLeetcode?: number;
    specialization?: string;
    dept?: string;
  };
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
      const options: string[] = [];
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

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const data = await apiCall<SystemSettings>("getSystemSettings");
    if (data) {
      if (typeof window !== "undefined") {
        localStorage.setItem("academic_year_completion", JSON.stringify(data));
      }
      return data;
    }
  } catch {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("academic_year_completion");
      if (local) {
        try { return JSON.parse(local); } catch {}
      }
    }
  }
  return { isAcademicYearCompleted: false };
}

export async function updateSystemSettings(settings: SystemSettings): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem("academic_year_completion", JSON.stringify(settings));
  }
  await apiCall("updateSystemSettings", settings);
}

export async function getSettingByKey<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const data = await apiCall<T>("getSettingByKey", key, defaultValue);
    if (data !== undefined && data !== null) {
      if (typeof window !== "undefined") {
        localStorage.setItem(`setting_${key}`, JSON.stringify(data));
      }
      return data;
    }
  } catch {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem(`setting_${key}`);
      if (local) {
        try { return JSON.parse(local) as T; } catch {}
      }
    }
  }
  return defaultValue;
}

export async function updateSettingByKey<T>(key: string, value: T): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(`setting_${key}`, JSON.stringify(value));
  }
  await apiCall("updateSettingByKey", key, value);
}
