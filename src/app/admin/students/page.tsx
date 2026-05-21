"use client";
import { Sk } from "@/components/ui/skeleton";

import { useState, useEffect, Suspense } from "react";
import { 
  LuClock,
  LuBriefcase,
  LuAward,
  LuTrendingUp,
  LuChevronRight,
  LuTriangleAlert,
  LuSearch,
  LuFilter,
  LuUser,
  LuDownload,
  LuUpload,
  LuEllipsis,
  LuCircleCheck,
  LuX,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useCallback } from "react";

const DEPARTMENTS = ["All Departments", "AI&DS", "AI&ML", "CSE", "CYS", "CSBS", "CCE", "ECE", "EEE", "MECH", "IT"];
const STATUSES = ["All Statuses", "Placed", "Unplaced", "Applied", "In-Process"];

interface AdminStudent {
  id: string;
  name: string;
  regNo: string;
  email?: string;
  dept: string;
  year: string;
  cgpa: number;
  leetcode: number;
  specializations: string[];
  completeness: number;
  verification: string;
  status: string;
  company?: string;
  eligible: boolean;
  reason?: string;
}

function StudentsPageContent() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [search, setSearch] = useState("");
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const deptFilter = searchParams.get('dept') || "All Departments";
  const statusFilter = searchParams.get('status') || "All Statuses";
  
  const advancedFilters = useMemo(() => ({
    minCgpa: parseFloat(searchParams.get('minCgpa') || "0"),
    maxCgpa: parseFloat(searchParams.get('maxCgpa') || "10"),
    minLeetcode: parseInt(searchParams.get('minLeetcode') || "0"),
    specialization: searchParams.get('specialization') || "All Domains"
  }), [searchParams]);

  const updateFilters = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  // Staged Filter State (for Drawer)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [stagedFilters, setStagedFilters] = useState({
    minCgpa: 0,
    maxCgpa: 10,
    minLeetcode: 0,
    specialization: "All Domains"
  });
  
  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    regNo: "",
    dept: "CSE",
    year: "1"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkType, setBulkType] = useState<"students" | "results">("students");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  // Missing States
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, total } = await db.getStudents({
        page: currentPage,
        pageSize,
        dept: deptFilter,
        status: statusFilter,
        ...advancedFilters
      });
      setStudents(data);
      setTotalStudents(total);
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, deptFilter, statusFilter, advancedFilters]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Client-side search for the current page to keep it snappy
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) || 
                         student.regNo.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleVerify = async (studentId: string, status: 'verified' | 'pending' | 'rejected') => {
    try {
      await db.updateStudentVerification(studentId, status);
      await loadStudents(); // Refresh data
      if (selectedStudent?.id === studentId) {
        setSelectedStudent({ 
          ...selectedStudent, 
          verification: status === 'verified' ? 'Verified' : status === 'pending' ? 'Pending' : 'Rejected' 
        });
      }
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error verifying student:", error);
    }
  };

  const handleFlag = async (studentId: string) => {
    try {
      await db.flagStudent(studentId, "Administrative review required");
      await loadStudents(); // Refresh data
      if (selectedStudent?.id === studentId) {
        setSelectedStudent({ ...selectedStudent, verification: "Rejected" });
      }
      setOpenMenuId(null);
    } catch (error) {
      console.error("Error flagging student:", error);
    }
  };

  const handleUpdateProfile = async (studentId: string, data: Partial<AdminStudent>) => {
    setIsSubmitting(true);
    try {
      await db.updateStudentProfile(studentId, data);
      await loadStudents();
      setIsEditModalOpen(false);
      setEditingStudent(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await db.createStudent(newStudent);
      setIsAddModalOpen(false);
      setNewStudent({ name: "", email: "", regNo: "", dept: "CSE", year: "1" });
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
          <button className="flex items-center gap-2 rounded-xl bg-surface border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors">
            <LuDownload size={16} />
            Export CSV
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-surface border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors"
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
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border-subtle bg-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <div className="flex gap-1.5 p-1 bg-surface border border-border-subtle rounded-2xl h-full items-center px-3 overflow-x-auto no-scrollbar">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => updateFilters({ dept })}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  deptFilter === dept 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-muted hover:bg-background"
                )}
              >
                {dept.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-3">
          <div className="flex gap-1.5 p-1 bg-surface border border-border-subtle rounded-2xl h-full items-center px-3 overflow-x-auto no-scrollbar">
            {STATUSES.map(status => (
              <button
                key={status}
                onClick={() => updateFilters({ status })}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                  statusFilter === status 
                    ? "bg-primary text-white shadow-sm" 
                    : "text-muted hover:bg-background"
                )}
              >
                {status.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-1">
          <button 
            onClick={() => {
              setStagedFilters(advancedFilters);
              setIsFilterDrawerOpen(true);
            }}
            className={cn(
              "w-full h-full flex items-center justify-center rounded-2xl border transition-all shadow-sm",
              (advancedFilters.minCgpa > 0 || advancedFilters.minLeetcode > 0 || advancedFilters.specialization !== "All Domains")
                ? "bg-primary/5 border-primary text-primary" 
                : "bg-surface border-border-subtle text-muted hover:bg-background"
            )}
          >
            <LuFilter size={20} />
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-background/50">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Student</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Department</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-center">CGPA</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Technical</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Profile</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Verification</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Status</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <Sk.TableRows cols={8} rows={8} />
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
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">LC: {student.leetcode || 0}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(student.specializations || []).slice(0, 2).map((spec: string) => (
                            <span key={spec} className="text-[9px] font-bold bg-black/5 text-muted px-1.5 py-0.5 rounded-md border border-border-subtle/50">
                              {spec}
                            </span>
                          ))}
                          {(student.specializations || []).length > 2 && (
                            <span className="text-[9px] font-bold text-muted px-1">+{(student.specializations || []).length - 2}</span>
                          )}
                        </div>
                      </div>
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
                      <div className="flex items-center justify-end gap-2 relative">
                        <div className="relative">
                          <button 
                            onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                            className={cn(
                              "h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
                              openMenuId === student.id ? "bg-black/5 text-primary" : "hover:bg-black/5 text-muted"
                            )}
                          >
                            <LuEllipsis size={18} />
                          </button>
                          
                          {openMenuId === student.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-xl shadow-xl border border-border-subtle py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                                <button 
                                  onClick={() => {
                                    setEditingStudent(student);
                                    setIsEditModalOpen(true);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-background flex items-center gap-2"
                                >
                                  <LuUser size={14} />
                                  Edit Profile
                                </button>
                                <button 
                                  onClick={() => handleVerify(student.id, 'verified')}
                                  className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-background flex items-center gap-2 text-emerald-600"
                                >
                                  <LuCircleCheck size={14} />
                                  Verify Status
                                </button>
                                <div className="my-1 border-t border-border-subtle" />
                                <button 
                                  onClick={() => handleFlag(student.id)}
                                  className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <LuTriangleAlert size={14} />
                                  Flag Record
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <button 
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDetailOpen(true);
                          }}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface border border-border-subtle shadow-sm hover:text-primary hover:border-primary/30 transition-all"
                        >
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
        
        {/* Edit Student Modal */}
        {isEditModalOpen && editingStudent && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
            <div className="relative w-full max-w-lg bg-surface rounded-3xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-border-subtle bg-background/50">
                <h3 className="text-xl font-black tracking-tight">Edit Student Profile</h3>
                <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">{editingStudent.regNo}</p>
              </div>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                      value={editingStudent.name}
                      onChange={e => setEditingStudent({...editingStudent, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                      value={editingStudent.email}
                      onChange={e => setEditingStudent({...editingStudent, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Department</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all appearance-none"
                      value={editingStudent.dept}
                      onChange={e => setEditingStudent({...editingStudent, dept: e.target.value})}
                    >
                      {DEPARTMENTS.slice(1).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Year</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all appearance-none"
                      value={editingStudent.year}
                      onChange={e => setEditingStudent({...editingStudent, year: e.target.value})}
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">CGPA</label>
                    <input 
                      type="number" step="0.01" min="0" max="10"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                      value={editingStudent.cgpa}
                      onChange={e => setEditingStudent({...editingStudent, cgpa: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">LeetCode Solved</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                      value={editingStudent.leetcode}
                      onChange={e => setEditingStudent({...editingStudent, leetcode: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-border-subtle bg-background/50 flex gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-surface border border-border-subtle text-xs font-black uppercase tracking-widest hover:bg-background transition-all"
                >
                  Cancel
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={() => handleUpdateProfile(editingStudent.id, {
                    name: editingStudent.name,
                    email: editingStudent.email,
                    dept: editingStudent.dept,
                    year: editingStudent.year,
                    cgpa: editingStudent.cgpa,
                    leetcode: editingStudent.leetcode,
                    specializations: editingStudent.specializations
                  })}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        
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
                "px-3 py-1 text-xs font-black rounded-lg border border-border-subtle bg-surface transition-colors",
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
                "px-3 py-1 text-xs font-black rounded-lg border border-border-subtle bg-surface transition-colors",
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
          <div className="bg-surface rounded-3xl w-full max-w-md p-8 shadow-2xl border border-border-subtle animate-in fade-in zoom-in duration-200">
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
          <div className="bg-surface rounded-3xl w-full max-w-xl p-8 shadow-2xl border border-border-subtle animate-in fade-in zoom-in duration-200">
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
                        const obj: Record<string, string> = {};
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
      {/* Advanced Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-surface border-l border-border-subtle shadow-2xl h-full animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-background/50">
              <div>
                <h2 className="text-xl font-black tracking-tight">Neural Filters</h2>
                <p className="text-xs text-muted font-medium">Calibrate your student search parameters.</p>
              </div>
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-2 hover:bg-black/5 rounded-xl transition-colors"
              >
                <LuX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* CGPA Range */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">CGPA Range</label>
                  <span className="text-xs font-bold text-primary">{stagedFilters.minCgpa.toFixed(1)} - {stagedFilters.maxCgpa.toFixed(1)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted font-bold">MIN</span>
                    <input 
                      type="range" min="0" max="10" step="0.1"
                      className="w-full accent-primary"
                      value={stagedFilters.minCgpa}
                      onChange={e => setStagedFilters({...stagedFilters, minCgpa: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted font-bold">MAX</span>
                    <input 
                      type="range" min="0" max="10" step="0.1"
                      className="w-full accent-primary"
                      value={stagedFilters.maxCgpa}
                      onChange={e => setStagedFilters({...stagedFilters, maxCgpa: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              {/* LeetCode Count */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">LeetCode Threshold</label>
                  <span className="text-xs font-bold text-primary">{stagedFilters.minLeetcode}+ Problems</span>
                </div>
                <input 
                  type="range" min="0" max="1000" step="50"
                  className="w-full accent-primary"
                  value={stagedFilters.minLeetcode}
                  onChange={e => setStagedFilters({...stagedFilters, minLeetcode: parseInt(e.target.value)})}
                />
                <div className="flex justify-between text-[10px] font-bold text-muted">
                  <span>0</span>
                  <span>500</span>
                  <span>1000+</span>
                </div>
              </div>

              {/* Specializations */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Specialized Domain</label>
                <div className="flex flex-wrap gap-2">
                  {["All Domains", "Cloud", "Python", "Java", "Fullstack", "DevOps", "AI/ML", "Data Science", "Cybersecurity"].map(domain => (
                    <button
                      key={domain}
                      onClick={() => setStagedFilters({...stagedFilters, specialization: domain})}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                        stagedFilters.specialization === domain 
                          ? "bg-primary text-white border-primary shadow-tactile" 
                          : "bg-background border-border-subtle text-muted hover:border-primary/30"
                      )}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border-subtle bg-background/50 flex gap-3">
              <button 
                onClick={() => setStagedFilters({
                  minCgpa: 0,
                  maxCgpa: 10,
                  minLeetcode: 0,
                  specialization: "All Domains"
                })}
                className="flex-1 py-3 rounded-2xl bg-surface border border-border-subtle text-xs font-black uppercase tracking-widest hover:bg-black/5 transition-all"
              >
                Reset
              </button>
              <button 
                onClick={() => {
                  updateFilters({
                    minCgpa: stagedFilters.minCgpa.toString(),
                    maxCgpa: stagedFilters.maxCgpa.toString(),
                    minLeetcode: stagedFilters.minLeetcode.toString(),
                    specialization: stagedFilters.specialization
                  });
                  setIsFilterDrawerOpen(false);
                }}
                className="flex-1 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Student Detail Sidebar */}
      {isDetailOpen && selectedStudent && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl border-l border-border-subtle flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black">{selectedStudent.name}</h3>
                  <p className="text-xs font-bold text-muted uppercase tracking-widest">{selectedStudent.regNo}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
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
                  <p className="text-2xl font-black text-primary">{selectedStudent.cgpa}</p>
                </div>
                <div className="p-4 rounded-2xl bg-background border border-border-subtle">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">LeetCode Progress</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black text-foreground">{selectedStudent.leetcode}</p>
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
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Department</p>
                      <p className="text-sm font-black">{selectedStudent.dept}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Year of Study</p>
                      <p className="text-sm font-black">{selectedStudent.year}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Status</p>
                      <p className="text-sm font-black">{selectedStudent.status}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Verification</p>
                      <p className="text-sm font-black">{selectedStudent.verification}</p>
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
                    {selectedStudent.specializations?.length > 0 ? (
                      selectedStudent.specializations.map((spec: string) => (
                        <span key={spec} className="px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/10">
                          {spec}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-muted italic">No specializations specified</p>
                    )}
                  </div>
                </section>

                {/* Quick Stats */}
                <section>
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                    <LuTrendingUp size={14} />
                    Neural Progress
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Profile Completeness</p>
                        <p className="text-sm font-black text-primary">{selectedStudent.completeness}%</p>
                      </div>
                      <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border-subtle">
                        <div 
                          className="h-full bg-primary transition-all duration-1000" 
                          style={{ width: `${selectedStudent.completeness}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-border-subtle bg-background/30 flex items-center gap-3">
              <button 
                onClick={() => handleVerify(selectedStudent.id, 'verified')}
                disabled={selectedStudent.verification === "Verified"}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-sm shadow-tactile hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {selectedStudent.verification === "Verified" ? "Verified" : "Verify Profile"}
              </button>
              <button 
                onClick={async () => {
                  try {
                    const blob = await db.generateStudentReport(selectedStudent.id);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `report_${selectedStudent.regNo}.pdf`;
                    a.click();
                  } catch (error) {
                    console.error("Error generating report:", error);
                  }
                }}
                className="flex-1 py-3 rounded-xl border border-border-subtle bg-white font-black text-sm hover:bg-background transition-all"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentsPageContent />
    </Suspense>
  );
}
