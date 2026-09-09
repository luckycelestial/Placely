"use client";

import { useState } from "react";
import { LuBuilding2, LuClock, LuGripVertical, LuMessageSquare, LuChevronRight } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { Application } from "./types";

interface AtsCandidateCardProps {
  candidate: Application;
  actualStageName: string;
  isGlobalView: boolean;
  isSelected: boolean;
  editingCtcId: string | null;
  showHoverPreview?: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onToggleSelect: (id: string) => void;
  onEditCtcStart: (id: string) => void;
  onEditCtcEnd: (id: string, value: string, prev: string) => void;
}

export function AtsCandidateCard({
  candidate,
  actualStageName,
  isGlobalView,
  isSelected,
  editingCtcId,
  showHoverPreview = false,
  onDragStart,
  onToggleSelect,
  onEditCtcStart,
  onEditCtcEnd,
}: AtsCandidateCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showHoverPreview) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      top: rect.top,
      left: rect.left,
      width: rect.width,
    });
    setShowTooltip(true);
  };

  const showCtc =
    actualStageName.toLowerCase().includes("offer") ||
    actualStageName.toLowerCase().includes("select") ||
    actualStageName.toLowerCase().includes("join");

  return (
    <div
      draggable
      tabIndex={0}
      role="article"
      aria-selected={isSelected}
      aria-label={`Candidate ${candidate.name}, Roll Number ${candidate.rollNo || candidate.regNo}`}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggleSelect(candidate.id);
        }
      }}
      onDragStart={(e) => onDragStart(e, candidate.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
      className={cn(
        "group relative flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-surface border transition-all cursor-grab active:cursor-grabbing hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-primary/40",
        isSelected
          ? "border-primary bg-primary/5 shadow-xs"
          : "border-border-subtle hover:border-primary/40"
      )}
    >
      {/* Checkbox + Avatar + Name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(candidate.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 rounded border-border-subtle text-primary focus:ring-primary/20 cursor-pointer shrink-0"
        />
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[9px] shrink-0">
          {candidate.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-xs truncate text-foreground group-hover:text-primary transition-colors leading-none">
            {candidate.name}
          </p>
        </div>
      </div>

      {/* Roll No + Grip Handle */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[9px] font-black text-muted tracking-tight">
          {candidate.rollNo || candidate.regNo}
        </span>
        <LuGripVertical size={13} className="text-muted/40 group-hover:text-muted cursor-grab" />
      </div>

      {/* Hover Detail Popover Tooltip (Fixed Overlay Unclipped by Scroll Context) */}
      {showTooltip && coords && (
        <div
          style={{
            position: "fixed",
            top: `${Math.max(12, coords.top - (showCtc ? 150 : 120))}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
          }}
          className="p-3 bg-surface border border-border-subtle rounded-2xl shadow-2xl z-[9999] animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle/50 mb-2">
            <div>
              <p className="font-bold text-xs text-foreground">{candidate.name}</p>
              <p className="text-[9px] font-black text-muted uppercase tracking-wider">{candidate.rollNo || candidate.regNo}</p>
            </div>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {candidate.avatar}
            </span>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between text-muted">
              <span>Company:</span>
              <span className="font-bold text-foreground truncate max-w-[170px] text-right">{candidate.company}</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Role:</span>
              <span className="font-bold text-foreground truncate max-w-[170px] text-right">{candidate.role}</span>
            </div>
            <div className="flex items-center justify-between text-muted">
              <span>Updated:</span>
              <span className="font-medium text-foreground/80">{candidate.updated}</span>
            </div>
            {isGlobalView && (
              <div className="flex items-center justify-between text-muted">
                <span>Stage:</span>
                <span className="font-bold text-primary">{actualStageName}</span>
              </div>
            )}
          </div>

          {/* Inline CTC editor in hover tooltip if applicable */}
          {showCtc && (
            <div className="mt-2.5 pt-2 border-t border-border-subtle/50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted">Package CTC:</span>
              <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                {editingCtcId === candidate.id ? (
                  <>
                    <input
                      autoFocus
                      type="number"
                      step="any"
                      defaultValue={candidate.ctc || ""}
                      placeholder="12"
                      className="w-14 bg-background border border-emerald-500 text-emerald-600 dark:text-emerald-400 rounded px-1.5 py-0.5 text-[10px] font-bold focus:outline-none"
                      onBlur={(e) => onEditCtcEnd(candidate.id, e.target.value, candidate.ctc || "")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                    />
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">LPA</span>
                  </>
                ) : (
                  <div
                    onClick={() => onEditCtcStart(candidate.id)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors border",
                      candidate.ctc
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                    )}
                  >
                    {candidate.ctc ? `${candidate.ctc} LPA` : "+ Set CTC"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
