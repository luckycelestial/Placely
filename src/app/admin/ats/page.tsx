"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { LuMoveRight, LuPlus, LuSlidersHorizontal, LuX, LuRotateCcw, LuSearch, LuFilter, LuEye } from "react-icons/lu";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { db } from "@/services/database";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import { exportToPDF } from "@/lib/export-utils";
import { getSettingByKey } from "@/services/settings";
import {
  type Stage,
  type Application,
  DEFAULT_STAGES,
  GLOBAL_META_STAGES,
  getMetaStageId,
  resolveStagesForDrive,
} from "./types";
import { AtsColumn, type AtsDrive } from "./ats-column";
import { AddStageModal, RemoveStageModal, MoveSelectedModal } from "./ats-modals";

interface AtsAppRecord {
  id: string;
  current_stage?: string;
  outcome?: string | number;
  updated_at?: string;
  students?: {
    name?: string;
    register_number?: string;
    roll_number?: string;
    department?: string;
    users?: { name?: string } | { name?: string }[];
  } | {
    name?: string;
    register_number?: string;
    roll_number?: string;
    department?: string;
    users?: { name?: string } | { name?: string }[];
  }[];
  job_drives?: {
    batch?: string;
    role_title?: string;
    companies?: { name?: string } | { name?: string }[];
  } | {
    batch?: string;
    role_title?: string;
    companies?: { name?: string } | { name?: string }[];
  }[];
}

// ---------- Main content ----------
function ATSTrackerContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [drives, setDrives] = useState<AtsDrive[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCtcId, setEditingCtcId] = useState<string | null>(null);

  // Filters
  const [activeDrive, setActiveDrive] = useState(() => searchParams.get("driveId") ?? "All Drives");
  const [activeBatch, setActiveBatch] = useState("All Batches");
  const [activeDept, setActiveDept] = useState("All Departments");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showHoverPreview, setShowHoverPreview] = useState(false);

  // Selection
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetStage, setTargetStage] = useState("shortlisted");

  // Stages
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [defaultStages, setDefaultStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [stageToRemove, setStageToRemove] = useState<string | null>(null);
  const [openMappingDropdown, setOpenMappingDropdown] = useState<string | null>(null);

  // ---------- Data loading ----------
  const loadInitialData = useCallback(async () => {
    try {
      const [appsData, drivesData, batchesData, deptsData] = await Promise.all([
        db.getApplications({
          driveId: activeDrive === "All Drives" ? undefined : activeDrive,
          batch: activeBatch === "All Batches" ? undefined : activeBatch,
          department: activeDept === "All Departments" ? undefined : activeDept,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: debouncedSearch.trim() || undefined,
          limit: 1000,
        }),
        db.getDrives(),
        db.getDistinctBatches(),
        db.getDistinctDepartments(),
      ]);

      setApplications(
        appsData.map((app: AtsAppRecord) => {
          const student = Array.isArray(app.students) ? app.students[0] : app.students;
          const user = Array.isArray(student?.users) ? student.users[0] : student?.users;
          const drive = Array.isArray(app.job_drives) ? app.job_drives[0] : app.job_drives;
          const company = Array.isArray(drive?.companies) ? drive.companies[0] : drive?.companies;
          return {
            id: app.id,
            name: user?.name || "Unknown",
            regNo: student?.register_number || "N/A",
            rollNo: student?.roll_number || student?.register_number || "N/A",
            dept: student?.department || "N/A",
            batch: drive?.batch || "N/A",
            company: company?.name || "Unknown",
            role: drive?.role_title || "N/A",
            stage: app.current_stage || "applied",
            ctc: app.outcome ? String(app.outcome).replace(/[^0-9.]/g, "") : "",
            updated: db.formatRelativeTime(app.updated_at),
            avatar: (user?.name || "U")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2),
          };
        })
      );

      setDrives(drivesData as AtsDrive[]);
      setBatches(batchesData);
      setDepartments(deptsData);

      const defaultStagesData = await getSettingByKey<Stage[]>('default_ats_stages', DEFAULT_STAGES);
      setDefaultStages(defaultStagesData);

      // Resolve stages for the selected drive
      if (activeDrive !== "All Drives") {
        const drive = (drivesData as AtsDrive[]).find((d) => d.id === activeDrive);
        let savedStages: Stage[] | null = null;
        try {
          const rules =
            typeof drive?.eligibility_rules === "string"
              ? JSON.parse(drive.eligibility_rules)
              : drive?.eligibility_rules;
          savedStages = (rules as { stages?: Stage[] } | null | undefined)?.stages ?? null;
        } catch (e) {
          console.error("Failed to parse stages:", e);
        }

        const resolved = (savedStages && savedStages.length > 0) ? savedStages : defaultStagesData;

        // Verify we have all stages represented
        const merged = [...resolved];
        appsData.forEach((app: AtsAppRecord) => {
          const st = app.current_stage;
          if (st && st !== "applied") {
            if (!merged.find((m) => m.id === st))
              merged.push({ id: st as string, name: st as string, color: "bg-gray-500" });
          }
        });
        setStages(merged);
      } else {
        setStages(GLOBAL_META_STAGES);
      }
    } catch (error) {
      console.error("Failed to load ATS data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeDrive, activeBatch, activeDept, startDate, endDate, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [appsData, drivesData, batchesData, deptsData] = await Promise.all([
          db.getApplications({
            driveId: activeDrive === "All Drives" ? undefined : activeDrive,
            batch: activeBatch === "All Batches" ? undefined : activeBatch,
            department: activeDept === "All Departments" ? undefined : activeDept,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            search: debouncedSearch.trim() || undefined,
            limit: 1000,
          }),
          db.getDrives(),
          db.getDistinctBatches(),
          db.getDistinctDepartments(),
        ]);
        if (ignore) return;

        setApplications(
          appsData.map((app: AtsAppRecord) => {
            const student = Array.isArray(app.students) ? app.students[0] : app.students;
            const user = Array.isArray(student?.users) ? student.users[0] : student?.users;
            const drive = Array.isArray(app.job_drives) ? app.job_drives[0] : app.job_drives;
            const company = Array.isArray(drive?.companies) ? drive.companies[0] : drive?.companies;
            return {
              id: app.id,
              name: user?.name || "Unknown",
              regNo: student?.register_number || "N/A",
              rollNo: student?.roll_number || student?.register_number || "N/A",
              dept: student?.department || "N/A",
              batch: drive?.batch || "N/A",
              company: company?.name || "Unknown",
              role: drive?.role_title || "N/A",
              stage: app.current_stage || "applied",
              ctc: app.outcome ? String(app.outcome).replace(/[^0-9.]/g, "") : "",
              updated: db.formatRelativeTime(app.updated_at),
              avatar: (user?.name || "U")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2),
            };
          })
        );

        setDrives(drivesData as AtsDrive[]);
        setBatches(batchesData);
        setDepartments(deptsData);

        const defaultStagesData = await getSettingByKey<Stage[]>('default_ats_stages', DEFAULT_STAGES);
        setDefaultStages(defaultStagesData);

        // Resolve stages for the selected drive
        if (activeDrive !== "All Drives") {
          const drive = (drivesData as AtsDrive[]).find((d) => d.id === activeDrive);
          let savedStages: Stage[] | null = null;
          try {
            const rules =
              typeof drive?.eligibility_rules === "string"
                ? JSON.parse(drive.eligibility_rules)
                : drive?.eligibility_rules;
            savedStages = (rules as { stages?: Stage[] } | null | undefined)?.stages ?? null;
          } catch (e) {
            console.error("Failed to parse stages:", e);
          }

          const resolved = (savedStages && savedStages.length > 0) ? savedStages : defaultStagesData;

          // Verify we have all stages represented
          const merged = [...resolved];
          appsData.forEach((app: AtsAppRecord) => {
            const st = app.current_stage;
            if (st && st !== "applied") {
              if (!merged.find((m) => m.id === st))
                merged.push({ id: st as string, name: st as string, color: "bg-gray-500" });
            }
          });
          setStages(merged);
        } else {
          setStages(GLOBAL_META_STAGES);
        }
      } catch (error) {
        console.error("Failed to load ATS data:", error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [activeDrive, activeBatch, activeDept, startDate, endDate, debouncedSearch]);

  useEffect(() => {
    if (!openMappingDropdown) return;
    const handler = () => setOpenMappingDropdown(null);
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [openMappingDropdown]);

  // ---------- Drag & Drop ----------
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("applicationId", id);
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("applicationId");
    if (!id) return;

    let resolvedStageId = targetStageId;
    if (activeDrive === "All Drives") {
      const candidate = applications.find((a) => a.id === id);
      if (candidate) {
        const driveObj = drives.find(
          (d) => `${d.companies?.name} - ${d.role_title}` === `${candidate.company} - ${candidate.role}`
        );
        const driveStages = resolveStagesForDrive(driveObj);
        const match = driveStages.find((s) => getMetaStageId(s.id) === targetStageId);
        if (match) resolvedStageId = match.id;
      }
    }

    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, stage: resolvedStageId } : app))
    );
    try {
      await db.updateApplicationStage(id, resolvedStageId);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String((error as { message: unknown }).message) : 'Unknown error';
      console.error("Failed to update stage:", msg, error);
      toast.error(`Failed to move card: ${msg}`);
      loadInitialData();
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  // ---------- Selection ----------
  const handleToggleSelect = (id: string) => {
    setSelectedApps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMoveSelected = async () => {
    if (selectedApps.size === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        Array.from(selectedApps).map(async (id) => {
          let resolvedStageId = targetStage;
          if (activeDrive === "All Drives") {
            const candidate = applications.find((a) => a.id === id);
            if (candidate) {
              const driveObj = drives.find(
                (d) => `${d.companies?.name} - ${d.role_title}` === `${candidate.company} - ${candidate.role}`
              );
              const driveStages = resolveStagesForDrive(driveObj);
              const match = driveStages.find((s) => getMetaStageId(s.id) === targetStage);
              if (match) resolvedStageId = match.id;
            }
          }
          return db.updateApplicationStage(id, resolvedStageId);
        })
      );
      await loadInitialData();
      setSelectedApps(new Set());
      setShowMoveModal(false);
    } catch (error) {
      console.error("Failed to move selected:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Stage management ----------
  const handleAddStage = async () => {
    if (activeDrive === "All Drives" || !newStageName.trim()) return;
    const id = newStageName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newStages = [...stages, { id, name: newStageName.trim(), color: "bg-slate-500" }];
    setStages(newStages);
    setShowAddStageModal(false);
    setNewStageName("");
    try {
      await db.updateDriveStages(activeDrive, newStages);
    } catch (err) {
      console.error("Failed to save stage:", err);
    }
  };

  const handleExecuteRemoveStage = async () => {
    if (activeDrive === "All Drives" || !stageToRemove) return;
    const stageId = stageToRemove;
    const newStages = stages.filter((s) => s.id !== stageId);
    setStages(newStages);
    setStageToRemove(null);
    try {
      await db.updateDriveStages(activeDrive, newStages);
      await db.resetApplicationsStage(activeDrive, stageId);
      await loadInitialData();
    } catch (err) {
      console.error("Failed to save stage removal:", err);
    }
  };

  const handleMoveStageColumn = async (stageId: string, direction: "left" | "right") => {
    if (activeDrive === "All Drives") return;
    const idx = stages.findIndex((s) => s.id === stageId);
    if (idx === -1) return;
    if (direction === "left" && idx === 0) return;
    if (direction === "right" && idx === stages.length - 1) return;
    const newStages = [...stages];
    const swapIdx = direction === "left" ? idx - 1 : idx + 1;
    [newStages[idx], newStages[swapIdx]] = [newStages[swapIdx], newStages[idx]];
    setStages(newStages);
    try {
      await db.updateDriveStages(activeDrive, newStages);
    } catch (err) {
      console.error("Failed to save stage reorder:", err);
    }
  };

  const handleUpdateStageMapping = async (stageId: string, metaStage: string) => {
    const newStages = stages.map((s) => (s.id === stageId ? { ...s, metaStage } : s));
    setStages(newStages);
    if (activeDrive !== "All Drives") {
      try {
        await db.updateDriveStages(activeDrive, newStages);
        toast.success("Stage mapping saved");
      } catch (err) {
        console.error("Failed to update stage mapping:", err);
        toast.error("Failed to save mapping");
      }
    }
  };

  // ---------- CTC editing ----------
  const handleEditCtcEnd = async (id: string, value: string, prev: string) => {
    setEditingCtcId(null);
    if (value === prev) return;
    try {
      await db.updateApplicationCtc(id, value);
      toast.success("CTC updated");
      setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, ctc: value } : app)));
    } catch (error: unknown) {
      console.error("CTC Update Error:", error);
      toast.error("Failed to update CTC");
    }
  };

  // ---------- Export ----------
  const handleExportData = async () => {
    const toastId = toast.loading("Exporting Excel...");
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const exportData = filteredApps.map((app) => ({
        "Candidate Name": app.name,
        "Register Number": app.regNo,
        Department: app.dept,
        Batch: app.batch,
        Company: app.company,
        Role: app.role,
        Stage:
          (activeDrive === "All Drives"
            ? stages.find((s) => s.id === getMetaStageId(app.stage))?.name
            : stages.find((s) => s.id === app.stage)?.name) ||
          app.stage ||
          "Applied",
        "Last Updated": app.updated,
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
      XLSX.writeFile(workbook, `ATS_Report_${new Date().getTime()}.xlsx`);
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Failed to download report:", error);
      toast.error("Failed to export Excel");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading("Exporting PDF...");
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const headers = ["Candidate Name", "Reg No", "Dept", "Batch", "Company", "Role", "Stage", "Last Updated"];
      const rows = filteredApps.map((app) => [
        app.name,
        app.regNo,
        app.dept,
        app.batch,
        app.company,
        app.role,
        (activeDrive === "All Drives"
          ? stages.find((s) => s.id === getMetaStageId(app.stage))?.name
          : stages.find((s) => s.id === app.stage)?.name) ||
        app.stage ||
        "Applied",
        app.updated
      ]);
      await exportToPDF("ATS Pipeline Report", headers, rows, `ATS_Report_${new Date().getTime()}`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      toast.dismiss(toastId);
    }
  };

  // ---------- Filtering ----------
  const filteredApps = applications.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.regNo.toLowerCase().includes(search.toLowerCase()) ||
      (app.rollNo && app.rollNo.toLowerCase().includes(search.toLowerCase()))
  );

  const activeFilterCount =
    (activeBatch !== "All Batches" ? 1 : 0) +
    (activeDept !== "All Departments" ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  return (
    <div className="space-y-4 h-[calc(100vh-184px)] md:h-[calc(100vh-112px)] flex flex-col relative -mt-3">
      {/* Top Bar Controls (Equal Shape & Heights, Extended Width, Pushed Up) */}
      <div className="flex items-center justify-between gap-3 shrink-0 w-full">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          {/* Standalone Search Bar with Search Icon */}
          <div className="relative flex-1 max-w-sm">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
            <input
              type="text"
              placeholder="Search by name, register number, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-border-subtle bg-surface pl-9 pr-3 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Expanded Drive Dropdown Box (Fills Middle Gap) */}
          <div className="flex-1 min-w-[260px]">
            <SearchableSelect
              options={[
                { value: "All Drives", label: "All Drives" },
                ...[...drives]
                  .sort((a, b) => {
                    const countA = a.applications?.[0]?.count ?? 0;
                    const countB = b.applications?.[0]?.count ?? 0;
                    return countB - countA;
                  })
                  .map((d) => {
                    const count = d.applications?.[0]?.count ?? 0;
                    return { value: d.id || "", label: `(${count}) ${d.companies?.name} - ${d.role_title}` };
                  }),
              ]}
              value={activeDrive}
              onChange={setActiveDrive}
              placeholder="Select Drive"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {selectedApps.size > 0 && (
            <button
              onClick={() => setShowMoveModal(true)}
              className="flex items-center gap-2 h-9 rounded-lg bg-surface border border-border-subtle px-3.5 text-xs font-bold shadow-sm hover:bg-background transition-colors"
            >
              <LuMoveRight size={14} />
              Move Selected ({selectedApps.size})
            </button>
          )}

          {/* Standalone Filter Button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`flex items-center gap-2 h-9 rounded-lg border px-3.5 text-xs font-bold shadow-sm transition-all ${
              activeFilterCount > 0
                ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                : "bg-surface border-border-subtle hover:bg-background text-foreground"
            }`}
          >
            <LuFilter size={14} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Hover Details Toggle Button */}
          <button
            onClick={() => setShowHoverPreview(!showHoverPreview)}
            className={`flex items-center gap-2 h-9 rounded-lg border px-3.5 text-xs font-bold shadow-sm transition-all ${
              showHoverPreview
                ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                : "bg-surface border-border-subtle hover:bg-background text-foreground"
            }`}
            title="Toggle candidate details preview on hover"
          >
            <LuEye size={14} />
            <span>Hover Details</span>
          </button>

          {/* Standalone Export Dropdown */}
          <ExportDropdown
            onExportExcel={handleExportData}
            onExportPDF={handleExportPDF}
          />
        </div>
      </div>

      {/* Slide-over Filter Panel (Right Drawer Tab) */}
      {isFilterOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsFilterOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-surface border-l border-border-subtle shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuSlidersHorizontal className="text-primary" size={18} />
                <h3 className="font-bold text-sm">Filter Candidates</h3>
                {activeFilterCount > 0 && (
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                    {activeFilterCount} Active
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1.5 rounded-lg hover:bg-background text-muted hover:text-foreground transition-colors"
              >
                <LuX size={16} />
              </button>
            </div>

            {/* Body: Filter Options */}
            <div className="p-4 space-y-5 flex-1 overflow-y-auto">
              {/* Batch Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Batch / Graduation Year</label>
                <SearchableSelect
                  options={[
                    { value: "All Batches", label: "All Batches" },
                    ...batches.map((b) => ({ value: b, label: b })),
                  ]}
                  value={activeBatch}
                  onChange={setActiveBatch}
                  placeholder="Select Batch"
                />
              </div>

              {/* Department Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Department</label>
                <SearchableSelect
                  options={[
                    { value: "All Departments", label: "All Departments" },
                    ...departments.map((d) => ({ value: d, label: d })),
                  ]}
                  value={activeDept}
                  onChange={setActiveDept}
                  placeholder="Select Department"
                />
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider">Application Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted font-medium block mb-1">From Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2 text-xs font-medium shadow-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted font-medium block mb-1">To Date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-border-subtle bg-background px-3 py-2 text-xs font-medium shadow-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setActiveBatch("All Batches");
                    setActiveDept("All Departments");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors pt-2"
                >
                  <LuRotateCcw size={14} />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto pb-4 no-scrollbar">
        {filteredApps.length === 0 && !loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="py-12 px-8 text-center max-w-md bg-surface border border-border-subtle rounded-3xl shadow-sm space-y-4 my-auto">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <LuSearch size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-foreground">No Candidates Found</h4>
                <p className="text-xs text-muted">
                  No candidate applications match your current search or filter criteria.
                </p>
              </div>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveBatch("All Batches");
                  setActiveDept("All Departments");
                  setStartDate("");
                  setEndDate("");
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <LuRotateCcw size={14} />
                Reset Search & Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 h-full min-w-max">
          {stages.map((stage) => (
            <AtsColumn
              key={stage.id}
              stage={stage}
              stages={stages}
              defaultStages={defaultStages}
              filteredApps={filteredApps}
              drives={drives}
              activeDrive={activeDrive}
              loading={loading}
              selectedApps={selectedApps}
              editingCtcId={editingCtcId}
              openMappingDropdown={openMappingDropdown}
              showHoverPreview={showHoverPreview}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onToggleSelect={handleToggleSelect}
              onMoveColumn={handleMoveStageColumn}
              onRemoveStage={setStageToRemove}
              onEditCtcStart={setEditingCtcId}
              onEditCtcEnd={handleEditCtcEnd}
              onOpenMappingDropdown={setOpenMappingDropdown}
              onUpdateStageMapping={handleUpdateStageMapping}
            />
          ))}

          {/* Add stage column */}
          {activeDrive !== "All Drives" && (
            <div className="w-[300px] flex flex-col gap-4">
              <button
                onClick={() => setShowAddStageModal(true)}
                className="h-full min-h-[100px] border-2 border-dashed border-border-subtle rounded-3xl flex flex-col items-center justify-center text-muted hover:text-foreground hover:border-primary/50 transition-colors opacity-70 hover:opacity-100"
              >
                <LuPlus size={24} className="mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">Add Stage</span>
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Modals */}
      {showAddStageModal && (
        <AddStageModal
          newStageName={newStageName}
          onNameChange={setNewStageName}
          onAdd={handleAddStage}
          onClose={() => setShowAddStageModal(false)}
        />
      )}
      {stageToRemove && (
        <RemoveStageModal
          onConfirm={handleExecuteRemoveStage}
          onClose={() => setStageToRemove(null)}
        />
      )}
      {showMoveModal && (
        <MoveSelectedModal
          count={selectedApps.size}
          stages={stages}
          targetStage={targetStage}
          isLoading={loading}
          onTargetChange={setTargetStage}
          onConfirm={handleMoveSelected}
          onClose={() => setShowMoveModal(false)}
        />
      )}
    </div>
  );
}

// ---------- Page export ----------
export default function ATSTrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-muted text-sm font-bold">
          Loading ATS Tracker...
        </div>
      }
    >
      <ATSTrackerContent />
    </Suspense>
  );
}
