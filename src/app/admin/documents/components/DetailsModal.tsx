"use client";

import { useState } from "react";
import { 
  LuX, 
  LuSearch, 
  LuCircleCheck, 
  LuClock, 
  LuCircleAlert 
} from "react-icons/lu";
import { cn } from "@/lib/utils";

interface StudentStatus {
  studentId: string;
  name: string;
  registerNumber: string;
  department: string;
  submissionId?: string;
  url?: string;
  storagePath?: string;
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
}

interface DetailsModalProps {
  selectedDetailsDoc: GroupedDoc;
  onClose: () => void;
  onUpdateStatus: (submissionId: string, status: "Completed" | "Rejected") => Promise<void>;
  onPreviewStudentDoc: (std: StudentStatus) => void;
}

export function DetailsModal({
  selectedDetailsDoc,
  onClose,
  onUpdateStatus,
  onPreviewStudentDoc
}: DetailsModalProps) {
  const [modalSearch, setModalSearch] = useState("");
  const [modalStatusFilter, setModalStatusFilter] = useState<"All" | "Pending" | "Completed" | "Missing">("All");

  const filteredStudents = selectedDetailsDoc.students.filter(std => {
    let matchesStatus = true;
    if (modalStatusFilter === "Pending") matchesStatus = std.status === "Pending";
    else if (modalStatusFilter === "Completed") matchesStatus = std.status === "Completed";
    else if (modalStatusFilter === "Missing") matchesStatus = std.status === "Not Provided" || std.status === "Rejected";

    const s = modalSearch.toLowerCase();
    const matchesSearch = 
      std.name.toLowerCase().includes(s) ||
      std.registerNumber.toLowerCase().includes(s) ||
      std.department.toLowerCase().includes(s);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-background border border-border-subtle p-8 rounded-[32px] w-full max-w-4xl shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-muted hover:text-foreground cursor-pointer z-10"
        >
          <LuX size={20} />
        </button>
        
        {/* Header */}
        <div className="mb-6 pr-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest">
              {selectedDetailsDoc.type}
            </span>
            <h3 className="font-display text-2xl font-black tracking-tight">{selectedDetailsDoc.title}</h3>
          </div>
          
          {/* Progress Summary */}
          <div className="flex flex-wrap items-center gap-6 mt-4 p-4 bg-surface border border-border-subtle rounded-2xl">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-foreground">{selectedDetailsDoc.stats.completed}</span> Verified
              </div>
              {selectedDetailsDoc.stats.pending > 0 && (
                <div className="flex items-center gap-1 text-amber-500 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>{selectedDetailsDoc.stats.pending}</span> Pending
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-foreground">{selectedDetailsDoc.stats.missing}</span> Missing
              </div>
            </div>

            <div className="flex-1 min-w-[200px] flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-background border border-border-subtle rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${selectedDetailsDoc.stats.total > 0 ? (selectedDetailsDoc.stats.completed / selectedDetailsDoc.stats.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs font-black text-muted">
                {Math.round(selectedDetailsDoc.stats.total > 0 ? (selectedDetailsDoc.stats.completed / selectedDetailsDoc.stats.total) * 100 : 0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 shrink-0">
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              value={modalSearch}
              onChange={e => setModalSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full h-10 bg-surface border border-border-subtle rounded-xl pl-9 pr-4 text-xs font-semibold focus:outline-none focus:border-primary transition-all text-foreground"
            />
            <LuSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full md:w-auto no-scrollbar">
            {(["All", "Pending", "Completed", "Missing"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setModalStatusFilter(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                  modalStatusFilter === tab 
                    ? "bg-foreground text-background" 
                    : "bg-surface border border-border-subtle text-muted hover:text-foreground"
                )}
              >
                {tab === "Pending" ? "Pending Review" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Student List Table */}
        <div className="flex-1 min-h-0 overflow-y-auto border border-border-subtle rounded-2xl bg-background/10 no-scrollbar">
          {filteredStudents.length === 0 ? (
            <div className="p-16 text-center text-xs font-semibold text-muted">
              No students match filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle/30 text-[9px] font-black uppercase tracking-widest text-muted bg-background/40 sticky top-0 backdrop-blur-md">
                  <th className="py-3 px-6">Student Info</th>
                  <th className="py-3 px-6">Submitted At</th>
                  <th className="py-3 px-6">Verification</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/20">
                {filteredStudents.map((std) => (
                  <tr 
                    key={std.studentId}
                    onClick={() => std.status !== "Not Provided" && onPreviewStudentDoc(std)}
                    className={cn(
                      "transition-colors",
                      std.status !== "Not Provided" ? "hover:bg-background/40 cursor-pointer" : "opacity-75"
                    )}
                  >
                    <td className="py-3 px-6">
                      <div className="min-w-0">
                        <p className="font-display font-black text-sm text-foreground">{std.name}</p>
                        <p className="text-[10px] font-bold text-muted mt-0.5">{std.registerNumber} • {std.department}</p>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-xs font-semibold text-muted">
                      {std.updatedAt || "—"}
                    </td>
                    <td className="py-3 px-6">
                      <StatusBadge status={std.status} />
                    </td>
                    <td className="py-3 px-6 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {std.status !== "Not Provided" && (
                          <>
                            {std.status !== "Completed" && (
                              <button
                                onClick={() => onUpdateStatus(std.submissionId!, "Completed")}
                                className="h-8 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {std.status !== "Rejected" && (
                              <button
                                onClick={() => onUpdateStatus(std.submissionId!, "Rejected")}
                                className="h-8 px-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-50 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest cursor-pointer"
                              >
                                Reject
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border-subtle/50 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="bg-surface hover:bg-surface-hover text-muted text-xs font-black uppercase tracking-widest rounded-2xl border border-border-subtle px-6 py-3 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Completed") return (
    <div className="inline-flex items-center gap-1.5 text-emerald-500 font-sans text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
      <LuCircleCheck size={12} />
      Verified
    </div>
  );
  if (status === "Pending") return (
    <div className="inline-flex items-center gap-1.5 text-amber-500 font-sans text-[10px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
      <LuClock size={12} />
      Pending Review
    </div>
  );
  if (status === "Rejected") return (
    <div className="inline-flex items-center gap-1.5 text-red-500 font-sans text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
      <LuCircleAlert size={12} />
      Rejected
    </div>
  );
  return (
    <div className="inline-flex items-center gap-1.5 text-muted font-sans text-[10px] font-black uppercase tracking-widest bg-surface border border-border-subtle px-2.5 py-1 rounded-full">
      <LuCircleAlert size={12} />
      Missing
    </div>
  );
}
