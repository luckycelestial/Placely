"use client";

import { usePathname } from "next/navigation";
import { STUDENT_NAV_ITEMS } from "./nav-config";
import { 
  LuSearch, 
  LuBell, 
  LuUser, 
  LuShield, 
  LuX, 
  LuArrowRight, 
  LuTriangleAlert, 
  LuCircleCheck, 
  LuInfo 
} from "react-icons/lu";
import Link from "next/link";
import { TypographyToggle } from "./typography-toggle";
import { DesignToggle } from "./design-toggle";
import { useEffect, useState } from "react";
import { db } from "@/services/database";
import { DEV_STUDENT_ID } from "@/lib/dev-config";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

export function Header() {
  const pathname = usePathname();
  const [student, setStudent] = useState<any>(null);
  const currentItem = STUDENT_NAV_ITEMS.find((item) => item.href === pathname);
  const title = currentItem?.title || "CareerBridge";

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadProfile() {
      try {
        const data = await db.getStudentProfile(DEV_STUDENT_ID);
        setStudent(data);
      } catch (error) {
        console.error("Error loading header profile:", error);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const notices = await db.getNotices();

        const mappedNotices = (notices || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          description: n.body || n.summary || n.title,
          type: (n.priority === "high" || n.priority === "Urgent" ? "Action Required" : "Info") as "Action Required" | "Info",
          priority: (n.priority === "high" || n.priority === "Urgent" ? "high" : n.priority === "Reminder" ? "medium" : "low") as "high" | "medium" | "low",
          timestamp: n.publish_at ? db.formatRelativeTime(n.publish_at) : "Recently",
          isRead: false,
          category: "general" as const
        }));

        setNotifications(mappedNotices);
      } catch (error) {
        console.error("Failed to load notifications in header:", error);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header suppressHydrationWarning className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-background/80 backdrop-blur-md px-6 md:px-12 border-b border-border-subtle/50">
      {/* Mobile Logo */}
      <div className="flex items-center gap-1 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 flex items-center justify-center overflow-hidden">
            <img src="/careerbridge.png" alt="CareerBridge" className="h-full w-full object-contain" />
          </div>
          <span className="font-display text-lg font-black tracking-tight uppercase">CareerBridge</span>
        </Link>
      </div>

      {/* Desktop Title */}
      <div className="hidden md:flex items-center gap-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-surface border border-border-subtle rounded-full px-4 py-2 hidden lg:flex group focus-within:border-primary transition-colors">
          <LuSearch size={18} className="text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search everything..." 
            className="bg-transparent border-none outline-none px-3 text-xs font-semibold w-40 placeholder:text-muted/60"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* COMMENTED OUT: Design & Typography Toggles
          <DesignToggle />
          <TypographyToggle />
          */}

          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
              className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 transition-all group cursor-pointer"
            >
              <LuBell size={22} className="text-foreground group-hover:text-primary transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 bg-primary border-2 border-background rounded-full animate-pulse"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsNotificationsOpen(false)}
                />
                <div className="absolute right-0 mt-3 w-[450px] max-h-[580px] flex flex-col bg-surface border border-border-subtle rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                  {/* Dropdown Header */}
                  <div className="px-6 py-4 border-b border-border-subtle bg-background/30 flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-sm font-black tracking-tight text-foreground">Missions & Alerts</h3>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">{unreadCount} new alerts</p>
                    </div>
                    <button 
                      onClick={markAllRead} 
                      className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>

                  {/* Scrollable list */}
                  <div className="flex-1 overflow-y-auto max-h-[420px] divide-y border-border-subtle bg-surface custom-scrollbar">
                    {loading ? (
                      <div className="py-12 text-center">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-[10px] font-bold text-muted mt-2 uppercase tracking-widest">Loading alerts...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            setSelectedNotification(notif);
                            markAsRead(notif.id);
                            setIsNotificationsOpen(false);
                          }}
                          className={cn(
                            "p-5 hover:bg-background/40 transition-all flex items-start gap-4 cursor-pointer relative group",
                            !notif.isRead && "bg-primary/[0.01]"
                          )}
                        >
                          {!notif.isRead && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                          )}
                          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-border-subtle bg-surface shadow-sm">
                            {notif.type === "Action Required" ? (
                              <LuTriangleAlert className="text-red-500" size={18} />
                            ) : notif.type === "Offer" ? (
                              <LuCircleCheck className="text-primary" size={18} />
                            ) : notif.type === "Approval" ? (
                              <LuCircleCheck className="text-emerald-500" size={18} />
                            ) : (
                              <LuInfo className="text-blue-500" size={18} />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                                notif.type === "Action Required" ? "bg-red-50 text-red-500 border border-red-100" :
                                notif.type === "Offer" ? "bg-primary/10 text-primary border border-primary/20" :
                                notif.type === "Approval" ? "bg-emerald-50 text-emerald-500 border border-emerald-100" :
                                "bg-blue-50 text-blue-500 border border-blue-100"
                              )}>
                                {notif.type}
                              </span>
                              <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest">{notif.timestamp}</span>
                            </div>
                            <h4 className={cn(
                              "font-display text-sm font-bold tracking-tight group-hover:text-primary transition-colors truncate",
                              !notif.isRead ? "text-foreground" : "text-muted"
                            )}>
                              {notif.title}
                            </h4>
                            <p className="font-sans text-xs font-medium text-muted mt-0.5 leading-relaxed line-clamp-1">
                              {notif.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-16 text-center text-muted">
                        <LuBell className="mx-auto mb-3 opacity-30 text-muted" size={30} />
                        <p className="text-xs font-bold uppercase tracking-wider text-foreground">All Clear</p>
                        <p className="text-[10px] text-muted/60 mt-1">No notifications found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border-subtle">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black uppercase tracking-tight leading-none">
                {student?.name || student?.users?.name || "Loading..."}
              </p>
              <p className="text-[10px] font-bold text-primary uppercase mt-1">Student</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-display text-sm font-bold text-primary overflow-hidden uppercase">
              {(student?.name || student?.users?.name)?.charAt(0) || "S"}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Notification Info Modal overlay */}
      {selectedNotification && mounted && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center border border-border-subtle bg-surface">
                  {selectedNotification.type === "Action Required" ? (
                    <LuTriangleAlert className="text-red-500" size={24} />
                  ) : selectedNotification.type === "Offer" ? (
                    <LuCircleCheck className="text-primary" size={24} />
                  ) : selectedNotification.type === "Approval" ? (
                    <LuCircleCheck className="text-emerald-500" size={24} />
                  ) : (
                    <LuInfo className="text-blue-500" size={24} />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest font-sans">Notification Details</span>
                  <h3 className="text-xl font-display font-black tracking-tight text-foreground">{selectedNotification.type}</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center hover:bg-primary/10 transition-colors text-muted hover:text-foreground cursor-pointer"
              >
                <LuX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                  selectedNotification.type === "Action Required" ? "bg-red-100 text-red-600" :
                  selectedNotification.type === "Offer" ? "bg-primary text-white" :
                  selectedNotification.type === "Approval" ? "bg-emerald-100 text-emerald-600" :
                  "bg-blue-100 text-blue-600"
                )}>
                  {selectedNotification.type}
                </span>
                <span className="text-[10px] font-black text-muted uppercase tracking-widest font-sans">{selectedNotification.timestamp}</span>
                {selectedNotification.priority === "high" && (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100 font-sans">High Priority</span>
                )}
              </div>

              <div className="text-left">
                <h4 className="text-2xl font-display font-black tracking-tight text-foreground">
                  {selectedNotification.title}
                </h4>
                <p className="font-sans text-base font-medium text-muted mt-4 leading-relaxed whitespace-pre-line bg-background/50 border border-border-subtle p-6 rounded-2xl">
                  {selectedNotification.description}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-border-subtle bg-background/30 flex gap-3">
              <button 
                onClick={() => setSelectedNotification(null)}
                className="flex-1 py-3.5 rounded-xl border border-border-subtle text-xs font-black uppercase tracking-widest hover:bg-background transition-all cursor-pointer"
              >
                Dismiss
              </button>
              {selectedNotification.type === "Action Required" && (
                <Link href={
                  selectedNotification.category === "profile" ? "/profile" : 
                  selectedNotification.category === "offers" ? "/progress" : 
                  selectedNotification.category === "applications" ? "/progress" : "/dashboard"
                } className="flex-1">
                  <button 
                    onClick={() => setSelectedNotification(null)}
                    className="w-full btn-primary py-3.5 px-6 h-auto text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Take Action
                    <LuArrowRight size={14} />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
