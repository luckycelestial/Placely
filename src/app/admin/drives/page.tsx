"use client";

import { useState, useEffect } from "react";
import { 
  LuSearch, 
  LuFilter, 
  LuPlus, 
  LuBuilding2, 
  LuCalendar, 
  LuMapPin, 
  LuDollarSign,
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DriveDialog from "./drive-dialog";
import CompanyDialog from "./company-dialog";
import TemplateDialog from "./template-dialog";

const TABS = ["Drives", "Companies", "Templates"];

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

  // Modal States
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<any>(null);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "Drives") {
        const drivesData = await db.getDrives({ 
          search, 
          status: showPastDrives ? 'completed' : 'published',
          type: filterType === 'All' ? undefined : filterType
        });
        setDrives(drivesData.map((d: any) => ({
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
          status: d.status,
          applications: d.applications?.length || 0, 
          eligibility: d.eligibility_rules,
          type: d.drive_type
        })));
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
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [search, activeTab, showPastDrives, filterType]);

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
    router.push(`/admin/applications?driveId=${driveId}`);
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
          {["All", "Full-time", "Internship", "Contract"].map(type => (
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
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted gap-4">
            <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            <p className="font-bold">Loading {activeTab.toLowerCase()}...</p>
          </div>
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
                        <div className="h-16 w-16 rounded-[22px] bg-background border border-border-subtle flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform p-3 overflow-hidden">
                          {drive.companyLogo?.startsWith('http') ? (
                            <img src={drive.companyLogo} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <LuBuilding2 size={28} className="text-muted group-hover:text-primary transition-colors" />
                          )}
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
                      <div className={cn(
                        "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                        drive.status === "published" || drive.status === "Published" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                        drive.status === "draft" || drive.status === "Draft" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                        "bg-black/5 text-muted border border-border-subtle"
                      )}>
                        {drive.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-background border border-border-subtle flex items-center justify-center text-muted shrink-0 shadow-sm">
                          <LuDollarSign size={18} className="text-primary" />
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
                    <div className="h-14 w-14 rounded-2xl bg-background border border-border-subtle flex items-center justify-center shrink-0 p-3 overflow-hidden shadow-tactile-sm">
                      {company.logo_url?.startsWith('http') ? (
                        <img src={company.logo_url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <LuBuilding2 size={24} className="text-muted group-hover:text-primary transition-colors" />
                      )}
                    </div>
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
                      <a href={company.website} target="_blank" className="hover:underline truncate">{company.website?.replace('https://', '') || 'placely.io'}</a>
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

            <div className="bg-surface rounded-[32px] border border-border-subtle p-8">
              <h4 className="text-sm font-black uppercase tracking-widest text-muted mb-6">Quick Start Presets</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Product Based", role: "Software Engineer", type: "Full-time", pkg: "10 - 15 LPA", criteria: "B.Tech CSE/AI&DS, 7.5+ CGPA" },
                  { name: "Service Based", role: "Associate Engineer", type: "Full-time", pkg: "4 - 6 LPA", criteria: "Any Engineer, 6.0+ CGPA" },
                  { name: "Startup", role: "Full Stack Dev", type: "Full-time", pkg: "8 - 12 LPA", criteria: "Proven projects, No active backlogs" },
                  { name: "Internship", role: "SDE Intern", type: "Internship", pkg: "30k - 50k /mo", criteria: "Final/Pre-final year" }
                ].map((preset) => (
                  <div 
                    key={preset.name} 
                    onClick={() => handleUseTemplate({ 
                      role_title: preset.role, 
                      drive_type: preset.type, 
                      package_ctc: preset.pkg, 
                      eligibility_rules: preset.criteria 
                    })}
                    className="p-6 rounded-2xl border border-border-subtle bg-background hover:border-primary/40 transition-all cursor-pointer group"
                  >
                    <h5 className="font-black group-hover:text-primary transition-colors mb-1">{preset.name}</h5>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-tighter">{preset.role}</p>
                  </div>
                ))}
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
