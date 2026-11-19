"use client";

import { useState } from "react";
import { LuSearch, LuFilter, LuX, LuRotateCcw, LuCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { DEPARTMENTS, STATUSES } from "../types";

const SPECIALIZATIONS_LIST = [
  "Full Stack", "Frontend", "Backend", "AI/ML", "Data Science", 
  "Cloud & DevOps", "Cybersecurity", "Mobile Dev", "UI/UX", "Embedded/IoT"
];

const PREFERENCES_LIST = [
  "Core Technical", "IT / Software", "Consulting", "Finance / Fintech", 
  "Product Management", "Higher Studies", "Govt / PSU"
];

interface StagedFilters {
  minCgpa: number;
  maxCgpa: number;
  minLeetcode: number;
  specializations: string[];
  specializationMode: "any" | "all";
  depts: string[];
  status: string;
  company: string;
  interests: string[];
  interestMode: "any" | "all";
}

interface StudentFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  deptFilter: string;
  statusFilter: string;
  advancedFilters: {
    minCgpa: number;
    maxCgpa: number;
    minLeetcode: number;
    specialization: string;
    specializationMode: 'any' | 'all';
    company: string;
    interest: string;
    interestMode: 'any' | 'all';
  };
  onApplyFilters: (updates: Record<string, string>) => void;
  allCompanies: string[];
}

export function StudentFilters({
  search,
  onSearchChange,
  deptFilter,
  statusFilter,
  advancedFilters,
  onApplyFilters,
  allCompanies,
}: StudentFiltersProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [stagedFilters, setStagedFilters] = useState<StagedFilters>({
    minCgpa: 0,
    maxCgpa: 10,
    minLeetcode: 0,
    specializations: [],
    specializationMode: "any",
    depts: [],
    status: "All Statuses",
    company: "All Companies",
    interests: [],
    interestMode: "any",
  });

  const hasActiveFilters = (
    advancedFilters.minCgpa > 0 || 
    advancedFilters.minLeetcode > 0 || 
    advancedFilters.specialization !== "All Domains" || 
    deptFilter !== "All Departments" || 
    statusFilter !== "All Statuses" || 
    advancedFilters.company !== "All Companies" || 
    advancedFilters.interest !== "All Preferences"
  );

  const openFilterDrawer = () => {
    const depts = deptFilter === "All Departments" ? [] : deptFilter.split(',').map(d => d.trim()).filter(Boolean);
    const specializations = advancedFilters.specialization === "All Domains" ? [] : advancedFilters.specialization.split(',').map(s => s.trim()).filter(Boolean);
    const interests = advancedFilters.interest === "All Preferences" ? [] : advancedFilters.interest.split(',').map(i => i.trim()).filter(Boolean);
    
    setStagedFilters({
      minCgpa: advancedFilters.minCgpa,
      maxCgpa: advancedFilters.maxCgpa,
      minLeetcode: advancedFilters.minLeetcode,
      specializations,
      specializationMode: advancedFilters.specializationMode,
      depts,
      status: statusFilter,
      company: advancedFilters.company,
      interests,
      interestMode: advancedFilters.interestMode
    });
    setIsFilterDrawerOpen(true);
  };

  const handleApplyStagedFilters = () => {
    onApplyFilters({
      dept: stagedFilters.depts.length > 0 ? stagedFilters.depts.join(',') : '',
      status: stagedFilters.status !== "All Statuses" ? stagedFilters.status : '',
      minCgpa: stagedFilters.minCgpa > 0 ? stagedFilters.minCgpa.toString() : '',
      maxCgpa: stagedFilters.maxCgpa < 10 ? stagedFilters.maxCgpa.toString() : '',
      minLeetcode: stagedFilters.minLeetcode > 0 ? stagedFilters.minLeetcode.toString() : '',
      specialization: stagedFilters.specializations.length > 0 ? stagedFilters.specializations.join(',') : '',
      specializationMode: stagedFilters.specializationMode !== 'any' ? stagedFilters.specializationMode : '',
      company: stagedFilters.company !== "All Companies" ? stagedFilters.company : '',
      interest: stagedFilters.interests.length > 0 ? stagedFilters.interests.join(',') : '',
      interestMode: stagedFilters.interestMode !== 'any' ? stagedFilters.interestMode : ''
    });
    setIsFilterDrawerOpen(false);
  };

  const handleResetFilters = () => {
    setStagedFilters({
      minCgpa: 0,
      maxCgpa: 10,
      minLeetcode: 0,
      specializations: [],
      specializationMode: "any",
      depts: [],
      status: "All Statuses",
      company: "All Companies",
      interests: [],
      interestMode: "any"
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-10 relative">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, register number, or skills..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border-subtle bg-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <button 
            onClick={openFilterDrawer}
            className={cn(
              "w-full h-full py-3 flex items-center justify-center rounded-2xl border transition-all shadow-sm text-sm font-bold gap-2",
              hasActiveFilters 
                ? "bg-primary/5 border-primary text-primary" 
                : "bg-surface border-border-subtle text-muted hover:bg-background"
            )}
          >
            <LuFilter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Filter Drawer */}
      {isFilterDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsFilterDrawerOpen(false); }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-drawer-title"
            className="w-full max-w-md bg-surface h-full shadow-2xl flex flex-col justify-between border-l border-border-subtle animate-in slide-in-from-right duration-300"
          >
            {/* Header */}
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 id="filters-drawer-title" className="text-lg font-black tracking-tight">Candidate Filters</h3>
                <p className="text-xs text-muted font-medium">Fine-tune candidates by criteria</p>
              </div>
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                aria-label="Close filters"
                className="h-8 w-8 rounded-full hover:bg-background flex items-center justify-center text-muted hover:text-foreground transition-colors"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Department */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">Departments</label>
                <div className="flex flex-wrap gap-1.5">
                  {DEPARTMENTS.filter(d => d !== "All Departments").map((dept) => {
                    const isSelected = stagedFilters.depts.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setStagedFilters(prev => ({
                            ...prev,
                            depts: isSelected ? prev.depts.filter(d => d !== dept) : [...prev.depts, dept]
                          }));
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                            : "bg-background border-border-subtle text-muted hover:text-foreground"
                        )}
                      >
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">Placement Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStagedFilters(prev => ({ ...prev, status }))}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left",
                        stagedFilters.status === status
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border-subtle text-muted hover:text-foreground"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* CGPA Range */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted">Minimum CGPA</label>
                  <span className="text-xs font-black text-primary">{stagedFilters.minCgpa.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  step="0.1" 
                  value={stagedFilters.minCgpa}
                  onChange={(e) => setStagedFilters(prev => ({ ...prev, minCgpa: parseFloat(e.target.value) }))}
                  className="w-full accent-primary"
                />
              </div>

              {/* LeetCode Solved */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted">Min LeetCode Solved</label>
                  <span className="text-xs font-black text-primary">{stagedFilters.minLeetcode}+</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  step="25" 
                  value={stagedFilters.minLeetcode}
                  onChange={(e) => setStagedFilters(prev => ({ ...prev, minLeetcode: parseInt(e.target.value) }))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Specializations */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted">Domains & Skills</label>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setStagedFilters(prev => ({ ...prev, specializationMode: 'any' }))}
                      className={cn("px-2 py-0.5 rounded", stagedFilters.specializationMode === 'any' ? "bg-primary/10 text-primary" : "text-muted")}
                    >
                      Any
                    </button>
                    <button
                      type="button"
                      onClick={() => setStagedFilters(prev => ({ ...prev, specializationMode: 'all' }))}
                      className={cn("px-2 py-0.5 rounded", stagedFilters.specializationMode === 'all' ? "bg-primary/10 text-primary" : "text-muted")}
                    >
                      All
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALIZATIONS_LIST.map((spec) => {
                    const isSelected = stagedFilters.specializations.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => {
                          setStagedFilters(prev => ({
                            ...prev,
                            specializations: isSelected ? prev.specializations.filter(s => s !== spec) : [...prev.specializations, spec]
                          }));
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-xl text-xs font-medium border transition-all",
                          isSelected ? "bg-primary text-primary-foreground border-primary font-bold" : "bg-background border-border-subtle text-muted hover:text-foreground"
                        )}
                      >
                        {spec}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border-subtle bg-background/50 flex gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-3 px-4 rounded-xl border border-border-subtle text-xs font-bold text-muted hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
              >
                <LuRotateCcw size={14} />
                Reset
              </button>
              <button
                type="button"
                onClick={handleApplyStagedFilters}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-tactile hover:bg-primary-dark transition-all flex items-center justify-center gap-1.5"
              >
                <LuCheck size={14} />
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
