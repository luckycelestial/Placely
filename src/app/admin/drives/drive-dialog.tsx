"use client";

import { useState, useEffect } from "react";
import { LuX, LuPlus, LuSave, LuBuilding2, LuMapPin, LuIndianRupee, LuCalendar, LuFileText, LuSearch, LuGraduationCap, LuCircleAlert } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const CURRENT_YEAR = new Date().getFullYear();
const BATCH_YEARS = [String(CURRENT_YEAR), String(CURRENT_YEAR + 1)];

const driveSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  roleTitle: z.string().min(2, "Role title must be at least 2 characters"),
  driveType: z.enum(["Full-time", "Internship", "Contract"]),
  package: z.string().min(1, "Package details are required"),
  location: z.string().min(1, "Location is required"),
  applicationStart: z.string().min(1, "Start date is required"),
  deadline: z.string().min(1, "Deadline is required"),
  batch: z.string().min(1, "Batch year is required"),
  branches: z.array(z.string()).min(1, "Select at least one branch"),
  minCgpa: z.number().min(0).max(10),
  backlogsAllowed: z.number().min(0).max(10),
  historyOfArrears: z.boolean(),
  status: z.enum(["draft", "published"])
});

type DriveFormValues = z.infer<typeof driveSchema>;

interface DriveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  drive?: any; // If present, we are in edit mode
}

export default function DriveDialog({ isOpen, onClose, onSuccess, drive }: DriveDialogProps) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<DriveFormValues>({
    resolver: zodResolver(driveSchema),
    defaultValues: {
      companyId: "",
      roleTitle: "",
      driveType: "Full-time",
      package: "",
      location: "",
      applicationStart: "",
      deadline: "",
      batch: String(CURRENT_YEAR),
      branches: ["CSE", "ECE", "MECH"],
      minCgpa: 7.0,
      backlogsAllowed: 0,
      historyOfArrears: false,
      status: "draft"
    }
  });

  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const selectedCompanyId = watch("companyId");
  const batchValue = watch("batch");
  const selectedBranches = watch("branches");
  const minCgpaValue = watch("minCgpa");

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const driveType = watch("driveType");
  const status = watch("status");

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
      if (drive) {
        // drive can come from the drives page (remapped UI names)
        // or from the dashboard (raw DB names) — handle both
        const rules = drive.eligibility_rules || drive.eligibility || {};
        const startRaw = drive.application_start
          ? new Date(drive.application_start).toISOString().split('T')[0]
          : "";
        const deadlineRaw =
          drive.application_end
            ? new Date(drive.application_end).toISOString().split('T')[0]
            : drive.deadline_iso || "";
        reset({
          companyId: drive.company_id || drive.companyId || "",
          roleTitle: drive.role_title || drive.role || "",
          driveType: (drive.drive_type || drive.type || "Full-time") as any,
          package: drive.package_ctc || drive.package || "",
          location: drive.location || "",
          applicationStart: startRaw,
          deadline: deadlineRaw,
          batch: drive.batch || "2025",
          branches: rules.branches || ["CSE", "ECE", "MECH"],
          minCgpa: rules.min_cgpa || 7.0,
          backlogsAllowed: rules.backlogs_allowed || 0,
          historyOfArrears: rules.history_of_arrears || false,
          status: (drive.status?.toLowerCase() || "draft") as any
        });
      } else {
        reset({
          companyId: "",
          roleTitle: "",
          driveType: "Full-time",
          package: "",
          location: "",
          applicationStart: "",
          deadline: "",
          batch: String(CURRENT_YEAR),
          branches: ["CSE", "ECE", "MECH"],
          minCgpa: 7.0,
          backlogsAllowed: 0,
          historyOfArrears: false,
          status: "draft"
        });
      }
    }
  }, [isOpen, drive, reset]);

  const loadCompanies = async () => {
    try {
      const data = await db.getTableData('companies');
      setCompanies(data || []);
    } catch (err) {
      console.error("Failed to load companies", err);
    }
  };

  const onFormSubmit = async (data: DriveFormValues) => {
    setLoading(true);
    try {
      const payload = {
        company_id: data.companyId,
        role_title: data.roleTitle,
        drive_type: data.driveType,
        package_ctc: data.package,
        location: data.location,
        application_start: data.applicationStart ? new Date(data.applicationStart).toISOString() : null,
        application_end: new Date(data.deadline).toISOString(),
        batch: data.batch,
        eligibility_rules: {
          branches: data.branches,
          min_cgpa: data.minCgpa,
          backlogs_allowed: data.backlogsAllowed,
          history_of_arrears: data.historyOfArrears
        },
        status: data.status,
        title: `${selectedCompany?.name || 'Company'} Recruitment ${data.batch}`
      };

      if (drive && drive.id) {
        await db.updateDrive(drive.id, payload);
        toast.success("Drive updated successfully");
      } else {
        await db.createDrive(payload);
        toast.success("New drive created successfully");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      // Supabase returns PostgrestError objects (not instanceof Error)
      // They have .message, .code, .details, .hint properties
      const msg = error?.message || error?.details || JSON.stringify(error) || "Error saving drive";
      console.error("Failed to save drive:", error?.code, msg, error?.details, error?.hint);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-[32px] border border-border-subtle shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-background/50 shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight">{drive ? "Edit Placement Drive" : "Launch New Drive"}</h2>
            <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">Recruitment Cycle 2025-26</p>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-background transition-colors shadow-sm"
          >
            <LuX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Selection */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuBuilding2 size={12} className="text-primary" />
                  Partner Company
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                    className={cn(
                      "w-full px-5 py-5 rounded-[24px] border bg-background text-sm font-bold flex items-center justify-between transition-all hover:border-primary/30 shadow-sm",
                      errors.companyId ? "border-red-500" : "border-border-subtle",
                      showCompanyDropdown && "border-primary ring-4 ring-primary/10"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center p-2 transition-all shadow-tactile border border-border-subtle",
                        selectedCompany ? "bg-white" : "bg-surface"
                      )}>
                        {selectedCompany?.logo_url ? (
                          <img src={selectedCompany.logo_url} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <LuBuilding2 size={16} className="text-primary" />
                        )}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className={cn("text-sm font-black", !selectedCompany && "text-muted")}>
                          {selectedCompany ? selectedCompany.name : "Select a company"}
                        </span>
                        {selectedCompany?.industry && <span className="text-[9px] font-bold text-muted uppercase tracking-wider">{selectedCompany.industry}</span>}
                      </div>
                    </div>
                    <svg 
                      width="14" height="14" viewBox="0 0 12 12" fill="none" 
                      className={cn("transition-transform duration-300 text-muted", showCompanyDropdown && "rotate-180 text-primary")}
                    >
                      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {showCompanyDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-3 p-3 bg-surface border border-border-subtle rounded-[28px] shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-xl">
                      <div className="relative mb-3 flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search partner network..."
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border-subtle rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all"
                            value={companySearch}
                            onChange={(e) => setCompanySearch(e.target.value)}
                            autoFocus
                          />
                          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={14} />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto no-scrollbar pr-1">
                        {filteredCompanies.length > 0 ? (
                          filteredCompanies.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className={cn(
                                "w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all mb-1 last:mb-0 flex items-center justify-between group",
                                selectedCompanyId === c.id ? "bg-primary text-white shadow-tactile" : "hover:bg-primary/5 text-foreground"
                              )}
                              onClick={() => {
                                setValue("companyId", c.id);
                                setShowCompanyDropdown(false);
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center p-2 transition-colors border overflow-hidden",
                                  selectedCompanyId === c.id ? "bg-white border-white/30" : "bg-background border-border-subtle group-hover:bg-primary/10"
                                )}>
                                  {c.logo_url?.startsWith('http') ? (
                                    <img src={c.logo_url} alt="" className="h-full w-full object-contain" />
                                  ) : (
                                    <LuBuilding2 size={16} className="text-primary" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black">{c.name}</span>
                                  <span className={cn("text-[9px] uppercase tracking-wider", selectedCompanyId === c.id ? "text-white/70" : "text-muted")}>
                                    {c.industry || "General Tech"}
                                  </span>
                                </div>
                              </div>
                              {selectedCompanyId === c.id && (
                                <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-2" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="py-8 text-center">
                            <LuBuilding2 size={24} className="mx-auto text-muted mb-2 opacity-20" />
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest">No matching partners</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-border-subtle">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCompanyDropdown(false);
                            alert("Please use the 'Add Company' button in the main sidebar to register a new partner.");
                          }}
                          className="w-full py-3 rounded-2xl bg-surface border border-border-subtle border-dashed text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/5 hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                        >
                          <LuPlus size={14} />
                          Register New Partner
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.companyId && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.companyId.message}</p>}
              </div>

              {/* Role Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Job Role Title</label>
                <input 
                  {...register("roleTitle")}
                  type="text" 
                  placeholder="e.g. Software Engineer"
                  className={cn(
                    "w-full px-5 py-5 rounded-[24px] border bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm",
                    errors.roleTitle ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                  )}
                />
                {errors.roleTitle && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.roleTitle.message}</p>}
              </div>

              {/* Drive Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Drive Type</label>
                <div className="flex gap-2 p-2 bg-background rounded-[24px] border border-border-subtle shadow-inner h-[62px]">
                  {["Full-time", "Internship", "Contract"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue("driveType", type as any)}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300",
                        driveType === type 
                          ? "bg-surface text-primary shadow-tactile scale-[1.02] border border-primary/10" 
                          : "text-muted hover:text-foreground hover:bg-surface/50"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Package */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuIndianRupee size={12} className="text-primary" />
                  Package (CTC)
                </label>
                <input 
                  {...register("package")}
                  type="text" 
                  placeholder="e.g. 12 - 15 LPA"
                  className={cn(
                    "w-full px-5 py-5 rounded-[24px] border bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm",
                    errors.package ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                  )}
                />
                {errors.package && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.package.message}</p>}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuMapPin size={12} className="text-primary" />
                  Work Location
                </label>
                <input 
                  {...register("location")}
                  type="text" 
                  placeholder="e.g. Bangalore, KA"
                  className={cn(
                    "w-full px-5 py-5 rounded-[24px] border bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm",
                    errors.location ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                  )}
                />
                {errors.location && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.location.message}</p>}
              </div>

              {/* Application Start Date */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuCalendar size={12} className="text-primary" />
                  Application Start Date
                </label>
                <input 
                  {...register("applicationStart")}
                  type="date" 
                  className={cn(
                    "w-full px-5 py-5 rounded-[24px] border bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm",
                    errors.applicationStart ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                  )}
                />
                {errors.applicationStart && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.applicationStart.message}</p>}
              </div>

              {/* Application Deadline */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuCalendar size={12} className="text-primary" />
                  Application Deadline
                </label>
                <input 
                  {...register("deadline")}
                  type="date" 
                  className={cn(
                    "w-full px-5 py-5 rounded-[24px] border bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm",
                    errors.deadline ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                  )}
                />
                {errors.deadline && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.deadline.message}</p>}
              </div>

              {/* Batch Year */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuCalendar size={12} className="text-primary" />
                  Batch Year
                </label>
                <div className="flex gap-2 p-2 bg-background rounded-[24px] border border-border-subtle shadow-inner h-[62px]">
                  {BATCH_YEARS.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setValue("batch", year)}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300",
                        batchValue === year
                          ? "bg-surface text-primary shadow-tactile scale-[1.02] border border-primary/10"
                          : "text-muted hover:text-foreground hover:bg-surface/50"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
                {errors.batch && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.batch.message}</p>}
              </div>

              {/* Target Departments */}
              <div className="md:col-span-2 space-y-2 mt-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuGraduationCap size={12} className="text-primary" />
                  Target Departments
                </label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 p-4 bg-background rounded-[24px] border border-border-subtle shadow-sm">
                  {["AI&DS", "AI&ML", "CSE", "IT", "CYS", "CSBS", "CCE", "ECE", "EEE", "MECH"].map(branch => (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => {
                        const current = selectedBranches;
                        if (current.includes(branch)) {
                          setValue("branches", current.filter(b => b !== branch));
                        } else {
                          setValue("branches", [...current, branch]);
                        }
                      }}
                      className={cn(
                        "px-2 py-3 rounded-2xl text-[10px] font-black transition-all border flex flex-col items-center justify-center gap-2",
                        selectedBranches.includes(branch)
                          ? "bg-primary text-white border-primary shadow-tactile scale-[1.02]"
                          : "bg-surface text-muted border-border-subtle hover:border-primary/50 hover:text-primary"
                      )}
                    >
                      {branch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="md:col-span-2 flex items-center justify-between p-4 bg-background rounded-[24px] border border-border-subtle mt-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-foreground/80">Visibility Status</p>
                  <p className="text-[10px] font-medium text-muted">Published drives are immediately visible to students.</p>
                </div>
                <div className="flex gap-2">
                  {["draft", "published"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setValue("status", s as any)}
                      className={cn(
                        "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all",
                        status === s 
                          ? "bg-primary text-white border-primary shadow-sm" 
                          : "bg-surface text-muted border-border-subtle hover:bg-background"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-border-subtle bg-background/50 flex gap-3 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-surface border-2 border-border-subtle text-sm font-black uppercase tracking-widest hover:bg-background transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              ) : drive ? (
                <>
                  <LuSave size={18} />
                  Update Drive
                </>
              ) : (
                <>
                  <LuPlus size={18} />
                  Launch Drive
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
