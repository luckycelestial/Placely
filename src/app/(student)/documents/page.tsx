"use client";

import { useState, useEffect } from "react";
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
  LuPlus,
  LuX,
  LuUpload,
  LuCloudUpload
} from "react-icons/lu";
import { cn, isStudentInAudience } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { DEV_STUDENT_ID, isValidUuid } from "@/lib/dev-config";
import { toast } from "sonner";
import { getSystemSettings, getSettingByKey } from "@/services/settings";
import { getYearFromBatch, getBatchRangeFromYear, getRomanYear } from "@/lib/batch-utils";
import { uploadFileToR2, getSignedDownloadUrl, deleteFileFromR2 } from "@/lib/api-client";

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

interface Document {
  id: string;
  title: string;
  type: string;
  format: "link" | "file";
  reference: string;
  storagePath?: string;
  timestamp: string;
  status: "Completed" | "Pending" | "Rejected" | "Not Provided";
  isRequired: boolean;
}

const INITIAL_DOCUMENTS = [
  {
    title: "Primary Placement Resume",
    type: "Resume",
    format: "file" as const,
    reference: "Not Provided",
    storage_path: "",
    status: "Completed" as const,
    isRequired: true
  }
];

export default function DocumentsCenterPage() {
  const [documentsList, setDocumentsList] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"All" | "Required" | "Optional">("All");

  // Modal toggle states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Resume");
  const [format, setFormat] = useState<"link" | "file">("file");
  const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reference, setReference] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  
  const [validatingLink, setValidatingLink] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const clearForm = () => {
    setTitle("");
    setType("Resume");
    setFormat("file");
    setUploadMode("file");
    setSelectedFile(null);
    setUploading(false);
    setReference("");
    setIsRequired(false);
    setSelectedDoc(null);
    setValidatingLink(false);
  };

  const fetchDocs = async () => {
    if (!DEV_STUDENT_ID || !isValidUuid(DEV_STUDENT_ID)) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // Fetch current student details
      const { data: student, error: studentErr } = await supabase
        .from('students')
        .select(`
          id,
          year,
          department,
          student_profiles (specializations),
          student_preferences (work_mode_preference)
        `)
        .eq('id', DEV_STUDENT_ID)
        .maybeSingle();

      if (studentErr) {
        console.warn("Failed to fetch student profile details:", studentErr);
      }

      const { data: existingDocs, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', DEV_STUDENT_ID);

      if (error) throw error;

      // Fetch active document request notices
      const { data: noticesData } = await supabase
        .from('notices')
        .select('*')
        .eq('status', 'published');

      // Load system settings to check if academic year is completed
      const settings = await getSystemSettings();
      const isCompleted = settings.isAcademicYearCompleted;

      // Prepare student info for matching notice audience
      let studentBatchLabel = "";
      let studentSpecializations: string[] = [];
      let studentPlacementGroup = "";

      if (student) {
        if (student.year) {
          const range = getBatchRangeFromYear(student.year);
          const yearNum = getYearFromBatch(student.year, isCompleted);
          studentBatchLabel = `${range.startYear} - ${range.endYear} : ${getRomanYear(yearNum)}`;
        }
        
        const profiles = student.student_profiles;
        if (profiles) {
          studentSpecializations = (Array.isArray(profiles) ? profiles[0] : profiles)?.specializations || [];
        }

        const preferences = student.student_preferences;
        if (preferences) {
          const rawPref = (Array.isArray(preferences) ? preferences[0] : preferences)?.work_mode_preference || "";
          if (rawPref.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(rawPref);
              studentPlacementGroup = parsed["placement_groups"] || parsed["placement_group"] || "";
            } catch (e) {
              studentPlacementGroup = rawPref;
            }
          } else {
            studentPlacementGroup = rawPref;
          }
        }
      }

      // Fetch deleted default documents settings
      let deletedDefaults: string[] = [];
      try {
        deletedDefaults = await getSettingByKey<string[]>('deleted_default_documents', []);
      } catch (err) {
        console.warn("Failed to load deleted default documents settings:", err);
      }

      let mapped: Document[] = [];

      if (!existingDocs || existingDocs.length === 0) {
        // Seed initial documents in database
        const initialDocs = INITIAL_DOCUMENTS
          .filter(d => !deletedDefaults.some(deleted => deleted.toLowerCase() === d.title.toLowerCase()))
          .map(doc => ({
            student_id: DEV_STUDENT_ID,
            title: doc.title,
            document_type: doc.type,
            url: doc.reference,
            storage_path: (doc as any).format === "file" ? doc.reference : "",
            is_required: doc.isRequired,
            verification_status: doc.status,
          }));
        
        const { data: inserted, error: insertError } = await supabase
          .from('student_documents')
          .insert(initialDocs)
          .select();

        if (insertError) throw insertError;
        
        mapped = (inserted || []).map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.document_type,
          format: doc.storage_path ? ('file' as const) : ('link' as const),
          reference: doc.url || 'Not Provided',
          storagePath: doc.storage_path || '',
          timestamp: 'Just now',
          status: (doc.verification_status === "Verified" || doc.verification_status === "Completed") ? ("Completed" as const) : (doc.verification_status as any),
          isRequired: doc.is_required
        }));
      } else {
        mapped = existingDocs
          .filter(doc => doc.title && !deletedDefaults.some(deleted => deleted.toLowerCase() === doc.title.toLowerCase()))
          .map(doc => ({
            id: doc.id,
            title: doc.title,
            type: doc.document_type,
            format: doc.storage_path ? ('file' as const) : ('link' as const),
            reference: doc.url || 'Not Provided',
            storagePath: doc.storage_path || '',
            timestamp: doc.updated_at ? new Date(doc.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'N/A',
            status: (doc.verification_status === "Verified" || doc.verification_status === "Completed") ? ("Completed" as const) : (doc.verification_status as any),
            isRequired: doc.is_required
          }));
      }

      // Process document requests
      const virtualDocs: Document[] = [];
      if (noticesData) {
        noticesData
          .filter(notice => notice.title && notice.title.startsWith('[Document Request]'))
          .forEach(notice => {
            const aud = notice.audience || "All Batches";
            
            const isTargeted = isStudentInAudience(
              {
                department: student?.department || undefined,
                batch: studentBatchLabel ? studentBatchLabel.split(" : ")[0]?.trim().replace(/\s+/g, '') : undefined,
                specializations: studentSpecializations,
                placementGroup: studentPlacementGroup || undefined,
              },
              aud
            );

            if (!isTargeted) return;

            const docTitle = notice.title.replace('[Document Request] ', '').trim();
            const alreadyExists = mapped.some(
              d => d.title.toLowerCase() === docTitle.toLowerCase() && d.reference !== "Not Provided"
            );

            if (!alreadyExists) {
              let cat = 'Other';
              const catMatch = notice.body && notice.body.match(/^\[Category:\s*([^\]]+)\]/);
              if (catMatch && catMatch[1]) {
                cat = catMatch[1].trim();
              }

              // Check if there is an empty/Not Provided seeded/placeholder document with same title
              const existingPlaceholder = mapped.find(
                d => d.title.toLowerCase() === docTitle.toLowerCase()
              );

              if (existingPlaceholder) {
                // Just mark the existing placeholder as required if request specifies it
                existingPlaceholder.isRequired = true;
              } else {
                virtualDocs.push({
                  id: `req-${notice.id}`,
                  title: docTitle,
                  type: cat,
                  format: 'link',
                  reference: 'Not Provided',
                  timestamp: 'Requested by Admin',
                  status: 'Not Provided',
                  isRequired: true
                });
              }
            }
          });
      }

      setDocumentsList([...mapped, ...virtualDocs]);
    } catch (err) {
      console.error("Failed to load documents from database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleOpenAddModal = () => {
    clearForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (doc: Document) => {
    setSelectedDoc(doc);
    setTitle(doc.title);
    setType(doc.type);
    setFormat(doc.format);
    setReference(doc.reference === 'Not Provided' ? '' : doc.reference);
    setIsRequired(doc.isRequired);
    setUploadMode(doc.storagePath ? 'file' : 'link');
    setSelectedFile(null);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (doc: Document) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || validatingLink || uploading) return;

    let finalUrl = reference.trim();
    let finalStoragePath = "";
    let finalFormat: "file" | "link" = "link";

    if (uploadMode === "file") {
      if (!selectedFile) {
        toast.error("Please select a file to upload.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File exceeds 5MB limit. Please select a smaller file.");
        return;
      }

      setUploading(true);
      try {
        const uploadData = await uploadFileToR2(
          selectedFile,
          type === "Resume" ? "resume" : "document",
          title.trim()
        );
        finalUrl = uploadData.url;
        finalStoragePath = uploadData.key;
        finalFormat = "file";
      } catch (err: any) {
        console.error("Upload error:", err);
        toast.error(err.message || "Failed to upload file to Cloudflare R2.");
        setUploading(false);
        return;
      }
    } else {
      if (!finalUrl.includes('drive.google.com') && !finalUrl.includes('docs.google.com')) {
        toast.error('Must be a Google Drive or Google Docs link.');
        return;
      }

      setValidatingLink(true);
      try {
        const res = await fetch(`/api/validate-drive-link?url=${encodeURIComponent(finalUrl)}`);
        const valData = await res.json();
        if (!valData.valid) {
          toast.error(valData.error || 'Failed to validate Google Drive link.');
          setValidatingLink(false);
          return;
        }
      } catch (err) {
        toast.error("Failed to validate Google Drive link.");
        setValidatingLink(false);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('student_documents')
        .insert([{
          student_id: DEV_STUDENT_ID,
          title: title.trim(),
          document_type: type,
          url: finalUrl,
          storage_path: finalStoragePath,
          is_required: isRequired,
          verification_status: "Completed"
        }]);

      if (error) throw error;

      // Sync primary resume to student profile
      if (type === "Resume") {
        await supabase
          .from("student_profiles")
          .update({ resume_url: finalUrl })
          .eq("student_id", DEV_STUDENT_ID);
      }

      toast.success(uploadMode === "file" ? "File uploaded to Cloudflare R2 successfully!" : "Document link added successfully.");
      await fetchDocs(); // Reload from DB
      setIsAddModalOpen(false);
      clearForm();
    } catch (err: any) {
      console.error("Failed to add document:", err);
      toast.error(err.message || "Failed to add document.");
    } finally {
      setUploading(false);
      setValidatingLink(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !title.trim() || validatingLink || uploading) return;

    let finalUrl = selectedDoc.reference;
    let finalStoragePath = selectedDoc.storagePath || "";
    let finalFormat = selectedDoc.format;

    if (uploadMode === "file") {
      if (selectedFile) {
        if (selectedFile.size > 5 * 1024 * 1024) {
          toast.error("File exceeds 5MB limit. Please select a smaller file.");
          return;
        }

        setUploading(true);
        try {
          const uploadData = await uploadFileToR2(
            selectedFile,
            type === "Resume" ? "resume" : "document",
            title.trim()
          );

          // Clean up old file if different
          if (selectedDoc.storagePath && selectedDoc.storagePath !== uploadData.key) {
            deleteFileFromR2(selectedDoc.storagePath).catch(() => {});
          }

          finalUrl = uploadData.url;
          finalStoragePath = uploadData.key;
          finalFormat = "file";
        } catch (err: any) {
          console.error("Upload error:", err);
          toast.error(err.message || "Failed to upload file to Cloudflare R2.");
          setUploading(false);
          return;
        }
      }
    } else {
      const cleanUrl = reference.trim();
      if (!cleanUrl) {
        toast.error("Please provide a link.");
        return;
      }
      if (!cleanUrl.includes('drive.google.com') && !cleanUrl.includes('docs.google.com')) {
        toast.error('Must be a Google Drive or Google Docs link.');
        return;
      }

      setValidatingLink(true);
      try {
        const res = await fetch(`/api/validate-drive-link?url=${encodeURIComponent(cleanUrl)}`);
        const valData = await res.json();
        if (!valData.valid) {
          toast.error(valData.error || 'Failed to validate Google Drive link.');
          setValidatingLink(false);
          return;
        }
        finalUrl = cleanUrl;
        finalStoragePath = "";
        finalFormat = "link";
      } catch (err) {
        toast.error("Failed to validate Google Drive link.");
        setValidatingLink(false);
        return;
      }
    }

    const isVirtual = selectedDoc.id.toString().startsWith('req-');

    try {
      if (isVirtual) {
        const { error: err } = await supabase
          .from('student_documents')
          .insert([{
            student_id: DEV_STUDENT_ID,
            title: title.trim(),
            document_type: type,
            url: finalUrl,
            storage_path: finalStoragePath,
            is_required: isRequired,
            verification_status: "Completed"
          }]);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('student_documents')
          .update({
            title: title.trim(),
            document_type: type,
            url: finalUrl,
            storage_path: finalStoragePath,
            is_required: isRequired,
            verification_status: "Completed",
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedDoc.id);
        if (err) throw err;
      }

      // Sync primary resume to student profile
      if (type === "Resume") {
        await supabase
          .from("student_profiles")
          .update({ resume_url: finalUrl })
          .eq("student_id", DEV_STUDENT_ID);
      }

      toast.success("Document updated successfully.");
      await fetchDocs(); // Reload from DB
      setIsEditModalOpen(false);
      clearForm();
    } catch (err: any) {
      console.error("Failed to update document:", err);
      toast.error(err.message || "Failed to update document.");
    } finally {
      setUploading(false);
      setValidatingLink(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDoc) return;

    try {
      if (selectedDoc.storagePath) {
        deleteFileFromR2(selectedDoc.storagePath).catch((e) => console.warn("Failed to delete from R2:", e));
      }

      const { error } = await supabase
        .from('student_documents')
        .delete()
        .eq('id', selectedDoc.id);

      if (error) throw error;
      toast.success("Document deleted.");
      await fetchDocs(); // Reload from DB
      setIsDeleteModalOpen(false);
      setSelectedDoc(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
      toast.error("Failed to delete document.");
    }
  };

  const handlePreviewDoc = async (doc: Document) => {
    if (doc.reference === "Not Provided") return;
    if (doc.storagePath) {
      try {
        const presigned = await getSignedDownloadUrl(doc.storagePath);
        setPreviewDoc({ ...doc, reference: presigned });
        return;
      } catch (err: any) {
        console.error("Failed to generate preview URL:", err);
        toast.error("Failed to load secure document preview.");
        return;
      }
    }
    setPreviewDoc(doc);
  };

  const filteredDocs = documentsList.filter(doc => {
    if (activeTab === "Required") return doc.isRequired;
    if (activeTab === "Optional") return !doc.isRequired;
    return true;
  });

  const completionStats = {
    required: documentsList.filter(d => d.isRequired).length,
    completedRequired: documentsList.filter(d => d.isRequired && d.status === "Completed").length
  };

  const progress = completionStats.required > 0 
    ? Math.round((completionStats.completedRequired / completionStats.required) * 100)
    : 0;

  return (
    <div className="space-y-12 pt-2 pb-10 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div>
            <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
              Documents <span className="text-primary">Center.</span>
            </h2>
            <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed mt-2">
              Manage your placement identity. Keep your certifications, proofs, and resumes updated for completeness.
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
                {completionStats.completedRequired} of {completionStats.required} <span className="text-muted">Completed</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Active Document Notices / Requests */}
      {documentsList.some(d => d.status === "Not Provided" && d.id.toString().startsWith('req-')) && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center shrink-0">
              <LuCircleAlert size={24} />
            </div>
            <div>
              <h4 className="font-display text-lg font-black tracking-tight text-foreground">Action Required: Document Requests</h4>
              <p className="text-xs font-semibold text-muted leading-relaxed mt-1">
                Admin has requested you to upload: {documentsList
                  .filter(d => d.status === "Not Provided" && d.id.toString().startsWith('req-'))
                  .map(d => `"${d.title}"`)
                  .join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs and Actions */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between sticky -top-4 md:-top-6 z-30 bg-background/95 backdrop-blur-md py-2.5 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 w-full md:w-auto no-scrollbar">
          {["All", "Required", "Optional"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "All" | "Required" | "Optional")}
              className={cn(
                "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab 
                  ? "bg-foreground text-white shadow-tactile scale-105" 
                  : "bg-surface border border-border-subtle text-muted hover:border-primary hover:text-primary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="btn-primary w-full md:w-auto py-2.5 px-6 h-auto text-[10px] uppercase tracking-widest gap-3 cursor-pointer"
        >
          <LuPlus size={18} />
          Add New Document
        </button>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-44 rounded-3xl bg-surface animate-pulse" />
          <div className="h-44 rounded-3xl bg-surface animate-pulse" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.id} 
              onClick={() => doc.reference !== "Not Provided" && handlePreviewDoc(doc)}
              className="app-card group hover:border-primary/50 transition-all cursor-pointer"
            >
              <div className="p-8 flex items-start gap-6">
                <div className={cn(
                  "h-20 w-20 rounded-3xl flex items-center justify-center shrink-0 border border-border-subtle transition-all group-hover:scale-105 bg-primary/5 text-primary"
                )}>
                  {doc.format === "file" || doc.storagePath ? <LuFileText size={32} /> : <LuLink size={32} />}
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
                    {doc.reference !== "Not Provided" && <LuExternalLink size={12} className="text-muted/40" />}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <StatusBadge status={doc.status} />
                       <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">{doc.timestamp}</span>
                     </div>
                     <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleOpenEditModal(doc); }}
                         className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer"
                       >
                         <LuPencil size={18} />
                       </button>
                       {!doc.id.toString().startsWith('req-') && (
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleOpenDeleteModal(doc); }}
                           className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-muted hover:text-red-500 transition-all cursor-pointer"
                         >
                           <LuTrash2 size={18} />
                         </button>
                       )}
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
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenEditModal(doc); }}
                    className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline cursor-pointer"
                  >
                    Action Now
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
                 We prioritize cloud storage to keep your data secure. Upload marksheets directly to secure cloud hosts. Links must be shared publicly.
               </p>
             </div>
           </div>
           <button 
             onClick={() => setIsRulesModalOpen(true)}
             className="btn-secondary bg-surface border-none shadow-xl px-8 h-14 text-[10px] uppercase tracking-widest cursor-pointer"
           >
             Review Submission Rules
           </button>
        </div>
        <div className="absolute right-0 bottom-0 h-64 w-64 bg-primary/5 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
      </div>

      {/* ADD DOCUMENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-border-subtle p-8 rounded-[32px] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-muted hover:text-foreground cursor-pointer"
            >
              <LuX size={20} />
            </button>
            <h3 className="font-display text-2xl font-black tracking-tight mb-6">Add New Document</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-6">
              {/* Method Toggle: R2 File vs External Link */}
              <div className="flex bg-surface p-1 rounded-2xl border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer",
                    uploadMode === "file" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
                  )}
                >
                  <LuCloudUpload size={15} /> Upload File (R2)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("link")}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer",
                    uploadMode === "link" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
                  )}
                >
                  <LuLink size={15} /> Drive / URL
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Document Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Primary Placement Resume, 12th Marksheet"
                  required
                  className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Category Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground outline-none cursor-pointer"
                >
                  <option value="Resume">Resume</option>
                  <option value="Academic Proof">Academic Proof</option>
                  <option value="Certification">Certification</option>
                  <option value="Profile Link">Profile Link</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {uploadMode === "file" ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Select File</label>
                    <span className="text-[9px] font-bold text-muted bg-surface px-2 py-0.5 rounded-full border border-border-subtle">
                      Max 5MB • PDF, DOCX, Images
                    </span>
                  </div>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border-subtle hover:border-primary/50 rounded-2xl p-6 bg-surface cursor-pointer transition-all group">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("File exceeds 5MB limit. Please select a smaller file.");
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                    />
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <LuUpload size={20} />
                    </div>
                    {selectedFile ? (
                      <div className="text-center">
                        <p className="text-xs font-bold text-foreground truncate max-w-[280px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-muted">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs font-bold text-foreground">Click to select file</p>
                        <p className="text-[10px] text-muted mt-0.5">Stored in Cloudflare R2</p>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Google Drive Link</label>
                  {validatingLink ? (
                    <div className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 flex items-center justify-center gap-3">
                      <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-muted">Validating share status...</span>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={reference} 
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. https://drive.google.com/file/d/.../view"
                      required
                      className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground outline-none"
                    />
                  )}
                  <p className="text-[10px] text-muted-foreground/60 font-medium">Link must be shared as &quot;Anyone with the link can view&quot;.</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isRequiredAdd"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="h-5 w-5 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <label htmlFor="isRequiredAdd" className="text-xs font-bold text-muted cursor-pointer selection:bg-transparent select-none">
                  Mark as placement-critical required document
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border-subtle/50">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-14 bg-surface hover:bg-surface-hover text-muted text-xs font-black uppercase tracking-widest rounded-2xl border border-border-subtle cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={validatingLink || uploading}
                  className="flex-1 h-14 btn-primary text-xs uppercase tracking-widest rounded-2xl cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {uploading ? "Uploading to R2..." : "Add Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCUMENT MODAL */}
      {isEditModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-border-subtle p-8 rounded-[32px] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 text-muted hover:text-foreground cursor-pointer"
            >
              <LuX size={20} />
            </button>
            <h3 className="font-display text-2xl font-black tracking-tight mb-6">Edit Document Details</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Method Toggle */}
              <div className="flex bg-surface p-1 rounded-2xl border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer",
                    uploadMode === "file" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
                  )}
                >
                  <LuCloudUpload size={15} /> Upload File (R2)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("link")}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer",
                    uploadMode === "link" ? "bg-primary text-white shadow-sm" : "text-muted hover:text-foreground"
                  )}
                >
                  <LuLink size={15} /> Drive / URL
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Document Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 12th Marksheet, Certification Link"
                  required
                  className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Category Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground outline-none cursor-pointer"
                >
                  <option value="Resume">Resume</option>
                  <option value="Academic Proof">Academic Proof</option>
                  <option value="Certification">Certification</option>
                  <option value="Profile Link">Profile Link</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {uploadMode === "file" ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Replace File</label>
                    <span className="text-[9px] font-bold text-muted bg-surface px-2 py-0.5 rounded-full border border-border-subtle">
                      Max 5MB • PDF, DOCX, Images
                    </span>
                  </div>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border-subtle hover:border-primary/50 rounded-2xl p-6 bg-surface cursor-pointer transition-all group">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("File exceeds 5MB limit. Please select a smaller file.");
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                    />
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <LuUpload size={20} />
                    </div>
                    {selectedFile ? (
                      <div className="text-center">
                        <p className="text-xs font-bold text-foreground truncate max-w-[280px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-muted">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB (Ready to upload)</p>
                      </div>
                    ) : selectedDoc.storagePath ? (
                      <div className="text-center">
                        <p className="text-xs font-bold text-foreground truncate max-w-[280px]">File saved in Cloudflare R2</p>
                        <p className="text-[10px] text-muted mt-0.5">Click to choose a replacement file</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs font-bold text-foreground">Click to upload file</p>
                        <p className="text-[10px] text-muted mt-0.5">PDF, DOCX, PNG, or JPG (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">Google Drive Link</label>
                  {validatingLink ? (
                    <div className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 flex items-center justify-center gap-3">
                      <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-muted">Validating share status...</span>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={reference} 
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. https://drive.google.com/file/d/.../view"
                      required
                      className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground outline-none"
                    />
                  )}
                  <p className="text-[10px] text-muted-foreground/60 font-medium">Link must be shared as &quot;Anyone with the link can view&quot;.</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="isRequiredEdit"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="h-5 w-5 rounded border-border-subtle text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <label htmlFor="isRequiredEdit" className="text-xs font-bold text-muted cursor-pointer selection:bg-transparent select-none">
                  Mark as placement-critical required document
                </label>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border-subtle/50">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 h-14 bg-surface hover:bg-surface-hover text-muted text-xs font-black uppercase tracking-widest rounded-2xl border border-border-subtle cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={validatingLink || uploading}
                  className="flex-1 h-14 btn-primary text-xs uppercase tracking-widest rounded-2xl cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {uploading ? "Saving to R2..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-border-subtle p-8 rounded-[32px] w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <button 
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-6 right-6 text-muted hover:text-foreground cursor-pointer"
            >
              <LuX size={20} />
            </button>
            <div className="h-16 w-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <LuTrash2 size={28} />
            </div>
            
            <h3 className="font-display text-2xl font-black tracking-tight mb-2">Delete Document?</h3>
            <p className="text-sm font-semibold text-muted leading-relaxed mb-8 px-2">
              Are you sure you want to delete <span className="text-foreground font-black">&quot;{selectedDoc.title}&quot;</span>? This action is permanent and cannot be undone.
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 h-14 bg-surface hover:bg-surface-hover text-muted text-xs font-black uppercase tracking-widest rounded-2xl border border-border-subtle cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 h-14 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl cursor-pointer shadow-lg shadow-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFICATION RULES MODAL */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-border-subtle p-8 rounded-[32px] w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsRulesModalOpen(false)}
              className="absolute top-6 right-6 text-muted hover:text-foreground cursor-pointer"
            >
              <LuX size={20} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                <LuShieldCheck size={24} />
              </div>
              <h3 className="font-display text-2xl font-black tracking-tight">Submission Rules</h3>
            </div>
            
            <div className="space-y-6 text-sm font-semibold text-muted leading-relaxed max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
              <div className="space-y-2">
                <h4 className="text-foreground font-black text-base">1. Document Authenticity</h4>
                <p>All uploaded marksheets, certifications, and files must be clear and readable copies of the original document. Digitally generated copies or scanned physical proofs are acceptable.</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-foreground font-black text-base">2. Shareable Link Formats</h4>
                <p>When providing a shareable link (e.g. for Google Drive Resumes or Credly Certifications), make sure the link access permissions are set to public or shared with the institutional placement team domain. Private or restricted links will be rejected during audit.</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-foreground font-black text-base">3. Submission Progress</h4>
                <p>Newly added or edited documents are instantly marked as Completed. No manual staff approval or turnaround time is required.</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-foreground font-black text-base">4. Crucial Placement Documents</h4>
                <p>Documents marked as &quot;Required&quot; (e.g., standard resumes and cumulative grade transcripts) are critical for drive applications. Failure to complete these documents will restrict your eligibility for active recruitment drives.</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border-subtle/50 text-right">
              <button 
                onClick={() => setIsRulesModalOpen(false)}
                className="btn-primary py-3 px-8 text-xs uppercase tracking-widest rounded-2xl cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW DOCUMENT MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-border-subtle p-8 rounded-[32px] w-full max-w-4xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setPreviewDoc(null)}
              className="absolute top-6 right-6 text-muted hover:text-foreground cursor-pointer z-10"
            >
              <LuX size={20} />
            </button>
            <h3 className="font-display text-2xl font-black tracking-tight mb-2 truncate pr-10">{previewDoc.title}</h3>
            <p className="text-xs text-muted font-bold uppercase tracking-widest mb-6">{previewDoc.type}</p>
            
            <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden relative">
              {previewDoc.reference.toLowerCase().includes('.pdf') ? (
                <iframe 
                  src={previewDoc.reference} 
                  className="w-full h-[550px] border-0" 
                  title={previewDoc.title}
                />
              ) : previewDoc.reference.match(/\.(png|jpg|jpeg|webp)($|\?)/i) ? (
                <div className="flex items-center justify-center p-4 h-[550px] bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={previewDoc.reference} 
                    alt={previewDoc.title} 
                    className="max-h-[520px] max-w-full object-contain rounded-xl shadow-md" 
                  />
                </div>
              ) : getGoogleDrivePreviewUrl(previewDoc.reference) ? (
                <iframe 
                  src={getGoogleDrivePreviewUrl(previewDoc.reference)!} 
                  className="w-full h-[550px] border-0" 
                  allow="autoplay"
                  title={previewDoc.title}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
                  <div className="h-16 w-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center">
                    <LuCircleAlert size={32} />
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-display text-xl font-bold">No Direct Preview Available</h5>
                    <p className="text-sm font-semibold text-muted max-w-sm">This link structure does not support inline embedding, or is formatted incorrectly.</p>
                  </div>
                  <a 
                    href={previewDoc.reference} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-primary flex items-center gap-2 px-6"
                  >
                    Open Document Link <LuExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-subtle/50">
              <a 
                href={previewDoc.reference} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1.5"
              >
                Open in New Tab <LuExternalLink size={14} />
              </a>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="bg-surface hover:bg-surface-hover text-muted text-xs font-black uppercase tracking-widest rounded-2xl border border-border-subtle px-6 py-3 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Completed") return (
    <div className="flex items-center gap-1.5 text-emerald-500 font-sans text-[10px] font-black uppercase tracking-widest">
      <LuCircleCheck size={14} />
      Completed
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
