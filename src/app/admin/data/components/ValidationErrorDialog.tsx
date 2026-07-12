"use client";

import { LuX, LuTriangleAlert } from "react-icons/lu";

interface ValidationErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  validationErrors: Record<number, string[]>;
  stagingData: any[];
}

export function ValidationErrorDialog({
  isOpen,
  onClose,
  validationErrors,
  stagingData,
}: ValidationErrorDialogProps) {
  if (!isOpen) return null;

  // Group errors by field/error type to provide helpful summary
  const errorSummary: Record<string, { count: number; examples: string[]; rule: string }> = {};

  Object.entries(validationErrors).forEach(([rowIndexStr, errors]) => {
    const rowIndex = parseInt(rowIndexStr, 10);
    const row = stagingData[rowIndex] || {};
    
    errors.forEach(err => {
      // Format is usually "Field Label: error message"
      const parts = err.split(":");
      const fieldLabel = parts[0]?.trim() || "Unknown Field";
      const errorMessage = parts.slice(1).join(":").trim() || "Invalid value";
      
      const key = `${fieldLabel}||${errorMessage}`;
      
      if (!errorSummary[key]) {
        errorSummary[key] = {
          count: 0,
          examples: [],
          rule: errorMessage,
        };
      }
      
      errorSummary[key].count += 1;
      
      // Try to find the raw value in the row to show as example
      const matchingVal = Object.values(row).find(v => {
        // Simple heuristic to show what values failed
        if (typeof v === "string" && v.trim() !== "") {
          if (errorMessage.toLowerCase().includes("email") && v.includes("@")) return true;
          if (errorMessage.toLowerCase().includes("male") && (v === "M" || v === "F" || v === "m" || v === "f")) return true;
          if (errorMessage.toLowerCase().includes("alphanumeric") && v.length >= 6) return true;
        }
        return false;
      });
      
      const exampleVal = matchingVal ? String(matchingVal) : JSON.stringify(row).slice(0, 30) + "...";
      if (errorSummary[key].examples.length < 3 && !errorSummary[key].examples.includes(exampleVal)) {
        errorSummary[key].examples.push(exampleVal);
      }
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-border-subtle max-w-lg w-full mx-4 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <LuTriangleAlert size={20} />
            </div>
            <div>
              <h3 className="text-md font-black text-foreground">Import Validation Errors</h3>
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
                {Object.keys(validationErrors).length} rows have invalid data format
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="h-8 w-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-muted hover:text-foreground transition-all"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Resolution Guideline */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/60 flex gap-3 text-amber-800">
            <LuTriangleAlert size={18} className="shrink-0 mt-0.5" />
            <div className="text-xs font-semibold space-y-1">
              <p className="font-bold">How to resolve:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Check your spreadsheet values match the required formats below.</li>
                <li>Verify your column mappings — make sure spreadsheet columns are mapped to the correct Placely fields.</li>
                <li>You can select <span className="font-bold">"Skip Column"</span> in the header to skip non-critical columns that contain formatting errors.</li>
              </ul>
            </div>
          </div>

          {/* List of errors */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted">Error Details</h4>
            
            {Object.entries(errorSummary).map(([key, info]) => {
              const [fieldLabel, rule] = key.split("||");
              return (
                <div key={key} className="p-4 border border-border-subtle rounded-2xl bg-surface space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground uppercase tracking-wider">{fieldLabel}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 text-[10px] font-black uppercase">
                      {info.count} rows affected
                    </span>
                  </div>
                  
                  <div className="text-[11px] font-medium text-muted">
                    <span className="font-bold text-foreground">Rule:</span> {rule}
                  </div>

                  {info.examples.length > 0 && (
                    <div className="text-[10px] font-bold text-muted flex gap-1 items-center flex-wrap">
                      <span className="text-foreground uppercase tracking-widest text-[9px]">Examples of failed values:</span>
                      {info.examples.map((ex, idx) => (
                        <code key={idx} className="bg-black/5 px-1.5 py-0.5 rounded border border-black/10 font-mono text-[9px] text-red-600">
                          {ex}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-surface/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all"
          >
            Okay, I'll Fix It
          </button>
        </div>

      </div>
    </div>
  );
}
