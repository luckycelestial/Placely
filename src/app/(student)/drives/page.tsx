"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { LuSearch, LuFilter, LuChevronDown } from "react-icons/lu";
import { db } from "@/services/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Sk } from "@/components/ui/skeleton";
import { DEV_STUDENT_ID } from "@/lib/dev-config";

import { type Drive, type DriveFilters, type StudentInfo, type StudentProfileRecord, type StudentAcademicRecord, resolveDriveState } from "./types";
import { DriveCard } from "./drive-card";
import { DriveDetailModal } from "./drive-detail-modal";
import { FilterDrawer } from "./filter-drawer";

// ---------- Constants ----------
const STUDENT_ID = DEV_STUDENT_ID;
const DUMMY_STUDENT: StudentInfo = {
  branch: "CSE",
  cgpa: 8.2,
  backlogs: 0,
  history_of_arrears: false,
};

const DEFAULT_FILTERS: DriveFilters = {
  eligibility: "All",
  phase: "All",
  location: "All",
  minCtc: 0,
};

function parseLPA(pkg: string): number {
  const clean = pkg.toLowerCase();
  if (clean.includes("month")) {
    const num = parseFloat(clean.replace(/[^0-9.]/g, ""));
    return isNaN(num) ? 0 : (num * 12) / 100000;
  }
  if (clean.includes("lakh")) {
    const num = parseFloat(clean.replace(/[^0-9.]/g, ""));
    return isNaN(num) ? 0 : num;
  }
  const match = clean.match(/([0-9.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

// ---------- Page ----------
export default function JobDrivesPage() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [appliedDriveIds, setAppliedDriveIds] = useState<Set<string>>(new Set());
  const [studentProfile, setStudentProfile] = useState<StudentProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [savedDrives, setSavedDrives] = useState<string[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [stagedFilters, setStagedFilters] = useState<DriveFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<DriveFilters>(DEFAULT_FILTERS);
  const [isPlacementLocked, setIsPlacementLocked] = useState(false);

  useEffect(() => {
    loadDrives();
  }, []);

  // ---------- Derived student info ----------
  const getStudentInfo = useCallback((): StudentInfo => {
    const acadRecord = Array.isArray(studentProfile?.student_academics)
      ? studentProfile?.student_academics[0]
      : studentProfile?.student_academics;
    const acad: StudentAcademicRecord = acadRecord || {};
    return {
      branch: studentProfile?.department || DUMMY_STUDENT.branch,
      cgpa: parseFloat(String(acad.cgpa || DUMMY_STUDENT.cgpa)),
      backlogs: acad.active_arrears !== undefined ? acad.active_arrears : DUMMY_STUDENT.backlogs,
      history_of_arrears:
        acad.history_of_arrears !== undefined
          ? acad.history_of_arrears
          : DUMMY_STUDENT.history_of_arrears,
      isPlacementLocked,
    };
  }, [studentProfile, isPlacementLocked]);

  // ---------- Data loading ----------
  const loadDrives = async () => {
    try {
      const [data, appliedIds, profile] = await Promise.all([
        db.getDrives(),
        db.getStudentAppliedDriveIds(STUDENT_ID),
        db.getStudentProfile(STUDENT_ID).catch(() => null),
      ]);

      setStudentProfile(profile);

      // Resolve placement lock from student_preferences.work_mode_preference
      let locked = false;
      try {
        const rawPref = (profile?.student_preferences as any)?.[0]?.work_mode_preference
          || (profile?.student_preferences as any)?.work_mode_preference
          || '';
        if (typeof rawPref === 'string' && rawPref.trim().startsWith('{')) {
          const map = JSON.parse(rawPref);
          locked = map['placement_lock'] === 'Active';
        }
      } catch (e) { /* ignore parse errors */ }
      setIsPlacementLocked(locked);

      const acad =
        (profile?.student_academics as any)?.[0] || profile?.student_academics || {};
      const studentInfo: StudentInfo = {
        branch: profile?.department || DUMMY_STUDENT.branch,
        cgpa: parseFloat(acad.cgpa || String(DUMMY_STUDENT.cgpa)),
        backlogs:
          acad.active_arrears !== undefined ? acad.active_arrears : DUMMY_STUDENT.backlogs,
        history_of_arrears:
          acad.history_of_arrears !== undefined
            ? acad.history_of_arrears
            : DUMMY_STUDENT.history_of_arrears,
        isPlacementLocked: locked,
        registerNumber: profile?.register_number || '',
        id: STUDENT_ID,
      };

      const processedDrives = (data || []).map((drive: any) => {
        const rules = drive.eligibility_rules || {};
        const ineligibleReasons: string[] = [];
        if (rules.branches && rules.branches.length > 0 && !rules.branches.includes(studentInfo.branch))
          ineligibleReasons.push(`Not open to ${studentInfo.branch} branch`);
        if (rules.min_cgpa && studentInfo.cgpa < rules.min_cgpa)
          ineligibleReasons.push(`CGPA too low (Requires ${rules.min_cgpa}+)`);
        if (rules.backlogs_allowed !== undefined && studentInfo.backlogs > rules.backlogs_allowed)
          ineligibleReasons.push(`Too many backlogs (Max ${rules.backlogs_allowed})`);
        if (rules.history_of_arrears === false && studentInfo.history_of_arrears === true)
          ineligibleReasons.push("Drive requires no history of arrears");
        return { ...drive, isEligible: ineligibleReasons.length === 0, ineligibleReasons };
      });

      setDrives(processedDrives);
      setAppliedDriveIds(new Set(appliedIds));
    } catch (err) {
      console.error("Failed to load drives", err);
      toast.error("Failed to load job drives");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Apply to drive ----------
  const handleApply = async (driveId: string) => {
    const activeStudentId = (typeof window !== 'undefined' && localStorage.getItem('active_student_id')) || STUDENT_ID;
    const drive = drives.find(d => d.id === driveId);
    const bypassList = drive?.eligibility_rules?.bypass_placement_lock_students || [];
    const isBypassed = bypassList.includes(studentProfile?.register_number || '') || (activeStudentId && bypassList.includes(activeStudentId));

    if (isPlacementLocked && !isBypassed) {
      toast.error('Your Placement Lock is Active. You cannot apply to new drives.');
      return;
    }
    setIsApplying(true);
    try {
      await db.applyToDrive(activeStudentId, driveId);
      setAppliedDriveIds((prev) => new Set([...prev, driveId]));
      toast.success("Application submitted successfully!");
      setSelectedDrive(null);
    } catch (err: any) {
      console.error("Failed to apply:", err);
      toast.error(err?.message || err?.details || "Failed to submit application");
    } finally {
      setIsApplying(false);
    }
  };

  // ---------- Memoized filter pipeline ----------
  const filteredDrives = useMemo(() => {
    const studentInfo = getStudentInfo();
    return drives.filter((drive) => {
      const state = resolveDriveState(drive, appliedDriveIds, studentInfo);
      const matchesSearch =
        drive.companies?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drive.role_title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || drive.drive_type === activeCategory;
      const matchesEligibility =
        appliedFilters.eligibility === "All"
          ? true
          : appliedFilters.eligibility === "Eligible"
          ? state.isEligible
          : !state.isEligible;
      const matchesPhase =
        appliedFilters.phase === "All" ? true : state.phase === appliedFilters.phase;
      const matchesLocation =
        appliedFilters.location === "All"
          ? true
          : drive.location.toLowerCase().includes(appliedFilters.location.toLowerCase());
      const matchesCtc =
        appliedFilters.minCtc > 0 ? parseLPA(drive.package_ctc) >= appliedFilters.minCtc : true;
      return matchesSearch && matchesCategory && matchesEligibility && matchesPhase && matchesLocation && matchesCtc;
    });
  }, [drives, appliedDriveIds, searchQuery, activeCategory, appliedFilters, getStudentInfo]);

  // ---------- Stable callbacks ----------
  const toggleSave = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedDrives((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }, []);

  const handleCardClick = useCallback((drive: Drive) => setSelectedDrive(drive), []);

  const hasActiveFilters =
    appliedFilters.eligibility !== "All" ||
    appliedFilters.phase !== "All" ||
    appliedFilters.location !== "All" ||
    appliedFilters.minCtc > 0;

  // Derive state for selected drive modal
  const studentInfo = getStudentInfo();
  const selectedDriveState = selectedDrive
    ? resolveDriveState(selectedDrive, appliedDriveIds, studentInfo)
    : null;

  return (
    <div className="pt-2 pb-10 px-4 max-w-7xl mx-auto min-h-screen relative">
      {/* Hero */}
      <section className="flex flex-col gap-4 mb-10">
        <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
          Job <span className="text-primary">Drives.</span>
        </h2>
        <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed">
          Discover and apply to the most exclusive placement opportunities tailored for your profile.
        </p>
      </section>

      {/* Sticky search + category bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky -top-4 md:-top-6 z-30 bg-background/95 backdrop-blur-md py-2.5 mb-8">
        <div className="relative w-full md:w-96 group">
          <LuSearch
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors"
            size={18}
          />
          <input
            type="text"
            placeholder="Search companies or roles..."
            className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-border-subtle bg-surface shadow-soft focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 w-full md:w-auto no-scrollbar">
          {["All", "Full-time", "Internship", "Contract", "Intern + Full-time"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeCategory === category
                  ? "bg-primary text-white shadow-tactile scale-105"
                  : "bg-surface border border-border-subtle text-muted hover:border-primary hover:text-primary"
              )}
            >
              {category}
            </button>
          ))}
          <button
            onClick={() => {
              setStagedFilters(appliedFilters);
              setIsFilterDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-surface border border-border-subtle text-[10px] font-black uppercase tracking-widest text-muted hover:border-primary hover:text-primary transition-all"
          >
            <LuFilter size={14} />
            Filters
            {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
            <LuChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Drive grid */}
      <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array(6)
              .fill(0)
              .map((_, i) => <Sk.DriveCard key={i} />)
          : filteredDrives.map((drive) => {
              const state = resolveDriveState(drive, appliedDriveIds, studentInfo);
              const isSaved = savedDrives.includes(drive.id);
              return (
                <DriveCard
                  key={drive.id}
                  drive={drive}
                  state={state}
                  isSaved={isSaved}
                  onToggleSave={toggleSave}
                  onCardClick={handleCardClick}
                />
              );
            })}
      </div>

      {/* Empty state */}
      {filteredDrives.length === 0 && !loading && (
        <div className="py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6">
            <LuSearch size={32} />
          </div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">No drives found</h3>
          <p className="text-muted mt-2 font-medium">
            Try adjusting your search or filters to find more opportunities.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("All");
            }}
            className="mt-8 text-xs font-black uppercase tracking-widest text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Drive detail modal */}
      {selectedDrive && selectedDriveState && (
        <DriveDetailModal
          drive={selectedDrive}
          state={selectedDriveState}
          studentInfo={studentInfo}
          isSaved={savedDrives.includes(selectedDrive.id)}
          isApplying={isApplying}
          onClose={() => setSelectedDrive(null)}
          onApply={handleApply}
          onToggleSave={toggleSave}
        />
      )}

      {/* Filter drawer */}
      {isFilterDrawerOpen && (
        <FilterDrawer
          stagedFilters={stagedFilters}
          appliedFilters={appliedFilters}
          onChangeStagedFilters={setStagedFilters}
          onApply={(filters) => {
            setAppliedFilters(filters);
            setIsFilterDrawerOpen(false);
          }}
          onClose={() => setIsFilterDrawerOpen(false)}
        />
      )}
    </div>
  );
}
