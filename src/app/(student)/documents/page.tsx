"use client";

import { useState } from "react";
import { 
  LuFileText, 
  LuLink, 
  LuCircleCheck, 
  LuCircleAlert,
  LuClock,
  LuExternalLink,
  LuTrash2,
  LuPencil,
  LuInfo,
  LuShieldCheck,
  LuPlus
} from "react-icons/lu";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  title: string;
  type: string;
  format: "link" | "file";
  reference: string;
  timestamp: string;
  status: "Verified" | "Pending" | "Rejected" | "Not Provided";
  isRequired: boolean;
}

const DOCUMENTS: Document[] = [
  {
    id: "1",
    title: "Primary Placement Resume",
    type: "Resume",
    format: "link",
    reference: "drive.google.com/resume-final",
    timestamp: "2 days ago",
    status: "Verified",
    isRequired: true
  },
  {
    id: "2",
    title: "10th Standard Marksheet",
    type: "Academic Proof",
    format: "file",
    reference: "10th_Marksheet.pdf",
    timestamp: "5 days ago",
    status: "Verified",
    isRequired: true
  },
  {
    id: "3",
    title: "6th Semester Marksheet",
    type: "Academic Proof",
    format: "file",
    reference: "6th_Sem_Marksheet.pdf",
    timestamp: "Pending upload",
    status: "Not Provided",
    isRequired: true
  },
  {
    id: "4",
    title: "AWS Certified Developer",
    type: "Certification",
    format: "link",
    reference: "credly.com/aws-cert",
    timestamp: "1 week ago",
    status: "Pending",
    isRequired: false
  },
  {
    id: "5",
    title: "GitHub Portfolio",
    type: "Profile Link",
    format: "link",
    reference: "github.com/johndoe",
    timestamp: "Yesterday",
    status: "Verified",
    isRequired: false
  }
];

export default function DocumentsCenterPage() {
  const [activeTab, setActiveTab] = useState<"All" | "Required" | "Optional">("All");

  const filteredDocs = DOCUMENTS.filter(doc => {
    if (activeTab === "Required") return doc.isRequired;
    if (activeTab === "Optional") return !doc.isRequired;
    return true;
  });

  const completionStats = {
    required: DOCUMENTS.filter(d => d.isRequired).length,
    completedRequired: DOCUMENTS.filter(d => d.isRequired && d.status === "Verified").length
  };

  const progress = Math.round((completionStats.completedRequired / completionStats.required) * 100);

  return (
    <div className="space-y-12 py-10 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-12 rounded-full bg-primary" />
          <span className="section-label text-primary">Credential Vault</span>
        </div>
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div>
            <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
              Documents <span className="text-primary italic">Center.</span>
            </h2>
            <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed mt-2">
              Manage your placement identity. Keep your certifications, proofs, and resumes updated for verification.
            </p>
          </div>
          
          {/* Progress Card */}
          <div className="bg-surface border border-border-subtle p-6 rounded-3xl flex items-center gap-6 shadow-xl shadow-black/5 min-w-[320px]">
            <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
               <svg className="h-full w-full -rotate-90">
                 <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary/10" />
                 <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray={176} strokeDashoffset={176 - (176 * progress) / 100} className="text-primary transition-all duration-1000" />
               </svg>
               <span className="absolute font-display text-xs font-black text-primary">{progress}%</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Required Progress</p>
              <p className="font-display text-xl font-black mt-1">
                {completionStats.completedRequired} of {completionStats.required} <span className="text-muted">Verified</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs and Actions */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between sticky -top-4 md:-top-6 z-10 bg-background/95 backdrop-blur-md py-4 -mx-4 md:-mx-6 px-4 md:px-6 mb-8 border-b border-border-subtle/50 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          {["All", "Required", "Optional"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "All" | "Required" | "Optional")}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab 
                  ? "bg-foreground text-white shadow-tactile scale-105" 
                  : "bg-surface border border-border-subtle text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button className="btn-primary w-full md:w-auto py-4 px-8 h-auto text-[10px] uppercase tracking-widest gap-3">
          <LuPlus size={18} />
          Add New Document
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="app-card group hover:border-primary/50 transition-all cursor-pointer">
            <div className="p-8 flex items-start gap-6">
              <div className={cn(
                "h-20 w-20 rounded-3xl flex items-center justify-center shrink-0 border border-border-subtle transition-all group-hover:scale-105",
                doc.format === "link" ? "bg-primary/5 text-primary" : "bg-blue-50 text-blue-500"
              )}>
                {doc.format === "link" ? <LuLink size={32} /> : <LuFileText size={32} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                    doc.isRequired ? "bg-red-50 text-red-500 border border-red-100" : "bg-surface border border-border-subtle text-muted"
                  )}>
                    {doc.isRequired ? "Required" : "Optional"}
                  </span>
                  <span className="text-[10px] font-black text-muted/60 uppercase tracking-widest">{doc.type}</span>
                </div>
                <h4 className="font-display text-2xl font-bold tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                  {doc.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-sans text-sm font-semibold text-muted/60 truncate">{doc.reference}</p>
                  {doc.format === "link" && <LuExternalLink size={12} className="text-muted/40" />}
                </div>

                <div className="mt-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <StatusBadge status={doc.status} />
                     <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">{doc.timestamp}</span>
                   </div>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-muted hover:text-primary transition-all">
                       <LuPencil size={18} />
                     </button>
                     <button className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-muted hover:text-red-500 transition-all">
                       <LuTrash2 size={18} />
                     </button>
                   </div>
                </div>
              </div>
            </div>
            
            {doc.status === "Not Provided" && (
              <div className="px-8 py-4 bg-red-50/50 border-t border-red-100 flex items-center justify-between group-hover:bg-red-50 transition-colors">
                <div className="flex items-center gap-2 text-red-600 font-sans text-xs font-bold">
                  <LuCircleAlert size={16} />
                  Missing critical document
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline">
                  Action Now
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Panel */}
      <div className="app-card p-10 bg-primary/5 border-primary/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex gap-6">
             <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-tactile shrink-0">
               <LuShieldCheck size={28} />
             </div>
             <div>
               <h5 className="font-display text-2xl font-black tracking-tight">Security & Policy</h5>
               <p className="font-sans text-base font-medium text-muted mt-2 max-w-xl leading-relaxed">
                 We prioritize link-based management to give you control over your data. Ensure links are public or shared with the placement office domain.
               </p>
             </div>
           </div>
           <button className="btn-secondary bg-surface border-none shadow-xl px-8 h-14 text-[10px] uppercase tracking-widest">
             Review Verification Rules
           </button>
        </div>
        <div className="absolute right-0 bottom-0 h-64 w-64 bg-primary/5 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Verified") return (
    <div className="flex items-center gap-1.5 text-emerald-500 font-sans text-[10px] font-black uppercase tracking-widest">
      <LuCircleCheck size={14} />
      Verified
    </div>
  );
  if (status === "Pending") return (
    <div className="flex items-center gap-1.5 text-amber-500 font-sans text-[10px] font-black uppercase tracking-widest">
      <LuClock size={14} />
      Pending
    </div>
  );
  if (status === "Rejected") return (
    <div className="flex items-center gap-1.5 text-red-500 font-sans text-[10px] font-black uppercase tracking-widest">
      <LuCircleAlert size={14} />
      Rejected
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 text-muted font-sans text-[10px] font-black uppercase tracking-widest">
      <LuInfo size={14} />
      Missing
    </div>
  );
}
