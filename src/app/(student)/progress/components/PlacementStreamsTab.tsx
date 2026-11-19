"use client";

import React from "react";
import { LuSearch, LuBuilding2 } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { ApplicationProgress, DateModalData } from "../types";
import { PipelineCard } from "./PipelineCard";

interface PlacementStreamsTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredApps: ApplicationProgress[];
  expandedOfferId: string | null;
  setExpandedOfferId: React.Dispatch<React.SetStateAction<string | null>>;
  acceptedOffers: Record<string, boolean>;
  completedActions: Record<string, boolean>;
  onToggleActionItem: (actionKey: string) => void;
  onOpenDateModal: (data: DateModalData) => void;
  onAcceptOffer: (app: ApplicationProgress) => void;
}

export function PlacementStreamsTab({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  filteredApps,
  expandedOfferId,
  setExpandedOfferId,
  acceptedOffers,
  completedActions,
  onToggleActionItem,
  onOpenDateModal,
  onAcceptOffer,
}: PlacementStreamsTabProps) {
  return (
    <>
      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between sticky -top-4 md:-top-6 z-30 bg-background/95 backdrop-blur-md py-2.5 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 w-full lg:w-auto no-scrollbar">
          {["All", "Applied", "In Review", "Shortlisted", "Offered", "Accepted", "Not Selected"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                  activeTab === tab
                    ? "bg-foreground text-white shadow-tactile scale-105"
                    : "bg-surface border border-border-subtle text-muted hover:border-primary hover:text-primary"
                )}
              >
                {tab}
              </button>
            )
          )}
        </div>

        <div className="relative w-full lg:w-96 group">
          <LuSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search company or job role..."
            className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-border-subtle bg-surface shadow-soft focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Pipeline Cards Grid */}
      <div className="space-y-8">
        {filteredApps.map((app) => {
          const isOfferOpen = expandedOfferId === app.id;
          const isPlacedLocally =
            acceptedOffers[app.id] ||
            app.overallStatus === "Accepted" ||
            app.overallStatus === "Joined";

          return (
            <PipelineCard
              key={app.id}
              app={app}
              isOfferOpen={isOfferOpen}
              onToggleOffer={() => setExpandedOfferId(isOfferOpen ? null : app.id)}
              isPlacedLocally={isPlacedLocally}
              completedActions={completedActions}
              onToggleActionItem={onToggleActionItem}
              onOpenDateModal={onOpenDateModal}
              onAcceptOffer={onAcceptOffer}
            />
          );
        })}

        {filteredApps.length === 0 && (
          <div className="py-24 text-center app-card">
            <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6">
              <LuBuilding2 size={28} />
            </div>
            <h3 className="font-display text-2xl font-black tracking-tight text-foreground">
              No Pipelines Found
            </h3>
            <p className="text-muted mt-2 font-medium text-base">
              We couldn&apos;t find any applications in the {activeTab !== "All" ? `"${activeTab}"` : ""}{" "}
              stream.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
