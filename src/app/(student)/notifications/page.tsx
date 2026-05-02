"use client";

import { useState } from "react";
import { 
  LuBell, 
  LuCircleCheck, 
  LuClock, 
  LuArrowRight, 
  LuSearch, 
  LuFilter,
  LuTrash2,
  LuArchive,
  LuTriangleAlert,
  LuInfo,
  LuChevronRight
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: "Action Required" | "Info" | "Approval" | "Offer";
  priority: "high" | "medium" | "low";
  timestamp: string;
  isRead: boolean;
  category: "applications" | "profile" | "general" | "offers";
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Action Required: Upload 6th Sem Marksheet",
    description: "Your application for Google SDE role requires 6th semester marksheet verification. Please upload it by tomorrow.",
    type: "Action Required",
    priority: "high",
    timestamp: "2 hours ago",
    isRead: false,
    category: "profile"
  },
  {
    id: "2",
    title: "Offer Received: Microsoft",
    description: "Congratulations! You have received a placement offer from Microsoft for the Cloud Associate role.",
    type: "Offer",
    priority: "high",
    timestamp: "5 hours ago",
    isRead: false,
    category: "offers"
  },
  {
    id: "3",
    title: "Application Status Update: Meta",
    description: "Your application for Product Designer at Meta has been moved to 'Shortlisted'. Check the ATS timeline for next steps.",
    type: "Approval",
    priority: "medium",
    timestamp: "1 day ago",
    isRead: true,
    category: "applications"
  },
  {
    id: "4",
    title: "Upcoming Pre-Placement Talk: Google",
    description: "Google is conducting a pre-placement talk tomorrow at 10:00 AM. Attendance is mandatory for registered students.",
    type: "Info",
    priority: "low",
    timestamp: "1 day ago",
    isRead: true,
    category: "general"
  },
  {
    id: "5",
    title: "Resume Verified",
    description: "Your latest resume has been successfully verified by the placement office.",
    type: "Approval",
    priority: "low",
    timestamp: "2 days ago",
    isRead: true,
    category: "profile"
  }
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         notif.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "All" || notif.type === filter;
    return matchesSearch && matchesFilter;
  });

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-10 py-10 px-4 max-w-[1400px] mx-auto min-h-screen">
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-12 rounded-full bg-primary" />
          <span className="section-label text-primary">Mission Control</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
              Task <span className="text-primary italic">Inbox.</span>
            </h2>
            <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed mt-2">
              Stay ahead of your placement journey. Act on urgent requirements and track your progress in real-time.
            </p>
          </div>
          <button 
            onClick={markAllRead}
            className="btn-secondary px-8 py-4 h-auto text-[10px] uppercase tracking-widest whitespace-nowrap"
          >
            Mark all as read
          </button>
        </div>
      </section>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full lg:w-auto no-scrollbar">
          {["All", "Action Required", "Offer", "Approval", "Info"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === f 
                  ? "bg-foreground text-white shadow-tactile scale-105" 
                  : "bg-surface border border-border-subtle text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-96 group">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle bg-surface shadow-soft focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="app-card overflow-hidden border-none shadow-2xl shadow-black/5">
        {filteredNotifications.length > 0 ? (
          <div className="divide-y border-border-subtle">
            {filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={cn(
                  "p-8 hover:bg-background/50 transition-all group relative flex flex-col md:flex-row md:items-center gap-8",
                  !notif.isRead && "bg-primary/[0.02]"
                )}
              >
                {!notif.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
                )}
                
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <NotificationIcon type={notif.type} priority={notif.priority} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                        notif.type === "Action Required" ? "bg-red-100 text-red-600" :
                        notif.type === "Offer" ? "bg-primary text-white" :
                        notif.type === "Approval" ? "bg-emerald-100 text-emerald-600" :
                        "bg-blue-100 text-blue-600"
                      )}>
                        {notif.type}
                      </span>
                      <span className="text-[10px] font-black text-muted/60 uppercase tracking-widest">{notif.timestamp}</span>
                    </div>
                    <h4 className={cn(
                      "font-display text-xl md:text-2xl font-bold tracking-tight transition-colors truncate",
                      !notif.isRead ? "text-foreground" : "text-muted/80"
                    )}>
                      {notif.title}
                    </h4>
                    <p className="font-sans text-base font-medium text-muted mt-1 leading-relaxed line-clamp-2 max-w-3xl">
                      {notif.description}
                    </p>
                  </div>
                </div>

                 <div className="flex items-center gap-4 self-end md:self-center">
                  {notif.type === "Action Required" && (
                    <Link href={
                      notif.category === "profile" ? "/profile" : 
                      notif.category === "offers" ? "/offers" : 
                      notif.category === "applications" ? "/progress" : "/dashboard"
                    }>
                      <button className="btn-primary py-3 px-6 h-auto text-[9px] uppercase tracking-widest">
                        Take Action
                        <LuArrowRight size={14} />
                      </button>
                    </Link>
                  )}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => deleteNotification(notif.id)}
                      className="h-12 w-12 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-muted hover:text-red-500 hover:border-red-200 transition-all"
                    >
                      <LuTrash2 size={20} />
                    </button>
                    <Link href={
                      notif.category === "profile" ? "/profile" : 
                      notif.category === "offers" ? "/offers" : 
                      notif.category === "applications" ? "/progress" : "/dashboard"
                    }>
                      <button className="h-12 w-12 rounded-2xl bg-foreground text-white flex items-center justify-center hover:bg-primary transition-all shadow-tactile">
                        <LuChevronRight size={22} />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center">
            <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center text-primary mx-auto mb-8 animate-pulse">
              <LuBell size={40} />
            </div>
            <h3 className="font-display text-3xl font-black tracking-tight text-foreground">Inbox is Clear</h3>
            <p className="text-muted mt-3 font-medium text-lg">You're all caught up! No pending tasks at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationIcon({ type, priority }: { type: string, priority: string }) {
  if (type === "Action Required") return (
    <div className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shadow-sm relative shrink-0">
      <LuTriangleAlert size={30} />
      {priority === "high" && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-600 border-2 border-white animate-ping" />}
    </div>
  );
  if (type === "Offer") return (
    <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm shrink-0">
      <LuCircleCheck size={30} />
    </div>
  );
  if (type === "Approval") return (
    <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm shrink-0">
      <LuCircleCheck size={30} />
    </div>
  );
  return (
    <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm shrink-0">
      <LuInfo size={30} />
    </div>
  );
}
