"use client";
import { Sk } from "@/components/ui/skeleton";

import { useEffect, useState } from "react";
import {
  LuMapPin,
  LuCalendar,
  LuArrowRight,
  LuSearch,
  LuFilter,
  LuChevronDown,
  LuHeart,
  LuX,
  LuCircleCheck,
  LuTriangleAlert,
  LuBuilding2,
  LuGraduationCap,
  LuTrendingUp,
  LuCircleAlert,
  LuHistory,
  LuClock,
  LuBadgeCheck
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import { db } from "@/services/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Drive {
  id: string;
  company_id: string;
  role_title: string;
  location: string;
  package_ctc: string;
  application_start?: string | null;
  application_end: string;
  drive_start?: string | null;
  drive_end?: string | null;
  drive_type: string;
  status: string;
  eligibility_rules: {
    branches: string[];
    min_cgpa: number;
    backlogs_allowed: number;
    history_of_arrears: boolean;
  };
  companies: {
    name: string;
    logo_url: string;
    theme_color: string;
  };
  isEligible?: boolean;
  ineligibleReasons?: string[];
}

// ---------- DUMMY STUDENT (replace with real auth later) ----------
const STUDENT_ID = "41851b38-cb29-4d93-9120-213403ffa82c";
const DUMMY_STUDENT = {
  branch: "CSE",
  cgpa: 8.2,
  backlogs: 0,
  history_of_arrears: false
};

// ---------- Drive state resolution ----------
export interface ResolvedState {
  phase: 'pre_open' | 'open' | 'ongoing' | 'completed';
  isEligible: boolean;
  ineligibleReasons: string[];
  hasApplied: boolean;
  cardBorder: string;
  ctaText: string;
  ctaClass: string;
  ctaDisabled: boolean;
  opacityClass: string;
}

export function resolveDriveState(
  drive: Drive,
  appliedIds: Set<string>,
  studentInfo: { branch: string; cgpa: number; backlogs: number; history_of_arrears: boolean }
): ResolvedState {
  const now = Date.now();
  const hasApplied = appliedIds.has(drive.id);
  
  // Parse dates safely
  const appStart = drive.application_start ? new Date(drive.application_start).getTime() : null;
  const appEnd = drive.application_end ? new Date(drive.application_end).getTime() : null;
  const drEnd = drive.drive_end ? new Date(drive.drive_end).getTime() : null;
  
  // Calculate Eligibility
  const rules = drive.eligibility_rules || {};
  const ineligibleReasons: string[] = [];
  
  if (rules.branches && rules.branches.length > 0 && !rules.branches.includes(studentInfo.branch)) {
    ineligibleReasons.push(`Not open to ${studentInfo.branch} branch`);
  }
  if (rules.min_cgpa && studentInfo.cgpa < rules.min_cgpa) {
    ineligibleReasons.push(`CGPA too low (Requires ${rules.min_cgpa}+)`);
  }
  if (rules.backlogs_allowed !== undefined && studentInfo.backlogs > rules.backlogs_allowed) {
    ineligibleReasons.push(`Too many backlogs (Max ${rules.backlogs_allowed})`);
  }
  if (rules.history_of_arrears === false && studentInfo.history_of_arrears === true) {
    ineligibleReasons.push("Requires no history of arrears");
  }
  
  const isEligible = ineligibleReasons.length === 0;

  // Resolve Drive Phase
  let phase: 'pre_open' | 'open' | 'ongoing' | 'completed' = 'open';
  if (drive.status === 'upcoming' || (appStart && now < appStart)) {
    phase = 'pre_open';
  } else if (drive.status === 'completed' || (drEnd && now > drEnd)) {
    phase = 'completed';
  } else if (appEnd && now > appEnd) {
    phase = 'ongoing';
  } else {
    phase = 'open';
  }

  // State configurations (Absolutely NO card background tints, state defined in bottom button strictly)
  let cardBorder = "border-border-subtle hover:border-primary/40";
  let ctaText = "";
  let ctaClass = "";
  let ctaDisabled = false;
  let opacityClass = "";

  if (phase === 'pre_open') {
    ctaDisabled = true;
    if (isEligible) {
      cardBorder = "border-emerald-100 hover:border-emerald-200";
      ctaText = "Opening Soon • Eligible";
      ctaClass = "bg-emerald-50/40 text-emerald-600 border border-emerald-200/50 cursor-not-allowed";
    } else {
      cardBorder = "border-red-100 hover:border-red-200";
      ctaText = "Opening Soon • Not Eligible";
      ctaClass = "bg-red-50/30 text-red-600 border border-red-200/40 cursor-not-allowed";
    }
  } else if (phase === 'open') {
    if (isEligible) {
      if (hasApplied) {
        cardBorder = "border-emerald-200 hover:border-emerald-300";
        ctaText = "Applied • Open";
        ctaClass = "bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default";
        ctaDisabled = true;
      } else {
        cardBorder = "border-border-subtle hover:border-emerald-400";
        ctaText = "Eligible • Open";
        ctaClass = "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-soft hover:shadow-hover hover:scale-[1.01]";
      }
    } else {
      cardBorder = "border-red-100 hover:border-red-200";
      ctaText = "Not Eligible • Open";
      ctaClass = "bg-red-50/30 text-red-700/50 border border-red-200/40 cursor-not-allowed";
      ctaDisabled = true;
    }
  } else if (phase === 'ongoing') {
    if (hasApplied) {
      cardBorder = "border-blue-200 hover:border-blue-400 shadow-sm";
      ctaText = "Applied • Ongoing";
      ctaClass = "bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-soft hover:shadow-hover";
      ctaDisabled = false;
    } else if (isEligible) {
      cardBorder = "border-amber-100 hover:border-amber-200";
      opacityClass = "opacity-70";
      ctaText = "Missed • Ongoing";
      ctaClass = "bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed";
      ctaDisabled = true;
    } else {
      cardBorder = "border-red-100 hover:border-red-200";
      opacityClass = "opacity-70";
      ctaText = "Not Eligible • Ongoing";
      ctaClass = "bg-red-50/30 text-red-700/50 border border-red-200/40 cursor-not-allowed";
      ctaDisabled = true;
    }
  } else if (phase === 'completed') {
    if (hasApplied) {
      cardBorder = "border-emerald-200 hover:border-emerald-400 shadow-sm";
      opacityClass = "opacity-85";
      ctaText = "Attended • Closed";
      ctaClass = "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-soft hover:shadow-hover";
      ctaDisabled = false;
    } else if (isEligible) {
      cardBorder = "border-amber-100 hover:border-amber-200";
      opacityClass = "opacity-50";
      ctaText = "Missed • Closed";
      ctaClass = "bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed";
      ctaDisabled = true;
    } else {
      cardBorder = "border-red-100 hover:border-red-200";
      opacityClass = "opacity-50";
      ctaText = "Not Eligible • Closed";
      ctaClass = "bg-red-50/30 text-red-700/50 border border-red-200/40 cursor-not-allowed";
      ctaDisabled = true;
    }
  }

  return {
    phase,
    isEligible,
    ineligibleReasons,
    hasApplied,
    cardBorder,
    ctaText,
    ctaClass,
    ctaDisabled,
    opacityClass
  };
}

export default function JobDrivesPage() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [appliedDriveIds, setAppliedDriveIds] = useState<Set<string>>(new Set());
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [savedDrives, setSavedDrives] = useState<string[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const router = useRouter();

  // Advanced Filters State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [stagedFilters, setStagedFilters] = useState({
    eligibility: "All",
    phase: "All",
    location: "All",
    minCtc: 0
  });
  const [appliedFilters, setAppliedFilters] = useState({
    eligibility: "All",
    phase: "All",
    location: "All",
    minCtc: 0
  });

  useEffect(() => {
    loadDrives();
  }, []);

  const getStudentInfo = () => {
    const acad = (studentProfile?.student_academics as any)?.[0] || studentProfile?.student_academics || {};
    return {
      branch: studentProfile?.department || DUMMY_STUDENT.branch,
      cgpa: parseFloat(acad.cgpa || String(DUMMY_STUDENT.cgpa)),
      backlogs: acad.active_arrears !== undefined ? acad.active_arrears : DUMMY_STUDENT.backlogs,
      history_of_arrears: acad.history_of_arrears !== undefined ? acad.history_of_arrears : DUMMY_STUDENT.history_of_arrears
    };
  };

  const loadDrives = async () => {
    try {
      const [data, appliedIds, profile] = await Promise.all([
        db.getDrives(),
        db.getStudentAppliedDriveIds(STUDENT_ID),
        db.getStudentProfile(STUDENT_ID).catch(() => null)
      ]);

      setStudentProfile(profile);

      const acad = (profile?.student_academics as any)?.[0] || profile?.student_academics || {};
      const studentInfo = {
        branch: profile?.department || DUMMY_STUDENT.branch,
        cgpa: parseFloat(acad.cgpa || String(DUMMY_STUDENT.cgpa)),
        backlogs: acad.active_arrears !== undefined ? acad.active_arrears : DUMMY_STUDENT.backlogs,
        history_of_arrears: acad.history_of_arrears !== undefined ? acad.history_of_arrears : DUMMY_STUDENT.history_of_arrears
      };

      const processedDrives = (data || []).map((drive: any) => {
        const rules = drive.eligibility_rules || {};
        const ineligibleReasons: string[] = [];

        if (rules.branches && rules.branches.length > 0 && !rules.branches.includes(studentInfo.branch)) {
          ineligibleReasons.push(`Not open to ${studentInfo.branch} branch`);
        }
        if (rules.min_cgpa && studentInfo.cgpa < rules.min_cgpa) {
          ineligibleReasons.push(`CGPA too low (Requires ${rules.min_cgpa}+)`);
        }
        if (rules.backlogs_allowed !== undefined && studentInfo.backlogs > rules.backlogs_allowed) {
          ineligibleReasons.push(`Too many backlogs (Max ${rules.backlogs_allowed})`);
        }
        if (rules.history_of_arrears === false && studentInfo.history_of_arrears === true) {
          ineligibleReasons.push("Drive requires no history of arrears");
        }

        return {
          ...drive,
          isEligible: ineligibleReasons.length === 0,
          ineligibleReasons
        };
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

  const handleApply = async (driveId: string) => {
    setIsApplying(true);
    try {
      await db.applyToDrive(STUDENT_ID, driveId);
      setAppliedDriveIds(prev => new Set([...prev, driveId]));
      toast.success("Application submitted successfully!");
      setSelectedDrive(null);
    } catch (err: any) {
      console.error("Failed to apply", err);
      toast.error(err.message || "Failed to submit application");
    } finally {
      setIsApplying(false);
    }
  };

  const filteredDrives = drives.filter(drive => {
    const studentInfo = getStudentInfo();
    const state = resolveDriveState(drive, appliedDriveIds, studentInfo);

    const matchesSearch = drive.companies?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drive.role_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || drive.drive_type === activeCategory;

    // Profile Eligibility Filter
    let matchesEligibility = true;
    if (appliedFilters.eligibility === "Eligible") {
      matchesEligibility = state.isEligible;
    } else if (appliedFilters.eligibility === "Ineligible") {
      matchesEligibility = !state.isEligible;
    }

    // Drive Status Filter
    let matchesPhase = true;
    if (appliedFilters.phase !== "All") {
      matchesPhase = state.phase === appliedFilters.phase;
    }

    // Location Filter
    let matchesLocation = true;
    if (appliedFilters.location !== "All") {
      matchesLocation = drive.location.toLowerCase().includes(appliedFilters.location.toLowerCase());
    }

    // Minimum CTC Filter
    let matchesCtc = true;
    if (appliedFilters.minCtc > 0) {
      const parseLPA = (pkg: string): number => {
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
        if (match) {
          return parseFloat(match[1]);
        }
        return 0;
      };
      matchesCtc = parseLPA(drive.package_ctc) >= appliedFilters.minCtc;
    }

    return matchesSearch && matchesCategory && matchesEligibility && matchesPhase && matchesLocation && matchesCtc;
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedDrives(prev =>
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    );
  };

  return (
    <div className="py-10 px-4 max-w-7xl mx-auto min-h-screen relative">
      <section className="flex flex-col gap-4 mb-10">
        <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
          Job <span className="text-primary">Drives.</span>
        </h2>
        <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed">
          Discover and apply to the most exclusive placement opportunities tailored for your profile.
        </p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky -top-4 md:-top-6 z-30 bg-background/95 backdrop-blur-md py-2.5 mb-8">
        <div className="relative w-full md:w-96 group">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search companies or roles..."
            className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-border-subtle bg-surface shadow-soft focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 w-full md:w-auto no-scrollbar">
          {["All", "Full-time", "Internship", "Contract"].map((category) => (
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
              setStagedFilters({
                eligibility: appliedFilters.eligibility,
                phase: appliedFilters.phase,
                location: appliedFilters.location,
                minCtc: appliedFilters.minCtc
              });
              setIsFilterDrawerOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-surface border border-border-subtle text-[10px] font-black uppercase tracking-widest text-muted hover:border-primary hover:text-primary transition-all"
          >
            <LuFilter size={14} />
            Filters
            {(appliedFilters.eligibility !== "All" || appliedFilters.phase !== "All" || appliedFilters.location !== "All" || appliedFilters.minCtc > 0) && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
            <LuChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <Sk.DriveCard key={i} />
          ))
        ) : filteredDrives.map((drive) => {
          const studentInfo = getStudentInfo();
          const state = resolveDriveState(drive, appliedDriveIds, studentInfo);
          const isSaved = savedDrives.includes(drive.id);
          const isClosed = state.phase === 'ongoing' || state.phase === 'completed';
          const daysLeft = Math.ceil((new Date(drive.application_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

          const handleCardClick = () => {
            if (state.hasApplied && (state.phase === 'ongoing' || state.phase === 'completed')) {
              router.push('/progress');
            } else {
              setSelectedDrive(drive);
            }
          };

          return (
            <div
              key={drive.id}
              onClick={handleCardClick}
              className={cn(
                "app-card group relative flex flex-col h-full cursor-pointer transition-all hover:shadow-hover overflow-hidden border bg-surface",
                state.cardBorder,
                state.opacityClass
              )}
            >
              {/* Save button (Absolute top right to avoid taking up vertical space above the logo) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSave(drive.id, e);
                }}
                className={cn(
                  "absolute top-6 right-6 h-8 w-8 rounded-xl border flex items-center justify-center transition-all bg-background/70 border-border-subtle text-muted hover:text-primary z-10",
                  isSaved && "bg-red-50 border-red-100 text-red-500 hover:text-red-600"
                )}
              >
                <LuHeart size={14} fill={isSaved ? "currentColor" : "none"} />
              </button>

              <div className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div className="h-16 w-16 rounded-2xl bg-background border border-border-subtle flex items-center justify-center p-3 shadow-sm overflow-hidden group-hover:shadow-md transition-shadow">
                    {drive.companies?.logo_url?.startsWith('http') ? (
                      <img src={drive.companies.logo_url} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <LuBuilding2 size={32} style={{ color: drive.companies?.theme_color || 'var(--primary)' }} />
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

              <div className="px-8 py-6 space-y-4 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted">
                    <LuMapPin size={16} className="text-primary/60" />
                    <span className="font-bold">{drive.location}</span>
                  </div>
                  <div className="font-display text-lg font-black text-foreground">{drive.package_ctc}</div>
                </div>

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                  {state.phase === 'pre_open' ? (
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                      <LuCalendar size={14} />
                      {drive.application_start ? (
                        `Opens ${new Date(drive.application_start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
                      ) : (
                        "Opens Soon"
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                      isClosed ? "text-muted" : daysLeft <= 3 ? "text-red-500" : "text-primary"
                    )}>
                      <LuCalendar size={14} />
                      {state.phase === 'completed' ? "Ended" : isClosed ? "Closed" : daysLeft === 0 ? "Last day!" : `${daysLeft}d left`}
                    </div>
                  )}
                  {/* Ineligible reasons preview */}
                  {!state.isEligible && state.ineligibleReasons && state.ineligibleReasons.length > 0 && (
                    <span className="text-[9px] font-bold text-amber-600 max-w-[120px] text-right leading-tight truncate">
                      {state.ineligibleReasons[0]}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-background/30 border-t border-border-subtle group-hover:bg-surface/50 transition-colors">
                <button
                  disabled={state.ctaDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (state.hasApplied && (state.phase === 'ongoing' || state.phase === 'completed')) {
                      router.push('/progress');
                    } else if (!state.ctaDisabled) {
                      setSelectedDrive(drive);
                    }
                  }}
                  className={cn(
                    "w-full py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all",
                    state.ctaClass
                  )}
                >
                  {state.hasApplied && state.phase === 'open' && <LuCircleCheck size={16} />}
                  {state.ctaText}
                  {state.phase === 'open' && !state.hasApplied && state.isEligible && <LuArrowRight size={16} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDrives.length === 0 && !loading && (
        <div className="py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6">
            <LuSearch size={32} />
          </div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">No drives found</h3>
          <p className="text-muted mt-2 font-medium">Try adjusting your search or filters to find more opportunities.</p>
          <button
            onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}
            className="mt-8 text-xs font-black uppercase tracking-widest text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {selectedDrive && (() => {
        const studentInfo = getStudentInfo();
        const state = resolveDriveState(selectedDrive, appliedDriveIds, studentInfo);
        const isSaved = savedDrives.includes(selectedDrive.id);
        const isClosed = state.phase === 'ongoing' || state.phase === 'completed';

        const handleModalCtaClick = () => {
          if (state.hasApplied && (state.phase === 'ongoing' || state.phase === 'completed')) {
            setSelectedDrive(null);
            router.push('/progress');
          } else if (state.phase === 'open' && !state.hasApplied && state.isEligible) {
            handleApply(selectedDrive.id);
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelectedDrive(null)} />
            <div className="relative bg-surface w-full max-w-2xl rounded-[40px] border border-border-subtle shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-border-subtle flex items-start justify-between bg-background/50">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-3xl bg-background border border-border-subtle flex items-center justify-center shadow-sm p-4 overflow-hidden">
                    {selectedDrive.companies?.logo_url?.startsWith('http') ? (
                      <img src={selectedDrive.companies.logo_url} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <LuBuilding2 size={40} style={{ color: selectedDrive.companies?.theme_color || 'var(--primary)' }} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-3xl font-black tracking-tight">{selectedDrive.role_title}</h3>
                    <p className="font-sans text-xl font-bold text-muted">{selectedDrive.companies?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDrive(null)}
                  className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-muted hover:text-primary transition-colors shadow-sm"
                >
                  <LuX size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-[24px] bg-background border border-border-subtle shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-2">
                      <LuTrendingUp size={12} className="text-primary" />
                      Package
                    </p>
                    <p className="font-display text-xl font-black text-primary">{selectedDrive.package_ctc}</p>
                  </div>
                  <div className="p-6 rounded-[24px] bg-background border border-border-subtle shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-2">
                      <LuMapPin size={12} className="text-primary" />
                      Location
                    </p>
                    <p className="font-display text-xl font-black">{selectedDrive.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-[24px] bg-background border border-border-subtle shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-2">
                      <LuCalendar size={12} className="text-primary" />
                      Application Starts
                    </p>
                    <p className="font-display text-base font-black">
                      {selectedDrive.application_start
                        ? new Date(selectedDrive.application_start).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                        : "Immediate"}
                    </p>
                  </div>
                  <div className="p-6 rounded-[24px] bg-background border border-border-subtle shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-2">
                      <LuCalendar size={12} className="text-primary" />
                      Application Deadline
                    </p>
                    <p className="font-display text-base font-black text-red-500">
                      {selectedDrive.application_end
                        ? new Date(selectedDrive.application_end).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">Mandatory Academic Standards</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={cn(
                      "p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all shadow-sm",
                      studentInfo.cgpa >= (selectedDrive.eligibility_rules?.min_cgpa || 0)
                        ? "bg-green-50/50 border-green-200"
                        : "bg-red-50/50 border-red-200"
                    )}>
                      <LuGraduationCap size={24} className={studentInfo.cgpa >= (selectedDrive.eligibility_rules?.min_cgpa || 0) ? "text-green-600" : "text-red-600"} />
                      <div className="text-center">
                        <p className="text-xl font-black">{selectedDrive.eligibility_rules?.min_cgpa || "N/A"}+</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Min CGPA</p>
                      </div>
                    </div>

                    <div className={cn(
                      "p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all shadow-sm",
                      studentInfo.backlogs <= (selectedDrive.eligibility_rules?.backlogs_allowed ?? 99)
                        ? "bg-green-50/50 border-green-200"
                        : "bg-red-50/50 border-red-200"
                    )}>
                      <LuCircleAlert size={24} className={studentInfo.backlogs <= (selectedDrive.eligibility_rules?.backlogs_allowed ?? 99) ? "text-green-600" : "text-red-600"} />
                      <div className="text-center">
                        <p className="text-xl font-black">{selectedDrive.eligibility_rules?.backlogs_allowed ?? "Any"}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Max Backlogs</p>
                      </div>
                    </div>

                    <div className={cn(
                      "p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all shadow-sm",
                      (selectedDrive.eligibility_rules?.history_of_arrears === true || studentInfo.history_of_arrears === false)
                        ? "bg-green-50/50 border-green-200"
                        : "bg-red-50/50 border-red-200"
                    )}>
                      <LuHistory size={24} className={(selectedDrive.eligibility_rules?.history_of_arrears === true || studentInfo.history_of_arrears === false) ? "text-green-600" : "text-red-600"} />
                      <div className="text-center">
                        <p className="text-xl font-black">{selectedDrive.eligibility_rules?.history_of_arrears ? "YES" : "NO"}</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Arrears OK</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">Eligibility Conclusion</h5>
                  <div className={cn(
                    "p-6 rounded-[24px] border flex items-start gap-4",
                    state.isEligible ? "bg-primary/5 border-primary/20" : "bg-amber-50 border-amber-200"
                  )}>
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                      state.isEligible ? "bg-primary text-white" : "bg-amber-500 text-white"
                    )}>
                      {state.isEligible ? <LuCircleCheck size={28} /> : <LuTriangleAlert size={28} />}
                    </div>
                    <div>
                      <p className={cn(
                        "font-display text-xl font-bold tracking-tight",
                        state.isEligible ? "text-primary" : "text-amber-700"
                      )}>
                        {state.isEligible ? "Verification Successful" : "Eligibility Mismatch"}
                      </p>
                      <div className="mt-2 space-y-1">
                        {state.isEligible ? (
                          <p className="text-sm font-medium text-muted">Your profile meets all the mandatory criteria for this drive.</p>
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

              <div className="p-8 border-t border-border-subtle bg-background/50 flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(selectedDrive.id, e);
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
                    onClick={handleModalCtaClick}
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
                        {state.hasApplied && state.phase === 'open' && <LuCircleCheck size={18} />}
                        {state.ctaText}
                        {state.phase === 'open' && !state.hasApplied && state.isEligible && <LuArrowRight size={20} />}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Advanced Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-surface border-l border-border-subtle shadow-2xl h-full animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-background/50">
              <div>
                <h2 className="text-xl font-black tracking-tight">Opportunity Filters</h2>
                <p className="text-xs text-muted font-medium">Fine-tune your job opportunities search.</p>
              </div>
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-2 hover:bg-black/5 rounded-xl transition-colors"
              >
                <LuX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {/* Eligibility */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Profile Eligibility</label>
                <div className="flex flex-wrap gap-2">
                  {["All", "Eligible", "Ineligible"].map(elig => (
                    <button
                      key={elig}
                      onClick={() => setStagedFilters({...stagedFilters, eligibility: elig})}
                      type="button"
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                        stagedFilters.eligibility === elig 
                          ? "bg-primary text-white border-primary shadow-tactile" 
                          : "bg-background border-border-subtle text-muted hover:border-primary/30"
                      )}
                    >
                      {elig === "All" ? "All Opportunities" : elig}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status / Drive Phase */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Drive Status</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "All Statuses", value: "All" },
                    { label: "Opening Soon", value: "pre_open" },
                    { label: "Open", value: "open" },
                    { label: "Ongoing", value: "ongoing" },
                    { label: "Closed", value: "completed" }
                  ].map(p => (
                    <button
                      key={p.value}
                      onClick={() => setStagedFilters({...stagedFilters, phase: p.value})}
                      type="button"
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                        stagedFilters.phase === p.value 
                          ? "bg-primary text-white border-primary shadow-tactile" 
                          : "bg-background border-border-subtle text-muted hover:border-primary/30"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Job Location</label>
                <div className="flex flex-wrap gap-2">
                  {["All", "Bangalore", "Pune", "Chennai", "Gurgaon", "Hyderabad", "Remote"].map(loc => (
                    <button
                      key={loc}
                      onClick={() => setStagedFilters({...stagedFilters, location: loc})}
                      type="button"
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                        stagedFilters.location === loc 
                          ? "bg-primary text-white border-primary shadow-tactile" 
                          : "bg-background border-border-subtle text-muted hover:border-primary/30"
                      )}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimum Package Range */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Min Compensation</label>
                  <span className="text-xs font-bold text-primary">
                    {stagedFilters.minCtc > 0 ? `${stagedFilters.minCtc} LPA+` : "No Min"}
                  </span>
                </div>
                <div className="relative group">
                  <input 
                    type="number" min="0" max="100" step="1"
                    placeholder="Min LPA"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all pr-20"
                    value={stagedFilters.minCtc || ""}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setStagedFilters({...stagedFilters, minCtc: isNaN(val) ? 0 : val});
                    }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">LPA</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border-subtle bg-background/50 flex gap-3">
              <button 
                onClick={() => setStagedFilters({
                  eligibility: "All",
                  phase: "All",
                  location: "All",
                  minCtc: 0
                })}
                type="button"
                className="flex-1 py-3 rounded-2xl bg-surface border border-border-subtle text-xs font-black uppercase tracking-widest hover:bg-black/5 transition-all"
              >
                Reset
              </button>
              <button 
                onClick={() => {
                  setAppliedFilters({
                    eligibility: stagedFilters.eligibility,
                    phase: stagedFilters.phase,
                    location: stagedFilters.location,
                    minCtc: stagedFilters.minCtc
                  });
                  setIsFilterDrawerOpen(false);
                }}
                type="button"
                className="flex-1 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
