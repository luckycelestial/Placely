"use client";

import { useState } from "react";
import {
  LuX, LuPlus, LuSave, LuCalendar, LuClock, LuMapPin, LuUsers, LuTag
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export type Event = {
  id: string;
  title: string;
  type: "Webinar" | "Offline" | "Hybrid" | "Online";
  date: string;
  time: string;
  venue: string;
  status: "Upcoming" | "Scheduled" | "Completed" | "Cancelled";
  description?: string;
  maxAttendees?: number;
};

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => void;
  event?: Event | null;
}

const EVENT_TYPES = ["Webinar", "Offline", "Hybrid", "Online"] as const;
const EVENT_STATUSES = ["Upcoming", "Scheduled", "Completed", "Cancelled"] as const;

export default function EventDialog({ isOpen, onClose, onSave, event }: EventDialogProps) {
  const isEdit = !!event;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    type: "Webinar" as Event["type"],
    date: new Date().toISOString().split("T")[0],
    startTime: "02:00 PM",
    endTime: "03:30 PM",
    venue: "",
    status: "Upcoming" as Event["status"],
    description: "",
    maxAttendees: "",
  });

  const [prevEvent, setPrevEvent] = useState<Event | null | undefined>(event);
  if (prevEvent !== event) {
    setPrevEvent(event);
    if (event) {
      const [startTime, endTime] = event.time.includes(" - ")
        ? event.time.split(" - ")
        : [event.time, ""];
      setForm({
        title: event.title,
        type: event.type,
        date: event.date,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        venue: event.venue,
        status: event.status,
        description: event.description || "",
        maxAttendees: event.maxAttendees?.toString() || "",
      });
    } else {
      setForm({
        title: "",
        type: "Webinar",
        date: new Date().toISOString().split("T")[0],
        startTime: "02:00 PM",
        endTime: "03:30 PM",
        venue: "",
        status: "Upcoming",
        description: "",
        maxAttendees: "",
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Event title is required"); return; }
    if (!form.venue.trim()) { toast.error("Venue is required"); return; }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const timeStr = form.endTime ? `${form.startTime} - ${form.endTime}` : form.startTime;
      const saved: Event = {
        id: event?.id || `EVT${Date.now()}`,
        title: form.title,
        type: form.type,
        date: form.date,
        time: timeStr,
        venue: form.venue,
        status: form.status,
        description: form.description,
        maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : undefined,
      };
      onSave(saved);
      toast.success(isEdit ? "Event updated!" : "Event created!");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-xl max-h-[90vh] rounded-[32px] border border-border-subtle shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-background/50 shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight">{isEdit ? "Edit Event" : "Create Event"}</h2>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">
              {isEdit ? "Update event details" : "Schedule a new placement event"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-background transition-colors shadow-sm"
          >
            <LuX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-5 no-scrollbar">

            {/* Title */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                <LuCalendar size={12} className="text-primary" /> Event Title
              </label>
              <input
                type="text"
                placeholder="e.g. Microsoft Pre-Placement Talk"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-5 py-4 rounded-2xl border border-border-subtle bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                <LuTag size={12} className="text-primary" /> Event Type
              </label>
              <div className="flex gap-2 p-1.5 bg-background rounded-2xl border border-border-subtle">
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={cn(
                      "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      form.type === t
                        ? "bg-surface text-primary shadow-tactile border border-primary/10"
                        : "text-muted hover:text-foreground hover:bg-surface/50"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                <LuCalendar size={12} className="text-primary" /> Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-5 py-4 rounded-2xl border border-border-subtle bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              {(["startTime", "endTime"] as const).map((field, idx) => (
                <div key={field} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                    <LuClock size={12} className="text-primary" /> {idx === 0 ? "Start Time" : "End Time"}
                  </label>
                  <SearchableSelect
                    value={form[field]}
                    onChange={(val) => setForm((f) => ({ ...f, [field]: val }))}
                    options={((): { value: string, label: string }[] => {
                      const preset = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "03:30 PM", "04:00 PM", "05:00 PM", "06:00 PM"];
                      const times = preset.includes(form[field]) ? preset : [...preset, form[field]];
                      return times.map(t => ({ value: t, label: t }));
                    })()}
                  />
                </div>
              ))}
            </div>

            {/* Venue */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                <LuMapPin size={12} className="text-primary" /> Venue / Platform
              </label>
              <input
                type="text"
                placeholder="e.g. Main Auditorium / Zoom Meeting"
                value={form.venue}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                className="w-full px-5 py-4 rounded-2xl border border-border-subtle bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm"
              />
            </div>

            {/* Max Attendees */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                <LuUsers size={12} className="text-primary" /> Max Attendees <span className="text-muted font-medium normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 200"
                value={form.maxAttendees}
                onChange={(e) => setForm((f) => ({ ...f, maxAttendees: e.target.value }))}
                className="w-full px-5 py-4 rounded-2xl border border-border-subtle bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Description (optional)</label>
              <textarea
                placeholder="Add any additional details about the event..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-5 py-4 rounded-2xl border border-border-subtle bg-background text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm resize-none leading-relaxed"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Status</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      form.status === s
                        ? s === "Upcoming" ? "bg-emerald-500 text-white border-emerald-500"
                          : s === "Scheduled" ? "bg-blue-500 text-white border-blue-500"
                            : s === "Completed" ? "bg-gray-500 text-white border-gray-500"
                              : "bg-red-500 text-white border-red-500"
                        : "bg-surface border-border-subtle text-muted hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-subtle bg-background/50 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-surface border-2 border-border-subtle text-sm font-black uppercase tracking-widest hover:bg-background transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3.5 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : isEdit ? (
                <><LuSave size={16} /> Update Event</>
              ) : (
                <><LuPlus size={16} /> Create Event</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
