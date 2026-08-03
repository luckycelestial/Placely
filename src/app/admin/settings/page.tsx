"use client";
import { useState, useEffect } from "react";
import { 
  LuShield, 
  LuBell, 
  LuPalette, 
  LuLock, 
  LuSettings, 
  LuSave, 
  LuBriefcase, 
  LuChevronRight,
  LuChevronLeft,
  LuCalendar,
  LuCircleCheck,
  LuLayers,
  LuPlus,
  LuTrash2,
  LuX
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { 
  getSystemSettings, 
  updateSystemSettings,
  getSettingByKey,
  updateSettingByKey
} from "@/services/settings";
import { getBatchList, getRomanYear } from "@/lib/batch-utils";
import { toast } from "sonner";

const SECTIONS = [
  { id: "general", title: "General", icon: LuSettings, description: "College identity and basic info." },
  { id: "groups", title: "Groups & Domains", icon: LuLayers, description: "Manage dynamic domains & placement groups." },
  { id: "branding", title: "Branding", icon: LuPalette, description: "Logos, colors and portal theme." },
  // { id: "policy", title: "Placement Policy", icon: LuBriefcase, description: "Rules, eligibility and thresholds." },
  { id: "roles", title: "Roles & Access", icon: LuShield, description: "Manage staff roles and permissions." },
  { id: "notifications", title: "Notifications", icon: LuBell, description: "Email and SMS templates." },
  { id: "security", title: "Security", icon: LuLock, description: "Authentication and session rules." }
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [isCompleted, setIsCompleted] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [oneStudentOneJob, setOneStudentOneJob] = useState(false);
  const [defaultAtsStages, setDefaultAtsStages] = useState<any[]>([]);
  const [newStageInput, setNewStageInput] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [sysData, policyVal, stagesVal] = await Promise.all([
          getSystemSettings(),
          getSettingByKey<boolean>('one_student_one_job_policy', false),
          getSettingByKey<any[]>('default_ats_stages', [
            { id: "applied", name: "Applied", color: "bg-slate-500" },
            { id: "shortlisted", name: "Shortlisted", color: "bg-blue-500" },
            { id: "interview1", name: "Tech Round 1", color: "bg-purple-500" },
            { id: "interview2", name: "Tech Round 2", color: "bg-indigo-500" },
            { id: "selection", name: "Selection", color: "bg-emerald-500" },
          ])
        ]);
        setIsCompleted(sysData.isAcademicYearCompleted);
        setOneStudentOneJob(policyVal);
        setDefaultAtsStages(stagesVal);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSettings(false);
      }
    }
    load();
  }, []);

  const handleAddDefaultStage = async () => {
    if (!newStageInput.trim()) return;
    const newStageName = newStageInput.trim();
    const stageId = newStageName.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    if (defaultAtsStages.some(s => s.id === stageId)) {
      toast.error("Stage ID already exists");
      return;
    }

    const newStage = {
      id: stageId,
      name: newStageName,
      color: "bg-purple-500"
    };
    const nextVal = [...defaultAtsStages, newStage];
    setDefaultAtsStages(nextVal);
    setNewStageInput("");
    try {
      await updateSettingByKey('default_ats_stages', nextVal);
      toast.success("Default recruitment stage added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save default stages");
    }
  };

  const handleRemoveDefaultStage = async (id: string) => {
    if (id === "applied" || id === "selection") {
      toast.error("Applied and Selection stages cannot be deleted");
      return;
    }
    const nextVal = defaultAtsStages.filter(s => s.id !== id);
    setDefaultAtsStages(nextVal);
    try {
      await updateSettingByKey('default_ats_stages', nextVal);
      toast.success("Default recruitment stage removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save default stages");
    }
  };

  const handleToggleCompletion = async () => {
    const nextVal = !isCompleted;
    setIsCompleted(nextVal);
    try {
      await updateSystemSettings({ isAcademicYearCompleted: nextVal });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePolicy = async () => {
    const nextVal = !oneStudentOneJob;
    setOneStudentOneJob(nextVal);
    try {
      await updateSettingByKey<boolean>('one_student_one_job_policy', nextVal);
      toast.success(`One Student One Job Policy ${nextVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update policy");
    }
  };

  const activeBatches = getBatchList(isCompleted);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">System Settings</h1>
          <p className="text-muted text-sm font-medium">Configure portal behavior and institutional policies.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all text-left group",
                activeSection === section.id 
                  ? "bg-surface border border-border-subtle shadow-soft text-primary" 
                  : "text-muted hover:bg-background hover:text-foreground"
              )}
            >
              <section.icon size={20} className={cn(
                "shrink-0 transition-colors",
                activeSection === section.id ? "text-primary" : "text-muted group-hover:text-foreground"
              )} />
              <div>
                <p className="text-sm font-black tracking-tight">{section.title}</p>
                <p className="text-[10px] font-medium leading-none mt-1 opacity-70">{section.description}</p>
              </div>
              {activeSection === section.id && (
                <LuChevronRight size={16} className="ml-auto text-primary/40" />
              )}
            </button>
          ))}
        </aside>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          {activeSection === "general" && (
            <div className="space-y-6">
              {/* COMMENTED OUT: General Configuration
              <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-8 border-b border-border-subtle">
                  <h3 className="text-lg font-black tracking-tight mb-1">General Configuration</h3>
                  <p className="text-sm font-medium text-muted">Basic institutional details and contact information.</p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted ml-1">College Name</label>
                      <input 
                        type="text" 
                        defaultValue="National Institute of Technology"
                        className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted ml-1">College Short Name</label>
                      <input 
                        type="text" 
                        defaultValue="NIT"
                        className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted ml-1">Primary Email</label>
                      <input 
                        type="email" 
                        defaultValue="placements@college.edu"
                        className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted ml-1">Website URL</label>
                      <input 
                        type="url" 
                        defaultValue="https://college.edu"
                        className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
              */}

              {/* Academic Year Completion Control */}
              <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-8 sm:p-10 border-b border-border-subtle">
                  <h3 className="text-xl font-black tracking-tight mb-1">Academic Year &amp; Batch Progression</h3>
                  <p className="text-sm font-medium text-muted">Manage active student cohorts and transition term progression dynamically across the department.</p>
                </div>
                <div className="p-8 sm:p-10 space-y-10">
                  
                  {/* Status & Controls Bar */}
                  <div className="p-6 sm:p-8 rounded-3xl bg-background border border-border-subtle space-y-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-widest text-muted">Academic Term Status:</span>
                        <span className={cn(
                          "px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center gap-2",
                          isCompleted 
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}>
                          <span className={cn("h-2 w-2 rounded-full shrink-0", isCompleted ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
                          {isCompleted ? "Term Completed (Shifted)" : "Term In-Progress"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Revert/Backward Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (isCompleted) {
                              setIsCompleted(false);
                              try {
                                await updateSystemSettings({ isAcademicYearCompleted: false });
                                toast.success("Academic year set to In-Progress");
                              } catch (err) {
                                console.error(err);
                                toast.error("Failed to update setting");
                              }
                            }
                          }}
                          disabled={!isCompleted}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all border shadow-sm cursor-pointer",
                            !isCompleted
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                              : "bg-surface text-foreground border-border-subtle hover:bg-background active:scale-95"
                          )}
                        >
                          <LuChevronLeft size={16} />
                          Revert Term
                        </button>

                        {/* Advance/Forward Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!isCompleted) {
                              setIsCompleted(true);
                              try {
                                await updateSystemSettings({ isAcademicYearCompleted: true });
                                toast.success("Academic year marked as Completed");
                              } catch (err) {
                                console.error(err);
                                toast.error("Failed to update setting");
                              }
                            }
                          }}
                          disabled={isCompleted}
                          className={cn(
                            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all border shadow-md cursor-pointer",
                            isCompleted
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                              : "bg-primary text-white border-primary hover:bg-primary-dark active:scale-95"
                          )}
                        >
                          Complete Term
                          <LuChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-muted font-medium leading-relaxed border-t border-border-subtle/50 pt-4">
                      Toggling term completion automatically advances all active student batches across the department by 1 academic year (e.g. 3rd Year ➔ 4th Year).
                    </p>
                  </div>

                  {/* Batch Mapping Cards */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Active Batches vs. Year of Study Live Mapping</h4>
                      <span className="text-[11px] font-bold text-muted">4 Active Batches</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {activeBatches.map((batch) => {
                        const roman = getRomanYear(batch.yearNum);
                        const startYr = batch.graduationYear - 4;
                        return (
                          <div 
                            key={batch.value} 
                            className="p-6 rounded-2xl border border-border-subtle bg-background hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 hover:shadow-md group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-xl">
                                {roman} Year
                              </span>
                              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            </div>

                            <div className="space-y-1">
                              <p className="text-xl font-black text-foreground tracking-tight">Batch {batch.graduationYear}</p>
                              <p className="text-xs font-semibold text-muted">{startYr} – {batch.graduationYear}</p>
                            </div>

                            <div className="pt-3 border-t border-border-subtle/50 flex items-center">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                                Active Cohort
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {activeSection === "policy" && (
            <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-8 border-b border-border-subtle">
                <h3 className="text-lg font-black tracking-tight mb-1">Placement Rules & Policies</h3>
                <p className="text-sm font-medium text-muted">Define global rules for student eligibility and offer management.</p>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Eligibility Thresholds</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-2xl bg-background border border-border-subtle text-center">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Min CGPA</p>
                      <p className="text-xl font-black">6.5</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-background border border-border-subtle text-center">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Max Active Backlogs</p>
                      <p className="text-xl font-black">0</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-background border border-border-subtle text-center">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Attendance %</p>
                      <p className="text-xl font-black">75%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Global Preferences</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-border-subtle hover:bg-background transition-colors">
                      <div>
                        <p className="text-sm font-bold">One Student One Job Policy</p>
                        <p className="text-[11px] font-medium text-muted">Prevent students from applying for multiple jobs after receiving a placement offer.</p>
                      </div>
                      <div 
                        onClick={handleTogglePolicy}
                        className={cn(
                          "w-12 h-6 rounded-full relative transition-all cursor-pointer p-1",
                          oneStudentOneJob ? "bg-primary" : "bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded-full bg-surface transition-all shadow-sm",
                          oneStudentOneJob ? "ml-6" : "ml-0"
                        )} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Default Recruitment Stages Editor */}
                <div className="space-y-4 pt-6 border-t border-border-subtle/50">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Default Recruitment Pipeline Stages</h4>
                  <p className="text-xs text-muted font-medium mb-3">Customize the default tracking stages used for new drives.</p>
                  
                  <div className="flex flex-wrap gap-2.5 p-5 bg-background rounded-2xl border border-border-subtle">
                    {defaultAtsStages.map((stage) => {
                      const isEssential = stage.id === "applied" || stage.id === "selection";
                      return (
                        <div key={stage.id} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-subtle bg-surface text-xs font-bold shadow-sm">
                          <span className={cn("h-2.5 w-2.5 rounded-full", stage.color || "bg-purple-500")} />
                          <span>{stage.name}</span>
                          {!isEssential && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDefaultStage(stage.id)}
                              className="text-muted hover:text-red-500 transition-colors ml-1"
                            >
                              <LuX size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Technical Assessment, HR Round"
                      value={newStageInput}
                      onChange={(e) => setNewStageInput(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-border-subtle bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddDefaultStage}
                      className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-tactile hover:bg-primary-dark transition-all cursor-pointer"
                    >
                      <LuPlus size={14} /> Add Stage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "groups" && (
            <div className="bg-surface rounded-3xl border border-dashed border-border-subtle p-20 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
               <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center text-primary mb-6">
                 <LuLayers size={32} />
               </div>
               <h3 className="text-xl font-black tracking-tight mb-2 uppercase">Groups & Domains</h3>
               <p className="text-sm font-medium text-muted max-w-sm mx-auto mb-6">
                 Custom groups, options, and student mappings are now managed inside the dedicated Cohorts & Groups page.
               </p>
               <a
                 href="/admin/groups"
                 className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-white px-6 py-3 text-sm font-bold shadow-tactile transition-all cursor-pointer"
               >
                 Go to Groups Manager
                 <LuChevronRight size={16} />
               </a>
            </div>
          )}

          {/* Fallback for other sections */}
          {activeSection !== "general" && activeSection !== "policy" && activeSection !== "groups" && (
            <div className="bg-surface rounded-3xl border border-dashed border-border-subtle p-20 flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
               <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center text-muted mb-6">
                 <LuSettings size={32} />
               </div>
               <h3 className="text-xl font-black tracking-tight mb-2 uppercase">{activeSection} Module</h3>
               <p className="text-sm font-medium text-muted max-w-sm mx-auto">This configuration module is currently being migrated to the new admin console. Estimated arrival: Next Sprint.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
