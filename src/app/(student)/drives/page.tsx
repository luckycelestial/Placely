"use client";

import { useEffect, useState } from "react";
import {
  LuMapPin,
  LuCalendar,
  LuArrowRight,
  LuSearch,
  LuFilter,
  LuChevronDown,
  LuHeart,
  LuInfo,
  LuX,
  LuCircleCheck,
  LuTriangleAlert,
  LuBuilding2,
  LuGraduationCap,
  LuTrendingUp,
  LuCircleAlert,
  LuHistory,
  LuCircleX
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/services/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Drive {
  id: string;
  company_id: string;
  role_title: string;
  location: string;
  package_ctc: string;
  application_end: string;
  drive_type: string;
  eligibility_rules: {
    branches: string[];
    min_cgpa: number;
    backlogs_allowed: number;
    history_of_arrears: boolean;
  };
  status: string;
  companies: {
    name: string;
    logo_url: string;
    theme_color: string;
  };
  isEligible?: boolean;
  ineligibleReasons?: string[];
}

const DUMMY_STUDENT = {
  branch: "CSE",
  cgpa: 8.2,
  backlogs: 0,
  history_of_arrears: false
};

export default function JobDrivesPage() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [savedDrives, setSavedDrives] = useState<string[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadDrives();
  }, []);

  async function loadDrives() {
    try {
      const data = await db.getDrives();
      const processedDrives = (data || []).map((drive: any) => {
        const rules = drive.eligibility_rules || {};
        const ineligibleReasons: string[] = [];

        if (rules.branches && !rules.branches.includes(DUMMY_STUDENT.branch)) {
          ineligibleReasons.push(`Not open to ${DUMMY_STUDENT.branch} branch`);
        }
        if (rules.min_cgpa && DUMMY_STUDENT.cgpa < rules.min_cgpa) {
          ineligibleReasons.push(`CGPA too low (Requires ${rules.min_cgpa}+)`);
        }
        if (rules.backlogs_allowed !== undefined && DUMMY_STUDENT.backlogs > rules.backlogs_allowed) {
          ineligibleReasons.push(`Too many backlogs (Max ${rules.backlogs_allowed})`);
        }
        if (rules.history_of_arrears === false && DUMMY_STUDENT.history_of_arrears === true) {
          ineligibleReasons.push("Drive requires no history of arrears");
        }

        return {
          ...drive,
          isEligible: ineligibleReasons.length === 0,
          ineligibleReasons
        };
      });
      setDrives(processedDrives);
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
      const STUDENT_ID = "550e8400-e29b-41d4-a716-446655440000"; 
      await db.applyToDrive(STUDENT_ID, driveId);
      toast.success("Application submitted successfully!");
      router.push("/applications");
    } catch (err: any) {
      console.error("Failed to apply", err);
      toast.error(err.message || "Failed to submit application");
    } finally {
      setIsApplying(false);
    }
  };

  const filteredDrives = drives.filter(drive => {
    const matchesSearch = drive.companies?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drive.role_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || drive.drive_type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedDrives(prev =>
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-10 py-10 px-4 max-w-7xl mx-auto min-h-screen relative">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-12 rounded-full bg-primary" />
          <span className="section-label text-primary">Opportunity Hub</span>
        </div>
        <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
          Job <span className="text-primary italic">Drives.</span>
        </h2>
        <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed">
          Discover and apply to the most exclusive placement opportunities tailored for your profile.
        </p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4">
        <div className="relative w-full md:w-96 group">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search companies or roles..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle bg-surface shadow-soft focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          {["All", "Full-time", "Internship", "Contract"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeCategory === category
                  ? "bg-primary text-white shadow-tactile scale-105"
                  : "bg-surface border border-border-subtle text-muted hover:border-primary hover:text-primary"
              )}
            >
              {category}
            </button>
          ))}
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface border border-border-subtle text-[10px] font-black uppercase tracking-widest text-muted hover:border-primary hover:text-primary transition-all">
            <LuFilter size={14} />
            Filters
            <LuChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-[400px] rounded-[32px] bg-surface animate-pulse border border-border-subtle" />
          ))
        ) : filteredDrives.map((drive) => {
          const isExpired = new Date(drive.application_end) < new Date();
          const isSaved = savedDrives.includes(drive.id);
          const deadlineText = isExpired ? "Expired" : `${Math.ceil((new Date(drive.application_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`;

          return (
            <div
              key={drive.id}
              onClick={() => setSelectedDrive(drive)}
              className="app-card group relative flex flex-col h-full hover:border-primary/50 cursor-pointer transition-all hover:shadow-hover overflow-hidden"
            >
              <div className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div className="h-16 w-16 rounded-2xl bg-background border border-border-subtle flex items-center justify-center p-3 shadow-sm overflow-hidden group-hover:shadow-md transition-shadow">
                    {drive.companies?.logo_url?.startsWith('http') ? (
                      <img src={drive.companies.logo_url} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <LuBuilding2 size={32} style={{ color: drive.companies?.theme_color || 'var(--primary)' }} />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => toggleSave(drive.id, e)}
                      className={cn(
                        "h-10 w-10 rounded-xl border flex items-center justify-center transition-all",
                        isSaved ? "bg-red-50 border-red-100 text-red-500" : "bg-background border-border-subtle text-muted hover:text-primary"
                      )}
                    >
                      <LuHeart size={18} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                    {!drive.isEligible && (
                      <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                        <LuCircleAlert size={18} />
                      </div>
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
                  <div className={cn(
                    "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
                    isExpired ? "text-red-500" : "text-primary"
                  )}>
                    <LuCalendar size={14} />
                    {deadlineText}
                  </div>
                  {!isExpired && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                      Active Drive
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-background/30 border-t border-border-subtle group-hover:bg-primary/5 transition-colors">
                <button
                  disabled={isExpired || !drive.isEligible}
                  className={cn(
                    "w-full py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all",
                    isExpired || !drive.isEligible
                      ? "bg-border-subtle text-muted cursor-not-allowed"
                      : "bg-surface border border-border-subtle group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-tactile"
                  )}
                >
                  {isExpired ? "Drive Closed" : !drive.isEligible ? "Ineligible" : "Apply to Drive"}
                  {!isExpired && drive.isEligible && <LuArrowRight size={18} />}
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

      {selectedDrive && (
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

              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">Mandatory Academic Standards</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={cn(
                    "p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all shadow-sm",
                    DUMMY_STUDENT.cgpa >= (selectedDrive.eligibility_rules?.min_cgpa || 0)
                      ? "bg-green-50/50 border-green-200"
                      : "bg-red-50/50 border-red-200"
                  )}>
                    <LuGraduationCap size={24} className={DUMMY_STUDENT.cgpa >= (selectedDrive.eligibility_rules?.min_cgpa || 0) ? "text-green-600" : "text-red-600"} />
                    <div className="text-center">
                      <p className="text-xl font-black">{selectedDrive.eligibility_rules?.min_cgpa}+</p>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Min CGPA</p>
                    </div>
                  </div>

                  <div className={cn(
                    "p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all shadow-sm",
                    DUMMY_STUDENT.backlogs <= (selectedDrive.eligibility_rules?.backlogs_allowed || 0)
                      ? "bg-green-50/50 border-green-200"
                      : "bg-red-50/50 border-red-200"
                  )}>
                    <LuCircleAlert size={24} className={DUMMY_STUDENT.backlogs <= (selectedDrive.eligibility_rules?.backlogs_allowed || 0) ? "text-green-600" : "text-red-600"} />
                    <div className="text-center">
                      <p className="text-xl font-black">{selectedDrive.eligibility_rules?.backlogs_allowed}</p>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Max Backlogs</p>
                    </div>
                  </div>

                  <div className={cn(
                    "p-5 rounded-3xl border flex flex-col items-center gap-3 transition-all shadow-sm",
                    (selectedDrive.eligibility_rules?.history_of_arrears === true || DUMMY_STUDENT.history_of_arrears === false)
                      ? "bg-green-50/50 border-green-200"
                      : "bg-red-50/50 border-red-200"
                  )}>
                    <LuHistory size={24} className={(selectedDrive.eligibility_rules?.history_of_arrears === true || DUMMY_STUDENT.history_of_arrears === false) ? "text-green-600" : "text-red-600"} />
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
                  selectedDrive.isEligible ? "bg-primary/5 border-primary/20" : "bg-amber-50 border-amber-200"
                )}>
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                    selectedDrive.isEligible ? "bg-primary text-white" : "bg-amber-500 text-white"
                  )}>
                    {selectedDrive.isEligible ? <LuCircleCheck size={28} /> : <LuTriangleAlert size={28} />}
                  </div>
                  <div>
                    <p className={cn(
                      "font-display text-xl font-bold tracking-tight",
                      selectedDrive.isEligible ? "text-primary" : "text-amber-700"
                    )}>
                      {selectedDrive.isEligible ? "Verification Successful" : "Eligibility Mismatch"}
                    </p>
                    <div className="mt-2 space-y-1">
                      {selectedDrive.isEligible ? (
                        <p className="text-sm font-medium text-muted">Your profile meets all the mandatory criteria for this drive. You can proceed with the application.</p>
                      ) : (
                        selectedDrive.ineligibleReasons?.map((reason, i) => (
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
                onClick={(e) => toggleSave(selectedDrive.id, e)}
                className={cn(
                  "flex-1 py-5 rounded-2xl border font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all",
                  savedDrives.includes(selectedDrive.id)
                    ? "bg-red-50 border-red-200 text-red-500 shadow-inner"
                    : "bg-surface border-border-subtle text-muted hover:border-red-200 hover:text-red-500 shadow-sm"
                )}
              >
                <LuHeart size={18} fill={savedDrives.includes(selectedDrive.id) ? "currentColor" : "none"} />
                {savedDrives.includes(selectedDrive.id) ? "Saved" : "Save"}
              </button>
              <div className="flex-[2.5]">
                <button
                  onClick={() => handleApply(selectedDrive.id)}
                  disabled={new Date(selectedDrive.application_end) < new Date() || !selectedDrive.isEligible || isApplying}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-tactile transition-all",
                    (new Date(selectedDrive.application_end) < new Date() || !selectedDrive.isEligible || isApplying)
                      ? "bg-border-subtle text-muted cursor-not-allowed"
                      : "bg-primary text-white hover:shadow-hover hover:-translate-y-0.5 active:translate-y-0"
                  )}
                >
                  {isApplying ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {new Date(selectedDrive.application_end) < new Date() ? "Closed" : "Start Application"}
                      {new Date(selectedDrive.application_end) >= new Date() && selectedDrive.isEligible && <LuArrowRight size={20} />}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
