"use client";

import {
  LuX,
  LuBuilding2,
  LuCalendar,
  LuMapPin,
  LuTrendingUp,
  LuGraduationCap,
  LuCircleAlert,
  LuHistory,
  LuCircleCheck,
  LuTriangleAlert,
  LuArrowRight,
  LuHeart,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Drive, ResolvedState, StudentInfo } from "./types";

interface DriveDetailModalProps {
  drive: Drive;
  state: ResolvedState;
  studentInfo: StudentInfo;
  isSaved: boolean;
  isApplying: boolean;
  onClose: () => void;
  onApply: (driveId: string) => void;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}

export function DriveDetailModal({
  drive,
  state,
  studentInfo,
  isSaved,
  isApplying,
  onClose,
  onApply,
  onToggleSave,
}: DriveDetailModalProps) {
  const router = useRouter();
  const isClosed = state.phase === "ongoing" || state.phase === "completed";

  const handleCtaClick = () => {
    if (state.hasApplied && (state.phase === "ongoing" || state.phase === "completed")) {
      onClose();
      router.push("/progress");
    } else if (state.phase === "open" && !state.hasApplied && state.isEligible) {
      onApply(drive.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-surface w-full max-w-2xl rounded-[40px] border border-border-subtle shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-8 border-b border-border-subtle flex items-start justify-between bg-background/50">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-3xl bg-background border border-border-subtle flex items-center justify-center shadow-sm p-4 overflow-hidden">
              {drive.companies?.logo_url?.startsWith("http") ? (
                <img src={drive.companies.logo_url} alt="" className="h-full w-full object-contain" />
              ) : (
                <LuBuilding2 size={40} style={{ color: drive.companies?.theme_color || "var(--primary)" }} />
              )}
            </div>
            <div>
              <h3 className="font-display text-3xl font-black tracking-tight">{drive.role_title}</h3>
              <p className="font-sans text-xl font-bold text-muted">{drive.companies?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-muted hover:text-primary transition-colors shadow-sm"
          >
            <LuX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
          {/* Package + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[24px] bg-background border border-border-subtle shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-2">
                <LuTrendingUp size={12} className="text-primary" />
                Package
              </p>
              <p className="font-display text-xl font-black text-primary">{drive.package_ctc}</p>
            </div>
            <div className="p-6 rounded-[24px] bg-background border border-border-subtle shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-2">
                <LuMapPin size={12} className="text-primary" />
                Location
              </p>
              <p className="font-display text-xl font-black">{drive.location}</p>
            </div>
          </div>

          {/* Application window */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[24px] bg-background border border-border-subtle shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-2">
                <LuCalendar size={12} className="text-primary" />
                Application Starts
              </p>
              <p className="font-display text-base font-black">
                {drive.application_start
                  ? new Date(drive.application_start).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Immediate"}
              </p>
            </div>
            <div className="p-6 rounded-[24px] bg-background border border-border-subtle shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-2">
                <LuCalendar size={12} className="text-primary" />
                Application Deadline
              </p>
              <p className="font-display text-base font-black text-red-500">
                {drive.application_end
                  ? new Date(drive.application_end).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Academic Standards */}
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">
              Mandatory Academic Standards
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* CGPA */}
              <div
                className={cn(
                  "p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all shadow-sm",
                  studentInfo.cgpa >= (drive.eligibility_rules?.min_cgpa || 0)
                    ? "bg-green-50/50 border-green-200"
                    : "bg-red-50/50 border-red-200"
                )}
              >
                <LuGraduationCap
                  size={24}
                  className={
                    studentInfo.cgpa >= (drive.eligibility_rules?.min_cgpa || 0)
                      ? "text-green-600"
                      : "text-red-600"
                  }
                />
                <div className="text-center">
                  <p className="text-xl font-black">{drive.eligibility_rules?.min_cgpa || "N/A"}+</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Min CGPA</p>
                </div>
              </div>

              {/* Backlogs */}
              <div
                className={cn(
                  "p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all shadow-sm",
                  studentInfo.backlogs <= (drive.eligibility_rules?.backlogs_allowed ?? 99)
                    ? "bg-green-50/50 border-green-200"
                    : "bg-red-50/50 border-red-200"
                )}
              >
                <LuCircleAlert
                  size={24}
                  className={
                    studentInfo.backlogs <= (drive.eligibility_rules?.backlogs_allowed ?? 99)
                      ? "text-green-600"
                      : "text-red-600"
                  }
                />
                <div className="text-center">
                  <p className="text-xl font-black">{drive.eligibility_rules?.backlogs_allowed ?? "Any"}</p>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Max Backlogs</p>
                </div>
              </div>

              {/* Arrears */}
              <div
                className={cn(
                  "p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all shadow-sm",
                  drive.eligibility_rules?.history_of_arrears === true || studentInfo.history_of_arrears === false
                    ? "bg-green-50/50 border-green-200"
                    : "bg-red-50/50 border-red-200"
                )}
              >
                <LuHistory
                  size={24}
                  className={
                    drive.eligibility_rules?.history_of_arrears === true ||
                    studentInfo.history_of_arrears === false
                      ? "text-green-600"
                      : "text-red-600"
                  }
                />
                <div className="text-center">
                  <p className="text-xl font-black">
                    {drive.eligibility_rules?.history_of_arrears ? "YES" : "NO"}
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Arrears OK</p>
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility Conclusion */}
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">
              Eligibility Conclusion
            </h5>
            <div
              className={cn(
                "p-6 rounded-[24px] border flex items-start gap-4",
                state.isEligible ? "bg-primary/5 border-primary/20" : "bg-amber-50 border-amber-200"
              )}
            >
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                  state.isEligible ? "bg-primary text-white" : "bg-amber-500 text-white"
                )}
              >
                {state.isEligible ? <LuCircleCheck size={28} /> : <LuTriangleAlert size={28} />}
              </div>
              <div>
                <p
                  className={cn(
                    "font-display text-xl font-bold tracking-tight",
                    state.isEligible ? "text-primary" : "text-amber-700"
                  )}
                >
                  {state.isEligible ? "Verification Successful" : "Eligibility Mismatch"}
                </p>
                <div className="mt-2 space-y-1">
                  {state.isEligible ? (
                    <p className="text-sm font-medium text-muted">
                      Your profile meets all the mandatory criteria for this drive.
                    </p>
                  ) : (
                    state.ineligibleReasons?.map((reason, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-amber-800">
                        <div className="h-1 w-1 rounded-full bg-amber-500" />
                        {reason}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-8 border-t border-border-subtle bg-background/50 flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(drive.id, e);
            }}
            className={cn(
              "flex-1 py-5 rounded-2xl border font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all bg-surface border-border-subtle text-muted hover:border-red-200 hover:text-red-500 shadow-sm",
              isSaved && "bg-red-50 border-red-200 text-red-500 hover:text-red-600 shadow-inner"
            )}
          >
            <LuHeart size={18} fill={isSaved ? "currentColor" : "none"} />
            {isSaved ? "Saved" : "Save"}
          </button>

          <div className="flex-[2.5]">
            <button
              onClick={handleCtaClick}
              disabled={state.ctaDisabled || isApplying}
              className={cn(
                "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-tactile transition-all",
                state.ctaDisabled
                  ? cn(state.ctaClass, "cursor-not-allowed shadow-none")
                  : "bg-primary text-white hover:shadow-hover hover:-translate-y-0.5 active:translate-y-0"
              )}
            >
              {isApplying ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {state.hasApplied && state.phase === "open" && <LuCircleCheck size={18} />}
                  {state.ctaText}
                  {state.phase === "open" && !state.hasApplied && state.isEligible && (
                    <LuArrowRight size={20} />
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
