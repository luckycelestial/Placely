"use client";

import { useState } from "react";
import { 
  LuCircle, 
  LuChevronRight,
  LuBuilding2,
  LuTarget,
  LuCircleCheck,
  LuX,
  LuInfo
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TimelineEvent {
  id: string;
  title: string;
  company: string;
  status: "Completed" | "Current" | "Upcoming" | "Rejected";
  date: string;
  description: string;
}

interface ApplicationProgress {
  id: string;
  company: string;
  role: string;
  overallStatus: string;
  currentStage: string;
  completion: number;
  events: TimelineEvent[];
}

const PROGRESS_DATA: ApplicationProgress[] = [
  {
    id: "1",
    company: "Amazon",
    role: "SDE-1",
    overallStatus: "In Progress",
    currentStage: "Technical Interview II",
    completion: 65,
    events: [
      { id: "e1", title: "Application Submitted", company: "Amazon", status: "Completed", date: "Oct 15", description: "Applied through college portal" },
      { id: "e2", title: "Online Assessment", company: "Amazon", status: "Completed", date: "Oct 20", description: "Cleared with 100% score" },
      { id: "e3", title: "Technical Interview I", company: "Amazon", status: "Completed", date: "Oct 28", description: "Focused on DSA and Problem Solving" },
      { id: "e4", title: "Technical Interview II", company: "Amazon", status: "Current", date: "Nov 05", description: "System Design and Coding" },
      { id: "e5", title: "Bar Raiser Round", company: "Amazon", status: "Upcoming", date: "TBD", description: "Leadership principles and cultural fit" },
    ]
  },
  {
    id: "2",
    company: "Meta",
    role: "Product Designer",
    overallStatus: "Shortlisted",
    currentStage: "Portfolio Review",
    completion: 40,
    events: [
      { id: "m1", title: "Application Submitted", company: "Meta", status: "Completed", date: "Oct 12", description: "Resume and Portfolio link sent" },
      { id: "m2", title: "Initial Screening", company: "Meta", status: "Completed", date: "Oct 18", description: "HR screening call successful" },
      { id: "m3", title: "Portfolio Review", company: "Meta", status: "Current", date: "Nov 02", description: "Deep dive into case studies" },
      { id: "m4", title: "Design Challenge", company: "Meta", status: "Upcoming", date: "TBD", description: "48-hour take-home assignment" },
    ]
  }
];

export default function ProgressPage() {
  const [selectedApp, setSelectedApp] = useState<ApplicationProgress>(PROGRESS_DATA[0]);

  return (
    <div className="space-y-12 py-10 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-12 rounded-full bg-primary" />
          <span className="section-label text-primary">ATS Timeline</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
              My <span className="text-primary italic">Progress.</span>
            </h2>
            <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed mt-2">
              Track your journey through various placement stages. See exactly where you stand in each application pipeline.
            </p>
          </div>
          
          <div className="flex items-center gap-6 bg-surface border border-border-subtle p-6 rounded-3xl shadow-xl shadow-black/5">
             <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-primary">08</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Active Stages</span>
             </div>
             <div className="h-10 w-px bg-border-subtle" />
             <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-foreground">02</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Interviews</span>
             </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar: Applications List */}
        <div className="xl:col-span-4 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted px-2">Pipelines</h3>
          {PROGRESS_DATA.map((app) => (
            <div 
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={cn(
                "app-card group cursor-pointer transition-all p-6",
                selectedApp.id === app.id ? "border-primary bg-primary/[0.02]" : "hover:border-primary/40"
              )}
            >
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-foreground text-white flex items-center justify-center">
                      <LuBuilding2 size={20} />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-lg leading-none">{app.company}</h4>
                      <p className="text-xs font-bold text-muted mt-1">{app.role}</p>
                    </div>
                  </div>
                  <LuChevronRight size={18} className={cn("transition-transform", selectedApp.id === app.id ? "text-primary translate-x-1" : "text-muted")} />
               </div>
               
               <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                   <span className="text-muted">Completion</span>
                   <span className="text-primary">{app.completion}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-border-subtle rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-primary transition-all duration-1000" 
                     style={{ width: `${app.completion}%` }}
                   />
                 </div>
                 <p className="text-[10px] font-bold text-muted mt-2 italic truncate">Current: {app.currentStage}</p>
               </div>
            </div>
          ))}
        </div>

        {/* Content: Detailed Timeline */}
        <div className="xl:col-span-8">
           <div className="app-card p-10 border-none shadow-2xl shadow-black/5 min-h-[600px] flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                 <div>
                    <h3 className="font-display text-4xl font-black tracking-tighter">
                      {selectedApp.company} <span className="text-primary italic">Timeline.</span>
                    </h3>
                    <p className="font-sans text-muted font-medium mt-1">{selectedApp.role} • Application Tracking System</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <Link href="/applications">
                      <button className="btn-secondary px-6 py-3 h-auto text-[9px] uppercase tracking-widest">View App Details</button>
                    </Link>
                    <button className="btn-primary px-6 py-3 h-auto text-[9px] uppercase tracking-widest">Prepare Now</button>
                 </div>
              </div>

              <div className="relative flex-1">
                 {/* Vertical Line */}
                 <div className="absolute left-6 top-0 bottom-0 w-1 bg-border-subtle rounded-full" />
                 
                 <div className="space-y-12">
                    {selectedApp.events.map((event) => (
                      <div key={event.id} className="relative pl-16 group/item">
                         {/* Circle Indicator */}
                         <div className={cn(
                           "absolute left-2.5 top-0 h-8 w-8 rounded-full border-4 border-background flex items-center justify-center z-10 transition-all group-hover/item:scale-110",
                           event.status === "Completed" ? "bg-emerald-500 text-white" :
                           event.status === "Current" ? "bg-primary text-white shadow-tactile animate-pulse" :
                           event.status === "Rejected" ? "bg-red-500 text-white" :
                           "bg-surface border-border-subtle text-muted"
                         )}>
                            {event.status === "Completed" ? <LuCircleCheck size={16} /> :
                             event.status === "Current" ? <LuTarget size={16} /> :
                             event.status === "Rejected" ? <LuX size={16} /> :
                             <LuCircle size={14} />}
                         </div>

                         <div className={cn(
                           "p-8 rounded-3xl border transition-all",
                           event.status === "Current" ? "bg-primary/[0.03] border-primary/30 shadow-xl shadow-primary/5" : "bg-surface border-border-subtle group-hover/item:border-primary/20"
                         )}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                               <div>
                                  <div className="flex items-center gap-3 mb-1">
                                     <span className={cn(
                                       "text-[10px] font-black uppercase tracking-widest",
                                       event.status === "Completed" ? "text-emerald-500" :
                                       event.status === "Current" ? "text-primary" : "text-muted"
                                     )}>
                                       {event.status}
                                     </span>
                                     <span className="h-1 w-1 rounded-full bg-muted/30" />
                                     <span className="text-[10px] font-black text-muted/60 uppercase tracking-widest">{event.date}</span>
                                  </div>
                                  <h4 className="font-display text-2xl font-bold tracking-tight text-foreground">{event.title}</h4>
                               </div>
                               {event.status === "Current" && (
                                 <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-tactile animate-bounce">
                                   Action Needed
                                 </div>
                               )}
                            </div>
                            <p className="font-sans text-base font-medium text-muted leading-relaxed max-w-2xl">
                               {event.description}
                            </p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Bottom Info */}
              <div className="mt-12 p-6 bg-background rounded-2xl border border-border-subtle flex items-center gap-4">
                 <LuInfo className="text-primary shrink-0" size={24} />
                 <p className="font-sans text-sm font-medium text-muted">
                   This timeline is synced with the official company ATS. Dates and status updates may have a short delay.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
