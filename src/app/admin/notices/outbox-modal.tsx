"use client";

import { LuX, LuSend, LuClock, LuUsers, LuCircleCheck, LuCircleAlert, LuInfo } from "react-icons/lu";
import { cn, formatAudienceDisplay } from "@/lib/utils";
import type { Notice } from "./notice-dialog";

interface OutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  notices: Notice[];
}

export default function OutboxModal({ isOpen, onClose, notices }: OutboxModalProps) {
  if (!isOpen) return null;

  const sent = notices.filter((n) => n.status === "Published");
  const scheduled = notices.filter((n) => n.status === "Scheduled");
  const drafts = notices.filter((n) => n.status === "Draft");

  const priorityIcon = (priority: Notice["priority"]) => {
    if (priority === "Urgent") return <LuCircleAlert size={14} className="text-red-500" />;
    if (priority === "Reminder") return <LuCircleAlert size={14} className="text-orange-500" />;
    return <LuInfo size={14} className="text-blue-500" />;
  };

  const priorityColor = (priority: Notice["priority"]) => {
    if (priority === "Urgent") return "bg-red-500/10 text-red-600 border-red-500/20";
    if (priority === "Reminder") return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-2xl max-h-[85vh] rounded-[32px] border border-border-subtle shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-background/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <LuSend size={18} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Outbox</h2>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Sent & Scheduled Notices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-background transition-colors shadow-sm"
          >
            <LuX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Published", count: sent.length, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { label: "Scheduled", count: scheduled.length, color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20" },
              { label: "Drafts", count: drafts.length, color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20" },
            ].map((stat) => (
              <div key={stat.label} className={cn("p-4 rounded-2xl border text-center", stat.bg)}>
                <p className={cn("text-2xl font-black", stat.color)}>{stat.count}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Published */}
          {sent.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LuCircleCheck size={16} className="text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted">Published</h3>
              </div>
              <div className="space-y-3">
                {sent.map((notice) => (
                  <div key={notice.id} className="flex items-start gap-4 p-4 rounded-2xl bg-background border border-border-subtle/50">
                    <div className="shrink-0 mt-0.5">{priorityIcon(notice.priority)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm truncate">{notice.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border", priorityColor(notice.priority))}>
                          {notice.priority}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted">
                          <LuUsers size={10} /> {formatAudienceDisplay(notice.audience)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted">
                          <LuClock size={10} /> {notice.date}, {notice.time}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                      Sent
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled */}
          {scheduled.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LuClock size={16} className="text-blue-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted">Scheduled</h3>
              </div>
              <div className="space-y-3">
                {scheduled.map((notice) => (
                  <div key={notice.id} className="flex items-start gap-4 p-4 rounded-2xl bg-background border border-border-subtle/50">
                    <div className="shrink-0 mt-0.5">{priorityIcon(notice.priority)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm truncate">{notice.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border", priorityColor(notice.priority))}>
                          {notice.priority}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted">
                          <LuClock size={10} /> {notice.date}, {notice.time}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                      Queued
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty */}
          {notices.length === 0 && (
            <div className="py-16 text-center">
              <LuSend size={32} className="mx-auto text-muted/30 mb-4" />
              <p className="text-sm font-bold text-muted">No notices sent yet.</p>
              <p className="text-[11px] text-muted mt-1">Create your first notice to get started.</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border-subtle bg-background/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
