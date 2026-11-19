"use client";

import React from "react";
import {
  LuCircle,
  LuChevronRight,
  LuTarget,
  LuCircleCheck,
  LuX,
  LuInfo,
  LuIndianRupee,
  LuShieldCheck,
  LuClock,
  LuPartyPopper,
  LuTimer,
  LuSparkles,
  LuArrowRight,
  LuMapPin,
  LuAward,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { ApplicationProgress, DateModalData } from "../types";
import { Milestone } from "./ProgressModals";

interface PipelineCardProps {
  app: ApplicationProgress;
  isOfferOpen: boolean;
  onToggleOffer: () => void;
  isPlacedLocally: boolean;
  completedActions: Record<string, boolean>;
  onToggleActionItem: (actionKey: string) => void;
  onOpenDateModal: (data: DateModalData) => void;
  onAcceptOffer: (app: ApplicationProgress) => void;
}

export function PipelineCard({
  app,
  isOfferOpen,
  onToggleOffer,
  isPlacedLocally,
  completedActions,
  onToggleActionItem,
  onOpenDateModal,
  onAcceptOffer,
}: PipelineCardProps) {
  const hasOffer = app.offer !== undefined;

  return (
    <div
      className={cn(
        "app-card p-8 transition-all relative overflow-hidden group border",
        isOfferOpen
          ? "border-primary shadow-2xl shadow-primary/5 ring-4 ring-primary/5 bg-primary/[0.01]"
          : "hover:border-primary/20",
        isPlacedLocally && "border-emerald-500/30 bg-emerald-500/[0.005]"
      )}
    >
      {isPlacedLocally && (
        <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">
            Secured
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-subtle/50">
        <div className="flex items-center gap-6">
          <div className="shrink-0 transition-transform group-hover:scale-105">
            <CompanyLogo name={app.company} size={64} rounded="rounded-2xl" />
          </div>
          <div>
            <h3 className="font-display text-2xl font-black tracking-tight">{app.company}</h3>
            <p className="font-sans text-sm font-bold text-muted uppercase tracking-widest mt-1 flex items-center gap-1.5">
              {app.role}
              <span className="h-1 w-1 rounded-full bg-muted/40" />
              <span className="text-primary tracking-normal font-black flex items-center gap-0.5">
                <LuIndianRupee size={12} />
                {app.ctc}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-start md:self-center">
          <div className="text-left md:text-right">
            <span
              className={cn(
                "px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest",
                isPlacedLocally
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/15"
                  : app.overallStatus === "Not Selected"
                  ? "bg-red-500/10 text-red-500 border border-red-500/15"
                  : app.overallStatus === "Offered"
                  ? "bg-purple-500/15 text-purple-600 border border-purple-500/20 animate-pulse"
                  : "bg-primary/10 text-primary border border-primary/15"
              )}
            >
              {isPlacedLocally ? (
                <>
                  <LuShieldCheck size={12} />
                  Accepted Offer
                </>
              ) : (
                <>
                  <LuClock size={12} />
                  {app.overallStatus}
                </>
              )}
            </span>
          </div>

          {hasOffer && (
            <button
              onClick={onToggleOffer}
              className={cn(
                "btn px-5 py-3 h-auto text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer",
                isOfferOpen
                  ? "bg-foreground text-white hover:bg-foreground/95"
                  : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white"
              )}
            >
              <LuAward size={14} />
              {isOfferOpen ? "Close Details" : "View Offer & Onboarding"}
            </button>
          )}

          {!hasOffer && app.overallStatus !== "Not Selected" && (
            <button className="btn-secondary px-5 py-3 h-auto text-[9px] font-black uppercase tracking-widest rounded-xl cursor-pointer">
              Prepare Now
            </button>
          )}
        </div>
      </div>

      <div className="pt-6">
        <p className="text-[10px] font-black text-muted/50 uppercase tracking-[0.2em] mb-4">
          Recruitment Stages Log
        </p>
        <div className="relative overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth flex items-center gap-0 w-full select-none">
          {app.events.map((event, idx) => {
            const isCompleted =
              event.status === "Completed" || (isPlacedLocally && idx === app.events.length - 1);
            const isCurrent = event.status === "Current" && !isPlacedLocally;
            const isRejected = event.status === "Rejected";
            const isSkipped = event.status === "Skipped";

            return (
              <div
                key={event.id}
                className={cn("flex items-center shrink-0", isSkipped && "opacity-30")}
              >
                <div className="flex flex-col items-center text-center relative z-10 w-32 px-2">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full border-4 border-background flex items-center justify-center relative transition-all duration-300 shadow-sm",
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-primary text-white shadow-tactile animate-pulse scale-105"
                        : isRejected
                        ? "bg-red-500 text-white"
                        : isSkipped
                        ? "bg-surface/30 border-2 border-dashed border-border-subtle/50 text-muted/30"
                        : "bg-surface border-border-subtle text-muted"
                    )}
                  >
                    {isCompleted ? (
                      <LuCircleCheck size={18} />
                    ) : isCurrent ? (
                      <LuTarget size={18} />
                    ) : isRejected ? (
                      <LuX size={18} />
                    ) : isSkipped ? (
                      <span className="text-xs font-semibold select-none">—</span>
                    ) : (
                      <LuCircle size={14} />
                    )}
                  </div>

                  <span className="text-[9px] font-black text-muted/60 uppercase tracking-widest mt-2 leading-none">
                    {event.date}
                  </span>
                  <span
                    className={cn(
                      "font-display text-xs font-black tracking-tight mt-1 truncate max-w-[110px] block leading-snug",
                      isCurrent ? "text-primary font-black" : "text-foreground"
                    )}
                  >
                    {isPlacedLocally && idx === app.events.length - 1 ? "Offer Secured" : event.title}
                  </span>
                </div>

                {idx < app.events.length - 1 && (
                  <div
                    className={cn(
                      "h-[2px] w-20 mx-1 self-center rounded-full mt-[-24px] shrink-0",
                      isCompleted
                        ? "bg-emerald-500"
                        : event.status === "Skipped" ||
                          event.status === "Rejected" ||
                          app.events[idx + 1]?.status === "Skipped"
                        ? "bg-border-subtle/30"
                        : "bg-border-subtle"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isOfferOpen && app.offer && (
        <div className="mt-8 border-t border-border-subtle/80 pt-8 animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-foreground text-white rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary-light border border-primary/30 text-[10px] font-black uppercase tracking-widest">
                    {app.offer.type}
                  </span>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Issued {app.offer.offerDate}
                  </span>
                </div>

                <h4 className="font-display text-3xl font-black tracking-tighter">
                  Official Offer & <span className="text-primary">Roadmap.</span>
                </h4>

                <p className="font-sans text-base text-white/60 leading-relaxed max-w-xl">
                  {app.offer.description}
                </p>

                <div className="pt-8 border-t border-white/10 space-y-6">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <LuTimer className="text-primary" />
                    Onboarding Milestones
                  </h5>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Milestone
                      icon={<LuPartyPopper />}
                      label="Offer Released"
                      date={app.offer.offerDate}
                      completed
                    />
                    <Milestone
                      icon={<LuCircleCheck />}
                      label="Acceptance"
                      date={isPlacedLocally ? "Accepted" : "Pending"}
                      active={!isPlacedLocally}
                      completed={isPlacedLocally}
                    />
                    <Milestone
                      icon={<LuShieldCheck />}
                      label="Verification"
                      date={isPlacedLocally ? "Complete" : "Awaiting Sign"}
                      completed={isPlacedLocally}
                    />
                    <Milestone icon={<LuMapPin />} label="Joining Day" date={app.offer.joiningDate} />
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            </div>

            <div className="lg:col-span-5 space-y-6 h-full">
              <div className="bg-surface border border-border-subtle p-8 rounded-3xl flex flex-col justify-between min-h-[320px]">
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-6 flex items-center gap-2">
                    <LuSparkles className="text-primary" />
                    Required Onboarding Actions
                  </h5>

                  <div className="space-y-3">
                    {app.offer?.actionsRequired.map((action, i) => {
                      const actionKey = `${app.id}-${action}`;
                      const isItemChecked =
                        completedActions[actionKey] ||
                        (action === "Accept Offer" && isPlacedLocally) ||
                        (action === "Choose Joining Date Slot" && app.offer?.dbJoiningDate);

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (action === "Choose Joining Date Slot") {
                              onOpenDateModal({
                                appId: app.id,
                                companyId: app.offer?.companyId || "",
                                driveId: app.driveId || "",
                                roleTitle: app.role,
                                packageCtc: app.ctc,
                                currentDate: app.offer?.dbJoiningDate,
                              });
                            } else {
                              onToggleActionItem(actionKey);
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all group/action cursor-pointer select-none",
                            isItemChecked
                              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
                              : "border-border-subtle bg-background/50 hover:bg-background"
                          )}
                        >
                          <span
                            className={cn(
                              "font-sans text-xs font-bold transition-all",
                              isItemChecked ? "line-through opacity-70" : "text-foreground"
                            )}
                          >
                            {action}
                          </span>
                          {isItemChecked ? (
                            <LuCircleCheck size={18} className="text-emerald-500" />
                          ) : (
                            <LuChevronRight
                              size={18}
                              className="text-muted/40 group-hover/action:text-primary transition-all translate-x-0 group-hover/action:translate-x-1"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {!isPlacedLocally ? (
                  <button
                    onClick={() => onAcceptOffer(app)}
                    className="btn-primary w-full py-4 rounded-2xl mt-6 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest cursor-pointer"
                  >
                    Sign & Accept Offer
                    <LuArrowRight size={16} />
                  </button>
                ) : (
                  <div className="mt-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-center font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <LuCircleCheck size={16} />
                    Offer Secured
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border-subtle p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex gap-4 items-center">
              <div className="h-12 w-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                <LuInfo size={24} />
              </div>
              <div>
                <h6 className="font-display text-base font-black leading-tight">Offer Discrepancy?</h6>
                <p className="font-sans text-xs font-medium text-muted mt-1">
                  If the terms don&apos;t match what you discussed during your rounds, raise a query with our
                  placement office.
                </p>
              </div>
            </div>
            <button className="btn-secondary whitespace-nowrap px-6 py-3 h-auto text-[9px] uppercase tracking-widest self-stretch sm:self-auto rounded-xl cursor-pointer">
              Raise Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
