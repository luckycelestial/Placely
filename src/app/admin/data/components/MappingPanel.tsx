"use client";

import { LuFilter, LuCheck, LuTriangleAlert } from "react-icons/lu";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { getBatchList } from "@/lib/batch-utils";
import { cn } from "@/lib/utils";

interface MappingPanelProps {
  sheetNames: string[];
  selectedSheet: string;
  hasHeaders: boolean;
  importBatchYear: string;
  isCompleted: boolean;
  activeTable: string;
  validationErrors: Record<number, string[]>;
  onSheetChange: (v: string) => void;
  onHasHeadersChange: (v: boolean) => void;
  onBatchYearChange: (v: string) => void;
  onDiscard: () => void;
  onConfirm: () => void;
  onErrorClick?: () => void;
}

export function MappingPanel({
  sheetNames,
  selectedSheet,
  hasHeaders,
  importBatchYear,
  isCompleted,
  activeTable,
  validationErrors,
  onSheetChange,
  onHasHeadersChange,
  onBatchYearChange,
  onDiscard,
  onConfirm,
  onErrorClick,
}: MappingPanelProps) {
  const errorCount = Object.keys(validationErrors).length;

  return (
    <div className="bg-primary/5 border-b border-primary/10 px-6 py-4 animate-in slide-in-from-top duration-300 flex-shrink-0">
      {/* Row 1: title + action buttons */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
            <LuFilter size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase tracking-wider truncate">Map your columns</h3>
            <p className="text-[10px] font-bold text-muted uppercase truncate">Align spreadsheet headers with Placely fields</p>
          </div>
        </div>

        {/* Action buttons — always visible on the right */}
        <div className="flex items-center gap-2 shrink-0">
          {errorCount > 0 && (
            <button
              onClick={onErrorClick}
              title="Click to view details and resolution steps"
              className="flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50/80 px-2.5 py-1 rounded-lg border border-red-200/60 bg-red-50/40 text-[10px] font-bold cursor-pointer transition-all active:scale-95 animate-pulse"
            >
              <LuTriangleAlert size={13} className="shrink-0" />
              {errorCount} errors (View Info)
            </button>
          )}
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 rounded-lg bg-white border border-border-subtle text-[10px] font-black uppercase tracking-widest hover:bg-background transition-all"
          >
            Discard
          </button>
          <button
            onClick={onConfirm}
            disabled={errorCount > 0}
            className={cn(
              "px-3 py-1.5 rounded-lg text-white text-[10px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-1.5",
              errorCount > 0 ? "bg-muted cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
            )}
          >
            <LuCheck size={12} />
            Finish Import
          </button>
        </div>
      </div>

      {/* Row 2: controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {sheetNames.length > 1 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border-subtle rounded-xl shadow-sm shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted whitespace-nowrap">Sheet</span>
            <div className="w-40">
              <SearchableSelect
                options={sheetNames.map(name => ({ value: name, label: name }))}
                value={selectedSheet}
                onChange={onSheetChange}
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 bg-white border border-border-subtle rounded-xl shadow-sm shrink-0">
          <input
            type="checkbox"
            checked={hasHeaders}
            onChange={e => onHasHeadersChange(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
          />
          <span className="text-[10px] font-black uppercase tracking-wider text-muted whitespace-nowrap">
            First Row = Headers
          </span>
        </label>

        {activeTable === "students" && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border-subtle rounded-xl shadow-sm shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted whitespace-nowrap">Target Batch</span>
            <div className="w-32">
              <SearchableSelect
                options={getBatchList(isCompleted).map(b => {
                  const endYear = Number(b.value);
                  return { value: b.value, label: `${endYear - 4}-${endYear}` };
                })}
                value={importBatchYear}
                onChange={onBatchYearChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
