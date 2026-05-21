"use client";
import { Sk } from "@/components/ui/skeleton";

import { useEffect, useState } from "react";
import { 
  LuFileText, 
  LuClock, 
  LuCircleCheck, 
  LuCircleX, 
  LuArrowRight,
  LuSearch,
  LuCircleAlert,
  LuBuilding2
} from "react-icons/lu";

import Link from "next/link";
import { db } from "@/services/database";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/ui/CompanyLogo";



const STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  "Applied": { color: "bg-blue-100 text-blue-600", icon: LuClock },
  "In Review": { color: "bg-yellow-100 text-yellow-600", icon: LuClock },
  "Shortlisted": { color: "bg-purple-100 text-purple-600", icon: LuCircleCheck },
  "Rejected": { color: "bg-red-100 text-red-600", icon: LuCircleX },
  "Offered": { color: "bg-green-100 text-green-600", icon: LuCircleCheck },
};

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      // Mock student ID for now
      const STUDENT_ID = "550e8400-e29b-41d4-a716-446655440000";
      const data = await db.getStudentApplications(STUDENT_ID);
      
      const formatted = data.map((app: any) => ({
        id: app.id,
        companyName: app.job_drives?.companies?.name || "Unknown",
        companyLogo: app.job_drives?.companies?.logo_url,
        companyTheme: app.job_drives?.companies?.theme_color,
        role: app.job_drives?.role_title || "Unknown",
        appliedDate: new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        status: app.status || "Applied",
        nextStep: app.current_stage !== 'applied' ? app.current_stage : undefined,
        deadline: app.job_drives?.application_end
      }));

      setApplications(formatted);
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         app.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "All" || app.status === activeTab;
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="space-y-12 py-10 px-4 max-w-7xl mx-auto">
        <Sk.PageHeader />
        <Sk.CardGrid count={3} cols={3} />
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <Sk.Block className="h-12 w-full lg:w-2/3 rounded-full" />
          <Sk.Block className="h-12 w-full lg:w-1/3 rounded-2xl" />
        </div>
        <Sk.CardGrid count={4} cols={2} />
      </div>
    );
  }

  return (
    <div className="space-y-12 py-10 px-4 max-w-7xl mx-auto">
      {/* Header Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-12 rounded-full bg-primary" />
          <span className="section-label text-primary">Deployment Log</span>
        </div>
        <h2 className="font-display text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-tight">
          My <span className="text-primary italic">Applications.</span>
        </h2>
        <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed">
          Track each application as an active workflow. Monitor status, milestones, and upcoming interviews.
        </p>
      </section>

      {/* Deadline Reminders */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {applications.filter(app => app.deadline).slice(0, 3).map((app, i) => (
          <Link href="/progress" key={i} className="app-card p-6 bg-primary/5 border-primary/20 flex items-start gap-4 hover:border-primary transition-all group">
            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-tactile group-hover:scale-110 transition-transform">
              <LuCircleAlert size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Upcoming Milestone</p>
              <h4 className="font-display text-lg font-bold mt-1 group-hover:text-primary transition-colors">{app.nextStep}</h4>
              <p className="text-sm font-medium text-muted mt-1">{app.companyName} • {app.deadline}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full lg:w-auto no-scrollbar">
          {["All", "Applied", "In Review", "Shortlisted", "Offered", "Rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-foreground text-white shadow-tactile scale-105" 
                  : "bg-surface border border-border-subtle text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96 group">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary" size={20} />
          <input 
            type="text" 
            placeholder="Search your pipeline..." 
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle bg-surface shadow-soft focus:outline-none focus:border-primary transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="app-card overflow-hidden">
        <div className="divide-y border-border-subtle">
          {filteredApps.map((app) => {
            const Icon = app.icon;
            const statusStyle = STATUS_CONFIG[app.status];
            const StatusIcon = statusStyle.icon;

            return (
              <div key={app.id} className="p-8 hover:bg-background/50 transition-all group">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                  <div className="flex items-center gap-8 flex-1 min-w-0">
                    <div className="group-hover:scale-105 group-hover:border-primary/20 transition-all flex-shrink-0">
                      <CompanyLogo name={app.companyName} size={80} rounded="rounded-3xl" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${statusStyle.color}`}>
                          <StatusIcon size={12} />
                          {app.status}
                        </div>
                        <span className="text-[10px] font-black text-muted/60 uppercase tracking-widest">ID: #PL-{app.id}092</span>
                      </div>
                      <h4 className="font-display text-3xl font-bold tracking-tighter group-hover:text-primary transition-colors truncate">
                        {app.role}
                      </h4>
                      <p className="font-sans text-lg font-bold text-muted mt-1">{app.companyName}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end gap-6 sm:gap-12 xl:gap-4">
                    <div className="text-left sm:text-center xl:text-right">
                      <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Applied Date</p>
                      <p className="font-display text-lg font-bold">{app.appliedDate}</p>
                    </div>
                    
                    {app.nextStep ? (
                      <div className="text-left sm:text-center xl:text-right">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 flex items-center gap-2 xl:justify-end">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          Next Action
                        </p>
                        <p className="font-display text-lg font-bold text-foreground">{app.nextStep}</p>
                      </div>
                    ) : (
                      <div className="text-left sm:text-center xl:text-right">
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Wait Time</p>
                        <p className="font-display text-lg font-bold">~4-5 Days</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <Link href="/progress" className="flex-1 sm:flex-none">
                      <button className="w-full btn-secondary px-8 py-4 h-auto text-[10px] uppercase tracking-widest">
                        Track Progress
                      </button>
                    </Link>
                    <Link href="/progress">
                      <button className="h-14 w-14 rounded-2xl bg-foreground text-white flex items-center justify-center hover:bg-primary transition-all shadow-tactile group-hover:scale-105 active:scale-95">
                        <LuArrowRight size={24} />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
