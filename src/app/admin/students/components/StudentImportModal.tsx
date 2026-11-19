"use client";

import { useState, useCallback, useEffect } from "react";
import { LuX, LuUpload, LuArrowRight, LuCheck } from "react-icons/lu";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { STUDENT_FIELDS, type ColumnMapping } from "../types";
import { db } from "@/services/database";

interface StudentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StudentImportModal({
  isOpen,
  onClose,
  onSuccess,
}: StudentImportModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [rawSheetData, setRawSheetData] = useState<any[][]>([]);
  const [hasHeaders, setHasHeaders] = useState<boolean>(true);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [stagingData, setStagingData] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const getColLetter = (index: number): string => {
    let col = "";
    let temp = index;
    while (temp >= 0) {
      col = String.fromCharCode((temp % 26) + 65) + col;
      temp = Math.floor(temp / 26) - 1;
    }
    return col;
  };

  const processSheetData = useCallback((jsonData: any[][], useFirstRowAsHeaders: boolean) => {
    if (jsonData.length === 0) return;

    let headers: string[] = [];
    let data: any[] = [];

    if (useFirstRowAsHeaders) {
      const maxCols = Math.max(...jsonData.map(row => row.length), 0);
      const firstRow = jsonData[0] || [];
      
      headers = Array.from({ length: maxCols }, (_, i) => {
        const val = firstRow[i];
        return val !== undefined && val !== null && String(val).trim() !== "" ? String(val).trim() : `Column ${getColLetter(i)}`;
      });

      data = jsonData.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : "";
        });
        return obj;
      });
    } else {
      const maxCols = Math.max(...jsonData.map(row => row.length), 0);
      headers = Array.from({ length: maxCols }, (_, i) => `Column ${getColLetter(i)}`);

      data = jsonData.map(row => {
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : "";
        });
        return obj;
      });
    }

    setImportHeaders(headers);
    setStagingData(data);
    
    // Auto-mapping logic
    const autoMappings: ColumnMapping[] = [];
    headers.forEach(h => {
      const match = STUDENT_FIELDS.find(f => 
        f.label.toLowerCase() === h.toLowerCase() || 
        f.id.toLowerCase() === h.toLowerCase() ||
        h.toLowerCase().includes(f.id.toLowerCase())
      );
      if (match) autoMappings.push({ source: h, target: match.id });
    });
    setMappings(autoMappings);
  }, []);

  useEffect(() => {
    if (rawSheetData.length > 0) {
      processSheetData(rawSheetData, hasHeaders);
    }
  }, [hasHeaders, rawSheetData, processSheetData]);

  const handleBulkUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = (event) => {
      let rawGridData: any[][] = [];

      if (isExcel) {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" }) as any[][];
        
        rawGridData = jsonData.filter(row => row.some(cell => cell !== "" && cell !== null && cell !== undefined));
      } else {
        const text = event.target?.result as string;
        const lines = text.split("\n").map(row => row.trim()).filter(row => row);
        rawGridData = lines.map(line => line.split(",").map(cell => cell.trim()));
      }

      if (rawGridData.length === 0) return;

      setRawSheetData(rawGridData);
      
      const firstCell = String(rawGridData[0]?.[0] || '');
      const looksLikeData = /^[A-Z0-9]{6,12}$/i.test(firstCell) || /^[0-9]+$/.test(firstCell) || firstCell === '';
      setHasHeaders(!looksLikeData);
    };

    if (isExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  const handleBulkImportConfirm = async () => {
    setIsProcessing(true);
    setProcessingStatus("Preparing data...");
    
    const mappedData = stagingData.map((row: any) => {
      const newRow: any = {};
      mappings.forEach((m: ColumnMapping) => {
        newRow[m.target] = row[m.source];
      });
      return newRow;
    });

    try {
      setProcessingStatus("Uploading to database...");
      await db.bulkCreateStudents(mappedData);
      toast.success(`Successfully imported ${mappedData.length} student records.`);
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Bulk import failed:", error);
      toast.error("Import failed. Please verify your mappings and data format.");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const handleClose = () => {
    setRawSheetData([]);
    setImportHeaders([]);
    setMappings([]);
    setStagingData([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-upload-title"
        className="bg-surface rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-border-subtle animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle">
          <div>
            <h2 id="bulk-upload-title" className="text-2xl font-black">Bulk Upload Students</h2>
            <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">Import student records via Excel or CSV</p>
          </div>
          <button 
            onClick={handleClose}
            aria-label="Close bulk upload modal"
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-black/5 text-muted transition-colors"
          >
            <LuX size={18} />
          </button>
        </div>

        {isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold text-sm text-foreground">{processingStatus}</p>
          </div>
        ) : rawSheetData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 border-2 border-dashed border-border-subtle rounded-2xl bg-background/50 hover:bg-background transition-colors p-6 text-center">
            <LuUpload size={48} className="text-primary mb-4" />
            <h3 className="font-black text-lg mb-2">Upload your spreadsheet</h3>
            <p className="text-muted text-xs font-bold uppercase tracking-wider mb-6 max-w-xs">Supports Excel (.xlsx, .xls) and CSV files</p>
            <label className="px-6 py-3 rounded-xl cursor-pointer flex items-center justify-center bg-primary text-white font-black text-xs uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all select-none mx-auto w-fit">
              Select File
              <input 
                type="file" 
                accept=".csv,.xlsx,.xls" 
                className="hidden" 
                onChange={handleBulkUploadFile} 
              />
            </label>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Headers toggle */}
            <div className="flex items-center justify-between mb-4 bg-background/50 p-3 rounded-xl border border-border-subtle shrink-0">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Configure Mapping</span>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={hasHeaders}
                  onChange={(e) => setHasHeaders(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary"
                />
                <span className="text-xs font-bold text-foreground">First Row Contains Headers</span>
              </label>
            </div>

            {/* Mapping lists */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[45vh] custom-scrollbar">
              {importHeaders.map((header) => {
                const mapping = mappings.find(m => m.source === header);
                return (
                  <div key={header} className="p-3 rounded-xl bg-background border border-border-subtle flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-wider text-muted mb-0.5">Spreadsheet Column</p>
                      <p className="text-sm font-bold text-foreground truncate">{header}</p>
                    </div>
                    <LuArrowRight size={16} className="text-muted shrink-0" />
                    <div className="w-[220px] shrink-0">
                      <SearchableSelect 
                        options={[
                          { value: "", label: "Skip Column" },
                          ...STUDENT_FIELDS.map(f => ({ value: f.id, label: f.label + (f.required ? " *" : "") }))
                        ]}
                        value={mapping?.target || ""}
                        onChange={(newTarget) => {
                          setMappings(prev => {
                            const existing = prev.filter(m => m.source !== header);
                            if (newTarget) return [...existing, { source: header, target: newTarget }];
                            return existing;
                          });
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border-subtle shrink-0">
              <button 
                onClick={() => {
                  setRawSheetData([]);
                  setImportHeaders([]);
                  setMappings([]);
                  setStagingData([]);
                }}
                className="flex-1 py-3 rounded-xl border border-border-subtle font-black text-xs uppercase tracking-widest hover:bg-background transition-colors"
              >
                Back to Upload
              </button>
              <button 
                onClick={handleBulkImportConfirm}
                disabled={mappings.length === 0}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <LuCheck size={14} />
                Confirm Import ({stagingData.length} records)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
