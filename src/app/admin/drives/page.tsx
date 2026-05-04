"use client";

import { useState, useEffect } from "react";
import { 
  LuSearch, 
  LuFilter, 
  LuPlus, 
  LuBuilding2, 
  LuBriefcase, 
  LuCalendar, 
  LuMapPin, 
  LuDollarSign,
  LuChevronRight,
  LuHistory,
  LuFileText,
  LuCircleCheck,
  LuClock,
  LuBan,
  LuArrowUpRight,
  LuUsers
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";

const TABS = ["Drives", "Companies", "Templates"];

export default function DrivesPage() {
  const [activeTab, setActiveTab] = useState("Drives");
  const [search, setSearch] = useState("");
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDrives() {
      try {
        const data = await db.getDrives();
        setDrives(data.map((d: any) => ({
          id: d.id,
          company: d.companies?.name || "Unknown",
          role: d.role_title,
          package: d.package_ctc,
          location: d.location,
          deadline: new Date(d.application_end).toLocaleDateString(),
          status: d.status,
          applications: 0, 
          eligibility: d.eligibility_rules,
          type: d.drive_type
        })));
      } catch (error) {
        console.error("Failed to load drives:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDrives();
  }, []);

  const filteredDrives = drives.filter(drive => 
    drive.role.toLowerCase().includes(search.toLowerCase()) || 
    drive.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Placement Drives</h1>
          <p className="text-muted text-sm font-medium">Manage recruitment cycles, companies, and student eligibility.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-white border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors">
            <LuHistory size={16} />
            Past Drives
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-tactile hover:bg-primary-dark transition-all">
            <LuPlus size={18} />
            Create New Drive
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-background p-1 rounded-2xl w-fit border border-border-subtle">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2 text-sm font-bold rounded-xl transition-all",
              activeTab === tab 
                ? "bg-white text-primary shadow-sm" 
                : "text-muted hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search drives, companies, or roles..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border-subtle bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-border-subtle bg-white hover:bg-background transition-all shadow-sm text-sm font-bold">
          <LuFilter size={18} className="text-muted" />
          More Filters
        </button>
      </div>

      {/* Drives Grid/List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted font-bold">Loading drives...</div>
        ) : filteredDrives.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted font-bold">No drives found.</div>
        ) : (
          filteredDrives.map((drive) => (
            <div key={drive.id} className="group bg-white rounded-3xl border border-border-subtle shadow-soft hover:border-primary/20 transition-all overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-background border border-border-subtle flex items-center justify-center shrink-0">
                      <LuBuilding2 size={24} className="text-muted" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg leading-tight group-hover:text-primary transition-colors">{drive.role}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-foreground/70">{drive.company}</span>
                        <span className="h-1 w-1 rounded-full bg-border-subtle"></span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted">{drive.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                    drive.status === "published" || drive.status === "Published" ? "bg-emerald-500/10 text-emerald-600" :
                    drive.status === "draft" || drive.status === "Draft" ? "bg-blue-500/10 text-blue-600" :
                    "bg-black/5 text-muted"
                  )}>
                    {drive.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted">
                      <LuDollarSign size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted uppercase tracking-tighter">Package</p>
                      <p className="text-sm font-bold">{drive.package}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted">
                      <LuMapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted uppercase tracking-tighter">Location</p>
                      <p className="text-sm font-bold">{drive.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted">
                      <LuCalendar size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted uppercase tracking-tighter">Deadline</p>
                      <p className="text-sm font-bold">{drive.deadline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted">
                      <LuUsers size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted uppercase tracking-tighter">Applicants</p>
                      <p className="text-sm font-bold">{drive.applications}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-background border border-border-subtle/50 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <LuFileText size={14} className="text-primary" />
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Eligibility Rules</p>
                  </div>
                  <p className="text-xs font-bold text-foreground/80 leading-relaxed">
                    {drive.eligibility}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button className="flex-1 py-3 rounded-xl bg-surface border border-border-subtle text-sm font-bold hover:bg-black/5 transition-all flex items-center justify-center gap-2">
                    Edit Drive
                  </button>
                  <button className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-tactile hover:bg-primary-dark transition-all flex items-center justify-center gap-2">
                    Manage Applications
                    <LuArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
