export const DEPARTMENTS = ["All Departments", "AI&DS", "AI&ML", "CSE", "CYS", "CSBS", "CCE", "ECE", "EEE", "MECH", "IT"] as const;
export const STATUSES = ["All Statuses", "Placed", "Unplaced", "Applied", "In-Process"] as const;

export interface ColumnMapping {
  source: string;
  target: string;
}

export interface StudentFieldDef {
  id: string;
  label: string;
  required: boolean;
  validate?: (v: unknown) => true | string;
}

export const STUDENT_FIELDS: StudentFieldDef[] = [
  { id: "register_number", label: "Register Number", required: true, validate: (v: unknown) => typeof v === 'string' && (/^[A-Z0-9]{6,12}$/i.test(v)) || "Must be 6-12 alphanumeric characters" },
  { id: "name", label: "Full Name", required: true, validate: (v: unknown) => (typeof v === 'string' && v.length >= 3) || "Name too short" },
  { id: "email", label: "College Email (Login)", required: true, validate: (v: unknown) => (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || "Invalid email format" },
  { id: "personal_email", label: "Personal Email", required: false, validate: (v: unknown) => !v || (typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || "Invalid email format" },
  { id: "department", label: "Department", required: true, validate: (v: unknown) => (typeof v === 'string' && ["AI&DS", "AI&ML", "CSE", "CYS", "CSBS", "CCE", "ECE", "EEE", "MECH", "IT"].includes(v)) || "Must be one of: AI&DS, AI&ML, CSE, CYS, CSBS, CCE, ECE, EEE, MECH, IT" },
  { id: "year", label: "Batch", required: true, validate: (v: unknown) => [1, 2, 3, 4].includes(Number(v)) || (Number(v) >= 2000 && Number(v) <= 2100) || "Must be 1-4 or a valid Batch end-year (e.g. 2026)" },
  { id: "roll_number", label: "Roll Number", required: false },
  { id: "section", label: "Section", required: false },
  { id: "gender", label: "Gender", required: false, validate: (v: unknown) => (typeof v === 'string' && ["Male", "Female", "Other", ""].includes(v)) || "Must be Male, Female, or Other" },
  { id: "date_of_birth", label: "Date of Birth (YYYY-MM-DD)", required: false },
  { id: "phone", label: "Mobile Number", required: false },
  { id: "address", label: "Address", required: false },
  { id: "permanent_address", label: "Permanent Address", required: false },
  { id: "city", label: "City", required: false },
  { id: "state", label: "State", required: false },
  { id: "pincode", label: "Pincode", required: false },
  { id: "cgpa", label: "CGPA", required: false, validate: (v: unknown) => (Number(v) >= 0 && Number(v) <= 10) || "Must be 0-10" },
  { id: "tenth_score", label: "10th Score (%)", required: false, validate: (v: unknown) => (Number(v) >= 0 && Number(v) <= 100) || "Must be 0-100" },
  { id: "twelfth_score", label: "12th Score (%)", required: false, validate: (v: unknown) => (Number(v) >= 0 && Number(v) <= 100) || "Must be 0-100" },
  { id: "diploma_score", label: "Diploma Score (%)", required: false, validate: (v: unknown) => !v || (Number(v) >= 0 && Number(v) <= 100) || "Must be 0-100" },
  { id: "active_arrears", label: "Active Arrears (Current)", required: false, validate: (v: unknown) => Number(v) >= 0 || "Cannot be negative" },
  { id: "history_of_arrears", label: "History of Arrears (true/false)", required: false, validate: (v: unknown) => ["true","false","0","1","yes","no",""].includes(String(v).toLowerCase()) || "Must be true or false" },
  { id: "backlog_count", label: "Total Backlog Count", required: false, validate: (v: unknown) => Number(v) >= 0 || "Cannot be negative" },
  { id: "linkedin_url", label: "LinkedIn URL", required: false },
  { id: "github_url", label: "GitHub URL", required: false },
  { id: "portfolio_url", label: "Portfolio URL", required: false },
  { id: "resume_url", label: "Resume URL", required: false },
];

export interface AdminStudent {
  id: string;
  name: string;
  regNo: string;
  rollNo?: string;
  gender?: string;
  dob?: string;
  email?: string;
  personal_email?: string;
  dept: string;
  section?: string;
  year: string;
  cgpa: number;
  tenth_score?: number;
  twelfth_score?: number;
  diploma_score?: number | null;
  backlog_count?: number;
  active_arrears?: number;
  history_of_arrears?: boolean;
  semester_cgpa?: Record<string, number>;
  leetcode: number;
  specializations: string[];
  completeness: number;
  verification: string;
  status: string;
  company?: string;
  package_ctc?: string | number;
  eligible: boolean;
  reason?: string;
}

export type SortField = 'name' | 'dept' | 'cgpa' | 'technical' | 'profile' | 'status';
