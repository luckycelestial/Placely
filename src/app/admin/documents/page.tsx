"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  LuSearch, 
  LuX, 
  LuExternalLink, 
  LuCircleCheck, 
  LuClock, 
  LuCircleAlert,
  LuFolderOpen,
  LuTrash2,
  LuPencil
} from "react-icons/lu";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { 
  getSettingByKey, 
  updateSettingByKey,
  DEFAULT_CUSTOM_GROUPS, 
  type CustomGroup 
} from "@/services/settings";
import { BroadcastModal } from "./components/BroadcastModal";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { EditModal } from "./components/EditModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";
import { DetailsModal } from "./components/DetailsModal";
import { PreviewModal } from "./components/PreviewModal";

interface StudentStatus {
  studentId: string;
  name: string;
  registerNumber: string;
  department: string;
  submissionId?: string;
  url?: string;
  status: "Completed" | "Pending" | "Rejected" | "Not Provided";
  updatedAt?: string;
}

interface GroupedDoc {
  title: string;
  type: string;
  students: StudentStatus[];
  stats: {
    total: number;
    uploaded: number;
    completed: number;
    pending: number;
    missing: number;
  };
  noticeId?: string;
  noticeDetails?: {
    priority: string;
    audience: string;
    body: string;
  };
}

interface PreviewDocInfo {
  title: string;
  type: string;
  url: string;
  studentName: string;
  studentRegisterNumber: string;
  submissionId: string;
  status: "Completed" | "Pending" | "Rejected" | "Not Provided";
}

const categoryOptions = [
  { value: "Resume", label: "Resume" },
  { value: "Academic Proof", label: "Academic Proof" },
  { value: "Certification", label: "Certification" },
  { value: "Profile Link", label: "Profile Link" },
  { value: "Other", label: "Other" }
];

const priorityOptions = [
  { value: "Informational", label: "Informational" },
  { value: "Reminder", label: "Reminder" },
  { value: "Urgent", label: "Urgent" }
];

const batchOptions = (() => {
  const currentYear = new Date().getFullYear();
  const romanNumerals = ["I", "II", "III", "IV"];
  const options = [{ value: "All Batches", label: "All Batches" }];

  for (let i = 4; i >= 1; i--) {
    const startYear = currentYear - (i - 1);
    const endYear = startYear + 4;
    const label = `${startYear} - ${endYear} : ${romanNumerals[i - 1]}`;
    options.push({ value: label, label: label });
  }
  return options;
})();

function getGoogleDrivePreviewUrl(url: string): string | null {
  if (!url) return null;
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
  }
  const docIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docIdMatch && docIdMatch[1]) {
    return `https://docs.google.com/document/d/${docIdMatch[1]}/preview`;
  }
  const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetIdMatch && sheetIdMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/preview`;
  }
  const presIdMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (presIdMatch && presIdMatch[1]) {
    return `https://docs.google.com/presentation/d/${presIdMatch[1]}/preview`;
  }
  return null;
}

export default function AdminDocumentsPage() {
  const [groupedDocuments, setGroupedDocuments] = useState<GroupedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Completed" | "Missing">("All");
  const [batchOptions, setBatchOptions] = useState<{ value: string; label: string }[]>([]);
  const [groupOptions, setGroupOptions] = useState<{ value: string; label: string }[]>([]);
  const [docToDelete, setDocToDelete] = useState<{ title: string; noticeId: string } | null>(null);
  
  // Modals state
  const [previewDoc, setPreviewDoc] = useState<PreviewDocInfo | null>(null);
  const [selectedDetailsDoc, setSelectedDetailsDoc] = useState<GroupedDoc | null>(null);

  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Academic Proof");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"Urgent" | "Reminder" | "Informational">("Informational");
  const [editBatch, setEditBatch] = useState("All Batches");
  const [editGroup, setEditGroup] = useState("All Groups");

  // Load audience options from custom groups settings dynamically
  useEffect(() => {
    async function loadOptions() {
      const currentYear = new Date().getFullYear();
      const romanNumerals = ["I", "II", "III", "IV"];
      const bOptions = [{ value: "All Batches", label: "All Batches" }];

      for (let i = 4; i >= 1; i--) {
        const startYear = currentYear - (i - 1);
        const endYear = startYear + 4;
        const label = `${startYear} - ${endYear} : ${romanNumerals[i - 1]}`;
        bOptions.push({ value: label, label: label });
      }
      setBatchOptions(bOptions);

      const gOptions = [{ value: "All Groups", label: "All Groups" }];
      try {
        const groupsData = await getSettingByKey<CustomGroup[]>('custom_groups', DEFAULT_CUSTOM_GROUPS);
        if (groupsData) {
          groupsData.forEach(group => {
            if (group.options) {
              group.options.forEach(opt => {
                if (!gOptions.some(o => o.value === opt)) {
                  gOptions.push({ value: opt, label: opt });
                }
              });
            }
          });
        }
      } catch (err) {
        console.error("Failed to load custom groups settings for audience:", err);
      }

      setGroupOptions(gOptions);
    }
    loadOptions();
  }, []);

  const executeDeleteRequest = async () => {
    if (!docToDelete) return;
    try {
      if (docToDelete.noticeId) {
        // 1. Delete the notice request
        const { error } = await supabase
          .from("notices")
          .delete()
          .eq("id", docToDelete.noticeId);

        if (error) throw error;
      } else {
        // It's a default document. Save to settings to hide it.
        const deletedDefaults = await getSettingByKey<string[]>('deleted_default_documents', []);
        const newDeleted = [...deletedDefaults];
        const lowerTitle = docToDelete.title.toLowerCase();
        if (!newDeleted.includes(lowerTitle)) {
          newDeleted.push(lowerTitle);
          await updateSettingByKey('deleted_default_documents', newDeleted);
        }
      }

      // 2. Also delete all student submissions for this document request
      const { error: docsError } = await supabase
        .from("student_documents")
        .delete()
        .eq("title", docToDelete.title);

      if (docsError) throw docsError;

      toast.success("Document request and student submissions deleted successfully.");
      setDocToDelete(null);
      await fetchAllDocs();
    } catch (err) {
      console.error("Failed to delete document request:", err);
      toast.error("Failed to delete document request.");
    }
  };

  // Sync selectedDetailsDoc details when groupedDocuments updates
  useEffect(() => {
    if (selectedDetailsDoc) {
      const updated = groupedDocuments.find(g => g.title === selectedDetailsDoc.title);
      if (updated) {
        setSelectedDetailsDoc(updated);
      }
    }
  }, [groupedDocuments, selectedDetailsDoc?.title]);

  const handleEditRequestInit = (group: GroupedDoc) => {
    if (!group.noticeId || !group.noticeDetails) return;
    
    setEditingNoticeId(group.noticeId);
    setEditTitle(group.title);
    setEditCategory(group.type);
    
    const categoryPrefix = `[Category: ${group.type}] `;
    let desc = group.noticeDetails.body;
    if (desc.startsWith(categoryPrefix)) {
      desc = desc.substring(categoryPrefix.length);
    } else {
      const closingBracketIndex = desc.indexOf('] ');
      if (desc.startsWith('[Category:') && closingBracketIndex !== -1) {
        desc = desc.substring(closingBracketIndex + 2);
      }
    }
    setEditDescription(desc.trim());
    
    const priorityReverseMap: Record<string, "Urgent" | "Reminder" | "Informational"> = {
      high: "Urgent",
      normal: "Informational",
      low: "Reminder"
    };
    setEditPriority(priorityReverseMap[group.noticeDetails.priority] || "Informational");
    
    const audience = group.noticeDetails.audience || "All Batches | All Groups";
    const [batchPart, groupPart] = audience.split(" | ");
    setEditBatch(batchPart ? batchPart.trim() : "All Batches");
    setEditGroup(groupPart ? groupPart.trim() : "All Groups");
    
    setIsEditModalOpen(true);
  };

  const fetchAllDocs = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all students
      const { data: studentsData, error: studentsErr } = await supabase
        .from("students")
        .select("id, name, register_number, department")
        .order("name", { ascending: true });

      if (studentsErr) throw studentsErr;

      // Fetch all uploaded student documents
      const { data: docsData, error: docsErr } = await supabase
        .from("student_documents")
        .select("id, student_id, title, document_type, url, verification_status, updated_at")
        .order("updated_at", { ascending: false });

      if (docsErr) throw docsErr;

      // Fetch all active notices to detect custom document requests
      const { data: noticesData } = await supabase
        .from("notices")
        .select("id, title, body, priority, audience")
        .eq("status", "published");

      // Build unique list of document types/titles
      const uniqueDocs = new Map<
        string, 
        { 
          title: string; 
          type: string; 
          noticeId?: string;
          noticeDetails?: {
            priority: string;
            audience: string;
            body: string;
          };
        }
      >();

      // Fetch deleted default documents settings
      let deletedDefaults: string[] = [];
      try {
        deletedDefaults = await getSettingByKey<string[]>('deleted_default_documents', []);
      } catch (err) {
        console.warn("Failed to load deleted default documents:", err);
      }

      // Seed with initial default documents
      const INITIAL_TITLES = [
        { title: "Primary Placement Resume", type: "Resume" },
        { title: "10th Standard Marksheet", type: "Academic Proof" },
        { title: "6th Semester Marksheet", type: "Academic Proof" },
        { title: "AWS Certified Developer", type: "Certification" },
        { title: "GitHub Portfolio", type: "Profile Link" }
      ].filter(d => !deletedDefaults.some(deleted => deleted.toLowerCase() === d.title.toLowerCase()));
      INITIAL_TITLES.forEach(d => uniqueDocs.set(d.title.toLowerCase(), d));

      // Append notice requested documents
      if (noticesData) {
        noticesData
          .filter(n => n.title && n.title.startsWith('[Document Request]'))
          .forEach(n => {
            const title = n.title.replace('[Document Request] ', '').trim();
            let cat = 'Other';
            const catMatch = n.body && n.body.match(/^\[Category:\s*([^\]]+)\]/);
            if (catMatch && catMatch[1]) {
              cat = catMatch[1].trim();
            }
            uniqueDocs.set(title.toLowerCase(), { 
              title, 
              type: cat, 
              noticeId: n.id,
              noticeDetails: {
                priority: n.priority || "normal",
                audience: n.audience || "All Batches | All Groups",
                body: n.body || ""
              }
            });
          });
      }

      // Append any other unique uploaded document titles from DB
      if (docsData) {
        docsData.forEach(d => {
          if (d.title) {
            const lower = d.title.toLowerCase();
            if (!uniqueDocs.has(lower) && !deletedDefaults.some(deleted => deleted.toLowerCase() === lower)) {
              uniqueDocs.set(lower, { title: d.title, type: d.document_type || 'Other' });
            }
          }
        });
      }

      // Map students to statuses for each document type
      const grouped: GroupedDoc[] = [];
      const students = studentsData || [];

      uniqueDocs.forEach((docInfo) => {
        const studentStatuses: StudentStatus[] = students.map((std) => {
          const upload = docsData?.find(
            (d) => d.student_id === std.id && d.title.toLowerCase() === docInfo.title.toLowerCase()
          );

          if (upload && upload.url && upload.url !== "Not Provided") {
            const mappedStatus = (upload.verification_status === "Verified" || upload.verification_status === "Completed")
              ? ("Completed" as const)
              : (upload.verification_status as any || "Pending");
            return {
              studentId: std.id,
              name: std.name || "Unknown Student",
              registerNumber: std.register_number || "N/A",
              department: std.department || "N/A",
              submissionId: upload.id,
              url: upload.url,
              status: mappedStatus,
              updatedAt: upload.updated_at ? new Date(upload.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : "N/A"
            };
          }

          return {
            studentId: std.id,
            name: std.name || "Unknown Student",
            registerNumber: std.register_number || "N/A",
            department: std.department || "N/A",
            status: "Not Provided" as const
          };
        });

        const total = studentStatuses.length;
        const uploaded = studentStatuses.filter(s => s.status !== "Not Provided").length;
        const completed = studentStatuses.filter(s => s.status === "Completed").length;
        const pending = studentStatuses.filter(s => s.status === "Pending").length;
        const missing = studentStatuses.filter(s => s.status !== "Completed" && s.status !== "Pending").length;

        grouped.push({
          title: docInfo.title,
          type: docInfo.type,
          students: studentStatuses,
          stats: { total, uploaded, completed, pending, missing },
          noticeId: docInfo.noticeId,
          noticeDetails: docInfo.noticeDetails
        });
      });

      grouped.sort((a, b) => a.title.localeCompare(b.title));
      setGroupedDocuments(grouped);
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error("Error loading student documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllDocs();
  }, [fetchAllDocs]);

  const handleUpdateStatus = async (submissionId: string, newStatus: "Completed" | "Rejected") => {
    try {
      const { error } = await supabase
        .from("student_documents")
        .update({
          verification_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", submissionId);

      if (error) throw error;

      toast.success(`Document ${newStatus === "Completed" ? "approved" : "rejected"} successfully.`);
      await fetchAllDocs();
      
      if (previewDoc && previewDoc.submissionId === submissionId) {
        setPreviewDoc(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update verification status.");
    }
  };

  const filteredGrouped = groupedDocuments
    .map(group => {
      const filteredStudents = group.students.filter(std => {
        let matchesStatus = true;
        if (statusFilter === "Pending") matchesStatus = std.status === "Pending";
        else if (statusFilter === "Completed") matchesStatus = std.status === "Completed";
        else if (statusFilter === "Missing") matchesStatus = std.status === "Not Provided" || std.status === "Rejected";

        const s = search.toLowerCase();
        const matchesSearch = 
          group.title.toLowerCase().includes(s) ||
          std.name.toLowerCase().includes(s) ||
          std.registerNumber.toLowerCase().includes(s) ||
          std.department.toLowerCase().includes(s);

        return matchesStatus && matchesSearch;
      });

      return {
        ...group,
        filteredStudents
      };
    })
    .filter(group => group.filteredStudents.length > 0);

  const handleExportExcel = async () => {
    const toastId = toast.loading("Exporting Excel...");
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const exportRows: any[] = [];
      filteredGrouped.forEach(group => {
        group.filteredStudents.forEach(std => {
          exportRows.push({
            "Document Title": group.title,
            "Category": group.type || "Academic Proof",
            "Student Name": std.name,
            "Register Number": std.registerNumber,
            "Department": std.department,
            "Verification Status": std.status
          });
        });
      });

      exportToExcel(exportRows, "Documents_Verification_Report", "Documents");
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
      const headers = ["Document Title", "Category", "Student Name", "Reg No", "Dept", "Status"];
      const rows: any[][] = [];
      filteredGrouped.forEach(group => {
        group.filteredStudents.forEach(std => {
          rows.push([
            group.title,
            group.type || "Academic Proof",
            std.name,
            std.registerNumber,
            std.department,
            std.status
          ]);
        });
      });

      await exportToPDF("Documents Verification Report", headers, rows, "Documents_Verification_Report");
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Documents Management</h1>
          <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">Review and verify student credentials</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />
          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="btn-primary py-2.5 px-6 h-auto text-[10px] uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-tactile"
          >
            <LuFolderOpen size={16} />
            Broadcast Upload Notice
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student, register number, title..."
            className="w-full h-11 bg-surface border border-border-subtle rounded-xl pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-primary transition-all text-foreground"
          />
          <LuSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full md:w-auto no-scrollbar">
          {(["All", "Pending", "Completed", "Missing"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                statusFilter === tab 
                  ? "bg-foreground text-background" 
                  : "bg-surface border border-border-subtle text-muted hover:text-foreground"
              )}
            >
              {tab === "Pending" ? "Pending Review" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main content grid */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-24 bg-surface rounded-3xl animate-pulse" />
          <div className="h-24 bg-surface rounded-3xl animate-pulse" />
          <div className="h-24 bg-surface rounded-3xl animate-pulse" />
        </div>
      ) : filteredGrouped.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-dashed border-border-subtle p-20 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center text-muted mb-6">
            <LuFolderOpen size={32} />
          </div>
          <h3 className="text-xl font-black tracking-tight mb-2 uppercase">No Documents Found</h3>
          <p className="text-xs font-bold text-muted max-w-sm">No document types or student statuses match current search or filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGrouped.map((group) => {
            return (
              <div 
                key={group.title}
                className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-md transition-all hover:border-primary/30"
              >
                {/* Header Card */}
                <div 
                  onClick={() => setSelectedDetailsDoc(group)}
                  className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-border-subtle shrink-0">
                      <LuFolderOpen size={24} />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-black tracking-tight text-foreground">{group.title}</h3>
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">{group.type}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 md:gap-8">
                    {/* Status Stats */}
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted">
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-foreground">{group.stats.completed}</span> Verified
                      </div>
                      {group.stats.pending > 0 && (
                        <div className="flex items-center gap-1 text-amber-500 animate-pulse">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span>{group.stats.pending}</span> Pending
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-foreground">{group.stats.missing}</span> Missing
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="flex-1 h-2 bg-background border border-border-subtle rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${group.stats.total > 0 ? (group.stats.completed / group.stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-muted">
                        {Math.round(group.stats.total > 0 ? (group.stats.completed / group.stats.total) * 100 : 0)}%
                      </span>
                    </div>

                    {group.noticeId ? (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRequestInit(group);
                          }}
                          className="h-10 px-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
                        >
                          <LuPencil size={13} />
                          Edit Request
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocToDelete({ title: group.title, noticeId: group.noticeId! });
                          }}
                          className="h-10 px-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
                        >
                          <LuTrash2 size={13} />
                          Delete Request
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocToDelete({ title: group.title, noticeId: "" });
                        }}
                        className="h-10 px-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
                      >
                        <LuTrash2 size={13} />
                        Delete Request
                      </button>
                    )}
                    <button className="h-10 px-4 rounded-xl border border-border-subtle hover:bg-black/5 transition-all text-[10px] font-black uppercase tracking-widest text-muted cursor-pointer">
                      Show Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILS POPUP MODAL */}
      {selectedDetailsDoc && (
        <DetailsModal
          selectedDetailsDoc={selectedDetailsDoc}
          onClose={() => {
            setSelectedDetailsDoc(null);
          }}
          onUpdateStatus={handleUpdateStatus}
          onPreviewStudentDoc={(std) => {
            setPreviewDoc({
              title: selectedDetailsDoc.title,
              type: selectedDetailsDoc.type,
              url: std.url!,
              studentName: std.name,
              studentRegisterNumber: std.registerNumber,
              submissionId: std.submissionId!,
              status: std.status
            });
          }}
        />
      )}

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <PreviewModal
          previewDoc={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* BROADCAST REQUEST MODAL */}
      {isBroadcastModalOpen && (
        <BroadcastModal
          onClose={() => setIsBroadcastModalOpen(false)}
          onBroadcast={async (data) => {
            const priorityMap = {
              Urgent: "high",
              Informational: "normal",
              Reminder: "low"
            };

            const { error } = await supabase
              .from("notices")
              .insert([{
                title: `[Document Request] ${data.title.trim()}`,
                body: `[Category: ${data.category}] ${data.description.trim()}`,
                audience: `${data.batch} | ${data.group}`,
                priority: priorityMap[data.priority],
                status: "published",
                pinned: true,
                publish_at: new Date().toISOString()
              }]);

            if (error) throw error;

            toast.success("Document upload notice broadcasted successfully!");
            setIsBroadcastModalOpen(false);
            await fetchAllDocs();
          }}
          categoryOptions={categoryOptions}
          priorityOptions={priorityOptions}
          batchOptions={batchOptions}
          groupOptions={groupOptions}
        />
      )}

      {/* EDIT REQUEST MODAL */}
      {isEditModalOpen && (
        <EditModal
          initialTitle={editTitle}
          initialCategory={editCategory}
          initialDescription={editDescription}
          initialPriority={editPriority}
          initialBatch={editBatch}
          initialGroup={editGroup}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingNoticeId(null);
          }}
          onUpdate={async (data) => {
            const priorityMap = {
              Urgent: "high",
              Informational: "normal",
              Reminder: "low"
            };

            const { error } = await supabase
              .from("notices")
              .update({
                title: `[Document Request] ${data.title.trim()}`,
                body: `[Category: ${data.category}] ${data.description.trim()}`,
                audience: `${data.batch} | ${data.group}`,
                priority: priorityMap[data.priority],
                publish_at: new Date().toISOString()
              })
              .eq("id", editingNoticeId);

            if (error) throw error;

            toast.success("Document request updated successfully!");
            setIsEditModalOpen(false);
            setEditingNoticeId(null);
            await fetchAllDocs();
          }}
          categoryOptions={categoryOptions}
          priorityOptions={priorityOptions}
          batchOptions={batchOptions}
          groupOptions={groupOptions}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {docToDelete && (
        <DeleteConfirmationModal
          title={docToDelete.title}
          onClose={() => setDocToDelete(null)}
          onConfirm={executeDeleteRequest}
        />
      )}
    </div>
  );
}
