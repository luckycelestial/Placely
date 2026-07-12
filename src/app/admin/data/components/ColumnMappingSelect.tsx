"use client";

import { cn } from '@/lib/utils';
import type { Option } from '@/components/ui/SearchableSelect';

interface ColumnMappingSelectProps {
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
}

/**
 * Styled native <select> for column mapping inside react-data-grid headers.
 * - Uses `defaultValue` (uncontrolled) so React never overwrites the DOM selection
 *   on re-renders triggered by setMappings().
 * - Parent stores mappings in a ref; setMappings only updates the validation badge.
 * - The select itself is the source of truth for the current selection.
 */
export function ColumnMappingSelect({ options, defaultValue, onChange }: ColumnMappingSelectProps) {
  return (
    <select
      defaultValue={defaultValue ?? ""}
      onChange={e => {
        e.stopPropagation();
        onChange(e.target.value);
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      className={cn(
        "w-full rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-xs font-bold",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none",
        "text-foreground hover:border-primary/40 transition-colors",
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23d4413a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 8px center",
        paddingRight: "28px",
        fontFamily: "inherit",
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
