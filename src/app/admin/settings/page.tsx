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
  LuCircleCheck
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { getSystemSettings, updateSystemSettings } from "@/services/settings";
import { getBatchList, getRomanYear } from "@/lib/batch-utils";

const SECTIONS = [
  { id: "general", title: "General", icon: LuSettings, description: "College identity and basic info." },
  { id: "branding", title: "Branding", icon: LuPalette, description: "Logos, colors and portal theme." },
  { id: "policy", title: "Placement Policy", icon: LuBriefcase, description: "Rules, eligibility and thresholds." },
  { id: "roles", title: "Roles & Access", icon: LuShield, description: "Manage staff roles and permissions." },
  { id: "notifications", title: "Notifications", icon: LuBell, description: "Email and SMS templates." },
  { id: "security", title: "Security", icon: LuLock, description: "Authentication and session rules." }
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [isCompleted, setIsCompleted] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSystemSettings();
        setIsCompleted(data.isAcademicYearCompleted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSettings(false);
      }
    }
    load();
  }, []);

  const handleToggleCompletion = async () => {
    const nextVal = !isCompleted;
    setIsCompleted(nextVal);
    try {
      await updateSystemSettings({ isAcademicYearCompleted: nextVal });
    } catch (err) {
      console.error(err);
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
        <button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-tactile hover:bg-primary-dark transition-all">
          <LuSave size={18} />
          Save Changes
        </button>
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

              {/* Academic Year Completion Control */}
              <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-8 border-b border-border-subtle">
                  <h3 className="text-lg font-black tracking-tight mb-1">Academic Year Batch Control</h3>
                  <p className="text-sm font-medium text-muted">Manage progression of active batches and incoming enrollments.</p>
                </div>
                <div className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-2xl bg-primary/[0.03] border border-primary/10">
                    <div className="space-y-1 max-w-xl">
                      <p className="text-sm font-black flex items-center gap-2">
                        <LuCalendar size={18} className="text-primary" />
                        Academic Year Completion Status
                      </p>
                      <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed mt-1">
                        Toggling this transitions the college's active year. When enabled, final year students are marked as graduated and the incoming student batch becomes active.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Revert/Backward Button */}
                      <button
                        onClick={async () => {
                          if (isCompleted) {
                            setIsCompleted(false);
                            try {
                              await updateSystemSettings({ isAcademicYearCompleted: false });
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        disabled={!isCompleted}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all shadow-sm shrink-0 border",
                          !isCompleted
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                            : "bg-white text-foreground border-border-subtle hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer"
                        )}
                      >
                        <LuChevronLeft size={16} />
                        Revert Batch
                      </button>

                      {/* Advance/Forward Button */}
                      <button
                        onClick={async () => {
                          if (!isCompleted) {
                            setIsCompleted(true);
                            try {
                              await updateSystemSettings({ isAcademicYearCompleted: true });
                            } catch (err) {
                              console.error(err);
                            }
                          }
                        }}
                        disabled={isCompleted}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider transition-all shadow-sm shrink-0 border",
                          isCompleted
                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                            : "bg-primary text-white border-primary hover:bg-primary-dark hover:scale-105 active:scale-95 cursor-pointer"
                        )}
                      >
                        Complete Term
                        <LuChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary">Active Batches Live Preview</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {activeBatches.map((batch) => (
                        <div key={batch.value} className="p-4 rounded-2xl border border-border-subtle bg-background hover:shadow-md transition-shadow">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted">{getRomanYear(batch.yearNum)} Year</p>
                          <p className="text-lg font-black mt-2 text-foreground tracking-tight">{batch.label.split(' ')[0]}</p>
                          <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary px-2 py-0.5 rounded-full">Active</span>
                        </div>
                      ))}
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
                    {[
                      { label: "One Student One Job Policy", desc: "Allow students to apply for multiple jobs even after receiving one offer.", enabled: false },
                      { label: "Dream Company Provision", desc: "Allow students to apply for 'Dream' companies after one regular offer.", enabled: true }
                    ].map((pref) => (
                      <div key={pref.label} className="flex items-center justify-between p-4 rounded-2xl border border-border-subtle hover:bg-background transition-colors">
                        <div>
                          <p className="text-sm font-bold">{pref.label}</p>
                          <p className="text-[11px] font-medium text-muted">{pref.desc}</p>
                        </div>
                        <div className={cn(
                          "w-12 h-6 rounded-full relative transition-all cursor-pointer p-1",
                          pref.enabled ? "bg-primary" : "bg-muted/30"
                        )}>
                          <div className={cn(
                            "h-4 w-4 rounded-full bg-surface transition-all shadow-sm",
                            pref.enabled ? "ml-6" : "ml-0"
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback for other sections */}
          {activeSection !== "general" && activeSection !== "policy" && (
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
