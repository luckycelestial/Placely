"use client";

import { memo } from "react";
import {
  LuMapPin,
  LuCalendar,
  LuArrowRight,
  LuHeart,
  LuCircleCheck,
  LuBuilding2,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Drive, ResolvedState } from "./types";

interface DriveCardProps {
  drive: Drive;
  state: ResolvedState;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onCardClick: (drive: Drive) => void;
}

export const DriveCard = memo(function DriveCard({
  drive,
  state,
  isSaved,
  onToggleSave,
  onCardClick,
}: DriveCardProps) {
  const router = useRouter();
  const isClosed = state.phase === "ongoing" || state.phase === "completed";
  const daysLeft = Math.ceil(
    (new Date(drive.application_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const handleCardClick = () => {
    if (state.hasApplied && (state.phase === "ongoing" || state.phase === "completed")) {
      router.push("/progress");
    } else {
      onCardClick(drive);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "app-card group relative flex flex-col h-full cursor-pointer transition-all hover:shadow-hover overflow-hidden border bg-surface",
        state.cardBorder,
        state.opacityClass
      )}
    >
      {/* Save button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave(drive.id, e);
        }}
        className={cn(
          "absolute top-6 right-6 h-8 w-8 rounded-xl border flex items-center justify-center transition-all bg-background/70 border-border-subtle text-muted hover:text-primary z-10",
          isSaved && "bg-red-50 border-red-100 text-red-500 hover:text-red-600"
        )}
      >
        <LuHeart size={14} fill={isSaved ? "currentColor" : "none"} />
      </button>

      {/* Company logo + title */}
      <div className="p-8 pb-4">
        <div className="flex items-start justify-between">
          <div className="h-16 w-16 rounded-2xl bg-background border border-border-subtle flex items-center justify-center p-3 shadow-sm overflow-hidden group-hover:shadow-md transition-shadow">
            {drive.companies?.logo_url?.startsWith("http") ? (
              <img src={drive.companies.logo_url} alt="" className="h-full w-full object-contain" />
            ) : (
              <LuBuilding2 size={32} style={{ color: drive.companies?.theme_color || "var(--primary)" }} />
            )}
          </div>
        </div>
        <div className="mt-6">
          <h4 className="font-display text-2xl font-bold tracking-tight group-hover:text-primary transition-colors leading-tight">
            {drive.role_title}
          </h4>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-sans text-sm font-bold text-muted">{drive.companies?.name}</span>
            <span className="h-1 w-1 rounded-full bg-border-subtle" />
            <span className="font-sans text-sm font-bold text-muted">{drive.drive_type}</span>
          </div>
        </div>
      </div>

      {/* Location + CTC + date row */}
      <div className="px-8 py-6 space-y-4 flex-1">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted">
            <LuMapPin size={16} className="text-primary/60" />
            <span className="font-bold">{drive.location}</span>
          </div>
          <div className="font-display text-lg font-black text-foreground">{drive.package_ctc}</div>
        </div>

        <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
          {state.phase === "pre_open" ? (
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
              <LuCalendar size={14} />
              {drive.application_start
                ? `Opens ${new Date(drive.application_start).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
                : "Opens Soon"}
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                isClosed ? "text-muted" : daysLeft <= 3 ? "text-red-500" : "text-primary"
              )}
            >
              <LuCalendar size={14} />
              {state.phase === "completed"
                ? "Ended"
                : isClosed
                ? "Closed"
                : daysLeft === 0
                ? "Last day!"
                : `${daysLeft}d left`}
            </div>
          )}
          {!state.isEligible && state.ineligibleReasons && state.ineligibleReasons.length > 0 && (
            <span className="text-[9px] font-bold text-amber-600 max-w-[120px] text-right leading-tight truncate">
              {state.ineligibleReasons[0]}
            </span>
          )}
        </div>
      </div>

      {/* CTA button */}
      <div className="p-4 bg-background/30 border-t border-border-subtle group-hover:bg-surface/50 transition-colors">
        <button
          disabled={state.ctaDisabled}
          onClick={(e) => {
            e.stopPropagation();
            if (state.hasApplied && (state.phase === "ongoing" || state.phase === "completed")) {
              router.push("/progress");
            } else if (!state.ctaDisabled) {
              onCardClick(drive);
            }
          }}
          className={cn(
            "w-full py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all",
            state.ctaClass
          )}
        >
          {state.hasApplied && state.phase === "open" && <LuCircleCheck size={16} />}
          {state.ctaText}
          {state.phase === "open" && !state.hasApplied && state.isEligible && <LuArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
});
