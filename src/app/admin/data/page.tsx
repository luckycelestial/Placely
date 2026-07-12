"use client";
import { Sk } from "@/components/ui/skeleton";

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import { DataGrid, renderTextEditor, SelectColumn } from "react-data-grid";
import type { Column, RenderCellProps, RenderEditCellProps } from "react-data-grid";
import * as XLSX from "xlsx";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useSearchParams } from "next/navigation";
import "react-data-grid/lib/styles.css";
import { LuTriangleAlert, LuFileSpreadsheet, LuUpload, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { db } from "@/services/database";
import { cn } from "@/lib/utils";
import { getSystemSettings } from "@/services/settings";
import { getBatchList } from "@/lib/batch-utils";
import { supabase } from "@/lib/supabase";
import { STUDENT_FIELDS, TABLES } from "./constants";
import { isUUID, type ColumnMapping } from "./types";
import { ColumnMappingSelect } from "./components/ColumnMappingSelect";
import { DataWorkspaceHeader } from "./components/DataWorkspaceHeader";
import { MappingPanel } from "./components/MappingPanel";
import { DeleteDialog } from "./components/DeleteDialog";
import { ValidationErrorDialog } from "./components/ValidationErrorDialog";

function customRenderTextEditor(props: RenderEditCellProps<any>) {
  const value = props.row[props.column.key];
  return renderTextEditor({
    ...props,
    row: {
      ...props.row,
      [props.column.key]: value ?? ""
    }
  });
}

function DataWorkspacePageContent() {
  const searchParams = useSearchParams();
  const tableParam = searchParams.get("table");
  const autoImportParam = searchParams.get("import");

  const [activeTable, setActiveTable] = useState(tableParam || "students");
  const [activeTab, setActiveTab] = useState<"live" | "staging">("live");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [stagingData, setStagingData] = useState<any[]>([]);
  const [rawSheetData, setRawSheetData] = useState<any[][]>([]);
  const [hasHeaders, setHasHeaders] = useState<boolean>(true);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const mappingsRef = useRef<ColumnMapping[]>([]);
  // Keep ref in sync with state (state is used for validation; ref is read in columns memo)
  const syncMappings = (next: ColumnMapping[]) => {
    mappingsRef.current = next;
    setMappings(next);
  };
  const [isMappingMode, setIsMappingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [importBatchYear, setImportBatchYear] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTable, searchQuery, selectedYear]);

  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");

  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(new Set());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isValidationErrorDialogOpen, setIsValidationErrorDialogOpen] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);

  useEffect(() => {
    setSelectedRows(new Set());
  }, [activeTable, activeTab]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSystemSettings();
        setIsCompleted(settings.isAcademicYearCompleted);
        const batches = getBatchList(settings.isAcademicYearCompleted);
        if (batches.length > 0) {
          setSelectedYear(batches[0].value);
          setImportBatchYear(batches[0].value);
        }
      } catch (error) {
        console.error("Failed to load system settings:", error);
      }
    };
    loadSettings();
  }, []);

  const [studentsMap, setStudentsMap] = useState<Record<string, string>>({});
  const [companiesMap, setCompaniesMap] = useState<Record<string, string>>({});
  const [drivesMap, setDrivesMap] = useState<Record<string, string>>({});
  const [offersMap, setOffersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadMappings = async () => {
      try {
        const [students, companies, drives, offers] = await Promise.all([
          db.getAllStudents({ lightweight: true }),
          db.getCompanies(),
          db.getDrives(),
          db.getOffers()
        ]);
        
        const sMap: Record<string, string> = {};
        students.forEach((s: any) => {
          if (s.id) sMap[s.id] = s.name;
        });
        
        const cMap: Record<string, string> = {};
        companies.forEach((c: any) => {
          if (c.id) cMap[c.id] = c.name;
        });

        const dMap: Record<string, string> = {};
        drives.forEach((d: any) => {
          if (d.id) {
            const companyName = d.companies?.name || "Unknown Company";
            dMap[d.id] = `${companyName} - ${d.role_title}`;
          }
        });

        const oMap: Record<string, string> = {};
        offers.forEach((o: any) => {
          if (o.id) {
            const studentName = o.students?.name || o.students?.users?.name || o.students?.[0]?.name || o.students?.[0]?.users?.[0]?.name || "Unknown Student";
            const companyName = o.companies?.name || o.companies?.[0]?.name || "Unknown Company";
            const role = o.role_title || "Unknown Role";
            oMap[o.id] = `${studentName} (${companyName} - ${role})`;
          }
        });
        
        setStudentsMap(sMap);
        setCompaniesMap(cMap);
        setDrivesMap(dMap);
        setOffersMap(oMap);
      } catch (error) {
        console.error("Failed to load mappings:", error);
      }
    };
    loadMappings();
  }, []);

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
      // First row contains the headers
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
      // No header row, auto-generate column headers (Column A, Column B, etc.)
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
    const sampleRow = rows[0] || {};
    const tableKeys = Object.keys(sampleRow).filter(k => k !== "id");

    headers.forEach(h => {
      let targetField = "";
      if (activeTable === "students") {
        const match = STUDENT_FIELDS.filter(f => f.id !== "year").find(f => 
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
    syncMappings(autoMappings);
  }, [activeTable, rows]);

  useEffect(() => {
    if (workbook && selectedSheet) {
      const sheet = workbook.Sheets[selectedSheet];
      if (sheet) {
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as any[][];
        const rawGridData = jsonData.filter(row => row.some(cell => cell !== "" && cell !== null && cell !== undefined));
        setRawSheetData(rawGridData);
        
        const firstCell = String(rawGridData[0]?.[0] || '');
        const looksLikeData = /^[A-Z0-9]{6,12}$/i.test(firstCell) || /^[0-9]+$/.test(firstCell) || firstCell === '';
        setHasHeaders(!looksLikeData);
      }
    }
  }, [workbook, selectedSheet]);

  useEffect(() => {
    if (rawSheetData.length > 0) {
      processSheetData(rawSheetData, hasHeaders);
    }
  }, [hasHeaders, rawSheetData, processSheetData]);

  // Fetch Live Data for Active Table
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const count = await db.getTableCount(activeTable, { search: searchQuery, year: selectedYear });
      setTotalRows(count);

      const offset = (currentPage - 1) * pageSize;
      const data = await db.getTableData(activeTable, { limit: pageSize, offset, search: searchQuery, year: selectedYear });
      // If students, join with users to get name/email for compatibility with STUDENT_FIELDS logic
      if (activeTable === "students") {
        const enriched = await db.getAllStudents({ limit: pageSize, offset, search: searchQuery, year: selectedYear });
        setRows(enriched);
      } else {
        setRows(data);
      }
    } catch (error) {
      console.error("Failed to load table data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTable, currentPage, searchQuery, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns = useMemo((): Column<any>[] => {
    let baseCols: Column<any>[] = [];
    if (activeTab === "staging") {
      baseCols = importHeaders.map((h: string, index: number) => {
        const mapping = mappings.find((m: ColumnMapping) => m.source === h);
        const columnName = isMappingMode ? (
          <div className="flex flex-col gap-1 py-1 w-full text-left" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] font-black text-muted uppercase tracking-wider truncate block w-full mb-1">{h}</span>
            <div className="w-full" style={{ minWidth: "140px" }}>
              <ColumnMappingSelect
                options={[
                  { value: "", label: "Skip Column" },
                  ...(activeTable === "students"
                    ? STUDENT_FIELDS.filter(f => f.id !== "year").map(f => ({ value: f.id, label: f.label }))
                    : Object.keys(rows[0] || {}).filter(k => k !== "id" && k !== "verification_status" && k !== "verification").map(k => ({ value: k, label: k })))
                ]}
                defaultValue={mappingsRef.current.find((m: ColumnMapping) => m.source === h)?.target || ""}
                onChange={(newTarget) => {
                  // Update ref synchronously — no re-render, so the select stays mounted
                  const existing = mappingsRef.current.filter((m: ColumnMapping) => m.source !== h);
                  mappingsRef.current = newTarget
                    ? [...existing, { source: h, target: newTarget }]
                    : existing;
                  // Update state for validation badge only
                  setMappings([...mappingsRef.current]);
                }}
              />
            </div>
          </div>
        ) : h;

        return {
          key: h,
          name: columnName,
          resizable: true,
          editable: true,
          frozen: index === 0,
          renderEditCell: customRenderTextEditor,
          width: isMappingMode ? 220 : 180,
          renderCell: (props: RenderCellProps<any>) => {
            if (props.row.isEmptyPlaceholder) return "";
            const value = props.row[h];

            // In staging, highlight validation errors if mapping is active
            if (isMappingMode && activeTable === "students" && mapping?.target) {
              const field = STUDENT_FIELDS.find(f => f.id === mapping.target);
              if (field?.validate) {
                const result = field.validate(value);
                if (result !== true) {
                  return (
                    <div 
                      className="flex items-center gap-1 text-red-600 font-bold w-full h-full cursor-help"
                      title={`${field.label}: ${result}`}
                    >
                      <LuTriangleAlert size={12} className="shrink-0" />
                      <span className="truncate">{String(value ?? "")}</span>
                    </div>
                  );
                }
              }
            }

            return String(value ?? "");
          }
        };
      });
    } else {
      if (rows.length === 0) return [];

      let keys = Object.keys(rows[0]).filter(k => k !== "id" && k !== "verification_status" && k !== "verification");
      
      // Position student_id / studentId first if present, company_id / companyId if student_id is not present
      const studentIdIndex = keys.findIndex(k => k.toLowerCase() === "student_id" || k.toLowerCase() === "studentid");
      if (studentIdIndex > -1) {
        const [studentIdKey] = keys.splice(studentIdIndex, 1);
        keys = [studentIdKey, ...keys];
      } else {
        const companyIdIndex = keys.findIndex(k => k.toLowerCase() === "company_id" || k.toLowerCase() === "companyid");
        if (companyIdIndex > -1) {
          const [companyIdKey] = keys.splice(companyIdIndex, 1);
          keys = [companyIdKey, ...keys];
        }
      }
      
      baseCols = keys.map((k, index) => {
        const isStudentField = activeTable === "students" ? STUDENT_FIELDS.find(f => f.id === k) : undefined;
        const isStudentId = k.toLowerCase() === "student_id" || k.toLowerCase() === "studentid" || k.toLowerCase() === "student";
        const isCompanyId = k.toLowerCase() === "company_id" || k.toLowerCase() === "companyid" || k.toLowerCase() === "company";
        const isDriveId = k.toLowerCase() === "drive_id" || k.toLowerCase() === "driveid" || k.toLowerCase() === "drive";
        const isOfferId = k.toLowerCase() === "offer_id" || k.toLowerCase() === "offerid" || k.toLowerCase() === "offer";

        let headerName = isStudentField?.label || k.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (isStudentId) headerName = "Student Name";
        if (isCompanyId) headerName = "Company Name";
        if (isDriveId) headerName = "Placement Drive";
        if (isOfferId) headerName = "Offer Details";

        return {
          key: k,
          name: headerName,
          resizable: true,
          editable: true,
          frozen: index === 0,
          renderEditCell: customRenderTextEditor,
          width: k === "register_number" || k === "regNo" ? 150 : (isStudentId || isCompanyId || isDriveId || isOfferId ? 250 : 200),
          renderCell: (props: RenderCellProps<any>) => {
            if (props.row.isEmptyPlaceholder) return "";
            const value = props.row[k];
            const rowIndex = props.rowIdx;
            
            if (isUUID(value)) {
              if (studentsMap[value]) return studentsMap[value];
              if (companiesMap[value]) return companiesMap[value];
              if (drivesMap[value]) return drivesMap[value];
              if (offersMap[value]) return offersMap[value];
              
              if (isStudentId) return "Loading Student...";
              if (isCompanyId) return "Loading Company...";
              if (isDriveId) return "Loading Drive...";
              if (isOfferId) return "Loading Offer...";
              return "Loading...";
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

            if (Array.isArray(value)) {
              return value.join(", ");
            }

            if (typeof value === "object" && value !== null) {
              const criteria = value as any;
              const parts: string[] = [];
              if (criteria.min_cgpa !== undefined && criteria.min_cgpa !== null) {
                parts.push(`CGPA: ${criteria.min_cgpa}`);
              }
              if (criteria.backlogs_allowed !== undefined && criteria.backlogs_allowed !== null) {
                parts.push(`Backlogs: ${criteria.backlogs_allowed}`);
              }
              if (criteria.history_of_arrears !== undefined && criteria.history_of_arrears !== null) {
                parts.push(`Arrears: ${criteria.history_of_arrears ? "Yes" : "No"}`);
              }
              if (criteria.branches && Array.isArray(criteria.branches) && criteria.branches.length > 0) {
                parts.push(`Branches: ${criteria.branches.join(", ")}`);
              } else if (criteria.branches && typeof criteria.branches === "string") {
                parts.push(`Branches: ${criteria.branches}`);
              }
              return parts.length > 0 ? parts.join(" | ") : JSON.stringify(value);
            }

            return String(value ?? "");
          }
        };
      });
    }

    if (!isMappingMode) {
      return [SelectColumn, ...baseCols];
    }
    return baseCols;
  }, [rows, stagingData, activeTab, importHeaders, isMappingMode, activeTable, studentsMap, companiesMap, drivesMap, offersMap]);

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
          const match = STUDENT_FIELDS.filter(f => f.id !== "year").find(f => 
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
      let rawGridData: any[][] = [];

      if (isExcel) {
        const buffer = event.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        const initialSheet = wb.SheetNames[0] || "";
        setSelectedSheet(initialSheet);
      } else {
        const text = event.target?.result as string;
        const lines = text.split("\n").map(row => row.trim()).filter(row => row);
        rawGridData = lines.map(line => line.split(",").map(cell => cell.trim()));

        setWorkbook(null);
        setSheetNames([]);
        setSelectedSheet("");

        if (rawGridData.length === 0) return;

        setRawSheetData(rawGridData);
        
        // Auto-detect header: check if the first cell of the first row looks like register number or a index count
        const firstCell = String(rawGridData[0]?.[0] || '');
        const looksLikeData = /^[A-Z0-9]{6,12}$/i.test(firstCell) || /^[0-9]+$/.test(firstCell) || firstCell === '';
        setHasHeaders(!looksLikeData);
      }

      setActiveTab("staging");
      setIsMappingMode(true);
      setImportBatchYear(selectedYear);
      
      e.target.value = "";
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
    setRawSheetData([]);
    setImportHeaders([]);
    setIsMappingMode(false);
    setActiveTab("live");
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet("");
  };

  const handleImportConfirm = async () => {
    const targetYear = activeTable === "students" && importBatchYear ? parseInt(importBatchYear) : parseInt(selectedYear);
    const mappedData = stagingData.map((row: any) => {
      const newRow: any = { 
        year: targetYear
      };
      mappings.forEach((m: ColumnMapping) => {
        newRow[m.target] = row[m.source];
      });
      return newRow;
    });

    try {
      setLoading(true);
      if (activeTable === "students") {
        const existingRegNos = new Set(rows.map((s: any) => String(s.regNo || s.register_number || '').trim().toLowerCase()).filter(Boolean));
        const toUpdate = mappedData.filter((s: any) => {
          const reg = String(s.register_number || s.regNo || '').trim().toLowerCase();
          return reg && existingRegNos.has(reg);
        });
        const toInsert = mappedData.filter((s: any) => {
          const reg = String(s.register_number || s.regNo || '').trim().toLowerCase();
          return reg && !existingRegNos.has(reg);
        });

        if (toInsert.length > 0) await db.bulkCreateStudents(toInsert);
        for (const student of toUpdate) {
          const studentReg = String(student.register_number || student.regNo || '').trim().toLowerCase();
          const existingId = rows.find((s: any) => String(s.regNo || s.register_number || '').trim().toLowerCase() === studentReg)?.id;
          if (existingId) await db.updateStudentProfile(existingId, student);
        }
      } else {
        await db.upsertTableData(activeTable, mappedData);
      }

      alert(`Successfully processed ${mappedData.length} records.`);
      handleImportCancel();
      loadData();
    } catch (error: any) {
      console.error("Bulk import failed:", error);
      alert(`Import failed: ${error.message || error.details || (typeof error === 'object' ? JSON.stringify(error) : String(error))}`);
    } finally {
      setLoading(false);
    }
  };

  const onRowsChange = async (newRows: any[]) => {
    const realRows = newRows.filter(r => !r.isEmptyPlaceholder);
    
    if (activeTab === "live") {
      // Find the changed row and its changed fields
      const previousRows = rows;
      let changedRow: any = null;
      let previousRow: any = null;
      
      for (const newRow of realRows) {
        const prevRow = previousRows.find(r => r.id === newRow.id);
        if (prevRow) {
          // Compare fields
          const keys = Object.keys(newRow);
          const hasDiff = keys.some(k => JSON.stringify(newRow[k]) !== JSON.stringify(prevRow[k]));
          if (hasDiff) {
            changedRow = newRow;
            previousRow = prevRow;
            break;
          }
        }
      }
      
      setRows(realRows);

      if (changedRow && previousRow) {
        // Find which fields actually changed
        const updatedFields: any = {};
        Object.keys(changedRow).forEach(k => {
          if (JSON.stringify(changedRow[k]) !== JSON.stringify(previousRow[k])) {
            updatedFields[k] = changedRow[k];
          }
        });
        
        if (Object.keys(updatedFields).length > 0) {
          try {
            if (activeTable === "students") {
              await db.syncStudentRow(changedRow.id, updatedFields);
            } else {
              await db.updateTableCell(activeTable, changedRow.id, updatedFields);
            }
            console.log(`Successfully synced changes for ${activeTable} ID ${changedRow.id}:`, updatedFields);
          } catch (err) {
            console.error("Failed to sync changes with DB:", err);
            alert("Failed to sync changes with database: " + (err as any).message);
            loadData();
          }
        }
      }
    } else {
      setStagingData(realRows);
    }
  };

  const handleCellKeyDown = useCallback((args: any, event: any) => {
    if (args.mode === "SELECT" && (event.key === "Delete" || event.key === "Backspace")) {
      event.preventDefault();
      
      if (args.row.isEmptyPlaceholder) return;
      if (args.column.key === "id" || args.column.key === "rdg-select-column" || args.column.frozen) return;

      const dataToUpdate = activeTab === "live" ? rows : stagingData;
      const updatedRows = dataToUpdate.map((r: any) => {
        if (r.id === args.row.id) {
          return {
            ...r,
            [args.column.key]: ""
          };
        }
        return r;
      });

      onRowsChange(updatedRows);
    }
  }, [activeTab, rows, stagingData, onRowsChange]);

  const handleDeleteSelected = async () => {
    setIsDeletingSelected(true);
    try {
      const selectedIds = Array.from(selectedRows);
      
      if (activeTab === "live") {
        if (activeTable === "students") {
          // 1. Fetch user_ids of the students being deleted to delete their users
          const { data: studentsToDelete, error: fetchError } = await supabase
            .from('students')
            .select('user_id')
            .in('id', selectedIds);
          
          if (fetchError) throw fetchError;
          
          const userIds = studentsToDelete?.map(s => s.user_id).filter(Boolean) || [];
          
          // 2. Delete from users table (cascades to students, student_contacts, student_academics, student_profiles, etc.)
          if (userIds.length > 0) {
            const { error: userDeleteError } = await supabase
              .from('users')
              .delete()
              .in('id', userIds);
            
            if (userDeleteError) throw userDeleteError;
          }
          
          // 3. Fallback: delete remaining students directly if any didn't have user_id
          const { error: studentDeleteError } = await supabase
            .from('students')
            .delete()
            .in('id', selectedIds);
            
          if (studentDeleteError) throw studentDeleteError;

        } else if (activeTable === "users") {
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .in('id', selectedIds);
            
          if (deleteError) throw deleteError;

        } else {
          // Generic deletion for other tables
          const { error: deleteError } = await supabase
            .from(activeTable)
            .delete()
            .in('id', selectedIds);
            
          if (deleteError) throw deleteError;
        }
        
        await loadData();
      } else {
        // Staging tab: just filter out from state
        setStagingData(prev => prev.filter(r => !selectedRows.has(r.id)));
      }
      
      setSelectedRows(new Set());
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Bulk deletion failed:", error);
      alert("Failed to delete records: " + (error as any).message);
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (activeTab === "live") {
      return rows;
    }
    let data = stagingData;
    if (!searchQuery) return data;
    return data.filter(r => 
      Object.values(r).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [rows, stagingData, activeTab, searchQuery]);

  const rowsForGrid = useMemo(() => {
    const data = [...filteredRows];
    // Pad with empty rows to make it look like a full sheet spanning to the bottom bar
    const minRows = 20; 
    if (data.length < minRows) {
      const padCount = minRows - data.length;
      for (let i = 0; i < padCount; i++) {
        data.push({
          id: `empty-row-${i}`,
          isEmptyPlaceholder: true
        });
      }
    }
    return data;
  }, [filteredRows]);

  return (
    <div className="flex flex-col h-[calc(100vh-176px)] md:h-[calc(100vh-112px)] space-y-4">
      {/* Workspace Header */}
      {!isMappingMode && (
        <DataWorkspaceHeader
          selectedYear={selectedYear}
          isCompleted={isCompleted}
          searchQuery={searchQuery}
          selectedRowsCount={selectedRows.size}
          onYearChange={setSelectedYear}
          onSearchChange={setSearchQuery}
          onDeleteSelected={() => setIsDeleteDialogOpen(true)}
          onFileUpload={handleFileUpload}
          onExport={handleExportExcel}
        />
      )}

      {/* Auto Import Prompt Modal */}
      {autoImportParam === "true" && rawSheetData.length === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-surface p-8 rounded-3xl shadow-2xl border border-border-subtle text-center max-w-md w-full animate-in zoom-in-95 duration-200">
             <LuUpload size={48} className="text-primary mx-auto mb-4" />
             <h2 className="text-2xl font-black mb-2">Upload Data</h2>
             <p className="text-muted mb-6 text-sm">Select an Excel or CSV file to import records into <span className="font-bold">{activeTable}</span>.</p>
             <label className="btn-primary w-full py-4 rounded-xl cursor-pointer flex items-center justify-center text-white font-black text-sm uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all">
               Choose File
               <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => {
                 const url = new URL(window.location.href);
                 url.searchParams.delete('import');
                 window.history.replaceState({}, '', url.toString());
                 handleFileUpload(e);
               }} />
             </label>
             <button onClick={() => {
               const url = new URL(window.location.href);
               url.searchParams.delete('import');
               window.history.replaceState({}, '', url.toString());
               window.location.reload(); 
             }} className="mt-4 text-xs font-bold text-muted uppercase tracking-widest hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-soft flex flex-col relative">
        
        {/* Mapping Panel */}
        {isMappingMode && (
          <MappingPanel
            sheetNames={sheetNames}
            selectedSheet={selectedSheet}
            hasHeaders={hasHeaders}
            importBatchYear={importBatchYear}
            isCompleted={isCompleted}
            activeTable={activeTable}
            validationErrors={validationErrors}
            onSheetChange={setSelectedSheet}
            onHasHeadersChange={setHasHeaders}
            onBatchYearChange={setImportBatchYear}
            onDiscard={handleImportCancel}
            onConfirm={handleImportConfirm}
            onErrorClick={() => setIsValidationErrorDialogOpen(true)}
          />
        )}




        {/* React Data Grid */}
        <div className="flex-1 flex flex-col min-h-0 w-full bg-white rdg-light custom-rdg">
          {loading ? (
            <div className="flex-1 p-4 w-full h-full overflow-hidden">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-border-subtle">
                  <Sk.TableRows cols={8} rows={10} />
                </tbody>
              </table>
            </div>
          ) : (
            <DataGrid
              columns={columns}
              rows={rowsForGrid}
              onRowsChange={onRowsChange}
              rowKeyGetter={(row: any) => row.id || row.register_number || row.email || Math.random().toString()}
              selectedRows={selectedRows}
              onSelectedRowsChange={setSelectedRows}
              onCellKeyDown={handleCellKeyDown}
              className={cn("h-full", isMappingMode && "custom-rdg-mapping")}
              rowHeight={48}
              headerRowHeight={isMappingMode ? 76 : 48}
            />
          )}
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

          {/* Pagination Controls */}
          {activeTab === "live" && totalRows > pageSize && (
            <div className="flex items-center gap-2 select-none">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 border border-border-subtle rounded-lg text-muted hover:text-foreground disabled:opacity-35 transition-colors cursor-pointer"
              >
                <LuChevronLeft size={12} />
              </button>
              <span className="text-[9px] font-black uppercase text-foreground">
                Page {currentPage} / {Math.ceil(totalRows / pageSize)}
              </span>
              <button
                type="button"
                disabled={currentPage >= Math.ceil(totalRows / pageSize)}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1 border border-border-subtle rounded-lg text-muted hover:text-foreground disabled:opacity-35 transition-colors cursor-pointer"
              >
                <LuChevronRight size={12} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-4 text-[10px] font-bold text-muted uppercase tracking-wider shrink-0 ml-4">
            <span>{activeTab === "live" ? totalRows : filteredRows.length} Records</span>
            <div className="h-4 w-[1px] bg-border-subtle" />
            <span className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Connected to Neural DB
            </span>
          </div>
        </div>
      </div>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        count={selectedRows.size}
        isDeleting={isDeletingSelected}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteSelected}
      />

      <ValidationErrorDialog
        isOpen={isValidationErrorDialogOpen}
        onClose={() => setIsValidationErrorDialogOpen(false)}
        validationErrors={validationErrors}
        stagingData={stagingData}
      />

      <style dangerouslySetInnerHTML={{ __html: `
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
          --rdg-background-color: #ffffff;
          --rdg-header-background-color: #fcfcfc;
          --rdg-frozen-cell-background-color: #ffffff;
          --rdg-row-hover-background-color: #fff5f5;
          --rdg-selection-color: var(--color-primary);
          
          block-size: 100% !important;
          height: 100% !important;
        }

        .custom-rdg,
        .custom-rdg .rdg {
          block-size: 100% !important;
          height: 100% !important;
        }

        .custom-rdg .rdg {
          scrollbar-width: thin !important;
          scrollbar-color: #d4d4d8 #f9f9f9 !important;
        }

        .custom-rdg .rdg::-webkit-scrollbar {
          height: 6px !important;
          width: 6px !important;
        }

        .custom-rdg .rdg::-webkit-scrollbar-track {
          background: #f9f9f9 !important;
          border-radius: 4px !important;
        }

        .custom-rdg .rdg::-webkit-scrollbar-thumb {
          background: #d4d4d8 !important;
          border-radius: 4px !important;
        }

        .custom-rdg .rdg::-webkit-scrollbar-thumb:hover {
          background: #a1a1aa !important;
        }

        /* 1. Header Cells styling (supports both classes and ARIA roles) */
        .rdg-header-row .rdg-cell,
        [role="row"].rdg-header-row [role="columnheader"],
        [class*="header"] [role="columnheader"],
        [role="columnheader"] {
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-size: 11px !important;
          color: #8e8e93 !important;
          border-bottom: 1px solid #e6e6e6 !important;
          background-color: #fcfcfc !important;
          padding: 0 16px !important;
        }

        /* 2. Body Cells styling */
        .rdg-cell,
        [role="gridcell"] {
          font-weight: 600 !important;
          display: flex !important;
          align-items: center !important;
          border-inline-end: 1px solid #f2f2f2 !important;
          border-bottom: 1px solid #f2f2f2 !important;
          padding: 0 16px !important;
          background-color: #ffffff !important;
        }

        /* 3. Base state: Force sticky frozen column position & solid white background */
        .rdg-cell-frozen,
        .rdg-7-0-0-beta-58-17a9a6d4,
        [role="row"]:not(.rdg-header-row) .rdg-cell-frozen,
        [role="row"]:not(.rdg-header-row) > *.rdg-cell-frozen {
          background-color: #ffffff !important;
          z-index: 10 !important;
          box-shadow: 2px 0 5px -2px rgba(136, 136, 136, 0.3) !important;
        }

        /* 4. Base state: Force solid light-gray and sticky for all header frozen cells */
        .rdg-header-row .rdg-cell-frozen,
        .rdg-header-row .rdg-7-0-0-beta-58-17a9a6d4,
        [role="row"].rdg-header-row .rdg-cell-frozen,
        [role="row"].rdg-header-row > *.rdg-cell-frozen {
          background-color: #fcfcfc !important;
          z-index: 20 !important;
          box-shadow: 2px 0 5px -2px rgba(136, 136, 136, 0.3) !important;
        }

        /* 5. Hover Highlight for ALL cells in body rows */
        .rdg-row:hover:not(.rdg-header-row) .rdg-cell,
        [role="row"]:hover:not(.rdg-header-row) .rdg-cell,
        [role="row"]:hover:not(.rdg-header-row) > * {
          background-color: #fff5f5 !important;
        }

        /* 6. Explicit Hover Highlight override for frozen cells */
        .rdg-row:hover:not(.rdg-header-row) .rdg-cell-frozen,
        .rdg-row:hover:not(.rdg-header-row) .rdg-7-0-0-beta-58-17a9a6d4,
        [role="row"]:hover:not(.rdg-header-row) .rdg-cell-frozen,
        [role="row"]:hover:not(.rdg-header-row) > *.rdg-cell-frozen {
          background-color: #fff5f5 !important;
          z-index: 10 !important;
        }

        .rdg-cell[aria-selected='true'],
        [role="gridcell"][aria-selected='true'] {
          outline: 2px solid var(--color-primary) !important;
          outline-offset: -2px;
          z-index: 2;
        }

        .rdg-checkbox-label {
          border-radius: 0px !important;
        }

        .rdg-checkbox-input:checked + .rdg-checkbox-label {
          background-color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
        }

        .custom-rdg-mapping .rdg-header-row {
          z-index: 30 !important;
        }
        .custom-rdg-mapping .rdg-header-row .rdg-cell,
        .custom-rdg-mapping [role="row"].rdg-header-row [role="columnheader"] {
          overflow: visible !important;
          z-index: auto !important;
        }
      ` }} />
    </div>
  );
}

export default function DataWorkspacePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-[calc(100vh-112px)] items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-muted mt-4 uppercase tracking-widest animate-pulse">Initializing Data Workspace...</p>
      </div>
    }>
      <DataWorkspacePageContent />
    </Suspense>
  );
}
