import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MatchStudentInfo {
  department?: string;
  batch?: string;
  specializations?: string[];
  placementGroup?: string;
}

export function isStudentInAudience(student: MatchStudentInfo, audience: string): boolean {
  if (!audience) return true;
  
  const aud = audience.trim();
  if (aud === "All Students" || aud === "All Batches" || aud === "All" || aud === "All Batches | All Groups") {
    return true;
  }

  // Check if it's our new structured JSON audience format
  if (aud.startsWith('{') && aud.endsWith('}')) {
    try {
      const parsed = JSON.parse(aud);
      const { operator, cohorts } = parsed as { operator: "AND" | "OR"; cohorts: string[] };
      if (!cohorts || cohorts.length === 0) return true;

      const matchesList = cohorts.map(cohort => {
        const c = cohort.trim().toLowerCase();
        
        // 1. Match Batch (graduation year or batch range)
        if (student.batch) {
          const b = student.batch.toLowerCase();
          if (b.includes(c) || c.includes(b)) return true;
        }

        // 2. Match Department
        if (student.department) {
          const d = student.department.toLowerCase();
          if (d === c || d.includes(c) || c.includes(d)) return true;
        }

        // 3. Match Specializations
        if (student.specializations && student.specializations.some(s => s.toLowerCase() === c || s.toLowerCase().includes(c))) {
          return true;
        }

        // 4. Match Placement Group
        if (student.placementGroup) {
          const pg = student.placementGroup.toLowerCase();
          if (pg === c || pg.includes(c)) return true;
        }

        return false;
      });

      if (operator === "AND") {
        return matchesList.every(m => m === true);
      } else {
        return matchesList.some(m => m === true);
      }
    } catch (e) {
      console.error("Failed to parse notice audience JSON:", e);
    }
  }

  // Fallback for legacy split format "Batch | Group"
  if (aud.includes(" | ")) {
    const parts = aud.split(" | ");
    const batchPart = parts[0]?.trim() || "All Batches";
    const groupPart = parts[1]?.trim() || "All Groups";

    const matchesBatch = 
      batchPart === "All Batches" || 
      batchPart === "All Students" || 
      batchPart === "All" ||
      !!(student.batch && (student.batch.includes(batchPart) || batchPart.includes(student.batch)));

    const matchesGroup = 
      groupPart === "All Groups" || 
      groupPart === "All Students" || 
      groupPart === "All" ||
      !!(student.department && (student.department.includes(groupPart) || groupPart.includes(student.department))) ||
      !!(student.specializations && student.specializations.some(s => s.includes(groupPart) || groupPart.includes(s))) ||
      !!(student.placementGroup && student.placementGroup.includes(groupPart));

    return !!(matchesBatch && matchesGroup);
  }

  // Fallback for simple legacy text match
  const lowerAud = aud.toLowerCase();
  if (student.batch && student.batch.toLowerCase().includes(lowerAud)) return true;
  if (student.department && student.department.toLowerCase().includes(lowerAud)) return true;
  if (student.specializations && student.specializations.some(s => s.toLowerCase().includes(lowerAud))) return true;
  if (student.placementGroup && student.placementGroup.toLowerCase().includes(lowerAud)) return true;

  return false;
}

export function formatAudienceDisplay(aud: string): string {
  if (!aud) return "All Students";
  if (aud.startsWith('{') && aud.endsWith('}')) {
    try {
      const parsed = JSON.parse(aud);
      const { operator, cohorts } = parsed;
      if (!cohorts || cohorts.length === 0) return "All Students";
      return `${operator === 'AND' ? 'All' : 'Any'} of: ${cohorts.join(", ")}`;
    } catch (e) {
      return aud;
    }
  }
  return aud;
}
