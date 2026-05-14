"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { DataGrid, SelectColumn, renderTextEditor } from "react-data-grid";
import type { Column, RenderCellProps, RenderEditCellProps } from "react-data-grid";
import * as XLSX from "xlsx";
import "react-data-grid/lib/styles.css";
import { 
  LuUpload, 
  LuDownload, 
  LuSave, 
  LuX, 
  LuCheck, 
  LuTriangleAlert,
  LuFileSpreadsheet,
  LuDatabase,
  LuHistory,
  LuPlus,
  LuArrowRight,
  LuSearch,
  LuFilter,
  LuChevronRight,
  LuChevronLeft
} from "react-icons/lu";
import { db } from "@/services/database";
import { cn } from "@/lib/utils";

interface ColumnMapping {
  source: string;
  target: string;
}

const STUDENT_FIELDS = [
  { id: "register_number", label: "Register Number", required: true, validate: (v: string) => /^[A-Z0-9]{6,12}$/i.test(v) || "Must be 6-12 alphanumeric characters" },
  { id: "name", label: "Full Name", required: true, validate: (v: string) => v?.length >= 3 || "Name too short" },
  { id: "email", label: "Email Address", required: true, validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Invalid email format" },
  { id: "department", label: "Department", required: true },
  { id: "year", label: "Year of Study", required: true, validate: (v: any) => [1, 2, 3, 4].includes(Number(v)) || "Must be 1-4" },
  { id: "cgpa", label: "CGPA", required: false, validate: (v: any) => (Number(v) >= 0 && Number(v) <= 10) || "Must be 0-10" },
  { id: "tenth_score", label: "10th Score", required: false, validate: (v: any) => (Number(v) >= 0 && Number(v) <= 100) || "Must be 0-100" },
  { id: "twelfth_score", label: "12th Score", required: false, validate: (v: any) => (Number(v) >= 0 && Number(v) <= 100) || "Must be 0-100" },
  { id: "backlog_count", label: "Backlogs", required: false, validate: (v: any) => Number(v) >= 0 || "Cannot be negative" },
];

const TABLES = [
  { id: "students", label: "Students", icon: <LuDatabase size={14} /> },
  { id: "student_academics", label: "Academics", icon: <LuFileSpreadsheet size={14} /> },
  { id: "student_contacts", label: "Contacts", icon: <LuDatabase size={14} /> },
  { id: "student_profiles", label: "Profiles", icon: <LuDatabase size={14} /> },
  { id: "companies", label: "Companies", icon: <LuDatabase size={14} /> },
  { id: "job_drives", label: "Job Drives", icon: <LuDatabase size={14} /> },
  { id: "applications", label: "Applications", icon: <LuDatabase size={14} /> },
  { id: "offers", label: "Offers", icon: <LuDatabase size={14} /> },
  { id: "joinees", label: "Joinees", icon: <LuDatabase size={14} /> },
  { id: "notices", label: "Notices", icon: <LuDatabase size={14} /> },
  { id: "events", label: "Events", icon: <LuDatabase size={14} /> },
  { id: "tasks", label: "Tasks", icon: <LuDatabase size={14} /> },
  { id: "users", label: "Users", icon: <LuDatabase size={14} /> },
];

export default function DataWorkspacePage() {
  const [activeTable, setActiveTable] = useState("students");
  const [activeTab, setActiveTab] = useState<"live" | "staging">("live");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [stagingData, setStagingData] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isMappingMode, setIsMappingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("4");
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(new Set());

  // Fetch Live Data for Active Table
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getTableData(activeTable);
      // If students, join with users to get name/email for compatibility with STUDENT_FIELDS logic
      if (activeTable === "students") {
        const enriched = await db.getAllStudents();
        setRows(enriched);
      } else {
        setRows(data);
      }
    } catch (error) {
      console.error("Failed to load table data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTable]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Generate Columns dynamically from data
  const columns = useMemo((): Column<any>[] => {
    if (activeTab === "staging" && !isMappingMode) {
      return importHeaders.map(h => ({
        key: h,
        name: h,
        resizable: true,
        editable: true,
        renderEditCell: renderTextEditor
      }));
    }

    if (rows.length === 0 && stagingData.length === 0) return [];

    const dataToUse = activeTab === "live" ? rows : stagingData;
    if (dataToUse.length === 0) return [];

    const keys = Object.keys(dataToUse[0]).filter(k => k !== "id");
    
    return [
      { ...SelectColumn, frozen: true },
      ...keys.map((k, index) => {
        const isStudentField = activeTable === "students" ? STUDENT_FIELDS.find(f => f.id === k) : undefined;
        return {
          key: k,
          name: isStudentField?.label || k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          resizable: true,
          editable: true,
          frozen: index === 0,
          renderEditCell: renderTextEditor,
          width: k === "register_number" || k === "regNo" ? 150 : 200,
          formatter: (props: RenderCellProps<any>) => {
            const value = props.row[k];
            const rowIndex = props.rowIdx;
            
            // Validation highlighting in staging mode
            if (activeTab === "staging" && activeTable === "students") {
              const field = STUDENT_FIELDS.find(f => f.id === k);
              if (field?.validate) {
                const result = field.validate(value);
                if (result !== true) {
                  return (
                    <div className="flex items-center gap-1 text-red-600 font-bold">
                      <LuTriangleAlert size={12} />
                      {value}
                    </div>
                  );
                }
              }
            }

            if (k === "status" || k === "placement_status") {
              return (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                  value === "Placed" || value === "placed" ? "bg-emerald-500/10 text-emerald-600" :
                  value === "Applied" || value === "applied" ? "bg-blue-500/10 text-blue-600" :
                  "bg-orange-500/10 text-orange-600"
                )}>
                  {value}
                </span>
              );
            }
            return String(value ?? "");
          }
        };
      })
    ];
  }, [rows, stagingData, activeTab, importHeaders, isMappingMode, activeTable]);

  // Handle Clipboard Paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;

      const rows = text.split("\n").map(row => row.trim()).filter(row => row);
      if (rows.length === 0) return;

      const headers = rows[0].split("\t").map(h => h.trim());
      setImportHeaders(headers);

      const data = rows.slice(1).map(row => {
        const values = row.split("\t").map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        return obj;
      });

      setStagingData(data);
      setActiveTab("staging");
      setIsMappingMode(true);
      
      // Auto-mapping logic
      const autoMappings: ColumnMapping[] = [];
      const sampleRow = rows[0] || {};
      const tableKeys = Object.keys(sampleRow).filter(k => k !== "id");

      headers.forEach(h => {
        let targetField = "";
        if (activeTable === "students") {
          const match = STUDENT_FIELDS.find(f => 
            f.label.toLowerCase() === h.toLowerCase() || 
            f.id.toLowerCase() === h.toLowerCase() ||
            h.toLowerCase().includes(f.id.toLowerCase())
          );
          if (match) targetField = match.id;
        } else {
          const match = tableKeys.find(k => 
            k.toLowerCase() === h.toLowerCase() || 
            h.toLowerCase().includes(k.toLowerCase())
          );
          if (match) targetField = match;
        }
        
        if (targetField) {
          autoMappings.push({ source: h, target: targetField });
        }
      });
      setMappings(autoMappings);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Validation Logic
  const validateData = useCallback((data: any[], currentMappings: ColumnMapping[]) => {
    if (activeTable !== "students") return;
    const errors: Record<number, string[]> = {};
    data.forEach((row, rowIndex) => {
      const rowErrors: string[] = [];
      currentMappings.forEach(m => {
        const field = STUDENT_FIELDS.find(f => f.id === m.target);
        if (field?.validate) {
          const result = field.validate(row[m.source]);
          if (result !== true) {
            rowErrors.push(`${field.label}: ${result}`);
          }
        }
      });
      if (rowErrors.length > 0) errors[rowIndex] = rowErrors;
    });
    setValidationErrors(errors);
  }, [activeTable]);

  useEffect(() => {
    if (activeTab === "staging" && stagingData.length > 0) {
      validateData(stagingData, mappings);
    }
  }, [stagingData, mappings, activeTab, validateData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = (event) => {
      let headers: string[] = [];
      let data: any[] = [];

      if (isExcel) {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        
        if (jsonData.length === 0) return;
        headers = jsonData[0].map(h => String(h).trim());
        data = jsonData.slice(1).map(row => {
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;
        });
      } else {
        const text = event.target?.result as string;
        const rows = text.split("\n").map(row => row.trim()).filter(row => row);
        if (rows.length === 0) return;
        headers = rows[0].split(",").map(h => h.trim());
        data = rows.slice(1).map(row => {
          const values = row.split(",").map(v => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = values[i]);
          return obj;
        });
      }

      setImportHeaders(headers);
      setStagingData(data);
      setActiveTab("staging");
      setIsMappingMode(true);
      
      // Auto-mapping logic
      const autoMappings: ColumnMapping[] = [];
      const sampleRow = rows[0] || {};
      const tableKeys = Object.keys(sampleRow).filter(k => k !== "id");

      headers.forEach(h => {
        let targetField = "";
        if (activeTable === "students") {
          const match = STUDENT_FIELDS.find(f => 
            f.label.toLowerCase() === h.toLowerCase() || 
            f.id.toLowerCase() === h.toLowerCase() ||
            h.toLowerCase().includes(f.id.toLowerCase())
          );
          if (match) targetField = match.id;
        } else {
          const match = tableKeys.find(k => 
            k.toLowerCase() === h.toLowerCase() || 
            h.toLowerCase().includes(k.toLowerCase())
          );
          if (match) targetField = match;
        }
        
        if (targetField) autoMappings.push({ source: h, target: targetField });
      });
      setMappings(autoMappings);
    };

    if (isExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  const handleExportExcel = () => {
    const dataToExport = activeTab === "live" ? filteredRows : stagingData;
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTable);
    XLSX.writeFile(workbook, `${activeTable}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportCancel = () => {
    setStagingData([]);
    setImportHeaders([]);
    setIsMappingMode(false);
    setActiveTab("live");
  };

  const handleImportConfirm = async () => {
    const mappedData = stagingData.map(row => {
      const newRow: any = { 
        year: parseInt(selectedYear)
      };
      mappings.forEach(m => {
        newRow[m.target] = row[m.source];
      });
      return newRow;
    });

    try {
      setLoading(true);
      if (activeTable === "students") {
        const existingRegNos = new Set(rows.map(s => s.regNo || s.register_number));
        const toUpdate = mappedData.filter(s => existingRegNos.has(s.regNo || s.register_number));
        const toInsert = mappedData.filter(s => !existingRegNos.has(s.regNo || s.register_number));

        if (toInsert.length > 0) await db.bulkCreateStudents(toInsert);
        for (const student of toUpdate) {
          const existingId = rows.find(s => (s.regNo || s.register_number) === (student.regNo || student.register_number))?.id;
          if (existingId) await db.updateStudentProfile(existingId, student);
        }
      } else {
        await db.upsertTableData(activeTable, mappedData);
      }

      alert(`Successfully processed ${mappedData.length} records.`);
      handleImportCancel();
      loadData();
    } catch (error) {
      console.error("Bulk import failed:", error);
      alert("Import failed.");
    } finally {
      setLoading(false);
    }
  };

  const onRowsChange = (newRows: any[]) => {
    if (activeTab === "live") setRows(newRows);
    else setStagingData(newRows);
  };

  const filteredRows = useMemo(() => {
    const data = activeTab === "live" ? rows : stagingData;
    if (!searchQuery) return data;
    return data.filter(r => 
      Object.values(r).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [rows, stagingData, activeTab, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      {/* Workspace Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <LuFileSpreadsheet size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Data Workspace</h1>
            <p className="text-muted text-xs font-bold uppercase tracking-widest">INSTITUTIONAL RECORDS MANAGEMENT</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border-subtle rounded-xl">
            <span className="text-[10px] font-black uppercase text-muted">Year</span>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold bg-transparent outline-none cursor-pointer"
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div className="relative">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="pl-9 pr-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <label className="flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2 text-xs font-black shadow-tactile hover:bg-primary-dark cursor-pointer transition-all">
            <LuUpload size={14} />
            Import Excel/CSV
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          </label>
          
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl bg-surface border border-border-subtle px-4 py-2 text-xs font-black shadow-sm hover:bg-background transition-colors"
          >
            <LuDownload size={14} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-soft flex flex-col relative">
        
        {/* Mapping Panel */}
        {isMappingMode && (
          <div className="bg-primary/5 border-b border-primary/10 p-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center">
                  <LuFilter size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Map your columns</h3>
                  <p className="text-[10px] font-bold text-muted uppercase">Align your spreadsheet headers with Placely fields</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {Object.keys(validationErrors).length > 0 && (
                  <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold mr-4">
                    <LuTriangleAlert size={14} />
                    {Object.keys(validationErrors).length} Rows have errors
                  </div>
                )}
                <button 
                  onClick={handleImportCancel}
                  className="px-4 py-2 rounded-lg bg-white border border-border-subtle text-[10px] font-black uppercase tracking-widest hover:bg-background transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={handleImportConfirm}
                  disabled={Object.keys(validationErrors).length > 0}
                  className={cn(
                    "px-4 py-2 rounded-lg text-white text-[10px] font-black uppercase tracking-widest shadow-tactile transition-all flex items-center gap-2",
                    Object.keys(validationErrors).length > 0 ? "bg-muted cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
                  )}
                >
                  <LuCheck size={14} />
                  Finish Import
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {importHeaders.map(header => {
                const mapping = mappings.find(m => m.source === header);
                return (
                  <div key={header} className="p-3 rounded-xl bg-white border border-border-subtle flex items-center justify-between">
                    <span className="text-xs font-bold truncate max-w-[100px]">{header}</span>
                    <LuArrowRight size={12} className="text-muted" />
                    <select 
                      className="text-[10px] font-black bg-transparent outline-none text-primary cursor-pointer"
                      value={mapping?.target || ""}
                      onChange={(e) => {
                        const newTarget = e.target.value;
                        setMappings(prev => {
                          const existing = prev.filter(m => m.source !== header);
                          if (newTarget) return [...existing, { source: header, target: newTarget }];
                          return existing;
                        });
                      }}
                    >
                      <option value="">Skip Column</option>
                      {activeTable === "students" && STUDENT_FIELDS.map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                      {activeTable !== "students" && Object.keys(rows[0] || {}).map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* React Data Grid */}
        <div className="flex-1 w-full bg-white rdg-light custom-rdg">
          <DataGrid
            columns={columns}
            rows={filteredRows}
            onRowsChange={onRowsChange}
            rowKeyGetter={(row) => row.id || row.register_number || row.email || Math.random().toString()}
            className="h-full"
            rowHeight={48}
            headerRowHeight={48}
            selectedRows={selectedRows}
            onSelectedRowsChange={setSelectedRows}
          />
        </div>

        {/* Bottom Bar — Table Selector */}
        <div className="h-14 bg-background border-t border-border-subtle flex items-center justify-between px-4 overflow-hidden">
          <div className="flex items-center h-full overflow-x-auto no-scrollbar gap-1 pr-4">
            {TABLES.map(table => (
              <button 
                key={table.id}
                onClick={() => {
                  setActiveTable(table.id);
                  setActiveTab("live");
                  setStagingData([]);
                }}
                className={cn(
                  "h-10 px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                  activeTable === table.id && activeTab === "live" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted hover:bg-surface border border-transparent"
                )}
              >
                {table.icon}
                {table.label}
              </button>
            ))}
            
            <div className="h-6 w-[1px] bg-border-subtle mx-2 shrink-0" />

            {stagingData.length > 0 && (
              <button 
                onClick={() => setActiveTab("staging")}
                className={cn(
                  "h-10 px-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap border",
                  activeTab === "staging" ? "bg-orange-500/10 text-orange-600 border-orange-500/20" : "text-muted hover:bg-surface border-transparent"
                )}
              >
                <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                Import Sheet
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold text-muted uppercase tracking-wider shrink-0 ml-4">
            <span>{filteredRows.length} Records</span>
            <div className="h-4 w-[1px] bg-border-subtle" />
            <span className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Connected to Neural DB
            </span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .custom-rdg {
          --rdg-font-size: 13px;
          --rdg-color: #1a1a1a;
          --rdg-border-color: #f2f2f2;
          --rdg-header-background-color: #fcfcfc;
          --rdg-row-hover-background-color: rgba(255, 56, 60, 0.02);
          --rdg-selection-color: var(--color-primary);
        }

        .rdg-header-row .rdg-cell {
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-size: 11px !important;
          color: #8e8e93 !important;
          border-bottom: 1px solid #e6e6e6 !important;
        }

        .rdg-cell {
          font-weight: 600 !important;
          display: flex !important;
          align-items: center !important;
          border-inline-end: 1px solid #f2f2f2 !important;
          border-bottom: 1px solid #f2f2f2 !important;
        }

        .rdg-cell[aria-selected='true'] {
          outline: 2px solid var(--color-primary) !important;
          outline-offset: -2px;
          z-index: 2;
        }

        .rdg-checkbox-label {
          border-radius: 4px !important;
        }

        .rdg-checkbox-input:checked + .rdg-checkbox-label {
          background-color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
        }
      `}</style>
    </div>
  );
}
