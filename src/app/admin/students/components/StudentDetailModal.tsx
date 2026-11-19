"use client";

import { LuX, LuBriefcase, LuAward, LuTrendingUp } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { Sk } from "@/components/ui/skeleton";
import { db } from "@/services/database";
import type { AdminStudent } from "../types";

interface StudentDetailModalProps {
  isOpen: boolean;
  student: AdminStudent | null;
  applications: any[];
  loadingApplications: boolean;
  onClose: () => void;
}

export function StudentDetailModal({
  isOpen,
  student,
  applications,
  loadingApplications,
  onClose,
}: StudentDetailModalProps) {
  if (!isOpen || !student) return null;

  const handleGenerateReport = async () => {
    try {
      const blob = await db.generateStudentReport(student.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${student.regNo}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-detail-title"
        className="relative w-full max-w-xl bg-white h-full shadow-2xl border-l border-border-subtle flex flex-col animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
              {student.name.charAt(0)}
            </div>
            <div>
              <h3 id="student-detail-title" className="text-xl font-black">{student.name}</h3>
              <p className="text-xs font-bold text-muted uppercase tracking-widest">{student.regNo}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close profile drawer"
            className="h-10 w-10 rounded-xl hover:bg-background flex items-center justify-center transition-colors"
          >
            <LuX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="p-4 rounded-2xl bg-background border border-border-subtle">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Current CGPA</p>
              <p className="text-2xl font-black text-primary">{student.cgpa}</p>
            </div>
            <div className="p-4 rounded-2xl bg-background border border-border-subtle">
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">LeetCode Progress</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-foreground">{student.leetcode}</p>
                <p className="text-[10px] font-bold text-muted">solved</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Academic Profile */}
            <section>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                <LuBriefcase size={14} />
                Academic Profile
              </h4>
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Department &amp; Section</p>
                  <p className="text-sm font-black">{student.dept} {student.section ? `- Sec ${student.section}` : ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Batch</p>
                  <p className="text-sm font-black">{student.year}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Status</p>
                  <p className="text-sm font-black">{student.status}</p>
                </div>
              </div>
            </section>

            {/* Specializations */}
            <section>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                <LuAward size={14} />
                Domain Specializations
              </h4>
              <div className="flex flex-wrap gap-2">
                {student.specializations?.length > 0 ? (
                  student.specializations.map((spec: string) => (
                    <span key={spec} className="px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/10">
                      {spec}
                    </span>
                  ))
                ) : (
                  <p className="text-xs font-bold text-muted italic">No specializations specified</p>
                )}
              </div>
            </section>

            {/* Progress */}
            <section>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                <LuTrendingUp size={14} />
                Profile Completeness
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Completeness</p>
                    <p className="text-sm font-black text-primary">{student.completeness}%</p>
                  </div>
                  <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border-subtle">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${student.completeness}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Recruitment Drive History */}
            <section>
              <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                <LuBriefcase size={14} />
                Recruitment Drive History
              </h4>
              {loadingApplications ? (
                <div className="space-y-3">
                  <Sk.Block className="h-16 w-full rounded-2xl" />
                  <Sk.Block className="h-16 w-full rounded-2xl" />
                </div>
              ) : applications.length === 0 ? (
                <p className="text-xs font-bold text-muted italic bg-background/50 border border-border-subtle/50 p-4 rounded-2xl text-center">
                  No drive attendance records found.
                </p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app: any) => {
                    const drive = app.job_drives || {};
                    const company = drive.companies || {};
                    const roundTitle = app.current_stage ? (
                      app.current_stage === 'applied' ? 'Applied' :
                      app.current_stage === 'shortlisted' ? 'Shortlisted' :
                      app.current_stage === 'aptitude' ? 'Aptitude Assessment' :
                      app.current_stage === 'interview1' ? 'Technical Interview 1' :
                      app.current_stage === 'interview2' ? 'Technical Interview 2' :
                      app.current_stage === 'selection' ? 'Offer Discussion' :
                      app.current_stage === 'offered' ? 'Offered' :
                      app.current_stage === 'rejected' ? 'Rejected' :
                      app.current_stage.charAt(0).toUpperCase() + app.current_stage.slice(1)
                    ) : 'Applied';

                    const isOffered = app.status?.toLowerCase() === 'offered' || app.current_stage?.toLowerCase() === 'offered' || app.status?.toLowerCase() === 'selection';
                    const isRejected = app.status?.toLowerCase() === 'rejected' || app.current_stage?.toLowerCase() === 'rejected';

                    return (
                      <div key={app.id} className="p-4 rounded-2xl border border-border-subtle bg-background flex items-center justify-between hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4 min-w-0">
                          <CompanyLogo name={company.name || 'Unknown'} size={40} rounded="rounded-xl shadow-tactile" />
                          <div className="min-w-0">
                            <h5 className="font-bold text-sm leading-tight text-foreground truncate group-hover:text-primary transition-colors">
                              {drive.role_title || 'Software Engineer'}
                            </h5>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">
                              {company.name || 'Unknown Company'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            isOffered ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            isRejected ? "bg-red-500/10 text-red-600 border-red-500/20" :
                            "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          )}>
                            {app.status || 'Applied'}
                          </span>
                          <p className="text-[10px] font-bold text-muted">
                            Round: <span className="text-foreground font-black">{roundTitle}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-border-subtle bg-background/30 flex items-center">
          <button 
            onClick={handleGenerateReport}
            className="w-full py-3 rounded-xl bg-primary text-white font-black text-sm shadow-tactile hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
