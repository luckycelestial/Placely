"use client";
import { Sk } from "@/components/ui/skeleton";

import { useState, useEffect, Suspense } from "react";
import { 
  LuSearch, 
  LuDownload, 
  LuEye,
  LuArrowUpRight,
  LuEllipsisVertical,
  LuChevronRight,
  LuUser,
  LuBuilding2,
  LuBriefcase,
  LuPlus,
  LuLayoutGrid,
  LuEllipsis,
  LuCalendar
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";


const STATUS_TABS = ["All", "Applied", "Shortlisted", "Interviewing", "Offered", "Rejected"];

const statusMap: Record<string, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interviewing: "Interviewing",
  offered: "Offered",
  rejected: "Rejected"
};


function ApplicationsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const driveId = searchParams.get("driveId");
  
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState<{ id: string; studentName: string; regNo: string; company: string; role: string; appliedDate: string; status: string; stage: string; avatar: string }[]>([]);
  const [driveDetails, setDriveDetails] = useState<any>(null);
  const [stats, setStats] = useState({ pending: 0, shortlisted: 0, interviews: 0, offers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Fetch drive details if driveId is present
        if (driveId && driveId !== "All") {
          const drives = await db.getDrives({ search: driveId });
          if (drives && drives.length > 0) {
            setDriveDetails(drives[0]);
          }
        }

        const [appsData, statsData] = await Promise.all([
          db.getApplications({ driveId: driveId || undefined }),
          db.getApplicationStats(driveId || undefined)
        ]);
        
        if (!appsData || appsData.length === 0) {
          setApplications([]);
          setStats(statsData);
          return;
        }

        const mappedApps = appsData.map((app: any) => {
          const student = app.students;
          const user = student?.users;
          const drive = app.job_drives;
          const company = drive?.companies;

          return {
            id: app.id,
            studentName: user?.name || "Unknown Student",
            regNo: student?.register_number || "N/A",
            company: company?.name || "N/A",
            role: drive?.role_title || "N/A",
            appliedDate: app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "N/A",
            status: statusMap[app.status] || app.status || "Pending",
            stage: app.current_stage || "Applied",
            avatar: (user?.name || "UN").split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
          };
        });

        setApplications(mappedApps);
        setStats(statsData);
      } catch (error) {
        console.error("Failed to load applications:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [driveId]);

  const filteredApps = applications.filter(app => {
    const matchesTab = activeTab === "All" || app.status === activeTab;
    const matchesSearch = app.studentName.toLowerCase().includes(search.toLowerCase()) || 
                          app.company.toLowerCase().includes(search.toLowerCase()) ||
                          app.regNo.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });


  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {driveId && (
            <Link 
              href="/admin/drives"
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-border-subtle bg-surface shadow-sm hover:bg-background transition-colors"
            >
              <LuArrowLeft size={20} />
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {driveDetails ? `${driveDetails.companies?.name} - ${driveDetails.role_title}` : "Applications Manager"}
            </h1>
            <p className="text-muted text-sm font-medium">
              {driveDetails ? `Reviewing ${applications.length} applications for this drive.` : "Review, track, and manage student applications across all drives."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-surface border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors">
            <LuDownload size={16} />
            Download Report
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-tactile hover:bg-primary-dark transition-all">
            Bulk Update Status
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: stats.pending, color: "text-orange-600", bg: "bg-orange-500/10" },
          { label: "Shortlisted", value: stats.shortlisted, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "Interviews", value: stats.interviews, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Final Offers", value: stats.offers, color: "text-primary", bg: "bg-primary/10" }
        ].map((stat) => (
          <div key={stat.label} className={cn("p-4 rounded-3xl border border-border-subtle shadow-soft bg-surface group hover:scale-[1.02] transition-all cursor-default")}>
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs & Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-1 bg-background p-1 rounded-2xl w-fit border border-border-subtle overflow-x-auto no-scrollbar">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-surface text-primary shadow-sm" 
                    : "text-muted hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search student or company..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border-subtle bg-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-background/50">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Application</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Job Details</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Applied Date</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Current Stage</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Status</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <Sk.TableRows cols={6} rows={6} />
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm font-bold text-muted">
                    No applications found.
                  </td>
                </tr>
              ) : filteredApps.map((app) => (
                <tr key={app.id} className="group hover:bg-primary/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                        {app.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-none mb-1">{app.studentName}</p>
                        <p className="text-muted text-[11px] font-medium uppercase tracking-wider">{app.regNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <LuBuilding2 size={12} className="text-muted" />
                        <p className="text-sm font-bold text-foreground/80">{app.company}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <LuBriefcase size={12} className="text-muted" />
                        <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{app.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-foreground/70">{app.appliedDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse"></div>
                      <p className="text-sm font-bold text-foreground/80">{app.stage}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-black tracking-tight",
                      app.status === "Offered" ? "bg-emerald-500/10 text-emerald-600" : 
                      app.status === "Shortlisted" ? "bg-blue-500/10 text-blue-600" : 
                      app.status === "Interviewing" ? "bg-purple-500/10 text-purple-600" :
                      app.status === "Rejected" ? "bg-red-500/10 text-red-600" :
                      "bg-orange-500/10 text-orange-600"
                    )}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors" title="View Application">
                        <LuEye size={18} className="text-muted" />
                      </button>
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface border border-border-subtle shadow-sm hover:text-primary hover:border-primary/30 transition-all">
                        <LuArrowUpRight size={18} />
                      </button>
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors">
                        <LuEllipsisVertical size={18} className="text-muted" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="px-6 py-4 border-t border-border-subtle bg-background/30 flex items-center justify-between">
          <p className="text-xs font-bold text-muted">Page 1 of 42</p>
          <div className="flex items-center gap-1">
            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted cursor-not-allowed">
              <LuChevronRight size={16} className="rotate-180" />
            </button>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-black shadow-sm">1</button>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 text-xs font-black transition-colors">2</button>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors">
              <LuChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-muted">Loading applications manager...</p>
        </div>
      </div>
    }>
      <ApplicationsContent />
    </Suspense>
  );
}
