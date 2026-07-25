"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LuDownload, LuMoveRight, LuPlus } from "react-icons/lu";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { db } from "@/services/database";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { getSettingByKey } from "@/services/settings";
import {
  type Stage,
  type Application,
  DEFAULT_STAGES,
  GLOBAL_META_STAGES,
  getMetaStageId,
  resolveStagesForDrive,
} from "./types";
import { AtsColumn } from "./ats-column";
import { AddStageModal, RemoveStageModal, MoveSelectedModal } from "./ats-modals";

// ---------- Main content ----------
function ATSTrackerContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
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
  const loadInitialData = async () => {
    setLoading(true);
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
        appsData.map((app: any) => {
          const student = Array.isArray(app.students) ? app.students[0] : app.students;
          const user = Array.isArray(student?.users) ? student.users[0] : student?.users;
          const drive = Array.isArray(app.job_drives) ? app.job_drives[0] : app.job_drives;
          const company = Array.isArray(drive?.companies) ? drive.companies[0] : drive?.companies;
          return {
            id: app.id,
            name: user?.name || "Unknown",
            regNo: student?.register_number || "N/A",
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

      setDrives(drivesData);
      setBatches(batchesData);
      setDepartments(deptsData);

      const defaultStagesData = await getSettingByKey<Stage[]>('default_ats_stages', DEFAULT_STAGES);
      setDefaultStages(defaultStagesData);

      // Resolve stages for the selected drive
      if (activeDrive !== "All Drives") {
        const drive = drivesData.find((d: any) => d.id === activeDrive);
        let savedStages: Stage[] | null = null;
        try {
          const rules =
            typeof drive?.eligibility_rules === "string"
              ? JSON.parse(drive.eligibility_rules)
              : drive?.eligibility_rules;
          savedStages = rules?.stages ?? null;
        } catch (e) {
          console.error("Failed to parse stages:", e);
        }

        const resolved = (savedStages && savedStages.length > 0) ? savedStages : defaultStagesData;

        // Verify we have all stages represented
        const merged = [...resolved];
        appsData.forEach((app: any) => {
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
  };

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadInitialData();
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
    } catch (error: any) {
      const msg = error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error';
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
      next.has(id) ? next.delete(id) : next.add(id);
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
    } catch (error: any) {
      console.error("CTC Update Error:", error);
      toast.error("Failed to update CTC");
    }
  };

  // ---------- Export ----------
  const handleExportData = () => {
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
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  // ---------- Filtering ----------
  const filteredApps = applications.filter(
    (app) =>
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.company.toLowerCase().includes(search.toLowerCase()) ||
      app.regNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-184px)] md:h-[calc(100vh-112px)] flex flex-col relative">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight">ATS Tracker</h1>
          <p className="text-muted text-sm font-medium">Manage pipeline stages and track candidate progress.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedApps.size > 0 && (
            <button
              onClick={() => setShowMoveModal(true)}
              className="flex items-center gap-2 rounded-xl bg-surface border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors"
            >
              <LuMoveRight size={16} />
              Move Selected ({selectedApps.size})
            </button>
          )}
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
          >
            <LuDownload size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 shrink-0 bg-surface/50 p-3 rounded-2xl border border-border-subtle w-full">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <SearchableSelect
          options={[
            { value: "All Drives", label: "All Drives" },
            ...[...drives]
              .sort((a, b) => {
                const countA = (a.applications as any)?.[0]?.count ?? 0;
                const countB = (b.applications as any)?.[0]?.count ?? 0;
                return countB - countA;
              })
              .map((d) => {
                const count = (d.applications as any)?.[0]?.count ?? 0;
                return { value: d.id, label: `(${count}) ${d.companies?.name} - ${d.role_title}` };
              }),
          ]}
          value={activeDrive}
          onChange={setActiveDrive}
          placeholder="Select Drive"
        />
        <SearchableSelect
          options={[
            { value: "All Batches", label: "All Batches" },
            ...batches.map((b) => ({ value: b, label: b })),
          ]}
          value={activeBatch}
          onChange={setActiveBatch}
          placeholder="Select Batch"
        />
        <SearchableSelect
          options={[
            { value: "All Departments", label: "All Departments" },
            ...departments.map((d) => ({ value: d, label: d })),
          ]}
          value={activeDept}
          onChange={setActiveDept}
          placeholder="Select Department"
        />
        <div className="flex items-center gap-2 xl:col-span-2">
          <span className="text-xs font-bold text-muted whitespace-nowrap">Date:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-background px-2 py-2 text-xs font-bold shadow-sm focus:outline-none"
          />
          <span className="text-xs font-bold text-muted">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-background px-2 py-2 text-xs font-bold shadow-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto pb-4 no-scrollbar">
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
