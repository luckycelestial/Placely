"use client";
import { Suspense, useState, useEffect } from "react";
import { Sk } from "@/components/ui/skeleton";
import { useSearchParams } from "next/navigation";
import { 
  LuGripVertical, 
  LuMessageSquare, 
  LuClock, 
  LuArrowRight,
  LuBuilding2,
  LuDownload,
  LuMoveRight,
  LuX,
  LuPlus,
  LuTrash2,
  LuChevronLeft,
  LuChevronRight
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import * as XLSX from "xlsx";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { toast } from "sonner";

const DEFAULT_STAGES = [
  { id: "applied", name: "Applied", color: "bg-slate-500" },
  { id: "shortlisted", name: "Shortlisted", color: "bg-blue-500" },
  { id: "interview1", name: "Tech Round 1", color: "bg-purple-500" },
  { id: "interview2", name: "Tech Round 2", color: "bg-indigo-500" },
  { id: "selection", name: "Selection", color: "bg-emerald-500" }
];

const GLOBAL_META_STAGES = [
  { id: "applied", name: "Applied", color: "bg-slate-500 animate-fade-in" },
  { id: "screening", name: "Screening", color: "bg-blue-500 animate-fade-in" },
  { id: "interview", name: "Interviews", color: "bg-purple-500 animate-fade-in" },
  { id: "offered", name: "Offered", color: "bg-emerald-500 animate-fade-in" },
  { id: "joined", name: "Joined", color: "bg-indigo-500 animate-fade-in" }
];

function getMetaStageId(stageId: string): string {
  const id = stageId.toLowerCase();
  if (id === 'applied' || id.includes('apply') || id.includes('appli')) return 'applied';
  if (id.includes('screen') || id.includes('short') || id.includes('gd') || id.includes('group') || id.includes('test')) return 'screening';
  if (id.includes('interview') || id.includes('tech') || id.includes('round') || id.includes('oa') || id.includes('assess') || id.includes('coding')) return 'interview';
  if (id.includes('offer') || id.includes('select') || id.includes('accept')) return 'offered';
  if (id.includes('join') || id.includes('place')) return 'joined';
  return 'interview'; // default fallback
}

// Resolves the global meta-stage for a candidate, checking explicit mapping first
function getCandidateMetaStage(candidateStage: string, driveStages: any[]): string {
  const stageObj = driveStages.find((s: any) => s.id === candidateStage);
  if (stageObj?.metaStage) return stageObj.metaStage;
  return getMetaStageId(candidateStage);
}

// Helper to get drive stages from raw drive object
function parseDriveStages(driveObj: any): any[] {
  if (!driveObj) return [];
  let rules = driveObj.eligibility_rules;
  if (typeof rules === 'string') { try { rules = JSON.parse(rules); } catch (e) {} }
  return (rules?.stages && Array.isArray(rules.stages) && rules.stages.length > 0) ? rules.stages : [];
}

interface Stage {
  id: string;
  name: string;
  color: string;
  metaStage?: string;
}

interface Application {
  id: string;
  name: string;
  regNo: string;
  company: string;
  role: string;
  stage: string;
  updated: string;
  avatar: string;
  dept: string;
  batch: string;
  ctc?: string;
}

function ATSTrackerContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCtcId, setEditingCtcId] = useState<string | null>(null);

  // Filters State
  const [activeDrive, setActiveDrive] = useState(() => searchParams.get("driveId") ?? "All Drives");
  const [activeBatch, setActiveBatch] = useState("All Batches");
  const [activeDept, setActiveDept] = useState("All Departments");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Checkbox State
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetStage, setTargetStage] = useState("shortlisted");

  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [stageToRemove, setStageToRemove] = useState<string | null>(null);
  const [openMappingDropdown, setOpenMappingDropdown] = useState<string | null>(null);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [appsData, drivesData, batchesData, deptsData] = await Promise.all([
        db.getApplications({ 
          driveId: activeDrive === "All Drives" ? undefined : activeDrive,
          batch: activeBatch === "All Batches" ? undefined : activeBatch,
          department: activeDept === "All Departments" ? undefined : activeDept,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }),
        db.getDrives(),
        db.getDistinctBatches(),
        db.getDistinctDepartments()
      ]);
      setApplications(appsData.map((app: any) => {
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
          ctc: app.outcome || "",
          updated: db.formatRelativeTime(app.updated_at),
          avatar: (user?.name || "U").split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
        };
      }));
      setDrives(drivesData);
      setBatches(batchesData);
      setDepartments(deptsData);

      // Handle custom stages
      if (activeDrive !== "All Drives") {
        const drive = drivesData.find((d: any) => d.id === activeDrive);
        
        console.log("DRIVE OBJECT:", drive);
        console.log("ELIGIBILITY RULES:", drive?.eligibility_rules);
        console.log("TYPEOF ELIGIBILITY RULES:", typeof drive?.eligibility_rules);

        // Extract stages from eligibility_rules JSONB
        let savedStages = null;
        try {
          if (typeof drive?.eligibility_rules === 'string') {
            const parsed = JSON.parse(drive.eligibility_rules);
            savedStages = parsed?.stages;
          } else if (typeof drive?.eligibility_rules === 'object' && drive?.eligibility_rules !== null) {
            savedStages = drive.eligibility_rules.stages;
          }
        } catch (e) {
          console.error("Failed to parse eligibility rules:", e);
        }

        console.log("SAVED STAGES EXTRACTED:", savedStages);

        if (savedStages && Array.isArray(savedStages) && savedStages.length > 0) {
          setStages(savedStages);
        } else {
          const appStages = new Set(appsData.map((a: any) => a.current_stage || 'applied'));
          let merged = [...DEFAULT_STAGES];
          appStages.forEach(st => {
            if (!merged.find(m => m.id === st)) {
              merged.push({ id: st as string, name: st as string, color: "bg-gray-500" });
            }
          });
          setStages(merged);
        }
      } else {
        setStages(GLOBAL_META_STAGES);
      }
    } catch (error) {
      console.error("Failed to load ATS data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [activeDrive, activeBatch, activeDept, startDate, endDate]);

  useEffect(() => {
    if (!openMappingDropdown) return;
    const handler = () => setOpenMappingDropdown(null);
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [openMappingDropdown]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("applicationId", id);
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("applicationId");
    if (!id) return;

    let resolvedStageId = targetStageId;
    if (activeDrive === "All Drives") {
      const candidate = applications.find(a => a.id === id);
      if (candidate) {
        const driveObj = drives.find(d => `${d.companies?.name} - ${d.role_title}` === `${candidate.company} - ${candidate.role}`);
        let driveStages = DEFAULT_STAGES;
        if (driveObj) {
          let rules = driveObj.eligibility_rules;
          if (rules) {
            if (typeof rules === 'string') {
              try { rules = JSON.parse(rules); } catch (e) {}
            }
            if (rules.stages && Array.isArray(rules.stages) && rules.stages.length > 0) {
              driveStages = rules.stages;
            }
          }
        }
        const matchingStage = driveStages.find(s => getMetaStageId(s.id) === targetStageId);
        if (matchingStage) resolvedStageId = matchingStage.id;
      }
    }

    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, stage: resolvedStageId } : app
    ));

    try {
      await db.updateApplicationStage(id, resolvedStageId);
    } catch (error) {
      console.error("Failed to update stage:", error);
      loadInitialData();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedApps(newSelected);
  };

  const handleMoveSelected = async () => {
    if (selectedApps.size === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        Array.from(selectedApps).map(async (id) => {
          let resolvedStageId = targetStage;
          if (activeDrive === "All Drives") {
            const candidate = applications.find(a => a.id === id);
            if (candidate) {
              const driveObj = drives.find(d => `${d.companies?.name} - ${d.role_title}` === `${candidate.company} - ${candidate.role}`);
              let driveStages = DEFAULT_STAGES;
              if (driveObj) {
                let rules = driveObj.eligibility_rules;
                if (rules) {
                  if (typeof rules === 'string') {
                    try { rules = JSON.parse(rules); } catch (e) {}
                  }
                  if (rules.stages && Array.isArray(rules.stages) && rules.stages.length > 0) {
                    driveStages = rules.stages;
                  }
                }
              }
              const matchingStage = driveStages.find(s => getMetaStageId(s.id) === targetStage);
              if (matchingStage) resolvedStageId = matchingStage.id;
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

  const handleAddStage = async () => {
    if (!newStageName.trim()) return;
    const id = newStageName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newStages = [...stages, { id, name: newStageName.trim(), color: "bg-slate-500" }];
    setStages(newStages);
    setShowAddStageModal(false);
    setNewStageName("");
    
    if (activeDrive !== "All Drives") {
      try {
        await db.updateDriveStages(activeDrive, newStages);
      } catch (err) {
        console.error("Failed to save stage:", err);
      }
    } else {
      try {
        await db.updateAllDriveStages(newStages);
      } catch (err) {
        console.error("Failed to save global stages:", err);
      }
    }
  };

  const executeRemoveStage = async () => {
    if (!stageToRemove) return;
    const newStages = stages.filter(s => s.id !== stageToRemove);
    setStages(newStages);
    setStageToRemove(null);
    if (activeDrive !== "All Drives") {
      try {
        await db.updateDriveStages(activeDrive, newStages);
      } catch (err) {
        console.error("Failed to save stage removal:", err);
      }
    } else {
      try {
        await db.updateAllDriveStages(newStages);
      } catch (err) {
        console.error("Failed to save global stage removal:", err);
      }
    }
  };

  const handleMoveStageColumn = async (stageId: string, direction: 'left' | 'right') => {
    const idx = stages.findIndex(s => s.id === stageId);
    if (idx === -1) return;
    if (direction === 'left' && idx === 0) return;
    if (direction === 'right' && idx === stages.length - 1) return;

    const newStages = [...stages];
    const swapIdx = direction === 'left' ? idx - 1 : idx + 1;
    [newStages[idx], newStages[swapIdx]] = [newStages[swapIdx], newStages[idx]];
    
    setStages(newStages);
    if (activeDrive !== "All Drives") {
      try {
        await db.updateDriveStages(activeDrive, newStages);
      } catch (err) {
        console.error("Failed to save stage reorder:", err);
      }
    } else {
      try {
        await db.updateAllDriveStages(newStages);
      } catch (err) {
        console.error("Failed to save global stage reorder:", err);
      }
    }
  };

  const handleUpdateStageMapping = async (stageId: string, metaStage: string) => {
    const newStages = stages.map(s => s.id === stageId ? { ...s, metaStage } : s);
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

  const handleExportData = () => {
    try {
      const exportData = filteredApps.map((app) => ({
        "Candidate Name": app.name,
        "Register Number": app.regNo,
        "Department": app.dept,
        "Batch": app.batch,
        "Company": app.company,
        "Role": app.role,
        "Stage": (activeDrive === "All Drives" ? stages.find(s => s.id === getMetaStageId(app.stage))?.name : stages.find(s => s.id === app.stage)?.name) || app.stage || "Applied",
        "Last Updated": app.updated
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
      XLSX.writeFile(workbook, `ATS_Report_${new Date().getTime()}.xlsx`);
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  const filteredApps = applications.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase()) || 
    app.company.toLowerCase().includes(search.toLowerCase()) ||
    app.regNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-184px)] md:h-[calc(100vh-112px)] flex flex-col relative">
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
            ...drives.map(d => ({ value: d.id, label: `${d.companies?.name} - ${d.role_title}` }))
          ]}
          value={activeDrive}
          onChange={setActiveDrive}
          placeholder="Select Drive"
        />
        <SearchableSelect 
          options={[
            { value: "All Batches", label: "All Batches" },
            ...batches.map(b => ({ value: b, label: b }))
          ]}
          value={activeBatch}
          onChange={setActiveBatch}
          placeholder="Select Batch"
        />
        <SearchableSelect 
          options={[
            { value: "All Departments", label: "All Departments" },
            ...departments.map(d => ({ value: d, label: d }))
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

      <div className="flex-1 overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-4 h-full min-w-max">
          {stages.map((stage) => {
            const stageApps = filteredApps.filter(c => {
              if (activeDrive === "All Drives") {
                // Find candidate's drive and check for explicit metaStage mapping first
                const driveObj = drives.find(d =>
                  `${d.companies?.name} - ${d.role_title}` === `${c.company} - ${c.role}`
                );
                const driveStages = parseDriveStages(driveObj);
                return getCandidateMetaStage(c.stage, driveStages) === stage.id;
              } else {
                return c.stage === stage.id;
              }
            });

            return (
              <div 
                key={stage.id} 
                className="w-[300px] flex flex-col gap-4"
                onDrop={(e) => handleDrop(e, stage.id)}
                onDragOver={handleDragOver}
              >
                <div className="flex flex-col gap-1 px-2">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
                      <h3 className="font-black text-sm uppercase tracking-widest text-foreground/80">{stage.name}</h3>
                      <span className="bg-background px-2 py-0.5 rounded-md text-[10px] font-black text-muted border border-border-subtle">
                        {stageApps.length}
                      </span>
                    </div>
                    {activeDrive !== "All Drives" && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleMoveStageColumn(stage.id, 'left')}
                          className="p-1 hover:bg-black/5 rounded text-muted hover:text-foreground transition-colors"
                          disabled={stages.indexOf(stage) === 0}
                        >
                          <LuChevronLeft size={12} />
                        </button>
                        <button 
                          onClick={() => handleMoveStageColumn(stage.id, 'right')}
                          className="p-1 hover:bg-black/5 rounded text-muted hover:text-foreground transition-colors"
                          disabled={stages.indexOf(stage) === stages.length - 1}
                        >
                          <LuChevronRight size={12} />
                        </button>
                        <button 
                          onClick={() => setStageToRemove(stage.id)}
                          className="p-1 hover:bg-red-500/10 rounded text-muted hover:text-red-500 transition-colors ml-1"
                        >
                          <LuTrash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  {activeDrive !== "All Drives" && (
                    <div className="flex items-center gap-1.5 px-0.5 relative">
                      <span className="text-[8px] font-black text-muted/50 uppercase tracking-widest">Maps to</span>
                      <div className="relative">
                        <button
                          onClick={() => setOpenMappingDropdown(openMappingDropdown === stage.id ? null : stage.id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border-subtle text-[9px] font-black text-foreground/70 hover:text-foreground hover:border-foreground/20 transition-colors"
                        >
                          {GLOBAL_META_STAGES.find(m => m.id === (stage.metaStage || getMetaStageId(stage.id)))?.name ?? 'Interviews'}
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={cn("transition-transform", openMappingDropdown === stage.id && "rotate-180")}>
                            <path d="M1.5 3L4 5.5L6.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        {openMappingDropdown === stage.id && (
                          <div className="absolute top-full left-0 mt-1.5 w-32 bg-surface border border-border-subtle rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                            {GLOBAL_META_STAGES.map(m => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  handleUpdateStageMapping(stage.id, m.id);
                                  setOpenMappingDropdown(null);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2 text-[10px] font-bold transition-colors",
                                  (stage.metaStage || getMetaStageId(stage.id)) === m.id
                                    ? "bg-foreground/8 text-foreground font-black"
                                    : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                                )}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-background/50 rounded-3xl border border-border-subtle/50 p-3 space-y-3 overflow-y-auto no-scrollbar min-h-[200px]">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Sk.Card key={i} />)
                  ) : stageApps.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-border-subtle rounded-2xl flex flex-col items-center justify-center text-muted opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-widest">No Candidates</p>
                    </div>
                  ) : (
                    stageApps.map((candidate) => {
                      const driveObj = drives.find(d => d.id === activeDrive || (`${d.companies?.name} - ${d.role_title}` === `${candidate.company} - ${candidate.role}`));
                      let driveStages = DEFAULT_STAGES;
                      if (driveObj) {
                        let rules = driveObj.eligibility_rules;
                        if (rules) {
                          if (typeof rules === 'string') {
                            try { rules = JSON.parse(rules); } catch (e) {}
                          }
                          if (rules.stages && Array.isArray(rules.stages) && rules.stages.length > 0) {
                            driveStages = rules.stages;
                          }
                        }
                      }
                      const actualStageName = driveStages.find(s => s.id === candidate.stage)?.name || candidate.stage;

                      return (
                        <div 
                          key={candidate.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, candidate.id)}
                          className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-grab active:cursor-grabbing group relative"
                        >
                          <div className="absolute top-4 right-4">
                            <input 
                              type="checkbox"
                              checked={selectedApps.has(candidate.id)}
                              onChange={() => handleToggleSelect(candidate.id)}
                              className="w-4 h-4 rounded border-border-subtle text-primary focus:ring-primary/20 cursor-pointer"
                            />
                          </div>

                          <div className="flex items-start justify-between mb-3 pr-6">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                                {candidate.avatar}
                              </div>
                              <div>
                                <p className="font-bold text-xs leading-none mb-1 group-hover:text-primary transition-colors">{candidate.name}</p>
                                <p className="text-[9px] font-black text-muted uppercase tracking-tighter">{candidate.regNo}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-1.5 text-foreground/70">
                              <LuBuilding2 size={12} className="text-muted flex-shrink-0" />
                              <span className="text-[10px] font-bold truncate max-w-[100px]">{candidate.company}</span>
                              <span className="h-0.5 w-0.5 rounded-full bg-muted flex-shrink-0"></span>
                              <span className="text-[10px] font-bold truncate max-w-[150px]">{candidate.role}</span>
                            </div>
                          </div>

                          {activeDrive === "All Drives" && (
                            <div className="mb-4">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/10">
                                Round: {actualStageName}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50">
                            <div className="flex items-center gap-1.5">
                              <LuClock size={10} className="text-muted" />
                              <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">{candidate.updated}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {(actualStageName.toLowerCase().includes('offer') || actualStageName.toLowerCase().includes('select') || actualStageName.toLowerCase().includes('join')) && (
                                <div onClick={(e) => e.stopPropagation()}>
                                  {editingCtcId === candidate.id ? (
                                    <input 
                                      autoFocus
                                      type="text" 
                                      defaultValue={candidate.ctc || ""}
                                      placeholder="12 LPA"
                                      className="w-16 bg-background border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.5 text-[9px] font-bold focus:outline-none"
                                      onBlur={(e) => {
                                        setEditingCtcId(null);
                                        if (e.target.value !== candidate.ctc) {
                                          db.updateApplicationCtc(candidate.id, e.target.value).then(() => {
                                            toast.success("CTC updated");
                                            setApplications(prev => prev.map(app => app.id === candidate.id ? {...app, ctc: e.target.value} : app));
                                          }).catch((error: any) => {
                                            console.error("CTC Update Error:", error);
                                            toast.error("Failed to update CTC");
                                          });
                                        }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.currentTarget.blur();
                                      }}
                                    />
                                  ) : (
                                    <div 
                                      onClick={() => setEditingCtcId(candidate.id)}
                                      className={cn(
                                        "px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors border",
                                        candidate.ctc 
                                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/20" 
                                          : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                                      )}
                                    >
                                      {candidate.ctc || "+ CTC"}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors">
                                  <LuMessageSquare size={12} className="text-muted" />
                                </button>
                                <LuGripVertical size={12} className="text-muted cursor-grab" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
          
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

      {showAddStageModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border-subtle p-6 shadow-2xl">
            <h3 className="text-xl font-black mb-4">Add New Stage</h3>
            <p className="text-sm text-muted mb-6">Create a new column in your ATS pipeline.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted mb-2 block">Stage Name</label>
                <input 
                  type="text" 
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Group Discussion"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddStage();
                    if (e.key === 'Escape') setShowAddStageModal(false);
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowAddStageModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-border-subtle font-bold text-muted hover:text-foreground hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddStage}
                  disabled={!newStageName.trim()}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Stage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Stage Confirm Modal */}
      {stageToRemove && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl border border-border-subtle p-6 shadow-2xl">
            <h3 className="text-xl font-black mb-2">Remove Stage?</h3>
            <p className="text-sm text-muted mb-6">Are you sure you want to remove this stage column? Any students currently in this stage will not be deleted, but the column will be hidden.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setStageToRemove(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-border-subtle font-bold text-muted hover:text-foreground hover:bg-black/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeRemoveStage}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold hover:brightness-110 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-sm p-6 rounded-3xl border border-border-subtle shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black">Move {selectedApps.size} Candidates</h2>
              <button onClick={() => setShowMoveModal(false)} className="text-muted hover:text-foreground">
                <LuX size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">Target Stage</label>
                <SearchableSelect 
                  options={stages.map(s => ({ value: s.id, label: s.name }))}
                  value={targetStage}
                  onChange={setTargetStage}
                  placeholder="Select Target Stage"
                />
              </div>
              <button 
                onClick={handleMoveSelected}
                disabled={loading}
                className="w-full mt-4 bg-primary text-primary-foreground font-black py-3 rounded-xl hover:bg-primary/90 transition-colors"
              >
                {loading ? "Moving..." : "Confirm Move"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ATSTrackerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted text-sm font-bold">Loading ATS Tracker...</div>}>
      <ATSTrackerContent />
    </Suspense>
  );
}
