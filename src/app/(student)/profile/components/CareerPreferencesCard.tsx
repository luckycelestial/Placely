"use client";

import React from "react";
import {
  LuBriefcase,
  LuActivity,
  LuMapPin,
  LuLayers,
  LuBadgeCheck,
  LuUser,
  LuArrowRight,
  LuSettings,
  LuCircleCheck,
} from "react-icons/lu";
import { ProfileSection } from "@/components/student/profile-section";
import { DetailItem } from "./ProfileUiPrimitives";
import { type CustomGroup } from "@/services/settings";
import { getBatchRangeFromYear } from "@/lib/batch-utils";
import { cn } from "@/lib/utils";

interface CareerPreferencesCardProps {
  student: any;
  preferredRoles: string[];
  preferredLocations: string[];
  placementInterest: string;
  setPlacementInterest: (val: string) => void;
  prefRolesInput: string;
  setPrefRolesInput: (val: string) => void;
  prefLocationsInput: string;
  setPrefLocationsInput: (val: string) => void;
  customGroups: CustomGroup[];
  selectedDomains: string[];
  setSelectedDomains: React.Dispatch<React.SetStateAction<string[]>>;
  placementGroup: string;
  isEditingPrefs: boolean;
  setIsEditingPrefs: (val: boolean) => void;
  isSavingPrefs: boolean;
  handleSavePrefs: () => void;
  handleCancelPrefs: () => void;
}

export function CareerPreferencesCard({
  student,
  preferredRoles,
  preferredLocations,
  placementInterest,
  setPlacementInterest,
  prefRolesInput,
  setPrefRolesInput,
  prefLocationsInput,
  setPrefLocationsInput,
  customGroups,
  selectedDomains,
  setSelectedDomains,
  placementGroup,
  isEditingPrefs,
  setIsEditingPrefs,
  isSavingPrefs,
  handleSavePrefs,
  handleCancelPrefs,
}: CareerPreferencesCardProps) {
  return (
    <ProfileSection
      title="Placement Preferences"
      description="Career Strategy"
      actions={
        isEditingPrefs ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelPrefs}
              disabled={isSavingPrefs}
              className="bg-surface hover:bg-background border border-border-subtle text-muted hover:text-foreground rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePrefs}
              disabled={isSavingPrefs}
              className="bg-primary hover:bg-primary-dark text-white rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,56,60,0.2)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSavingPrefs ? (
                <>
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <LuCircleCheck size={12} />
                  Save
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingPrefs(true)}
            className="bg-primary hover:bg-primary-dark text-white rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_20px_rgba(255,56,60,0.2)] flex items-center gap-2 cursor-pointer"
          >
            <LuSettings size={12} />
            Edit
          </button>
        )
      }
    >
      {!isEditingPrefs ? (
        <div className="space-y-8 mt-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {preferredRoles.length > 0 ? (
              <DetailItem value={preferredRoles.join(" / ")} icon={LuBriefcase} />
            ) : (
              <div className="flex items-center gap-4 bg-background/50 rounded-3xl p-5 border border-dashed border-border-subtle">
                <div className="h-10 w-10 rounded-xl bg-muted/15 flex items-center justify-center text-muted flex-shrink-0">
                  <LuBriefcase size={20} />
                </div>
                <p className="text-sm text-muted font-bold">No preferred roles selected</p>
              </div>
            )}
            <DetailItem value={`Interest: ${placementInterest}`} icon={LuActivity} />
            {preferredLocations.length > 0 ? (
              <DetailItem value={preferredLocations.join(", ")} icon={LuMapPin} />
            ) : (
              <div className="flex items-center gap-4 bg-background/50 rounded-3xl p-5 border border-dashed border-border-subtle">
                <div className="h-10 w-10 rounded-xl bg-muted/15 flex items-center justify-center text-muted flex-shrink-0">
                  <LuMapPin size={20} />
                </div>
                <p className="text-sm text-muted font-bold">No preferred locations selected</p>
              </div>
            )}

            {/* Dynamic Groups/Domains in identical boxes */}
            {customGroups.map((group) => {
              if (group.type === "student_selectable") {
                const selectedInGroup = group.options.filter((opt) => selectedDomains.includes(opt));
                const displayValue =
                  selectedInGroup.length > 0 ? selectedInGroup.join(" / ") : "None selected";
                return (
                  <DetailItem
                    key={group.id}
                    value={`${group.name}: ${displayValue}`}
                    icon={LuLayers}
                  />
                );
              } else {
                let assignedOpt = "";
                if (group.id === "departments") {
                  assignedOpt = student?.department || "";
                } else if (group.id === "batches") {
                  const range = getBatchRangeFromYear(student?.year);
                  assignedOpt = range ? `${range.startYear}-${range.endYear}` : student?.year || "";
                } else if (placementGroup) {
                  if (placementGroup.trim().startsWith("{")) {
                    try {
                      const parsed = JSON.parse(placementGroup);
                      assignedOpt = parsed[group.id] || "";
                    } catch (e) {}
                  } else if (group.id === "placement_groups" || group.id === "placement_group") {
                    assignedOpt = placementGroup;
                  }
                }
                const displayValue = assignedOpt || "Unassigned";
                return (
                  <DetailItem
                    key={group.id}
                    value={`${group.name}: ${displayValue}`}
                    icon={LuBadgeCheck}
                  />
                );
              }
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-8 mt-4 animate-in fade-in duration-300">
          <div className="grid gap-6 md:grid-cols-3 bg-background/50 border border-border-subtle p-6 rounded-3xl">
            {/* Preferred Roles Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                <LuBriefcase size={12} /> Preferred Job Roles
              </label>
              <input
                type="text"
                value={prefRolesInput}
                onChange={(e) => setPrefRolesInput(e.target.value)}
                placeholder="e.g. SDE, Full Stack, Frontend Developer"
                className="w-full bg-background border border-border-subtle rounded-2xl py-4 px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <p className="text-[10px] text-muted-foreground/60 font-medium">
                Use commas to separate multiple roles.
              </p>
            </div>

            {/* Placement Interest Dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                <LuActivity size={12} /> Placement Interest
              </label>
              <div className="relative">
                <select
                  value={placementInterest}
                  onChange={(e) => setPlacementInterest(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-2xl py-4 pl-4 pr-10 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer appearance-none"
                >
                  <option value="Interested">Interested</option>
                  <option value="Not Interested: Higher Studies">Not Interested: Higher Studies</option>
                  <option value="Not Interested: Entrepreneurship">Not Interested: Entrepreneurship</option>
                  <option value="Not Interested">Not Interested</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                  <LuArrowRight size={16} className="rotate-90" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60 font-medium">
                Participation in campus placement drives.
              </p>
            </div>

            {/* Preferred Locations Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                <LuMapPin size={12} /> Preferred Locations
              </label>
              <input
                type="text"
                value={prefLocationsInput}
                onChange={(e) => setPrefLocationsInput(e.target.value)}
                placeholder="e.g. Bangalore, Mumbai, Remote"
                className="w-full bg-background border border-border-subtle rounded-2xl py-4 px-4 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <p className="text-[10px] text-muted-foreground/60 font-medium">
                Use commas to separate multiple locations.
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 bg-background/50 border border-border-subtle p-6 rounded-3xl">
            {customGroups.map((group) => {
              if (group.type === "student_selectable") {
                return (
                  <div key={group.id} className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                      <LuLayers size={12} /> {group.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const isSelected = selectedDomains.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedDomains(selectedDomains.filter((o) => o !== option));
                              } else {
                                setSelectedDomains([...selectedDomains, option]);
                              }
                            }}
                            className={cn(
                              "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                              isSelected
                                ? "bg-primary text-white border-primary shadow-tactile"
                                : "bg-surface text-muted border-border-subtle hover:border-primary/30"
                            )}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 font-medium">
                      Toggle options to choose your specializations.
                    </p>
                  </div>
                );
              } else {
                let currentAssigned = "";
                if (group.id === "departments") {
                  currentAssigned = student?.department || "";
                } else if (group.id === "batches") {
                  const range = getBatchRangeFromYear(student?.year);
                  currentAssigned = range ? `${range.startYear}-${range.endYear}` : student?.year || "";
                } else if (placementGroup) {
                  if (placementGroup.trim().startsWith("{")) {
                    try {
                      const parsed = JSON.parse(placementGroup);
                      currentAssigned = parsed[group.id] || "";
                    } catch (e) {}
                  } else if (group.id === "placement_groups" || group.id === "placement_group") {
                    currentAssigned = placementGroup;
                  }
                }
                return (
                  <div key={group.id} className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-1.5">
                      <LuUser size={12} /> {group.name}
                    </label>
                    <div className="relative">
                      <select
                        disabled
                        value={currentAssigned}
                        className="w-full bg-slate-100/50 border border-border-subtle rounded-2xl py-4 pl-4 pr-10 text-sm font-semibold text-muted focus:outline-none appearance-none cursor-not-allowed"
                      >
                        <option value="">Unassigned</option>
                        {group.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/30">
                        <LuArrowRight size={16} className="rotate-90" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 font-medium italic">
                      Managed by administrator.
                    </p>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </ProfileSection>
  );
}
