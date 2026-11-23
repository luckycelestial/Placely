"use client";
import { Sk } from "@/components/ui/skeleton";

import { useState, useRef, useEffect } from "react";
import { 
  LuSearch, 
  LuPlus, 
  LuCalendar, 
  LuClock, 
  LuBell, 
  LuPin,
  LuEllipsis, 
  LuSend,
  LuPencil,
  LuTrash2,
  LuRefreshCw,
  LuX,
  LuFileText,
} from "react-icons/lu";
import { cn, formatAudienceDisplay } from "@/lib/utils";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import type { Notice } from "./notice-dialog";
import type { Event } from "./event-dialog";
import {
  getNoticesAll,
  getEventsAll,
  createNotice,
  updateNotice,
  deleteNotice,
  toggleNoticePin,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/services/database";

const NoticeDialog = dynamic(() => import("./notice-dialog"), { ssr: false });
const EventDialog = dynamic(() => import("./event-dialog"), { ssr: false });
const OutboxModal = dynamic(() => import("./outbox-modal"), { ssr: false });
const RSVPModal = dynamic(() => import("./rsvp-modal"), { ssr: false });

const TABS = ["Notices", "Events"];

// ─── Ellipsis dropdown menu ───────────────────────────────────────────────────
interface ActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onResend?: () => void;
}

function ActionMenu({ onEdit, onDelete, onResend }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-10 w-10 flex items-center justify-center rounded-xl border border-border-subtle bg-surface hover:bg-black/5 transition-all shadow-sm",
          open && "bg-black/5 border-primary/20"
        )}
      >
        <LuEllipsis size={18} className="text-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-44 bg-surface border border-border-subtle rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-background transition-colors text-left"
          >
            <LuPencil size={15} className="text-primary" /> Edit
          </button>
          {onResend && (
            <button
              onClick={() => { onResend(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-background transition-colors text-left"
            >
              <LuRefreshCw size={15} className="text-blue-500" /> Resend
            </button>
          )}
          <div className="border-t border-border-subtle/50 mx-3" />
          <button
            onClick={() => { onDelete(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-red-50 text-red-500 transition-colors text-left"
          >
            <LuTrash2 size={15} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────
interface ConfirmDeleteProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDelete({ isOpen, title, onConfirm, onCancel }: ConfirmDeleteProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface w-full max-w-sm rounded-[28px] border border-border-subtle shadow-2xl p-8 animate-in zoom-in-95 duration-150">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-5">
          <LuTrash2 size={24} />
        </div>
        <h3 className="text-lg font-black text-center mb-2">Delete?</h3>
        <p className="text-sm text-muted text-center font-medium leading-relaxed mb-6">
          Are you sure you want to delete <span className="font-bold text-foreground">&quot;{title}&quot;</span>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl bg-surface border-2 border-border-subtle text-sm font-black hover:bg-background transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-black hover:bg-red-600 transition-all shadow-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Sk.NoticeRow key={i} />
      ))}
    </div>
  );
}

// ─── Format date for display ──────────────────────────────────────────────────
function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NoticesPage() {
  const [activeTab, setActiveTab] = useState("Notices");
  const [search, setSearch] = useState("");

  // Data
  const [notices, setNotices] = useState<Notice[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isNoticeDialogOpen, setIsNoticeDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [isRSVPOpen, setIsRSVPOpen] = useState(false);
  const [rsvpEvent, setRsvpEvent] = useState<Event | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: "notice" | "event"; id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Fetch on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [noticesData, eventsData] = await Promise.all([
          getNoticesAll(),
          getEventsAll(),
        ]);
        if (!ignore) {
          setNotices(noticesData as Notice[]);
          setEvents(eventsData as Event[]);
        }
      } catch (err) {
        console.error("Failed to load notices/events:", err);
        toast.error("Failed to load data. Please refresh.");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // ─── Filtered data ──────────────────────────────────────────────────────────
  const filteredNotices = notices
    .filter((n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase()) ||
      n.audience.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.venue.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateNotice = () => {
    setSelectedNotice(null);
    setIsNoticeDialogOpen(true);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsEventDialogOpen(true);
  };

  const handleSaveNotice = async (notice: Notice) => {
    const isNew = !notices.find((n) => n.id === notice.id);
    try {
      if (isNew) {
        const created = await createNotice(notice) as Notice;
        setNotices((prev) => [created, ...prev]);
      } else {
        const updated = await updateNotice(notice.id, notice) as Notice;
        setNotices((prev) => prev.map((n) => n.id === updated.id ? updated : n));
      }
    } catch (err) {
      console.error("Save notice error:", err);
      toast.error("Failed to save notice. Please try again.");
    }
  };

  const handleSaveEvent = async (event: Event) => {
    const isNew = !events.find((e) => e.id === event.id);
    try {
      if (isNew) {
        const created = await createEvent(event) as Event;
        setEvents((prev) => [...prev, created]);
      } else {
        const updated = await updateEvent(event.id, event) as Event;
        setEvents((prev) => prev.map((e) => e.id === updated.id ? updated : e));
      }
    } catch (err) {
      console.error("Save event error:", err);
      toast.error("Failed to save event. Please try again.");
    }
  };

  const handleEditNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsNoticeDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleDeleteNotice = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteNotice(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notice deleted.");
    } catch (err) {
      console.error("Delete notice error:", err);
      toast.error("Failed to delete notice.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Event deleted.");
    } catch (err) {
      console.error("Delete event error:", err);
      toast.error("Failed to delete event.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handlePinToggle = async (id: string) => {
    const notice = notices.find((n) => n.id === id);
    if (!notice) return;
    const currentlyPinned = notice.pinned ?? false;
    // Optimistic update
    setNotices((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !currentlyPinned } : n))
    );
    try {
      const updated = await toggleNoticePin(id, currentlyPinned) as Notice;
      setNotices((prev) => prev.map((n) => n.id === updated.id ? updated : n));
      toast.success(currentlyPinned ? "Notice unpinned." : "Notice pinned to top!");
    } catch (err) {
      // Revert optimistic update
      setNotices((prev) =>
        prev.map((n) => (n.id === id ? { ...n, pinned: currentlyPinned } : n))
      );
      console.error("Pin toggle error:", err);
      toast.error("Failed to update pin.");
    }
  };

  const handleResendNotice = (notice: Notice) => {
    toast.success(`Notice re-sent to ${notice.audience}!`);
  };

  const handleManageRSVP = (event: Event) => {
    setRsvpEvent(event);
    setIsRSVPOpen(true);
  };

  const priorityColor = (priority: Notice["priority"]) => {
    if (priority === "Urgent") return "bg-red-500";
    if (priority === "Reminder") return "bg-orange-500";
    return "bg-blue-500";
  };

  const priorityBadgeColor = (priority: Notice["priority"]) => {
    if (priority === "Urgent") return "bg-red-500/10 text-red-600";
    if (priority === "Reminder") return "bg-orange-500/10 text-orange-600";
    return "bg-blue-500/10 text-blue-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Notices &amp; Events</h1>
          <p className="text-muted text-sm font-medium">Communicate updates and schedule placement activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOutboxOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-surface border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors"
          >
            <LuSend size={16} />
            View Outbox
          </button>
          <button
            onClick={activeTab === "Notices" ? handleCreateNotice : handleCreateEvent}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-tactile hover:bg-primary-dark transition-all"
          >
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
              onClick={() => { setActiveTab(tab); setSearch(""); }}
              className={cn(
                "px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
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
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-border-subtle bg-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              <LuX size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6">
        {activeTab === "Notices" ? (
          <div className="space-y-4">
            {loading ? (
              <LoadingSkeleton count={3} />
            ) : filteredNotices.length === 0 ? (
              <div className="py-20 text-center bg-surface rounded-3xl border border-dashed border-border-subtle">
                <LuFileText size={32} className="mx-auto text-muted/30 mb-4" />
                <p className="text-muted font-bold">
                  {search ? `No notices matching "${search}"` : "No notices yet."}
                </p>
                {!search && (
                  <button
                    onClick={handleCreateNotice}
                    className="mt-4 text-primary font-black text-sm uppercase tracking-widest hover:underline"
                  >
                    Create your first notice
                  </button>
                )}
              </div>
            ) : (
              filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-surface p-6 rounded-3xl border border-border-subtle shadow-soft hover:shadow-md transition-all group relative"
                >
                  {/* Priority stripe */}
                  <div className={cn("absolute top-0 left-0 w-1.5 h-full rounded-l-3xl", priorityColor(notice.priority))} />

                  {/* Pinned indicator */}
                  {notice.pinned && (
                    <div className="absolute top-3 left-4 flex items-center gap-1">
                      <LuPin size={10} className="text-primary fill-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary">Pinned</span>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className={cn("space-y-2 flex-1", notice.pinned && "mt-4 md:mt-0")}>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                          priorityBadgeColor(notice.priority)
                        )}>
                          {notice.priority}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted bg-black/5 px-2 py-0.5 rounded-md">
                          Target: {formatAudienceDisplay(notice.audience)}
                        </span>
                        <div className="flex items-center gap-1.5 text-muted">
                          <LuClock size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {formatDisplayDate(notice.date)}, {notice.time}
                          </span>
                        </div>
                        {/* Status badge */}
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                          notice.status === "Published"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : notice.status === "Scheduled"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                          {notice.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-black tracking-tight group-hover:text-primary transition-colors">
                        {notice.title}
                      </h3>
                      <p className="text-sm font-medium text-foreground/70 leading-relaxed max-w-3xl">
                        {notice.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Pin toggle */}
                      <button
                        onClick={() => handlePinToggle(notice.id)}
                        title={notice.pinned ? "Unpin notice" : "Pin notice to top"}
                        className={cn(
                          "h-10 w-10 flex items-center justify-center rounded-xl border transition-all shadow-sm",
                          notice.pinned
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border-subtle bg-surface hover:border-primary/30 hover:text-primary"
                        )}
                      >
                        <LuPin size={17} className={notice.pinned ? "fill-primary" : ""} />
                      </button>

                      {/* Actions dropdown */}
                      <ActionMenu
                        onEdit={() => handleEditNotice(notice)}
                        onDelete={() => setDeleteTarget({ type: "notice", id: notice.id, title: notice.title })}
                        onResend={notice.status === "Published" ? () => handleResendNotice(notice) : undefined}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-surface p-6 rounded-3xl border border-border-subtle animate-pulse space-y-4">
                    <div className="flex justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-black/8" />
                      <div className="flex gap-2">
                        <div className="h-6 w-16 rounded-lg bg-black/8" />
                        <div className="h-6 w-16 rounded-lg bg-black/8" />
                      </div>
                    </div>
                    <div className="h-5 w-2/3 rounded-lg bg-black/8" />
                    <div className="h-4 w-full rounded-lg bg-black/8" />
                    <div className="h-4 w-3/4 rounded-lg bg-black/8" />
                  </div>
                ))}
              </>
            ) : filteredEvents.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-surface rounded-3xl border border-dashed border-border-subtle">
                <LuCalendar size={32} className="mx-auto text-muted/30 mb-4" />
                <p className="text-muted font-bold">
                  {search ? `No events matching "${search}"` : "No events scheduled."}
                </p>
                {!search && (
                  <button
                    onClick={handleCreateEvent}
                    className="mt-4 text-primary font-black text-sm uppercase tracking-widest hover:underline"
                  >
                    Schedule your first event
                  </button>
                )}
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="bg-surface p-6 rounded-3xl border border-border-subtle shadow-soft hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <LuCalendar size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                        event.status === "Upcoming" ? "bg-emerald-500/10 text-emerald-600" :
                        event.status === "Scheduled" ? "bg-blue-500/10 text-blue-600" :
                        event.status === "Completed" ? "bg-gray-500/10 text-gray-600" :
                        "bg-red-500/10 text-red-600"
                      )}>
                        {event.status}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-black/5 text-muted">
                        {event.type}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-black tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>

                  {event.description && (
                    <p className="text-xs font-medium text-foreground/60 leading-relaxed mb-3 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2.5 text-foreground/70">
                      <LuClock size={14} className="text-muted" />
                      <span className="text-xs font-bold">{formatDisplayDate(event.date)} | {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-foreground/70">
                      <LuBell size={14} className="text-muted" />
                      <span className="text-xs font-bold">{event.venue}</span>
                    </div>
                    {event.maxAttendees && (
                      <div className="flex items-center gap-2.5 text-foreground/70">
                        <LuBell size={14} className="text-muted" />
                        <span className="text-xs font-bold">Max {event.maxAttendees} attendees</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-border-subtle/50">
                    <button
                      onClick={() => handleManageRSVP(event)}
                      className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl bg-background border border-border-subtle hover:bg-black/5 transition-all"
                    >
                      Manage RSVPs
                    </button>
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-white shadow-tactile hover:bg-primary-dark transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: "event", id: event.id, title: event.title })}
                      className="h-10 w-10 flex items-center justify-center rounded-xl border border-border-subtle bg-surface hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-muted transition-all"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}
      <NoticeDialog
        isOpen={isNoticeDialogOpen}
        onClose={() => setIsNoticeDialogOpen(false)}
        onSave={handleSaveNotice}
        notice={selectedNotice}
      />

      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        onSave={handleSaveEvent}
        event={selectedEvent}
      />

      <OutboxModal
        isOpen={isOutboxOpen}
        onClose={() => setIsOutboxOpen(false)}
        notices={notices}
      />

      <RSVPModal
        isOpen={isRSVPOpen}
        onClose={() => setIsRSVPOpen(false)}
        event={rsvpEvent}
      />

      <ConfirmDelete
        isOpen={!!deleteTarget}
        title={deleteTarget?.title ?? ""}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === "notice") handleDeleteNotice(deleteTarget.id);
          else handleDeleteEvent(deleteTarget.id);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Global deleting spinner overlay */}
      {isDeleting && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-6 shadow-2xl flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-black">Deleting...</span>
          </div>
        </div>
      )}
    </div>
  );
}
