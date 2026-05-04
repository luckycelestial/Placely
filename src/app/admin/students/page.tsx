"use client";

import { useState, useEffect } from "react";
import { 
  LuSearch, 
  LuFilter, 
  LuUser, 
  LuChevronRight, 
  LuDownload, 
  LuUpload,
  LuEllipsis,
  LuCircleCheck,
  LuTriangleAlert,
  LuCircleX,
  LuClock
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";

const DEPARTMENTS = ["All Departments", "Computer Science", "Electronics", "Mechanical", "Electrical", "Civil"];
const STATUSES = ["All Statuses", "Placed", "Unplaced", "Applied", "In-Process"];

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    regNo: "",
    dept: "Computer Science",
    year: "1"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Bulk Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkType, setBulkType] = useState<"students" | "results">("students");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  async function loadStudents() {
    setLoading(true);
    try {
      const { data, total } = await db.getStudents({
        page: currentPage,
        pageSize,
        dept: deptFilter,
        status: statusFilter
      });
      setStudents(data);
      setTotalStudents(total);
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, [currentPage, deptFilter, statusFilter]);

  // Client-side search for the current page to keep it snappy
  // Client-side search for the current page to keep it snappy
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) || 
                         student.regNo.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await db.createStudent(newStudent);
      setIsAddModalOpen(false);
      setNewStudent({ name: "", email: "", regNo: "", dept: "Computer Science", year: "1" });
      loadStudents(); // Refresh list
    } catch (error) {
      console.error("Failed to add student:", error);
      alert("Failed to add student. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Students Directory</h1>
          <p className="text-muted text-sm font-medium">Manage and monitor placement readiness across all departments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-white border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors">
            <LuDownload size={16} />
            Export CSV
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-white border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors"
          >
            <LuUpload size={16} />
            Bulk Upload
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-tactile hover:bg-primary-dark transition-all"
          >
            Add Student
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 relative">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, register number, or skills..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border-subtle bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <select 
            className="w-full px-4 py-3 rounded-2xl border border-border-subtle bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm appearance-none cursor-pointer"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <select 
            className="w-full px-4 py-3 rounded-2xl border border-border-subtle bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-1">
          <button className="w-full h-full flex items-center justify-center rounded-2xl border border-border-subtle bg-white hover:bg-background transition-all shadow-sm">
            <LuFilter size={20} className="text-muted" />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-border-subtle shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-background/50">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Student</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Department</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-center">CGPA</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Profile</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Verification</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Status</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted font-bold animate-pulse">
                    Scanning neural database...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted font-bold">
                    No students found in this frequency range.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="group hover:bg-primary/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                          {student.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-none mb-1">{student.name}</p>
                          <p className="text-muted text-[11px] font-medium uppercase tracking-wider">{student.regNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-foreground/80">{student.dept}</p>
                        <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{student.year}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-sm font-black",
                        student.cgpa >= 8.5 ? "bg-emerald-500/10 text-emerald-600" : 
                        student.cgpa >= 7.5 ? "bg-blue-500/10 text-blue-600" : 
                        "bg-orange-500/10 text-orange-600"
                      )}>
                        {Number(student.cgpa).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-muted uppercase tracking-tighter">{student.completeness}% Complete</span>
                        </div>
                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              student.completeness === 100 ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{ width: `${student.completeness}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {student.verification === "Verified" ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg">
                            <LuCircleCheck size={14} />
                            Verified
                          </span>
                        ) : student.verification === "Pending" ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-500/10 px-2 py-1 rounded-lg">
                            <LuClock size={14} />
                            Reviewing
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-500/10 px-2 py-1 rounded-lg">
                            <LuTriangleAlert size={14} />
                            Fix Needed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.status === "Placed" ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg mb-1">
                            Placed
                          </span>
                          <p className="text-[10px] font-black text-muted uppercase tracking-wider">{student.company}</p>
                        </div>
                      ) : student.eligible ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-1 rounded-lg">
                          Available
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-500/10 px-2 py-1 rounded-lg mb-1">
                            Not Eligible
                          </span>
                          <p className="text-[10px] font-black text-muted uppercase tracking-wider">{student.reason || 'Requirement Gap'}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors">
                          <LuEllipsis size={18} className="text-muted" />
                        </button>
                        <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface border border-border-subtle shadow-sm hover:text-primary hover:border-primary/30 transition-all">
                          <LuChevronRight size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="px-6 py-4 border-t border-border-subtle bg-background/30 flex items-center justify-between">
          <p className="text-xs font-bold text-muted">
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalStudents)} to {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents} students
          </p>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className={cn(
                "px-3 py-1 text-xs font-black rounded-lg border border-border-subtle bg-white transition-colors",
                (currentPage === 1 || loading) ? "text-muted/50 cursor-not-allowed" : "text-muted hover:bg-black/5"
              )}
            >
              Prev
            </button>
            
            {[...Array(Math.ceil(totalStudents / pageSize))].map((_, i) => {
              const pageNum = i + 1;
              // Show only a few page numbers around current page
              if (
                pageNum === 1 || 
                pageNum === Math.ceil(totalStudents / pageSize) || 
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "px-3 py-1 text-xs font-black rounded-lg transition-all",
                      currentPage === pageNum ? "bg-primary text-white shadow-sm" : "hover:bg-black/5 text-muted"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} className="px-1 text-muted text-xs">...</span>;
              }
              return null;
            })}

            <button 
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalStudents / pageSize), prev + 1))}
              disabled={currentPage === Math.ceil(totalStudents / pageSize) || loading}
              className={cn(
                "px-3 py-1 text-xs font-black rounded-lg border border-border-subtle bg-white transition-colors",
                (currentPage === Math.ceil(totalStudents / pageSize) || loading) ? "text-muted/50 cursor-not-allowed" : "text-muted hover:bg-black/5"
              )}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-border-subtle animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-6">Add New Student</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newStudent.name}
                  onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">Email Address</label>
                <input 
                  required
                  type="email" 
                  className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newStudent.email}
                  onChange={e => setNewStudent({...newStudent, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">Register Number</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={newStudent.regNo}
                  onChange={e => setNewStudent({...newStudent, regNo: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">Department</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-bold text-sm focus:outline-none"
                    value={newStudent.dept}
                    onChange={e => setNewStudent({...newStudent, dept: e.target.value})}
                  >
                    {DEPARTMENTS.slice(1).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">Year</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-border-subtle bg-background font-bold text-sm focus:outline-none"
                    value={newStudent.year}
                    onChange={e => setNewStudent({...newStudent, year: e.target.value})}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-border-subtle font-black text-sm hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-sm shadow-tactile hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Adding..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl p-8 shadow-2xl border border-border-subtle animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black mb-2">Bulk Neural Import</h2>
            <p className="text-muted text-sm mb-8 font-medium">Select the data frequency to upload via CSV.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button 
                onClick={() => setBulkType("students")}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all text-left",
                  bulkType === "students" ? "border-primary bg-primary/5" : "border-border-subtle hover:border-primary/30"
                )}
              >
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4", bulkType === "students" ? "bg-primary text-white" : "bg-background text-muted")}>
                  <LuUser size={20} />
                </div>
                <p className="font-bold text-sm">Students Directory</p>
                <p className="text-[10px] font-medium text-muted mt-1 uppercase tracking-wider">Basic Info & Enrollment</p>
              </button>
              
              <button 
                onClick={() => setBulkType("results")}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all text-left",
                  bulkType === "results" ? "border-primary bg-primary/5" : "border-border-subtle hover:border-primary/30"
                )}
              >
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4", bulkType === "results" ? "bg-primary text-white" : "bg-background text-muted")}>
                  <LuCircleCheck size={20} />
                </div>
                <p className="font-bold text-sm">Academic Results</p>
                <p className="text-[10px] font-medium text-muted mt-1 uppercase tracking-wider">CGPA, Backlogs, Scores</p>
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl border-2 border-dashed border-border-subtle bg-background/50 flex flex-col items-center justify-center text-center">
                <input 
                  type="file" 
                  accept=".csv" 
                  id="csv-upload" 
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
                        const obj: any = {};
                        headers.forEach((h, i) => obj[h] = values[i]);
                        return obj;
                      });

                      try {
                        if (bulkType === "students") {
                          setProcessingStatus(`Creating ${data.length} student records...`);
                          await db.bulkCreateStudents(data);
                        } else {
                          setProcessingStatus(`Updating ${data.length} academic profiles...`);
                          await db.bulkUploadResults(data);
                        }
                        setProcessingStatus("Success: Database synchronized.");
                        setTimeout(() => {
                          setIsBulkModalOpen(false);
                          loadStudents();
                        }, 1500);
                      } catch (err) {
                        console.error(err);
                        setProcessingStatus("Error: Uplink failed.");
                      } finally {
                        setIsProcessing(false);
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="h-12 w-12 rounded-full bg-white border border-border-subtle flex items-center justify-center text-muted mb-4 shadow-sm mx-auto group-hover:text-primary transition-all">
                    <LuUpload size={20} />
                  </div>
                  <p className="font-bold text-sm">Select CSV File</p>
                  <p className="text-[10px] font-medium text-muted mt-1 uppercase tracking-widest">or drag and drop mission data</p>
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
                    // Download template logic
                    const headers = bulkType === "students" 
                      ? "name,email,regNo,dept,year" 
                      : "regNo,cgpa,tenth_score,twelfth_score,backlog_count";
                    const blob = new Blob([headers], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${bulkType}_template.csv`;
                    a.click();
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary transition-colors"
                >
                  Download Template
                </button>
                <button 
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-border-subtle font-black text-xs uppercase tracking-widest hover:bg-background transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
