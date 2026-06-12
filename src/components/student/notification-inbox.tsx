import { LuBell, LuInfo, LuTriangleAlert, LuX, LuArrowRight } from "react-icons/lu";
import { useState, useEffect } from "react";
import { db } from "@/services/database";
import { cn } from "@/lib/utils";

interface Notice {
  id: string;
  title: string;
  body: string;
  priority: string;
  created_at: string;
}

export function NotificationInbox() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    async function loadNotices() {
      try {
        const data = await db.getNotices();
        setNotices(data || []);
      } catch (error) {
        console.error("Failed to load notices:", error);
      } finally {
        setLoading(false);
      }
    }
    loadNotices();
  }, []);

  if (loading) return (
    <div className="app-card p-12 text-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-bold text-muted mt-4 uppercase tracking-widest">Loading Alerts...</p>
    </div>
  );

  return (
    <div id="notifications" className="app-card overflow-hidden scroll-mt-20">
      <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-background/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <LuBell size={22} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">Missions & Alerts</h3>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">Recent Notifications</p>
          </div>
        </div>
        <div className="h-8 px-3 rounded-full bg-secondary/20 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-secondary-dark animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-tight text-foreground">{notices.length} Active</span>
        </div>
      </div>

      <div className="divide-y border-border-subtle max-h-[400px] overflow-y-auto custom-scrollbar">
        {notices.map((notice) => (
          <div 
            key={notice.id} 
            onClick={() => setSelectedNotice(notice)}
            className="p-6 hover:bg-background/50 transition-all group flex items-start gap-6 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-border-subtle bg-surface shadow-sm">
              {notice.priority === "high" || notice.priority === "Urgent" ? (
                <LuTriangleAlert className="text-red-500" size={18} />
              ) : (
                <LuInfo className="text-blue-500" size={18} />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-display text-lg font-bold tracking-tight group-hover:text-primary transition-colors truncate">
                  {notice.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted">
                  {db.formatRelativeTime(notice.created_at)}
                </div>
              </div>
              <p className="text-sm font-medium text-muted mt-1 leading-relaxed line-clamp-1">
                {notice.body || "No details provided."}
              </p>
              
              <div className="mt-4 flex items-center gap-4">
                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 hover:gap-3 transition-all">
                  Read Details <LuArrowRight size={14} />
                </button>
                {(notice.priority === "high" || notice.priority === "Urgent") && (
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                    Urgent
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="p-12 text-center text-muted italic text-sm">All clear! No pending notifications.</div>
        )}
      </div>

      {selectedNotice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center border border-border-subtle bg-surface">
                  {selectedNotice.priority === "high" || selectedNotice.priority === "Urgent" ? (
                    <LuTriangleAlert className="text-red-500" size={24} />
                  ) : (
                    <LuInfo className="text-blue-500" size={24} />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest font-sans">Notification Details</span>
                  <h3 className="text-xl font-display font-black tracking-tight text-foreground">
                    {selectedNotice.priority === "high" || selectedNotice.priority === "Urgent" ? "Action Required" : "Info Alert"}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNotice(null)}
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
                  selectedNotice.priority === "high" || selectedNotice.priority === "Urgent" 
                    ? "bg-red-100 text-red-600" 
                    : "bg-blue-100 text-blue-600"
                )}>
                  {selectedNotice.priority === "high" || selectedNotice.priority === "Urgent" ? "Urgent" : "General"}
                </span>
                <span className="text-[10px] font-black text-muted uppercase tracking-widest font-sans">
                  {db.formatRelativeTime(selectedNotice.created_at)}
                </span>
              </div>

              <div className="text-left">
                <h4 className="text-2xl font-display font-black tracking-tight text-foreground">
                  {selectedNotice.title}
                </h4>
                <p className="font-sans text-sm font-medium text-muted mt-4 leading-relaxed whitespace-pre-line bg-background/50 border border-border-subtle p-6 rounded-2xl">
                  {selectedNotice.body || "No details provided."}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-border-subtle bg-background/30 flex">
              <button 
                onClick={() => setSelectedNotice(null)}
                className="flex-1 py-3.5 rounded-xl border border-border-subtle text-xs font-black uppercase tracking-widest hover:bg-background transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
