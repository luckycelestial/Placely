"use client";
import { Sk } from "@/components/ui/skeleton";

import { useState, useEffect } from "react";
import { 
  LuSearch, 
  LuDownload, 
  LuCircleCheck, 
  LuCircleX, 
  LuClock, 
  LuCalendar, 
  LuBuilding2, 
  LuEllipsis, 
  LuTriangleAlert,
  LuBriefcase,
  LuShieldCheck,
  LuExternalLink,
  LuTrash,
  LuUpload,
  LuX
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import { supabase } from "@/lib/supabase";

const FILTERS = ["All", "Pending", "Verified", "Joined", "Deferred", "Mismatch"];

interface AdminOffer {
  id: string;
  studentId?: string;
  studentName: string;
  regNo: string;
  company: string;
  role: string;
  package: string;
  status: string;
  joiningDate: string;
  outcome: string;
  verification: string;
  avatar: string;
}

export default function OffersPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    mismatch: 0
  });

  // Modal states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  const [selectedOffer, setSelectedOffer] = useState<AdminOffer | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatingOffer, setUpdatingOffer] = useState(false);

  // Delete modal states
  const [offerToDelete, setOfferToDelete] = useState<AdminOffer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOffer, setDeletingOffer] = useState(false);

  // Form states for update offer
  const [editVerification, setEditVerification] = useState("pending");
  const [editOutcome, setEditOutcome] = useState("issued");
  const [editJoiningDate, setEditJoiningDate] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await db.getOffers();
      const mappedOffers = data.map((offer: any) => {
        const student = Array.isArray(offer.students) ? offer.students[0] : offer.students;
        const user = Array.isArray(student?.users) ? student.users[0] : student?.users;
        const company = Array.isArray(offer.companies) ? offer.companies[0] : offer.companies;

        return {
          id: String(offer.id),
          studentId: student?.id ? String(student.id) : undefined,
          studentName: String(user?.name || "Unknown"),
          regNo: String(student?.register_number || "N/A"),
          company: String(company?.name || "Unknown"),
          role: String(offer.role_title || "N/A"),
          package: String(offer.package_ctc || "N/A"),
          status: String(offer.acceptance_status || "N/A"),
          joiningDate: String(offer.joining_date || "N/A"),
          outcome: String(offer.offer_status || "N/A"),
          verification: String(offer.verification_status || "N/A"),
          avatar: String((user?.name || "U").split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2))
        } as AdminOffer;
      });
      setOffers(mappedOffers);
      
      // Compute stats
      setStats({
        total: mappedOffers.length,
        verified: mappedOffers.filter((o) => ['verified', 'joined'].includes(o.verification)).length,
        pending: mappedOffers.filter((o) => o.verification === 'pending').length,
        mismatch: mappedOffers.filter((o) => o.verification === 'rejected').length
      });
    } catch (error) {
      console.error("Failed to fetch offers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.studentName.toLowerCase().includes(search.toLowerCase()) || 
      offer.company.toLowerCase().includes(search.toLowerCase()) ||
      offer.regNo.toLowerCase().includes(search.toLowerCase());
    
    if (activeFilter === "All") return matchesSearch;
    if (activeFilter === "Mismatch") return matchesSearch && offer.verification === "rejected";
    return matchesSearch && offer.verification.toLowerCase() === activeFilter.toLowerCase();
  });

  // Action: Export CSV
  const handleExportCSV = () => {
    const headers = "Student Name,Register Number,Company,Role,Package,Status,Joining Date,Outcome,Verification\n";
    const rows = filteredOffers.map(offer => {
      return `"${offer.studentName}","${offer.regNo}","${offer.company}","${offer.role}","${offer.package}","${offer.status}","${offer.joiningDate}","${offer.outcome}","${offer.verification}"`;
    }).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `offers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action: Candidate Report download
  const handleDownloadReport = async (offer: AdminOffer) => {
    if (!offer.studentId) {
      alert("Candidate profile reference not found.");
      return;
    }
    try {
      const blob = await db.generateStudentReport(offer.studentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${offer.studentName.replace(/\s+/g, '_')}_${offer.regNo}.pdf`;
      a.click();
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate candidate details report.");
    }
  };

  // Action: Confirm Delete Offer
  const handleDeleteConfirm = async () => {
    if (!offerToDelete) return;
    setDeletingOffer(true);
    try {
      await db.deleteOffer(offerToDelete.id);
      setOffers(prev => prev.filter(o => o.id !== offerToDelete.id));
      // Recalculate stats
      const updated = offers.filter(o => o.id !== offerToDelete.id);
      setStats({
        total: updated.length,
        verified: updated.filter((o) => ['verified', 'joined'].includes(o.verification)).length,
        pending: updated.filter((o) => o.verification === 'pending').length,
        mismatch: updated.filter((o) => o.verification === 'rejected').length
      });
      setIsDeleteModalOpen(false);
      setOfferToDelete(null);
    } catch (error) {
      console.error("Failed to delete offer:", error);
      alert("Failed to delete offer record from database.");
    } finally {
      setDeletingOffer(false);
    }
  };

  // Action: Open Update Modal
  const openUpdateModal = (offer: AdminOffer) => {
    setSelectedOffer(offer);
    setEditVerification(offer.verification);
    setEditOutcome(offer.outcome);
    setEditJoiningDate(offer.joiningDate !== "N/A" ? offer.joiningDate : "");
    setIsUpdateModalOpen(true);
  };

  // Action: Submit Update
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    setUpdatingOffer(true);
    try {
      // Perform atomic update in a single database roundtrip
      await db.updateOffer(selectedOffer.id, {
        verification_status: editVerification,
        offer_status: editOutcome,
        joining_date: editJoiningDate || null
      });

      setIsUpdateModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("Failed to update offer:", error);
      alert("An error occurred while updating the offer record.");
    } finally {
      setUpdatingOffer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Offers & Joinees</h1>
          <p className="text-muted text-sm font-medium">Verify final outcomes and track the offer-to-joining lifecycle.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl bg-surface border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors"
          >
            <LuDownload size={16} />
            Export Final List
          </button>
          <button 
            onClick={() => {
              setProcessingStatus("");
              setIsBulkModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-tactile hover:bg-primary-dark transition-all"
          >
            <LuUpload size={16} />
            Upload Bulk Results
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Offers", value: stats.total.toString(), color: "text-foreground" },
          { label: "Verified", value: stats.verified.toString(), color: "text-emerald-600" },
          { label: "Pending", value: stats.pending.toString(), color: "text-blue-600" },
          { label: "Mismatches", value: stats.mismatch.toString(), color: "text-red-600" }
        ].map((stat) => (
          <div key={stat.label} className="p-5 rounded-3xl border border-border-subtle bg-surface shadow-soft">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-1 bg-background p-1 rounded-2xl w-fit border border-border-subtle overflow-x-auto no-scrollbar">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap",
                activeFilter === filter 
                  ? "bg-surface text-primary shadow-sm" 
                  : "text-muted hover:text-foreground"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Search student or company..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border-subtle bg-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-background/50">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Candidate</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Placement Details</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Package</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Verification</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Outcome</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <Sk.TableRows cols={6} rows={6} />
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted font-bold text-sm">
                    No offers found.
                  </td>
                </tr>
              ) : filteredOffers.map((offer) => (
                <tr key={offer.id} className="group hover:bg-primary/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                        {offer.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-none mb-1">{offer.studentName}</p>
                        <p className="text-muted text-[11px] font-medium uppercase tracking-wider">{offer.regNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <LuBuilding2 size={12} className="text-muted" />
                        <p className="text-sm font-bold text-foreground/80">{offer.company}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <LuBriefcase size={12} className="text-muted" />
                        <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{offer.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-foreground/70">{offer.package}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {offer.verification === "verified" ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg">
                          <LuShieldCheck size={14} />
                          Verified
                        </span>
                      ) : offer.verification === "pending" ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight text-orange-600 bg-orange-500/10 px-2 py-1 rounded-lg">
                          <LuClock size={14} />
                          Pending
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight text-red-600 bg-red-500/10 px-2 py-1 rounded-lg">
                          <LuTriangleAlert size={14} />
                          Mismatch
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className={cn(
                        "text-xs font-bold mb-1 uppercase tracking-wider",
                        offer.outcome === "accepted" ? "text-emerald-600" : 
                        offer.outcome === "issued" ? "text-blue-600" :
                        offer.outcome === "rejected" ? "text-red-600" : "text-muted"
                      )}>
                        {offer.outcome}
                      </p>
                      <div className="flex items-center gap-1.5 text-muted">
                        <LuCalendar size={10} />
                        <p className="text-[10px] font-black uppercase tracking-tighter">
                          {offer.joiningDate !== "N/A" ? `DOJ: ${offer.joiningDate}` : "No Date"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleDownloadReport(offer)}
                        title="Download Candidate Profile Report"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-border-subtle bg-surface hover:border-primary/30 hover:text-primary transition-all shadow-sm"
                      >
                        <LuExternalLink size={14} />
                      </button>
                      <button 
                        onClick={() => {
                          setOfferToDelete(offer);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete Offer Record"
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-border-subtle bg-surface hover:border-red-500/30 hover:text-red-600 transition-all shadow-sm"
                      >
                        <LuTrash size={14} />
                      </button>
                      <button 
                        onClick={() => openUpdateModal(offer)}
                        title="Update Status / Outcome"
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
                      >
                        <LuEllipsis size={18} className="text-muted" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Audit Footnote */}
        <div className="px-6 py-4 border-t border-border-subtle bg-background/30">
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.1em] text-center">
            All outcome changes are logged for audit purposes. Data synchronized with College Super Admin.
          </p>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl w-full max-w-xl p-8 shadow-2xl border border-border-subtle animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-black">Bulk Offer Import</h2>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-muted hover:text-foreground transition-colors"
              >
                <LuX size={18} />
              </button>
            </div>
            <p className="text-muted text-sm mb-8 font-medium">Select the data frequency to upload via CSV.</p>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl border-2 border-dashed border-border-subtle bg-background/50 flex flex-col items-center justify-center text-center">
                <input 
                  type="file" 
                  accept=".csv" 
                  id="csv-offer-upload" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    setIsProcessing(true);
                    setProcessingStatus("Initializing neural parsing...");
                    
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const text = event.target?.result as string;
                      const rows = text.split('\n').filter(row => row.trim());
                      const headers = rows[0].split(',').map(h => h.trim());
                      const data = rows.slice(1).map(row => {
                        const values = row.split(',').map(v => v.trim());
                        const obj: Record<string, string> = {};
                        headers.forEach((h, i) => obj[h] = values[i]);
                        return obj;
                      });

                      try {
                        setProcessingStatus(`Importing ${data.length} student offer records...`);
                        await db.bulkCreateOffers(data);
                        setProcessingStatus("Success: Database synchronized.");
                        setTimeout(() => {
                          setIsBulkModalOpen(false);
                          loadData();
                        }, 1500);
                      } catch (err) {
                        console.error(err);
                        setProcessingStatus("Error: Ingestion failed.");
                      } finally {
                        setIsProcessing(false);
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
                <label htmlFor="csv-offer-upload" className="cursor-pointer">
                  <div className="h-12 w-12 rounded-full bg-white border border-border-subtle flex items-center justify-center text-muted mb-4 shadow-sm mx-auto group-hover:text-primary transition-all">
                    <LuUpload size={20} />
                  </div>
                  <p className="font-bold text-sm">Select CSV File</p>
                  <p className="text-[10px] font-medium text-muted mt-1 uppercase tracking-widest">or click to upload placement details</p>
                </label>
              </div>

              {processingStatus && (
                <div className="p-4 rounded-xl bg-background border border-border-subtle flex items-center gap-3">
                  {isProcessing ? (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  )}
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{processingStatus}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <button 
                  onClick={() => {
                    const headers = "regNo,company,role,package,status,joiningDate,outcome,verification";
                    const blob = new Blob([headers], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `offers_import_template.csv`;
                    a.click();
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors animate-pulse"
                >
                  Download Template
                </button>

                <button 
                  onClick={() => setIsBulkModalOpen(false)}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Offer Verification & Outcome Modal */}
      {isUpdateModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form 
            onSubmit={handleUpdateSubmit}
            className="bg-surface rounded-3xl w-full max-w-md p-8 shadow-2xl border border-border-subtle animate-in fade-in zoom-in duration-200 flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black">Verify Placement</h2>
                <p className="text-xs text-muted font-medium mt-0.5">{selectedOffer.studentName} — {selectedOffer.regNo}</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-muted hover:text-foreground transition-colors"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Input fields */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Verification Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "pending", label: "Pending" },
                    { val: "verified", label: "Verified" },
                    { val: "rejected", label: "Mismatch" }
                  ].map(option => (
                    <button
                      key={option.val}
                      type="button"
                      onClick={() => setEditVerification(option.val)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold border transition-all text-center",
                        editVerification === option.val 
                          ? option.val === 'pending' ? "border-orange-500 bg-orange-500/10 text-orange-600 shadow-sm" : 
                            option.val === 'verified' ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-sm" : 
                            "border-red-500 bg-red-500/10 text-red-600 shadow-sm"
                          : "border-border-subtle text-muted hover:text-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Offer Outcome</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "issued", label: "Issued" },
                    { val: "accepted", label: "Accepted" },
                    { val: "rejected", label: "Rejected" }
                  ].map(option => (
                    <button
                      key={option.val}
                      type="button"
                      onClick={() => setEditOutcome(option.val)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold border transition-all text-center",
                        editOutcome === option.val 
                          ? "border-primary bg-primary/5 text-primary shadow-sm" 
                          : "border-border-subtle text-muted hover:text-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-2">Joining Date (DOJ)</label>
                <input 
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-border-subtle bg-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                  value={editJoiningDate}
                  onChange={(e) => setEditJoiningDate(e.target.value)}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setIsUpdateModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-border-subtle bg-white font-black text-sm hover:bg-background transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={updatingOffer}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-sm shadow-tactile hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {updatingOffer ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && offerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl w-full max-w-md p-8 shadow-2xl border border-border-subtle animate-in fade-in zoom-in duration-200 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-600">
                  <LuTriangleAlert size={20} />
                </div>
                <h2 className="text-xl font-black">Delete Offer Record</h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-muted hover:text-foreground transition-colors"
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                Are you sure you want to delete the offer record for <span className="font-black text-foreground">{offerToDelete.studentName}</span> ({offerToDelete.regNo})?
              </p>
              <div className="p-4 rounded-2xl bg-background border border-border-subtle space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-muted uppercase tracking-wider">Company</span>
                  <span className="font-bold text-foreground">{offerToDelete.company}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-muted uppercase tracking-wider">Role</span>
                  <span className="font-bold text-foreground">{offerToDelete.role}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-muted uppercase tracking-wider">Package</span>
                  <span className="font-bold text-foreground">{offerToDelete.package}</span>
                </div>
              </div>
              <p className="text-xs text-red-600 font-semibold bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                This action is permanent and cannot be undone. All audit trails associated with this record will be cleared.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-border-subtle bg-white font-black text-sm hover:bg-background transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deletingOffer}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-sm shadow-tactile hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {deletingOffer ? "Deleting..." : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
