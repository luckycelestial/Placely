"use client";

import { useState } from "react";
import { 
  LuSearch, 
  LuFilter, 
  LuPlus, 
  LuMegaphone, 
  LuCalendar, 
  LuClock, 
  LuUsers, 
  LuBell, 
  LuPin, 
  LuEllipsis, 
  LuExternalLink,
  LuCircleCheck,
  LuTriangleAlert,
  LuSend
} from "react-icons/lu";
import { cn } from "@/lib/utils";

// Mock Data for Notices
const NOTICES = [
  {
    id: "NOT001",
    title: "Mandatory Profile Update for 2025 Batch",
    summary: "All students from the 2025 graduating batch must complete their profile verification by end of this week.",
    audience: "Final Year",
    priority: "Urgent",
    status: "Published",
    date: "24 May 2024",
    time: "10:30 AM"
  },
  {
    id: "NOT002",
    title: "Google SWE Interview Schedule Released",
    summary: "The interview slots for Google SWE roles have been finalized. Check the ATS tracker for your specific slot.",
    audience: "Shortlisted Students",
    priority: "Informational",
    status: "Published",
    date: "23 May 2024",
    time: "04:15 PM"
  },
  {
    id: "NOT003",
    title: "Workshop on System Design Patterns",
    summary: "Upcoming workshop focusing on scalable system design for product-based company interviews.",
    audience: "All CSE/ECE",
    priority: "Reminder",
    status: "Scheduled",
    date: "26 May 2024",
    time: "09:00 AM"
  }
];

const EVENTS = [
  {
    id: "EVT001",
    title: "Microsoft Pre-Placement Talk",
    type: "Webinar",
    date: "25 May 2024",
    time: "02:00 PM - 03:30 PM",
    venue: "Main Auditorium / Online",
    status: "Upcoming"
  },
  {
    id: "EVT002",
    title: "Mock Interview Series - Round 1",
    type: "Offline",
    date: "27 May 2024",
    time: "10:00 AM - 05:00 PM",
    venue: "Placement Cell - Block B",
    status: "Scheduled"
  }
];

const TABS = ["Notices", "Events"];

export default function NoticesPage() {
  const [activeTab, setActiveTab] = useState("Notices");
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Notices & Events</h1>
          <p className="text-muted text-sm font-medium">Communicate updates and schedule placement activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-white border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors">
            <LuSend size={16} />
            View Outbox
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-tactile hover:bg-primary-dark transition-all">
            <LuPlus size={18} />
            Create {activeTab === "Notices" ? "Notice" : "Event"}
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-1 bg-background p-1 rounded-2xl w-fit border border-border-subtle overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-white text-primary shadow-sm" 
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
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border-subtle bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === "Notices" ? (
          <div className="space-y-4">
            {NOTICES.map((notice) => (
              <div key={notice.id} className="bg-white p-6 rounded-3xl border border-border-subtle shadow-soft hover:shadow-md transition-all group relative overflow-hidden">
                <div className={cn(
                  "absolute top-0 left-0 w-1.5 h-full",
                  notice.priority === "Urgent" ? "bg-red-500" :
                  notice.priority === "Reminder" ? "bg-orange-500" : "bg-blue-500"
                )} />
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                        notice.priority === "Urgent" ? "bg-red-500/10 text-red-600" :
                        notice.priority === "Reminder" ? "bg-orange-500/10 text-orange-600" : "bg-blue-500/10 text-blue-600"
                      )}>
                        {notice.priority}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted bg-black/5 px-2 py-0.5 rounded-md">
                        Target: {notice.audience}
                      </span>
                      <div className="flex items-center gap-1.5 text-muted">
                        <LuClock size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">{notice.date}, {notice.time}</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-black tracking-tight group-hover:text-primary transition-colors">{notice.title}</h3>
                    <p className="text-sm font-medium text-foreground/70 leading-relaxed max-w-3xl">{notice.summary}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-border-subtle bg-white hover:border-primary/30 hover:text-primary transition-all shadow-sm">
                      <LuPin size={18} />
                    </button>
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-border-subtle bg-white hover:bg-black/5 transition-all shadow-sm">
                      <LuEllipsis size={18} className="text-muted" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {EVENTS.map((event) => (
              <div key={event.id} className="bg-white p-6 rounded-3xl border border-border-subtle shadow-soft hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <LuCalendar size={24} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                    event.status === "Upcoming" ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"
                  )}>
                    {event.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-black tracking-tight mb-2 group-hover:text-primary transition-colors">{event.title}</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2.5 text-foreground/70">
                    <LuClock size={14} className="text-muted" />
                    <span className="text-xs font-bold">{event.date} | {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-foreground/70">
                    <LuBell size={14} className="text-muted" />
                    <span className="text-xs font-bold">{event.venue}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border-subtle/50">
                  <button className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl bg-background border border-border-subtle hover:bg-black/5 transition-all">
                    Manage RSVPs
                  </button>
                  <button className="px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-white shadow-tactile hover:bg-primary-dark transition-all">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
