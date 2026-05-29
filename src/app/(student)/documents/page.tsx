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
  LuX
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { DEV_STUDENT_ID } from "@/lib/dev-config";

interface Document {
  id: string;
  title: string;
  type: string;
  format: "link" | "file";
  reference: string;
  timestamp: string;
  status: "Completed" | "Pending" | "Rejected" | "Not Provided";
  isRequired: boolean;
}

const INITIAL_DOCUMENTS = [
  {
    title: "Primary Placement Resume",
    type: "Resume",
    format: "link" as const,
    reference: "drive.google.com/resume-final",
    status: "Completed" as const,
    isRequired: true
  },
  {
    title: "10th Standard Marksheet",
    type: "Academic Proof",
    format: "file" as const,
    reference: "10th_Marksheet.pdf",
    status: "Completed" as const,
    isRequired: true
  },
  {
    title: "6th Semester Marksheet",
    type: "Academic Proof",
    format: "file" as const,
    reference: "",
    status: "Not Provided" as const,
    isRequired: true
  },
  {
    title: "AWS Certified Developer",
    type: "Certification",
    format: "link" as const,
    reference: "credly.com/aws-cert",
    status: "Pending" as const,
    isRequired: false
  },
  {
    title: "GitHub Portfolio",
    type: "Profile Link",
    format: "link" as const,
    reference: "github.com/johndoe",
    status: "Completed" as const,
    isRequired: false
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
  const [format, setFormat] = useState<"link" | "file">("link");
  const [reference, setReference] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);

  const clearForm = () => {
    setTitle("");
    setType("Resume");
    setFormat("link");
    setReference("");
    setIsRequired(false);
    setSelectedDoc(null);
    setUploadingFile(false);
  };

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const { data: existingDocs, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', DEV_STUDENT_ID);

      if (error) throw error;

      if (!existingDocs || existingDocs.length === 0) {
        // Seed initial documents in database
        const initialDocs = INITIAL_DOCUMENTS.map(doc => ({
          student_id: DEV_STUDENT_ID,
          title: doc.title,
          document_type: doc.type,
          url: doc.reference,
          storage_path: doc.format === "file" ? doc.reference : "",
          is_required: doc.isRequired,
          verification_status: doc.status,
        }));
        
        const { data: inserted, error: insertError } = await supabase
          .from('student_documents')
          .insert(initialDocs)
          .select();

        if (insertError) throw insertError;
        
        const mapped = (inserted || []).map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.document_type,
          format: doc.storage_path ? ('file' as const) : ('link' as const),
          reference: doc.url || 'Not Provided',
          timestamp: 'Just now',
          status: (doc.verification_status === "Verified" || doc.verification_status === "Completed") ? ("Completed" as const) : (doc.verification_status as any),
          isRequired: doc.is_required
        }));
        setDocumentsList(mapped);
      } else {
        const mapped = existingDocs.map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.document_type,
          format: doc.storage_path ? ('file' as const) : ('link' as const),
          reference: doc.url || 'Not Provided',
          timestamp: doc.updated_at ? new Date(doc.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : 'N/A',
          status: (doc.verification_status === "Verified" || doc.verification_status === "Completed") ? ("Completed" as const) : (doc.verification_status as any),
          isRequired: doc.is_required
        }));
        setDocumentsList(mapped);
      }
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
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (doc: Document) => {
    setSelectedDoc(doc);
    setIsDeleteModalOpen(true);
  };

  // Handle uploading the file to Supabase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${DEV_STUDENT_ID}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName);

      setReference(publicUrl); // Store public URL in reference
    } catch (err: any) {
      console.error("File upload failed:", err);
      alert(err.message || "Failed to upload file to Supabase Storage");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reference.trim() || uploadingFile) return;

    try {
      const { error } = await supabase
        .from('student_documents')
        .insert([{
          student_id: DEV_STUDENT_ID,
          title: title.trim(),
          document_type: type,
          url: reference.trim(),
          storage_path: format === "file" ? reference.trim() : "",
          is_required: isRequired,
          verification_status: "Completed" // Mark as completed on upload!
        }]);

      if (error) throw error;
      await fetchDocs(); // Reload from DB
      setIsAddModalOpen(false);
      clearForm();
    } catch (err) {
      console.error("Failed to add document:", err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !title.trim() || !reference.trim() || uploadingFile) return;

    try {
      const { error } = await supabase
        .from('student_documents')
        .update({
          title: title.trim(),
          document_type: type,
          url: reference.trim(),
          storage_path: format === "file" ? reference.trim() : "",
          is_required: isRequired,
          verification_status: "Completed", // Mark as completed on upload!
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedDoc.id);

      if (error) throw error;
      await fetchDocs(); // Reload from DB
      setIsEditModalOpen(false);
      clearForm();
    } catch (err) {
      console.error("Failed to update document:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDoc) return;

    try {
      const { error } = await supabase
        .from('student_documents')
        .delete()
        .eq('id', selectedDoc.id);

      if (error) throw error;
      await fetchDocs(); // Reload from DB
      setIsDeleteModalOpen(false);
      setSelectedDoc(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
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
                    {doc.format === "link" && doc.reference !== "Not Provided" && <LuExternalLink size={12} className="text-muted/40" />}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <StatusBadge status={doc.status} />
                       <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">{doc.timestamp}</span>
                     </div>
                     <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => handleOpenEditModal(doc)}
                         className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-muted hover:text-primary transition-all cursor-pointer"
                       >
                         <LuPencil size={18} />
                       </button>
                       <button 
                         onClick={() => handleOpenDeleteModal(doc)}
                         className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-muted hover:text-red-500 transition-all cursor-pointer"
                       >
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
                  <button 
                    onClick={() => handleOpenEditModal(doc)}
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Submission Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setFormat("link"); setReference(""); }}
                    className={cn(
                      "h-12 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                      format === "link" ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border-subtle text-muted"
                    )}
                  >
                    Shareable Link
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setFormat("file"); setReference(""); }}
                    className={cn(
                      "h-12 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                      format === "file" ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border-subtle text-muted"
                    )}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                  {format === "link" ? "URL Reference" : "Choose File to Upload"}
                </label>
                
                {format === "link" ? (
                  <input 
                    type="text" 
                    value={reference} 
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. drive.google.com/resume"
                    required
                    className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground outline-none"
                  />
                ) : uploadingFile ? (
                  <div className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 flex items-center justify-center gap-3">
                    <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-muted">Uploading to Supabase Storage...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      required={!reference}
                      className="w-full text-xs text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    {reference && (
                      <p className="text-[10px] font-bold text-emerald-500 truncate">
                        Uploaded: {reference.split('/').pop()}
                      </p>
                    )}
                  </div>
                )}
              </div>

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
                  disabled={uploadingFile}
                  className="flex-1 h-14 btn-primary text-xs uppercase tracking-widest rounded-2xl cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  Add Document
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Submission Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setFormat("link"); setReference(""); }}
                    className={cn(
                      "h-12 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                      format === "link" ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border-subtle text-muted"
                    )}
                  >
                    Shareable Link
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setFormat("file"); setReference(""); }}
                    className={cn(
                      "h-12 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer",
                      format === "file" ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border-subtle text-muted"
                    )}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">
                  {format === "link" ? "URL Reference" : "Choose File to Upload"}
                </label>
                
                {format === "link" ? (
                  <input 
                    type="text" 
                    value={reference} 
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. drive.google.com/resume"
                    required
                    className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground outline-none"
                  />
                ) : uploadingFile ? (
                  <div className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 flex items-center justify-center gap-3">
                    <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-muted">Uploading to Supabase Storage...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      required={!reference}
                      className="w-full text-xs text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    {reference && (
                      <p className="text-[10px] font-bold text-emerald-500 truncate">
                        Uploaded: {reference.split('/').pop()}
                      </p>
                    )}
                  </div>
                )}
              </div>

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
                  disabled={uploadingFile}
                  className="flex-1 h-14 btn-primary text-xs uppercase tracking-widest rounded-2xl cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  Save Changes
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
              Are you sure you want to delete <span className="text-foreground font-black">"{selectedDoc.title}"</span>? This action is permanent and cannot be undone.
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
                <p>Documents marked as "Required" (e.g., standard resumes and cumulative grade transcripts) are critical for drive applications. Failure to complete these documents will restrict your eligibility for active recruitment drives.</p>
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
