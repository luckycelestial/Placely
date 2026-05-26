"use client";
import { Sk } from "@/components/ui/skeleton";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DataGrid, renderTextEditor } from "react-data-grid";
import type { Column, RenderCellProps, RenderEditCellProps } from "react-data-grid";
import * as XLSX from "xlsx";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
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
import { getSystemSettings } from "@/services/settings";
import { getBatchList } from "@/lib/batch-utils";

interface ColumnMapping {
  source: string;
  target: string;
}

const isUUID = (val: any): boolean =>
  typeof val === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const STUDENT_FIELDS = [
  { id: "register_number", label: "Register Number", required: true, validate: (v: string) => /^[A-Z0-9]{6,12}$/i.test(v) || "Must be 6-12 alphanumeric characters" },
  { id: "name", label: "Full Name", required: true, validate: (v: string) => v?.length >= 3 || "Name too short" },
  { id: "email", label: "Email Address", required: true, validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Invalid email format" },
  { id: "department", label: "Department", required: true },
  { id: "year", label: "Batch", required: true, validate: (v: any) => [1, 2, 3, 4].includes(Number(v)) || (Number(v) >= 2000 && Number(v) <= 2100) || "Must be 1-4 or a valid Batch end-year (e.g. 2026)" },
  { id: "roll_number", label: "Roll Number", required: false },
  { id: "gender", label: "Gender", required: false, validate: (v: string) => ["Male", "Female", "Other", ""].includes(v) || "Must be Male, Female, or Other" },
  { id: "date_of_birth", label: "Date of Birth (YYYY-MM-DD)", required: false },
  { id: "cgpa", label: "CGPA", required: false, validate: (v: any) => (Number(v) >= 0 && Number(v) <= 10) || "Must be 0-10" },
  { id: "tenth_score", label: "10th Score (%)", required: false, validate: (v: any) => (Number(v) >= 0 && Number(v) <= 100) || "Must be 0-100" },
  { id: "twelfth_score", label: "12th Score (%)", required: false, validate: (v: any) => (Number(v) >= 0 && Number(v) <= 100) || "Must be 0-100" },
  { id: "diploma_score", label: "Diploma Score (%)", required: false, validate: (v: any) => !v || (Number(v) >= 0 && Number(v) <= 100) || "Must be 0-100" },
  { id: "active_arrears", label: "Active Arrears (Current)", required: false, validate: (v: any) => Number(v) >= 0 || "Cannot be negative" },
  { id: "history_of_arrears", label: "History of Arrears (true/false)", required: false, validate: (v: any) => ["true","false","0","1","yes","no",""].includes(String(v).toLowerCase()) || "Must be true or false" },
  { id: "backlog_count", label: "Total Backlog Count", required: false, validate: (v: any) => Number(v) >= 0 || "Cannot be negative" },
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
  const [selectedYear, setSelectedYear] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSystemSettings();
        setIsCompleted(settings.isAcademicYearCompleted);
        const batches = getBatchList(settings.isAcademicYearCompleted);
        if (batches.length > 0) {
          setSelectedYear(batches[0].value);
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
          db.getAllStudents(),
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
            const studentName = o.students?.users?.name || o.students?.[0]?.users?.[0]?.name || "Unknown Student";
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
      return importHeaders.map((h: string) => ({
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

    let keys = Object.keys(dataToUse[0]).filter(k => k !== "id" && k !== "verification_status" && k !== "verification");
    
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
    
    return keys.map((k, index) => {
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
          renderEditCell: renderTextEditor,
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

            // Validation highlighting in staging mode
            if (activeTab === "staging" && activeTable === "students") {
              const field = STUDENT_FIELDS.find(f => f.id === k);
              if (field?.validate) {
                const result = field.validate(value);
                if (result !== true) {
                  return (
                    <div className="flex items-center gap-1 text-red-600 font-bold">
                      <LuTriangleAlert size={12} />
                      {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "")}
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
    const mappedData = stagingData.map((row: any) => {
      const newRow: any = { 
        year: parseInt(selectedYear)
      };
      mappings.forEach((m: ColumnMapping) => {
        newRow[m.target] = row[m.source];
      });
      return newRow;
    });

    try {
      setLoading(true);
      if (activeTable === "students") {
        const existingRegNos = new Set(rows.map((s: any) => s.regNo || s.register_number));
        const toUpdate = mappedData.filter((s: any) => existingRegNos.has(s.regNo || s.register_number));
        const toInsert = mappedData.filter((s: any) => !existingRegNos.has(s.regNo || s.register_number));

        if (toInsert.length > 0) await db.bulkCreateStudents(toInsert);
        for (const student of toUpdate) {
          const existingId = rows.find((s: any) => (s.regNo || s.register_number) === (student.regNo || student.register_number))?.id;
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

  const filteredRows = useMemo(() => {
    let data = activeTab === "live" ? rows : stagingData;
    
    if (activeTable === "students" && selectedYear) {
      data = data.filter(r => {
        if (!r.year) return false;
        const valStr = String(r.year);
        return valStr.includes(selectedYear) || valStr === selectedYear;
      });
    }

    if (!searchQuery) return data;
    return data.filter(r => 
      Object.values(r).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [rows, stagingData, activeTab, searchQuery, activeTable, selectedYear]);

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
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border-subtle rounded-xl min-w-[180px]">
            <span className="text-[10px] font-black uppercase text-muted">Batch</span>
            <SearchableSelect 
              options={getBatchList(isCompleted).map(b => ({
                value: b.value,
                label: b.label
              }))}
              value={selectedYear}
              onChange={setSelectedYear}
            />
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
              {importHeaders.map((header: string) => {
                const mapping = mappings.find((m: ColumnMapping) => m.source === header);
                return (
                  <div key={header} className="p-3 rounded-xl bg-white border border-border-subtle flex items-center justify-between">
                    <span className="text-xs font-bold truncate max-w-[100px]">{header}</span>
                    <LuArrowRight size={12} className="text-muted" />
                    <div className="w-[180px]">
                      <SearchableSelect 
                        options={[
                          { value: "", label: "Skip Column" },
                          ...(activeTable === "students" 
                            ? STUDENT_FIELDS.map(f => ({ value: f.id, label: f.label }))
                            : Object.keys(rows[0] || {}).map(k => ({ value: k, label: k })))
                        ]}
                        value={mapping?.target || ""}
                        onChange={(newTarget) => {
                          setMappings((prev: ColumnMapping[]) => {
                            const existing = prev.filter((m: ColumnMapping) => m.source !== header);
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
          </div>
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
              className="h-full"
              rowHeight={48}
              headerRowHeight={48}
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

        .custom-rdg > div,
        .custom-rdg .rdg,
        .custom-rdg [class*="rdg-"] {
          block-size: 100% !important;
          height: 100% !important;
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
        }

        /* 3. Base state: Force sticky frozen column position & solid white background */
        .rdg-cell-frozen,
        .rdg-7-0-0-beta-58-17a9a6d4,
        [role="row"]:not(.rdg-header-row) .rdg-cell-frozen,
        [role="row"]:not(.rdg-header-row) > *.rdg-cell-frozen,
        [role="row"]:not(.rdg-header-row) > [role="gridcell"]:nth-child(1) {
          position: sticky !important;
          left: 0 !important;
          background-color: #ffffff !important;
          z-index: 10 !important;
          box-shadow: 2px 0 5px -2px rgba(136, 136, 136, 0.3) !important;
        }

        /* 4. Base state: Force solid light-gray and sticky for all header frozen cells */
        .rdg-header-row .rdg-cell-frozen,
        .rdg-header-row .rdg-7-0-0-beta-58-17a9a6d4,
        [role="row"].rdg-header-row .rdg-cell-frozen,
        [role="row"].rdg-header-row > *.rdg-cell-frozen,
        [role="row"].rdg-header-row > [role="columnheader"]:nth-child(1) {
          position: sticky !important;
          left: 0 !important;
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
        [role="row"]:hover:not(.rdg-header-row) > *.rdg-cell-frozen,
        [role="row"]:hover:not(.rdg-header-row) > [role="gridcell"]:nth-child(1) {
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
      ` }} />
    </div>
  );
}
