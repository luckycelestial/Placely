"use client";

import { useState, useEffect } from "react";
import { 
  LuSearch, 
  LuFilter, 
  LuGripVertical, 
  LuMessageSquare, 
  LuCircleCheck, 
  LuCircleX, 
  LuClock, 
  LuArrowRight,
  LuHistory,
  LuLayers,
  LuChevronRight,
  LuBuilding2
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";

// Define stages
const STAGES = [
  { id: "applied", name: "Applied", color: "bg-slate-500" },
  { id: "shortlisted", name: "Shortlisted", color: "bg-blue-500" },
  { id: "interview1", name: "Tech Round 1", color: "bg-purple-500" },
  { id: "interview2", name: "Tech Round 2", color: "bg-indigo-500" },
  { id: "selection", name: "Selection", color: "bg-emerald-500" }
];

export default function ATSTrackerPage() {
  const [activeDrive, setActiveDrive] = useState("All Drives");
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [appsData, drivesData] = await Promise.all([
          db.getApplications({ driveId: activeDrive }),
          db.getDrives()
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
            company: company?.name || "Unknown",
            role: drive?.role_title || "N/A",
            stage: app.current_stage || "applied",
            updated: db.formatRelativeTime(app.updated_at),
            avatar: (user?.name || "U").split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2)
          };
        }));
        setDrives(drivesData);
      } catch (error) {
        console.error("Failed to load ATS data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [activeDrive]);

  const filteredApps = applications.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase()) || 
    app.company.toLowerCase().includes(search.toLowerCase()) ||
    app.regNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight">ATS Tracker</h1>
          <p className="text-muted text-sm font-medium">Manage pipeline stages and track candidate progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-10"
            value={activeDrive}
            onChange={(e) => setActiveDrive(e.target.value)}
          >
            <option>All Drives</option>
            {drives.map(drive => (
              <option key={drive.id} value={drive.id}>{drive.companies?.name} - {drive.role_title}</option>
            ))}
          </select>
          <button className="flex items-center gap-2 rounded-xl bg-white border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors">
            <LuHistory size={16} />
            History
          </button>
        </div>
      </div>

      {/* Pipeline Content */}
      <div className="flex-1 overflow-x-auto pb-4 no-scrollbar">
        <div className="flex gap-4 h-full min-w-max">
          {STAGES.map((stage) => {
            const stageApps = filteredApps.filter(c => c.stage === stage.id);
            return (
              <div key={stage.id} className="w-[300px] flex flex-col gap-4">
                {/* Stage Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", stage.color)} />
                    <h3 className="font-black text-sm uppercase tracking-widest text-foreground/80">{stage.name}</h3>
                  </div>
                  <span className="text-xs font-black text-muted bg-black/5 px-2 py-0.5 rounded-md">{stageApps.length}</span>
                </div>

                {/* Stage Column */}
                <div className="flex-1 bg-background/50 rounded-3xl border border-border-subtle/50 p-3 space-y-3 overflow-y-auto no-scrollbar">
                  {loading ? (
                    <div className="py-8 text-center text-xs font-bold text-muted">Loading...</div>
                  ) : stageApps.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-border-subtle rounded-2xl flex flex-col items-center justify-center text-muted opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-widest">No Candidates</p>
                    </div>
                  ) : (
                    stageApps.map((candidate) => (
                      <div 
                        key={candidate.id} 
                        className="bg-white p-4 rounded-2xl border border-border-subtle shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-grab active:cursor-grabbing group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px]">
                              {candidate.avatar}
                            </div>
                            <div>
                              <p className="font-bold text-xs leading-none mb-1 group-hover:text-primary transition-colors">{candidate.name}</p>
                              <p className="text-[9px] font-black text-muted uppercase tracking-tighter">{candidate.regNo}</p>
                            </div>
                          </div>
                          <LuGripVertical size={14} className="text-muted/40" />
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-1.5 text-foreground/70">
                            <LuBuilding2 size={12} className="text-muted" />
                            <span className="text-[10px] font-bold">{candidate.company}</span>
                            <span className="h-0.5 w-0.5 rounded-full bg-muted"></span>
                            <span className="text-[10px] font-bold">{candidate.role}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50">
                          <div className="flex items-center gap-1.5">
                            <LuClock size={10} className="text-muted" />
                            <span className="text-[9px] font-bold text-muted uppercase tracking-tighter">{candidate.updated}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors">
                              <LuMessageSquare size={12} className="text-muted" />
                            </button>
                            <button className="h-6 w-6 flex items-center justify-center rounded-md bg-primary/5 text-primary hover:bg-primary/10 transition-colors">
                              <LuArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
