"use client";
import { Sk } from "@/components/ui/skeleton";

import { useState, useEffect, useCallback } from "react";
import { 
  LuSearch, 
  LuFilter, 
  LuPlus, 
  LuBuilding2, 
  LuCalendar, 
  LuMapPin, 
  LuIndianRupee,
  LuHistory,
  LuFileText,
  LuArrowUpRight,
  LuUsers,
  LuGlobe,
  LuMail,
  LuPhone,
  LuLayoutDashboard,
  LuX,
  LuUserPen,
  LuPencil
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

const DriveDialog = dynamic(() => import("./drive-dialog"), { ssr: false });
const CompanyDialog = dynamic(() => import("./company-dialog"), { ssr: false });
const TemplateDialog = dynamic(() => import("./template-dialog"), { ssr: false });

const TABS = ["Drives", "Companies", "Templates"];

const CURRENT_YEAR = new Date().getFullYear();
// Base default — will be replaced by dynamic data from DB
const DEFAULT_BATCH_YEARS = ["All", String(CURRENT_YEAR + 1), String(CURRENT_YEAR)];

export default function DrivesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Drives");
  const [search, setSearch] = useState("");
  
  // Data States
  const [drives, setDrives] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [showPastDrives, setShowPastDrives] = useState(false);
  const [filterType, setFilterType] = useState("All");
  const [filterBatch, setFilterBatch] = useState("All");
  const [batchYears, setBatchYears] = useState<string[]>(DEFAULT_BATCH_YEARS);

  // Modal States
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<any>(null);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "Drives") {
        const [drivesData, distinctBatches] = await Promise.all([
          db.getDrives({ 
            status: showPastDrives ? 'completed' : undefined,
            excludeCompleted: !showPastDrives,
            type: filterType === 'All' ? undefined : filterType,
            batch: filterBatch === 'All' ? undefined : filterBatch
          }),
          db.getDistinctBatches()
        ]);
        // Prepend "All" to the sorted distinct batch years
        setBatchYears(["All", ...distinctBatches]);
        
        const mappedDrives = drivesData.map((d: any) => ({
          id: d.id,
          company: d.companies?.name || "Unknown",
          companyId: d.company_id,
          companyLogo: d.companies?.logo_url,
          companyTheme: d.companies?.theme_color,
          role: d.role_title,
          package: d.package_ctc,
          location: d.location,
          deadline: new Date(d.application_end).toLocaleDateString(),
          deadline_iso: d.application_end?.split('T')[0],
          batch: d.batch || null,
          status: d.status,
          // Supabase returns [{ count: N }] for count aggregates
          applications: (d.applications as any)?.[0]?.count ?? d.applications?.length ?? 0,
          eligibility: d.eligibility_rules,
          type: d.drive_type
        }));

        const filteredDrives = mappedDrives.filter((d: any) => {
          const queryStr = search.trim().toLowerCase();
          if (!queryStr) return true;
          const companyMatch = d.company?.toLowerCase().includes(queryStr);
          const roleMatch = d.role?.toLowerCase().includes(queryStr);
          return companyMatch || roleMatch;
        });

        console.log("DEBUG Drives Filter:", {
          searchQuery: search,
          trimmedQuery: search.trim(),
          totalMapped: mappedDrives.length,
          totalFiltered: filteredDrives.length,
          sampleMapped: mappedDrives.slice(0, 3).map(d => ({ company: d.company, role: d.role }))
        });

        setDrives(filteredDrives);
      } else if (activeTab === "Companies") {
        const companiesData = await db.getCompanies({ search });
        setCompanies(companiesData);
      } else if (activeTab === "Templates") {
        const templatesData = await db.getTemplates();
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, showPastDrives, filterType, filterBatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleCreate = () => {
    if (activeTab === "Drives") {
      setSelectedDrive(null);
      setIsDriveModalOpen(true);
    } else if (activeTab === "Companies") {
      setSelectedCompany(null);
      setIsCompanyModalOpen(true);
    } else {
      setSelectedTemplate(null);
      setIsTemplateModalOpen(true);
    }
  };

  const handleEditDrive = (drive: any) => {
    setSelectedDrive(drive);
    setIsDriveModalOpen(true);
  };

  const handleEditCompany = (company: any) => {
    setSelectedCompany(company);
    setIsCompanyModalOpen(true);
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setIsTemplateModalOpen(true);
  };

  const handleDeleteDrive = async (id: string) => {
    if (confirm("Are you sure you want to delete this drive?")) {
      const promise = db.deleteDrive(id);
      toast.promise(promise, {
        loading: 'Deleting drive...',
        success: 'Drive deleted successfully',
        error: 'Failed to delete drive'
      });
      try {
        await promise;
        loadData();
      } catch (err) {
        console.error("Failed to delete drive", err);
      }
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (confirm("Are you sure you want to delete this company? All associated drives will also be affected.")) {
      const promise = db.deleteCompany(id);
      toast.promise(promise, {
        loading: 'Deleting company...',
        success: 'Company deleted successfully',
        error: 'Failed to delete company'
      });
      try {
        await promise;
        loadData();
      } catch (err) {
        console.error("Failed to delete company", err);
      }
    }
  };

  const handleManageApplications = (driveId: string) => {
    router.push(`/admin/ats?driveId=${driveId}`);
  };

  const handleUseTemplate = (template: any) => {
    setSelectedDrive({
      role: template.role_title,
      type: template.drive_type,
      package: template.package_ctc,
      location: template.location,
      eligibility: template.eligibility_rules,
      status: 'draft'
    });
    setIsDriveModalOpen(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm("Delete this template?")) {
      const promise = db.deleteTemplate(id);
      toast.promise(promise, {
        loading: 'Deleting template...',
        success: 'Template deleted successfully',
        error: 'Failed to delete template'
      });
      try {
        await promise;
        loadData();
      } catch (err) {
        console.error("Failed to delete template", err);
      }
    }
  };
  const handleExportExcel = async () => {
    const toastId = toast.loading("Exporting Excel...");
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      let exportRows: any[] = [];
      let filename = `${activeTab}_Report`;
      
      if (activeTab === "Drives") {
        exportRows = drives.map(d => ({
          "Company": d.company,
          "Role": d.role,
          "Package (CTC)": d.package,
          "Location": d.location,
          "Deadline": d.deadline,
          "Batch": d.batch || "All",
          "Status": d.status,
          "Applicants": d.applications
        }));
      } else if (activeTab === "Companies") {
        exportRows = companies.map(c => ({
          "Company Name": c.name,
          "Industry": c.industry || "Technology",
          "Website": c.website || "N/A",
          "HR Email": c.hr_email || "N/A",
          "HR Phone": c.hr_phone || "N/A"
        }));
      } else if (activeTab === "Templates") {
        exportRows = templates.map(t => ({
          "Template Name": t.name,
          "Role": t.role_title,
          "Type": t.drive_type,
          "Package (CTC)": t.package_ctc,
          "Location": t.location
        }));
      }

      exportToExcel(exportRows, filename, activeTab);
      toast.success("Excel exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading("Exporting PDF...");
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      let headers: string[] = [];
      let rows: any[][] = [];
      let filename = `${activeTab}_Report`;

      if (activeTab === "Drives") {
        headers = ["Company", "Role", "Package", "Location", "Deadline", "Batch", "Status", "Applied"];
        rows = drives.map(d => [
          d.company,
          d.role,
          d.package,
          d.location,
          d.deadline,
          d.batch || "All",
          d.status,
          String(d.applications)
        ]);
      } else if (activeTab === "Companies") {
        headers = ["Company Name", "Industry", "Website", "HR Email", "HR Phone"];
        rows = companies.map(c => [
          c.name,
          c.industry || "Technology",
          c.website || "N/A",
          c.hr_email || "N/A",
          c.hr_phone || "N/A"
        ]);
      } else if (activeTab === "Templates") {
        headers = ["Template Name", "Role", "Type", "Package", "Location"];
        rows = templates.map(t => [
          t.name,
          t.role_title,
          t.drive_type,
          t.package_ctc,
          t.location
        ]);
      }

      await exportToPDF(`${activeTab} List`, headers, rows, filename);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Placement Management</h1>
          <p className="text-muted text-sm font-medium">Manage recruitment cycles, companies, and student eligibility.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowPastDrives(!showPastDrives)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold shadow-sm transition-all",
              showPastDrives 
                ? "bg-primary text-white border-primary" 
                : "bg-surface border-border-subtle hover:bg-background"
            )}
          >
            <LuHistory size={16} />
            {showPastDrives ? "Showing Past" : "Past Drives"}
          </button>
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-tactile hover:bg-primary-dark transition-all"
          >
            <LuPlus size={18} />
            Create New {activeTab.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-background p-1 rounded-2xl w-fit border border-border-subtle">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2 text-sm font-bold rounded-xl transition-all",
              activeTab === tab 
                ? "bg-surface text-primary shadow-sm" 
                : "text-muted hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border-subtle bg-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground p-1 rounded-lg hover:bg-background transition-colors"
            >
              <LuX size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {["All", "Full-time", "Internship", "Contract", "Intern + Full-time"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-4 py-2 rounded-xl border text-sm font-bold transition-all",
                filterType === type 
                  ? "bg-primary/10 border-primary/20 text-primary" 
                  : "bg-surface border-border-subtle text-muted hover:text-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>
        {/* Batch Filter Dropdown */}
        {activeTab === "Drives" && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-[180px]">
              <SearchableSelect 
                options={batchYears.map(batch => ({ 
                  value: batch, 
                  label: batch === "All" ? "All Batches" : `Batch ${batch}` 
                }))}
                value={filterBatch}
                onChange={setFilterBatch}
                placeholder="Select Batch"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="pt-4"><Sk.CardGrid count={4} cols={2} /></div>
        ) : activeTab === "Drives" ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {drives.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-surface rounded-[32px] border border-dashed border-border-subtle">
                <p className="text-muted font-bold">No {showPastDrives ? "past" : "active"} placement drives found.</p>
                {!showPastDrives && <button onClick={handleCreate} className="mt-4 text-primary font-black text-sm uppercase tracking-widest hover:underline">Launch your first drive</button>}
              </div>
            ) : (
              drives.map((drive) => (
                <div key={drive.id} className="group bg-surface rounded-[32px] border border-border-subtle shadow-soft hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden relative">
                  <button 
                    onClick={() => handleDeleteDrive(drive.id)}
                    className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500 hover:text-white"
                  >
                    <LuX size={14} />
                  </button>

                  <div className="p-8">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <div className="group-hover:scale-105 transition-transform shrink-0">
                          <CompanyLogo name={drive.company} size={64} rounded="rounded-[22px]" />
                        </div>
                        <div>
                          <h3 className="font-black text-xl leading-tight group-hover:text-primary transition-colors">{drive.role}</h3>
                          <div className="flex items-center gap-2.5 mt-1.5">
                            <span className="text-sm font-bold text-foreground/70">{drive.company}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-border-subtle"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted">{drive.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {drive.batch && (
                          <div className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 shadow-sm">
                            Batch {drive.batch}
                          </div>
                        )}
                        <div className={cn(
                          "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                          drive.status === "published" || drive.status === "Published" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                          drive.status === "draft" || drive.status === "Draft" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                          "bg-black/5 text-muted border border-border-subtle"
                        )}>
                          {drive.status}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-background border border-border-subtle flex items-center justify-center text-muted shrink-0 shadow-sm">
                          <LuIndianRupee size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted uppercase tracking-[0.1em]">Package</p>
                          <p className="text-sm font-black">{drive.package}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-background border border-border-subtle flex items-center justify-center text-muted shrink-0 shadow-sm">
                          <LuMapPin size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted uppercase tracking-[0.1em]">Location</p>
                          <p className="text-sm font-black">{drive.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-background border border-border-subtle flex items-center justify-center text-muted shrink-0 shadow-sm">
                          <LuCalendar size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted uppercase tracking-[0.1em]">Deadline</p>
                          <p className="text-sm font-black">{drive.deadline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-background border border-border-subtle flex items-center justify-center text-muted shrink-0 shadow-sm">
                          <LuUsers size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-muted uppercase tracking-[0.1em]">Applicants</p>
                          <p className="text-sm font-black">{drive.applications} Applied</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-[24px] bg-background/50 border border-border-subtle/40 mb-8 group-hover:bg-background transition-colors duration-300">
                      <div className="flex items-center gap-2.5 mb-3">
                        <LuFileText size={16} className="text-primary" />
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Eligibility Criteria</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {drive.eligibility ? (
                          <>
                            <span className="px-2.5 py-1 rounded-lg bg-surface border border-border-subtle text-[9px] font-black text-primary">
                              {drive.eligibility.min_cgpa}+ CGPA
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-surface border border-border-subtle text-[9px] font-black text-amber-600">
                              {drive.eligibility.backlogs_allowed} BACKLOGS
                            </span>
                            {drive.eligibility.branches?.slice(0, 2).map((b: string) => (
                              <span key={b} className="px-2.5 py-1 rounded-lg bg-surface border border-border-subtle text-[9px] font-black text-muted">
                                {b}
                              </span>
                            ))}
                            {(drive.eligibility.branches?.length || 0) > 2 && (
                              <span className="px-2.5 py-1 rounded-lg bg-surface border border-border-subtle text-[9px] font-black text-muted">
                                +{drive.eligibility.branches.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs font-bold text-muted italic">No criteria specified</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEditDrive(drive)}
                        className="flex-1 py-4 rounded-2xl bg-surface border-2 border-border-subtle text-sm font-black uppercase tracking-widest hover:bg-background hover:border-primary/20 transition-all duration-300 flex items-center justify-center gap-2.5"
                      >
                        <LuPencil size={16} />
                        Edit Drive
                      </button>
                      <button 
                        onClick={() => handleManageApplications(drive.id)}
                        className="flex-1 py-4 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all duration-300 flex items-center justify-center gap-2.5"
                      >
                        Applications
                        <LuArrowUpRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "Companies" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {companies.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-surface rounded-[32px] border border-dashed border-border-subtle">
                <p className="text-muted font-bold">No companies found matching "{search}".</p>
                <div className="flex flex-col items-center gap-3 mt-4">
                  <button 
                    onClick={() => {
                      setSelectedCompany({ name: search });
                      setIsCompanyModalOpen(true);
                    }} 
                    className="px-6 py-3 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all flex items-center gap-2"
                  >
                    <LuPlus size={18} />
                    Quick register "{search}"
                  </button>
                  <button onClick={() => setSearch("")} className="text-xs font-bold text-muted hover:text-primary uppercase tracking-widest transition-colors">
                    Clear search
                  </button>
                </div>
              </div>
            ) : (
              companies.map((company) => (
                <div key={company.id} className="bg-surface p-6 rounded-[32px] border border-border-subtle shadow-soft hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-6">
                    <CompanyLogo name={company.name} size={56} rounded="rounded-2xl" />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditCompany(company)}
                        className="h-10 w-10 rounded-xl hover:bg-background flex items-center justify-center text-muted hover:text-primary transition-colors border border-transparent hover:border-border-subtle"
                      >
                        <LuPencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCompany(company.id)}
                        className="h-10 w-10 rounded-xl hover:bg-red-500/10 flex items-center justify-center text-muted hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20"
                      >
                        <LuX size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="font-black text-lg group-hover:text-primary transition-colors">{company.name}</h3>
                    <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">{company.industry || "Technology"}</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border-subtle/50">
                    <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                      <LuGlobe size={16} className="text-primary" />
                      <a href={company.website} target="_blank" className="hover:underline truncate">{company.website?.replace('https://', '') || 'careerbridge.io'}</a>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                      <LuMail size={16} className="text-primary" />
                      <span className="truncate">{company.hr_email || 'hiring@' + company.name.toLowerCase().replace(' ', '') + '.com'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                      <LuPhone size={16} className="text-primary" />
                      <span>{company.hr_phone || '+91 98765 43210'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-surface rounded-[32px] border border-border-subtle p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black">Standard Drive Templates</h3>
                  <p className="text-muted text-sm font-medium">Standardize your recruitment process with reusable configurations.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-muted font-bold border-2 border-dashed border-border-subtle rounded-2xl">
                    No custom templates created yet.
                  </div>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="p-6 rounded-2xl border border-border-subtle bg-background hover:border-primary/40 transition-all cursor-pointer group relative">
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditTemplate(template); }}
                          className="h-8 w-8 rounded-lg bg-surface border border-border-subtle flex items-center justify-center hover:text-primary transition-colors"
                        >
                          <LuPencil size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                          className="h-8 w-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white"
                        >
                          <LuX size={14} />
                        </button>
                      </div>
                      <div onClick={() => handleUseTemplate(template)}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-black group-hover:text-primary transition-colors">{template.name}</h4>
                          <LuArrowUpRight size={18} className="text-muted group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-surface px-2 py-1 rounded-md border border-border-subtle">{template.drive_type}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-surface px-2 py-1 rounded-md border border-border-subtle">{template.package_ctc}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DriveDialog 
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        onSuccess={loadData}
        drive={selectedDrive}
      />
      <CompanyDialog 
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSuccess={loadData}
        company={selectedCompany}
      />
      <TemplateDialog 
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSuccess={loadData}
        template={selectedTemplate}
      />
    </div>
  );
}
