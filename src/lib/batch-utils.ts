/**
 * Utility functions to manage Batch calculations and Year of Study mapping.
 * Accounts for whether the academic year has been marked as completed.
 */

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

  // Parse end-year of the batch (e.g. from "2022-2026" or raw number 2026)
  let endYear = 2026;
  if (typeof batchOrYear === 'string' && batchOrYear.includes('-')) {
    const parts = batchOrYear.split('-');
    const parsed = parseInt(parts[1]);
    if (!isNaN(parsed)) {
      endYear = parsed;
    }
  } else if (!isNaN(numValue)) {
    endYear = numValue;
  }

  const cy = currentYear ?? new Date().getFullYear();
  const referenceYear = isCompleted ? cy + 1 : cy;

  // Formula: Year = 4 - (endYear - referenceYear)
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

  // If already a batch range
  if (typeof batchOrYear === 'string' && batchOrYear.includes('-')) {
    const parts = batchOrYear.split('-');
    const s = parseInt(parts[0]);
    const e = parseInt(parts[1]);
    if (!isNaN(s) && !isNaN(e)) {
      return { startYear: s, endYear: e };
    }
  }

  const numValue = Number(batchOrYear);
  // If it's a graduation end year (e.g. 2026)
  if (!isNaN(numValue) && numValue > 2000) {
    return { startYear: numValue - 4, endYear: numValue };
  }

  // If it is a legacy year number (1, 2, 3, 4), fallback using non-completed 2026 reference
  const cy = currentYear ?? new Date().getFullYear();
  const legacyYear = !isNaN(numValue) && numValue >= 1 && numValue <= 4 ? numValue : 4;
  const end = cy + 4 - legacyYear;
  return { startYear: end - 4, endYear: end };
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
): { value: string; label: string; yearNum: number }[] {
  const cy = currentYear ?? new Date().getFullYear();
  const referenceYear = isCompleted ? cy + 1 : cy;

  const batches = [];
  for (let yr = 4; yr >= 1; yr--) {
    const endYear = referenceYear + 4 - yr;
    const startYear = endYear - 4;
    batches.push({
      value: String(endYear),
      label: `${startYear}-${endYear} (${getRomanYear(yr)})`,
      yearNum: yr,
    });
  }
  return batches;
}

export function getRomanYear(yearNum: number): string {
  const romanMap: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
  return romanMap[yearNum] || 'IV';
}

export function formatYearOfStudy(yearNum: number): string {
  return `${getRomanYear(yearNum)} Year`;
}

