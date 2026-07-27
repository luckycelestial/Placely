/**
 * Utility functions to manage Batch (Graduation Year) calculations and Year of Study mapping.
 * Accounts for whether the academic year has been marked as completed.
 */

export function isValidBatchInput(input: string | number | null | undefined): boolean {
  if (input === null || input === undefined) return false;
  const str = String(input).trim();
  // Valid formats: 4-digit graduation year (2020-2035) or range "2024-2028" or legacy single digit (1-4)
  const rangeRegex = /^20\d{2}-20\d{2}$/;
  const yearRegex = /^20\d{2}$/;
  const legacyRegex = /^[1-4]$/;
  return rangeRegex.test(str) || yearRegex.test(str) || legacyRegex.test(str);
}

export function getYearFromBatch(
  batchOrYear: string | number | null | undefined,
  isCompleted: boolean,
  currentYear?: number
): number {
  if (batchOrYear === null || batchOrYear === undefined) {
    return 4; // Default fallback
  }

  // Handle legacy numbers: if the database contains raw year 1, 2, 3, 4
  const numValue = Number(batchOrYear);
  if (!isNaN(numValue) && numValue >= 1 && numValue <= 4) {
    return numValue;
  }

  // Parse end-year of the batch (e.g. from "2024-2028" or raw number 2028)
  let endYear = 2026;
  if (typeof batchOrYear === 'string' && batchOrYear.includes('-')) {
    const parts = batchOrYear.split('-');
    const parsed = parseInt(parts[1]);
    if (!isNaN(parsed)) {
      endYear = parsed;
    }
  } else if (!isNaN(numValue) && numValue > 2000) {
    endYear = numValue;
  }

  const cy = currentYear ?? new Date().getFullYear();
  const referenceYear = isCompleted ? cy + 1 : cy;

  // Formula: Year of study = 4 - (endYear - referenceYear)
  const yr = 4 - (endYear - referenceYear);
  return Math.max(1, Math.min(4, yr));
}

export function getBatchRangeFromYear(
  batchOrYear: string | number | null | undefined,
  currentYear?: number
): { startYear: number; endYear: number } {
  if (batchOrYear === null || batchOrYear === undefined) {
    const cy = currentYear ?? new Date().getFullYear();
    return { startYear: cy - 4, endYear: cy };
  }

  // If already a batch range (e.g. 2024-2028)
  if (typeof batchOrYear === 'string' && batchOrYear.includes('-')) {
    const parts = batchOrYear.split('-');
    const s = parseInt(parts[0]);
    const e = parseInt(parts[1]);
    if (!isNaN(s) && !isNaN(e)) {
      return { startYear: s, endYear: e };
    }
  }

  const numValue = Number(batchOrYear);
  // If it's a graduation end year (e.g. 2028)
  if (!isNaN(numValue) && numValue > 2000) {
    return { startYear: numValue - 4, endYear: numValue };
  }

  // Fallback for legacy numeric year (1-4)
  const cy = currentYear ?? new Date().getFullYear();
  const legacyYear = !isNaN(numValue) && numValue >= 1 && numValue <= 4 ? numValue : 4;
  const end = cy + 4 - legacyYear;
  return { startYear: end - 4, endYear: end };
}

export interface BatchDetails {
  graduationYear: number;
  startYear: number;
  batchRange: string;
  yearOfStudy: number;
  romanYear: string;
  yearOfStudyLabel: string;
  formatLabel: string;
  isAlumni: boolean;
}

export function getBatchDetails(
  batchOrYear: string | number | null | undefined,
  isCompleted: boolean,
  currentYear?: number
): BatchDetails {
  const range = getBatchRangeFromYear(batchOrYear, currentYear);
  const yearNum = getYearFromBatch(batchOrYear, isCompleted, currentYear);
  const cy = currentYear ?? new Date().getFullYear();
  const referenceYear = isCompleted ? cy + 1 : cy;
  const isAlumni = range.endYear < referenceYear;

  const roman = getRomanYear(yearNum);
  const yearOfStudyLabel = isAlumni ? "Graduated (Alumni)" : `${roman} Year (${yearNum}${getOrdinalSuffix(yearNum)} Year)`;
  const batchRange = `${range.startYear}-${range.endYear}`;
  const formatLabel = `${batchRange} • ${yearOfStudyLabel}`;

  return {
    graduationYear: range.endYear,
    startYear: range.startYear,
    batchRange,
    yearOfStudy: isAlumni ? 0 : yearNum,
    romanYear: isAlumni ? "Alumni" : roman,
    yearOfStudyLabel,
    formatLabel,
    isAlumni
  };
}

export function getBatchFromYear(
  yearNum: number,
  isCompleted: boolean,
  currentYear?: number
): string {
  const cy = currentYear ?? new Date().getFullYear();
  const referenceYear = isCompleted ? cy + 1 : cy;
  const endYear = referenceYear + 4 - yearNum;
  const startYear = endYear - 4;
  return `${startYear}-${endYear}`;
}

export function getBatchList(
  isCompleted: boolean,
  currentYear?: number
): { value: string; label: string; yearNum: number; graduationYear: number }[] {
  const cy = currentYear ?? new Date().getFullYear();
  const referenceYear = isCompleted ? cy + 1 : cy;

  const batches = [];
  for (let yr = 4; yr >= 1; yr--) {
    const endYear = referenceYear + 4 - yr;
    const startYear = endYear - 4;
    batches.push({
      value: String(endYear),
      label: `${startYear}-${endYear} (${getRomanYear(yr)} Year)`,
      yearNum: yr,
      graduationYear: endYear
    });
  }
  return batches;
}

export function getRomanYear(yearNum: number): string {
  const romanMap: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
  return romanMap[yearNum] || 'IV';
}

export function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function formatYearOfStudy(yearNum: number): string {
  return `${getRomanYear(yearNum)} Year (${yearNum}${getOrdinalSuffix(yearNum)} Year)`;
}

