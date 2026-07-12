"use client";
import { Sk } from "@/components/ui/skeleton";

import { useState, useEffect } from "react";
import { 
  LuUsers, 
  LuBuilding2, 
  LuCalendar, 
  LuTrendingUp, 
  LuPlus, 
  LuSearch, 
  LuFilter,
  LuDownload,
  LuLayoutGrid,
  LuList,
  LuArrowUpRight,
  LuCircleCheck,
  LuClock,
  LuChevronDown,
  LuLoader,
  LuFileText,
  LuTriangleAlert
} from "react-icons/lu";
import { db } from "@/services/database";
import { supabase } from "@/lib/supabase";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { cn } from "@/lib/utils";
import DriveDialog from "../drives/drive-dialog";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalStudents: number;
  activeDrives: number;
  placedStudents: number;
  averagePackage: number;
  placedPercentage: number;
  totalCompanies: number;
  totalOffers: number;
}

interface Activity {
  id: string;
  type: 'drive_created' | 'application_received' | 'placement_confirmed' | 'company_added';
  title: string;
  description: string;
  timestamp: Date;
  status?: 'success' | 'warning' | 'info' | 'error';
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeDrives: 0,
    placedStudents: 0,
    averagePackage: 0,
    placedPercentage: 0,
    totalCompanies: 0,
    totalOffers: 0
  });

  const [recentDrives, setRecentDrives] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [adminTasks, setAdminTasks] = useState<{ id: string; title: string; count: number }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDriveDialogOpen, setIsDriveDialogOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  const [loading, setLoading] = useState(true);
  const [batchOptions, setBatchOptions] = useState<string[]>([String(currentYear + 1), String(currentYear)]);

  useEffect(() => {
    loadDashboardData();
  }, [yearFilter]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [allDrives, dashboardStats, approvals, activityData, distinctBatches, tasksResult] = await Promise.all([
        db.getDrives(),   // fetch all, filter client-side so null-batch drives show
        db.getDashboardStats(),
        db.getPendingApprovals(),
        db.getRecentActivity(),
        db.getDistinctBatches(),
        supabase.from('admin_tasks').select('id, title, count').eq('is_active', true).order('created_at')
      ]);
      setAdminTasks(tasksResult.data || []);

      // Update batch options dynamically (sorted descending: newest first)
      setBatchOptions(distinctBatches);

      // drives with no batch fall under the current year
      const filtered = allDrives.filter((d: any) => {
        const driveBatch = d.batch || String(currentYear);
        return driveBatch === yearFilter;
      });

      setRecentDrives(filtered.slice(0, 4));
      setPendingApprovals(approvals.slice(0, 5));
      
      // Merge real stats with some mock calculation if needed
      setStats({
        totalStudents: dashboardStats.totalStudents,
        totalCompanies: dashboardStats.totalCompanies,
        activeDrives: dashboardStats.totalDrives,
        totalOffers: dashboardStats.totalOffers,
        placedStudents: (dashboardStats as any).placedStudents || 0,
        averagePackage: dashboardStats.averagePackage,
        placedPercentage: dashboardStats.totalStudents > 0 
          ? Math.round((((dashboardStats as any).placedStudents || 0) / dashboardStats.totalStudents) * 100) 
          : 0
      });

      // Map activity data to our Activity interface
      setActivities(activityData.map((a: any, i: number) => ({
        id: a.id || i.toString(),
        type: a.type || 'drive_created',
        title: a.title,
        description: a.time,
        timestamp: a.created_at ? new Date(a.created_at) : new Date(),
        status: a.title?.includes('Created') ? 'success' : 'info'
      })));

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.loading("Generating report...");
      const blob = await db.generateSystemReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_report_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      toast.dismiss();
      toast.success("Report downloaded!");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report");
    }
  };

  if (loading) return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Sk.Block className="h-8 w-64" />
          <Sk.Block className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Sk.Block className="h-10 w-32 rounded-xl" />
          <Sk.Block className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      
      {/* Stats Grid */}
      <Sk.StatCardGrid count={5} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <Sk.Block className="h-7 w-48" />
            <Sk.Block className="h-10 w-32 rounded-2xl" />
          </div>
          <Sk.ListItems count={4} />
        </div>
        <div className="space-y-6">
          <Sk.SidebarWidget />
          <Sk.SidebarWidget />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Placement Dashboard</h1>
          <p className="text-muted text-sm font-medium">Monitor placement drives, student analytics, and overall performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl bg-surface border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors"
          >
            <LuDownload size={16} />
            Export Report
          </button>
          <button 
            onClick={() => setIsDriveDialogOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-tactile hover:bg-primary-dark transition-all"
          >
            <LuPlus size={16} />
            Create Drive
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Students" 
          value={stats.totalStudents.toLocaleString()} 
          icon={LuUsers} 
          trend="+12%" 
          color="blue"
        />
        <StatCard 
          title="Active Drives" 
          value={stats.activeDrives.toString()} 
          icon={LuBuilding2} 
          trend="+5" 
          color="primary"
        />
        <StatCard 
          title="Placed / Total" 
          value={`${stats.placedStudents} / ${stats.totalStudents}`} 
          icon={LuCircleCheck} 
          trend="+8%" 
          color="green"
        />
        <StatCard 
          title="Avg Package" 
          value={`${stats.averagePackage} LPA`} 
          icon={LuTrendingUp} 
          trend="+1.2" 
          color="orange"
        />
        <StatCard 
          title="Total Offers" 
          value={stats.totalOffers.toString()} 
          icon={LuFileText} 
          trend="+24" 
          color="primary"
          className="hidden lg:flex"
        />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Recent Drives */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-primary rounded-full"></div>
              <h2 className="text-xl font-black tracking-tight text-foreground uppercase">Recent Drives</h2>
            </div>
            
            {/* Premium Filters */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => {
                    const el = document.getElementById('batch-dropdown');
                    if (el) el.classList.toggle('hidden');
                  }}
                  className="flex items-center gap-3 bg-surface border border-border-subtle rounded-2xl px-4 py-2.5 shadow-sm hover:border-primary transition-all group"
                >
                  <LuCalendar size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                    Batch {yearFilter}
                  </span>
                  <LuChevronDown size={14} className="text-muted group-hover:text-primary transition-colors" />
                </button>
                
                <div 
                  id="batch-dropdown"
                  className="absolute right-0 mt-2 w-48 bg-surface border border-border-subtle rounded-2xl shadow-2xl hidden z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  {batchOptions.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setYearFilter(year);
                        document.getElementById('batch-dropdown')?.classList.add('hidden');
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-primary/5",
                        yearFilter === year ? "text-primary bg-primary/5" : "text-muted"
                      )}
                    >
                      Batch {year}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center bg-surface border border-border-subtle rounded-xl p-1 shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    viewMode === 'grid' ? "bg-primary text-background shadow-md shadow-primary/20" : "text-muted hover:text-foreground"
                  )}
                >
                  <LuLayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all",
                    viewMode === 'list' ? "bg-primary text-background shadow-md shadow-primary/20" : "text-muted hover:text-foreground"
                  )}
                >
                  <LuList size={16} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-surface/50 animate-pulse border border-border-subtle rounded-3xl"></div>
              ))}
            </div>
          ) : (
            <div className={cn(
              "grid gap-4",
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            )}>
              {recentDrives.map((drive) => (
                <DriveCard key={drive.id} drive={drive} viewMode={viewMode} />
              ))}
              {recentDrives.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center bg-surface/50 border-2 border-dashed border-border-subtle rounded-3xl">
                  <LuBuilding2 size={40} className="text-muted mb-4" />
                  <p className="text-muted font-bold">No drives found for this batch</p>
                  <button 
                    onClick={() => setIsDriveDialogOpen(true)}
                    className="mt-4 text-primary font-black text-sm uppercase hover:underline"
                  >
                    Create your first drive
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Recent Activity & Reminders */}
        <div className="space-y-8">
          {/* Recent Activity */}
          <div className="bg-surface border border-border-subtle rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black tracking-tight text-foreground uppercase">Activity</h2>
              <button className="text-[10px] font-black text-primary uppercase hover:underline tracking-widest">View All</button>
            </div>
            <div className="space-y-6">
              {activities.length > 0 ? activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 group">
                  <div className={cn(
                    "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all group-hover:scale-110",
                    activity.status === 'success' ? "bg-green-500/10 text-green-500" :
                    activity.status === 'info' ? "bg-blue-500/10 text-blue-500" :
                    "bg-orange-500/10 text-orange-500"
                  )}>
                    {activity.type === 'drive_created' ? <LuPlus size={16} /> :
                     activity.type === 'application_received' ? <LuUsers size={16} /> :
                     <LuCircleCheck size={16} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-foreground leading-none">{activity.title}</p>
                    <p className="text-xs text-muted font-medium line-clamp-1">{activity.description}</p>
                    <p className="text-[10px] text-muted/60 font-black uppercase tracking-tight">{activity.timestamp ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(activity.timestamp)) : 'Recently'}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-muted font-bold text-center py-4 uppercase">No recent activities</p>
              )}
            </div>
          </div>

          {/* Quick Tasks */}
          <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 shadow-inner">
            <h2 className="text-lg font-black tracking-tight text-primary uppercase mb-4">Pending Tasks</h2>
            <div className="space-y-3">
              {adminTasks.length > 0
                ? adminTasks.map(t => <TaskItem key={t.id} title={t.title} count={t.count} />)
                : <p className="text-xs text-muted font-bold text-center py-2 uppercase">No pending tasks</p>
              }
            </div>
            <Link 
              href="/admin/data"
              className="w-full mt-6 bg-primary text-background py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              GOTO WORKSPACE
              <LuArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Drive Dialog */}
      <DriveDialog 
        isOpen={isDriveDialogOpen} 
        onClose={() => {
          setIsDriveDialogOpen(false);
          loadDashboardData();
        }}
        onSuccess={() => {
          setIsDriveDialogOpen(false);
          loadDashboardData();
        }}
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color, className }: any) {
  const colorMap: any = {
    primary: "text-primary bg-primary/10 border-primary/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20"
  };

  return (
    <div className={cn(
      "bg-surface border border-border-subtle rounded-3xl p-5 md:p-6 hover:border-primary/30 transition-all group shadow-sm flex flex-col",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className={cn("p-2.5 md:p-3 rounded-2xl border transition-all group-hover:scale-110", colorMap[color] || colorMap.primary)}>
          <Icon size={20} className="md:size-6" />
        </div>
        <div className={cn(
          "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight",
          trend.startsWith('+') ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {trend}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-muted text-[10px] md:text-xs font-black uppercase tracking-widest leading-none mb-1.5">{title}</p>
        <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">{value}</h3>
      </div>
    </div>
  );
}

function DriveCard({ drive, viewMode }: { drive: any, viewMode: 'grid' | 'list' }) {
  const companyName = drive.companies?.name || drive.companyName || 'Unknown Company';
  const jobRole = drive.role_title || drive.roleTitle || 'Unknown Role';
  const driveDate = drive.created_at || drive.createdAt || new Date().toISOString();
  const status = drive.status || 'draft';
  const applicationsCount = drive.applications?.length || 0;

  return (
    <div className={cn(
      "bg-surface border border-border-subtle rounded-3xl p-5 hover:border-primary/50 transition-all group shadow-sm",
      viewMode === 'list' && "flex items-center justify-between"
    )}>
      <div className={cn("flex gap-4", viewMode === 'list' && "items-center flex-1")}>
        <div className="group-hover:rotate-3 transition-transform shrink-0">
          <CompanyLogo name={companyName} size={56} rounded="rounded-2xl" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-black text-foreground truncate tracking-tight">{companyName}</h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
              status === 'published' ? "bg-green-500/10 text-green-500" : "bg-muted/10 text-muted"
            )}>
              {status}
            </span>
          </div>
          <p className="text-xs font-bold text-muted truncate uppercase tracking-tighter">{jobRole}</p>
          
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted/60 uppercase tracking-tight">
              <LuCalendar size={12} className="text-primary" />
              {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(driveDate))}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted/60 uppercase tracking-tight">
              <LuUsers size={12} className="text-primary" />
              {applicationsCount} APPLIED
            </div>
          </div>
        </div>
      </div>
      
      <div className={cn(
        "mt-4 pt-4 border-t border-border-subtle/50 flex items-center justify-between",
        viewMode === 'list' && "mt-0 pt-0 border-t-0 ml-4 shrink-0"
      )}>
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-6 rounded-full border-2 border-surface bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary shadow-sm">
              S{i}
            </div>
          ))}
          <div className="h-6 w-6 rounded-full border-2 border-surface bg-muted/10 flex items-center justify-center text-[8px] font-bold text-muted shadow-sm">
            +12
          </div>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-background hover:scale-110 active:scale-95 transition-all shadow-sm">
          <LuArrowUpRight size={18} />
        </button>
      </div>
    </div>
  );
}

function TaskItem({ title, count }: { title: string, count: number }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/50 border border-border-subtle/30 hover:border-primary/30 transition-all cursor-pointer group shadow-sm">
      <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">{title}</span>
      <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black shadow-sm">{count}</span>
    </div>
  );
}
