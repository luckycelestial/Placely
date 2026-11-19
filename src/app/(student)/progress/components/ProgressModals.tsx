"use client";

import React, { useMemo } from "react";
import {
  LuCalendar,
  LuChevronLeft,
  LuChevronRight,
  LuX,
  LuShieldCheck,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { DateModalData } from "../types";

export function Milestone({
  icon,
  label,
  date,
  completed = false,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  date: string;
  completed?: boolean;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 shrink-0 w-full min-w-[100px]">
      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center border transition-all shadow-sm",
          completed
            ? "bg-primary border-primary text-white"
            : active
            ? "bg-primary/20 border-primary text-primary animate-pulse"
            : "bg-white/5 border-white/10 text-white/20"
        )}
      >
        {icon}
      </div>
      <p
        className={cn(
          "text-[10px] font-black tracking-tight mt-3 leading-none",
          completed || active ? "text-white" : "text-white/20"
        )}
      >
        {label}
      </p>
      <p className={cn("text-[9px] font-semibold mt-1", completed ? "text-primary-light" : "text-white/40")}>
        {date}
      </p>
    </div>
  );
}

interface DateSlotPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateModalData: DateModalData | null;
  calendarMonth: number;
  setCalendarMonth: React.Dispatch<React.SetStateAction<number>>;
  calendarYear: number;
  setCalendarYear: React.Dispatch<React.SetStateAction<number>>;
  tempSelectedDate: string;
  setTempSelectedDate: (date: string) => void;
  onConfirmDate: (date: string) => void;
}

export function DateSlotPickerModal({
  isOpen,
  onClose,
  dateModalData,
  calendarMonth,
  setCalendarMonth,
  calendarYear,
  setCalendarYear,
  tempSelectedDate,
  setTempSelectedDate,
  onConfirmDate,
}: DateSlotPickerModalProps) {
  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m: number, y: number) => new Date(y, m, 1).getDay();
  const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
  const firstDayIndex = getFirstDayOfMonth(calendarMonth, calendarYear);

  const daysGrid: (number | null)[] = useMemo(() => {
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(d);
    }
    return grid;
  }, [firstDayIndex, daysInMonth]);

  if (!isOpen || !dateModalData) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="date-picker-title"
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-border-subtle bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LuCalendar className="text-primary" size={20} />
            <div>
              <h3 id="date-picker-title" className="font-display text-sm font-black tracking-tight text-foreground">
                Choose Joining Date
              </h3>
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">
                Select your preferred date
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors text-muted hover:text-foreground cursor-pointer"
          >
            <LuX size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="font-sans text-xs font-semibold text-muted leading-relaxed">
            Choose a custom start date that coordinates best with your timeline.
          </p>

          <div className="border border-border-subtle bg-background/50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear((prev) => prev - 1);
                  } else {
                    setCalendarMonth((prev) => prev - 1);
                  }
                }}
                aria-label="Previous month"
                className="p-2 rounded-xl hover:bg-primary/10 text-muted hover:text-primary transition-colors cursor-pointer"
              >
                <LuChevronLeft size={16} />
              </button>
              <span className="font-display text-sm font-black text-foreground">
                {new Date(calendarYear, calendarMonth).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear((prev) => prev + 1);
                  } else {
                    setCalendarMonth((prev) => prev + 1);
                  }
                }}
                aria-label="Next month"
                className="p-2 rounded-xl hover:bg-primary/10 text-muted hover:text-primary transition-colors cursor-pointer"
              >
                <LuChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d} className="text-[10px] font-black text-muted/60 uppercase tracking-widest">
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {daysGrid.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />;
                }

                const dateString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(
                  day
                ).padStart(2, "0")}`;
                const isSelected = tempSelectedDate === dateString;

                return (
                  <button
                    key={dateString}
                    onClick={() => setTempSelectedDate(dateString)}
                    className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all mx-auto cursor-pointer",
                      isSelected
                        ? "bg-primary text-white shadow-tactile font-black scale-110"
                        : "hover:bg-primary/10 text-foreground hover:text-primary"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {tempSelectedDate && (
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-center text-xs font-bold text-primary">
              Selected Date:{" "}
              {new Date(tempSelectedDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border-subtle bg-background/30 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border-subtle text-[10px] font-black uppercase tracking-widest hover:bg-background transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirmDate(tempSelectedDate)}
            disabled={!tempSelectedDate}
            className="flex-1 btn-primary py-3 px-6 h-auto text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            Confirm Date
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject: any;
  projTitle: string;
  setProjTitle: (val: string) => void;
  projDesc: string;
  setProjDesc: (val: string) => void;
  projTech: string;
  setProjTech: (val: string) => void;
  projGithub: string;
  setProjGithub: (val: string) => void;
  projLive: string;
  setProjLive: (val: string) => void;
  isSavingProject: boolean;
  onSaveProject: () => void;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  editingProject,
  projTitle,
  setProjTitle,
  projDesc,
  setProjDesc,
  projTech,
  setProjTech,
  projGithub,
  setProjGithub,
  projLive,
  setProjLive,
  isSavingProject,
  onSaveProject,
}: ProjectFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="px-6 py-4 border-b border-border-subtle bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
          <h3 id="project-modal-title" className="font-display text-lg font-black tracking-tight text-foreground">
            {editingProject ? "Edit Project" : "Add New Project"}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-primary/10 transition-colors text-muted hover:text-foreground cursor-pointer"
          >
            <LuX size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Project Title *
            </label>
            <input
              type="text"
              value={projTitle}
              onChange={(e) => setProjTitle(e.target.value)}
              placeholder="e.g. Campus Recruitment Portal"
              className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Description
            </label>
            <textarea
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Write a brief overview of the project..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Technologies (comma-separated)
            </label>
            <input
              type="text"
              value={projTech}
              onChange={(e) => setProjTech(e.target.value)}
              placeholder="e.g. Next.js, TypeScript, Tailwind, Supabase"
              className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={projGithub}
              onChange={(e) => setProjGithub(e.target.value)}
              placeholder="e.g. github.com/username/project"
              className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest">
              Live Demo URL
            </label>
            <input
              type="text"
              value={projLive}
              onChange={(e) => setProjLive(e.target.value)}
              placeholder="e.g. project-live.vercel.app"
              className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="p-6 border-t border-border-subtle bg-background/30 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border-subtle text-[10px] font-black uppercase tracking-widest hover:bg-background transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSaveProject}
            disabled={isSavingProject}
            className="flex-1 btn-primary py-3 px-6 h-auto text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSavingProject ? "Saving..." : "Save Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeleteProjectConfirmModal({
  deletingProjectId,
  onClose,
  onConfirmDelete,
}: {
  deletingProjectId: string | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
}) {
  if (!deletingProjectId) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-proj-title"
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-sm shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-300">
        <div className="space-y-2 text-center">
          <h4 id="delete-proj-title" className="font-display text-lg font-black tracking-tight">
            Delete Project?
          </h4>
          <p className="text-sm font-semibold text-muted">
            Are you sure you want to permanently delete this project? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border-subtle text-[10px] font-black uppercase tracking-widest hover:bg-background transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await onConfirmDelete(deletingProjectId);
              onClose();
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmOfferAcceptanceModal({
  offerToConfirm,
  onClose,
  onConfirmAccept,
}: {
  offerToConfirm: any | null;
  onClose: () => void;
  onConfirmAccept: (app: any) => Promise<void>;
}) {
  if (!offerToConfirm) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-confirm-title"
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-md shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
          <LuShieldCheck size={28} />
        </div>
        <div className="space-y-2 text-center">
          <h4 id="offer-confirm-title" className="font-display text-xl font-black tracking-tight text-foreground">
            Confirm Offer Acceptance
          </h4>
          <p className="text-xs font-semibold text-muted leading-relaxed">
            Accepting this offer from{" "}
            <span className="font-bold text-foreground">{offerToConfirm.company}</span> (
            {offerToConfirm.ctc}) will activate your{" "}
            <span className="font-bold text-amber-500">Placement Lock</span> and finalize your placement choice.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border border-border-subtle text-[10px] font-black uppercase tracking-widest text-muted hover:bg-background transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              const app = offerToConfirm;
              onClose();
              await onConfirmAccept(app);
            }}
            className="flex-1 py-3.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors cursor-pointer"
          >
            Confirm & Accept
          </button>
        </div>
      </div>
    </div>
  );
}
