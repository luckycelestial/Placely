"use client";

import { useState, useEffect } from "react";
import { LuX, LuUsers, LuCalendar, LuClock, LuMapPin, LuCircleCheck, LuCircleX, LuSearch } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Event } from "./event-dialog";
import { toast } from "sonner";
import { db } from "@/services/database";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

interface RSVPModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

type RSVPStatus = "Confirmed" | "Pending" | "Declined";

interface RSVPRow {
  id: string;
  student_name: string;
  roll_number: string;
  branch: string;
  status: RSVPStatus;
}

export default function RSVPModal({ isOpen, onClose, event }: RSVPModalProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<RSVPStatus | "All">("All");
  const [allRSVPs, setAllRSVPs] = useState<RSVPRow[]>([]);

  const [prevEventId, setPrevEventId] = useState<string | null>(null);
  const currentEventId = isOpen && event ? event.id : null;
  if (prevEventId !== currentEventId) {
    setPrevEventId(currentEventId);
    setSearch("");
    setFilterStatus("All");
  }

  useEffect(() => {
    if (!isOpen || !event) return;
    (async () => {
      try {
        const rows = await db.getNoticeRsvps(event.id);
        setAllRSVPs(rows as RSVPRow[]);
      } catch (error) {
        console.error('notice_rsvps fetch error:', error);
      }
    })();
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const filtered = allRSVPs.filter((r) => {
    const matchSearch =
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.roll_number.toLowerCase().includes(search.toLowerCase()) ||
      r.branch.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const confirmed = allRSVPs.filter((r) => r.status === "Confirmed").length;
  const pending = allRSVPs.filter((r) => r.status === "Pending").length;
  const declined = allRSVPs.filter((r) => r.status === "Declined").length;

  const handleExportExcel = async () => {
    const toastId = toast.loading("Exporting Excel...");
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const exportRows = filtered.map(r => ({
        "Student Name": r.student_name,
        "Roll Number": r.roll_number,
        "Branch": r.branch,
        "Status": r.status
      }));
      exportToExcel(exportRows, `RSVP_${event.title.replace(/\s+/g, '_')}_Report`, "RSVPs");
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading("Exporting PDF...");
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const headers = ["Student Name", "Roll Number", "Branch", "Status"];
      const rows = filtered.map(r => [
        r.student_name,
        r.roll_number,
        r.branch,
        r.status
      ]);
      await exportToPDF(`RSVP List - ${event.title}`, headers, rows, `RSVP_${event.title.replace(/\s+/g, '_')}_Report`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleRemind = () => {
    toast.success(`Reminder sent to ${pending} pending students!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-[32px] border border-border-subtle shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-background/50 shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight">Manage RSVPs</h2>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5 truncate max-w-xs">
              {event.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-background transition-colors shadow-sm"
          >
            <LuX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Event Info */}
          <div className="px-8 pt-6 pb-4 bg-background/30 border-b border-border-subtle/50">
            <div className="flex flex-wrap gap-4 text-xs font-bold text-foreground/70">
              <span className="flex items-center gap-1.5"><LuCalendar size={13} className="text-primary" />{event.date}</span>
              <span className="flex items-center gap-1.5"><LuClock size={13} className="text-primary" />{event.time}</span>
              <span className="flex items-center gap-1.5"><LuMapPin size={13} className="text-primary" />{event.venue}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="px-8 py-5 grid grid-cols-3 gap-4 border-b border-border-subtle/50">
            {[
              { label: "Confirmed", count: confirmed, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { label: "Pending", count: pending, color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20" },
              { label: "Declined", count: declined, color: "text-red-600", bg: "bg-red-500/10 border-red-500/20" },
            ].map((stat) => (
              <div key={stat.label} className={cn("p-4 rounded-2xl border text-center", stat.bg)}>
                <p className={cn("text-2xl font-black", stat.color)}>{stat.count}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Search + Filter */}
          <div className="px-8 py-4 flex gap-3 items-center border-b border-border-subtle/50">
            <div className="relative flex-1">
              <LuSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-subtle bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex gap-1.5">
              {(["All", "Confirmed", "Pending", "Declined"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    filterStatus === s
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-surface border-border-subtle text-muted hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* RSVP List */}
          <div className="px-8 py-4 space-y-2">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <LuUsers size={28} className="mx-auto text-muted/30 mb-3" />
                <p className="text-sm font-bold text-muted">No students found</p>
              </div>
            ) : (
              filtered.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border-subtle/50 hover:border-border-subtle transition-all"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm shrink-0">
                    {rsvp.student_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm">{rsvp.student_name}</p>
                    <p className="text-[10px] font-bold text-muted">{rsvp.roll_number} · {rsvp.branch}</p>
                  </div>
                  <span
                    className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                      rsvp.status === "Confirmed"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : rsvp.status === "Pending"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-red-500/10 text-red-600 border-red-500/20"
                    )}
                  >
                    {rsvp.status === "Confirmed" ? <LuCircleCheck size={11} /> : rsvp.status === "Declined" ? <LuCircleX size={11} /> : null}
                    {rsvp.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle bg-background/50 flex gap-3 shrink-0">
          <button
            onClick={handleRemind}
            className="flex-1 py-3.5 rounded-2xl bg-surface border-2 border-border-subtle text-sm font-black uppercase tracking-widest hover:bg-background transition-all"
            disabled={pending === 0}
          >
            Remind Pending ({pending})
          </button>
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            className="flex-1 [&>button]:w-full [&>button]:justify-center [&>button]:py-3.5 [&>button]:rounded-2xl [&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary-dark [&>button]:shadow-tactile [&>button]:border-none"
            buttonText="Export RSVPs"
          />
        </div>
      </div>
    </div>
  );
}
