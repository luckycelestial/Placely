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
  LuCalendar,
  LuEye
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import * as XLSX from "xlsx";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useCallback } from "react";
import { getSystemSettings } from "@/services/settings";
import { getBatchList, getBatchRangeFromYear } from "@/lib/batch-utils";

const DEPARTMENTS = ["All Departments", "AI&DS", "AI&ML", "CSE", "CYS", "CSBS", "CCE", "ECE", "EEE", "MECH", "IT"];
const STATUSES = ["All Statuses", "Placed", "Unplaced", "Applied", "In-Process"];

interface AdminStudent {
  id: string;
  name: string;
  regNo: string;
  rollNo?: string;
  gender?: string;
  dob?: string;
  email?: string;
  dept: string;
  year: string;
  cgpa: number;
  tenth_score?: number;
  twelfth_score?: number;
  diploma_score?: number | null;
  backlog_count?: number;
  active_arrears?: number;
  history_of_arrears?: boolean;
  semester_cgpa?: Record<string, number>;
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
  const [studentApplications, setStudentApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

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
    specialization: searchParams.get('specialization') || "All Domains",
    specializationMode: (searchParams.get('specializationMode') || "any") as 'any' | 'all',
    company: searchParams.get('company') || "All Companies",
    interest: searchParams.get('interest') || "All Preferences",
    interestMode: (searchParams.get('interestMode') || "any") as 'any' | 'all'
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
    specializations: [] as string[],
    specializationMode: "any" as "any" | "all",
    depts: [] as string[],
    status: "All Statuses",
    company: "All Companies",
    interests: [] as string[],
    interestMode: "any" as "any" | "all"
  });

  const [allCompanies, setAllCompanies] = useState<string[]>([]);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await db.getCompanies();
        setAllCompanies(["All Companies", ...data.map((c: any) => c.name)]);
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    }
    loadCompanies();
  }, []);
  
  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    regNo: "",
    dept: "CSE",
    year: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSystemSettings();
        setIsCompleted(data.isAcademicYearCompleted);
        
        const active = getBatchList(data.isAcademicYearCompleted);
        const firstYearBatchValue = active[3]?.value || "";
        setNewStudent(prev => ({ ...prev, year: firstYearBatchValue }));
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, [isAddModalOpen]);

  const batchOptions = useMemo(() => {
    return getBatchList(isCompleted).map(b => ({
      value: b.value,
      label: b.label
    }));
  }, [isCompleted]);
  
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
      setNewStudent({ name: "", email: "", regNo: "", dept: "CSE", year: batchOptions[3]?.value || "" });
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
            onClick={() => router.push('/admin/data?table=students&import=true')}
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
        <div className="md:col-span-10 relative">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, register number, or skills..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border-subtle bg-surface text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <button 
            onClick={() => {
              const depts = deptFilter === "All Departments" ? [] : deptFilter.split(',').map(d => d.trim()).filter(Boolean);
              const specializations = advancedFilters.specialization === "All Domains" ? [] : advancedFilters.specialization.split(',').map(s => s.trim()).filter(Boolean);
              const interests = advancedFilters.interest === "All Preferences" ? [] : advancedFilters.interest.split(',').map(i => i.trim()).filter(Boolean);
              setStagedFilters({
                minCgpa: advancedFilters.minCgpa,
                maxCgpa: advancedFilters.maxCgpa,
                minLeetcode: advancedFilters.minLeetcode,
                specializations,
                specializationMode: advancedFilters.specializationMode,
                depts,
                status: statusFilter,
                company: advancedFilters.company,
                interests,
                interestMode: advancedFilters.interestMode
              });
              setIsFilterDrawerOpen(true);
            }}
            className={cn(
              "w-full h-full py-3 flex items-center justify-center rounded-2xl border transition-all shadow-sm text-sm font-bold gap-2",
              (advancedFilters.minCgpa > 0 || advancedFilters.minLeetcode > 0 || advancedFilters.specialization !== "All Domains" || deptFilter !== "All Departments" || statusFilter !== "All Statuses" || advancedFilters.company !== "All Companies" || advancedFilters.interest !== "All Preferences")
                ? "bg-primary/5 border-primary text-primary" 
                : "bg-surface border-border-subtle text-muted hover:bg-background"
            )}
          >
            <LuFilter size={18} />
            Filters
            {(advancedFilters.minCgpa > 0 || advancedFilters.minLeetcode > 0 || advancedFilters.specialization !== "All Domains" || deptFilter !== "All Departments" || statusFilter !== "All Statuses" || advancedFilters.company !== "All Companies" || advancedFilters.interest !== "All Preferences") && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
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
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Dept & Batch</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-center">CGPA</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Technical</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Profile</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Status</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <Sk.TableRows cols={7} rows={8} />
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
                      {student.status === "Placed" ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg">
                              Placed
                            </span>
                            {(student as any).package_ctc && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                                {(student as any).package_ctc}
                              </span>
                            )}
                          </div>
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
                              </div>
                            </>
                          )}
                        </div>

                        <button 
                          onClick={async () => {
                            setSelectedStudent(student);
                            setIsDetailOpen(true);
                            setLoadingApplications(true);
                            try {
                              const apps = await db.getStudentApplications(student.id);
                              setStudentApplications(apps);
                            } catch (err) {
                              console.error("Failed to load student applications", err);
                            } finally {
                              setLoadingApplications(false);
                            }
                          }}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface border border-border-subtle shadow-sm hover:text-primary hover:border-primary/30 transition-all"
                          title="View Profile"
                        >
                          <LuEye size={18} />
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
            <div className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-border-subtle bg-background/50">
                <h3 className="text-xl font-black tracking-tight">Edit Student Profile</h3>
                <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">{editingStudent.regNo}</p>
              </div>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">

                {/* Identity */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Identity</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Name</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.name} onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Email</label>
                      <input type="email" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.email || ''} onChange={e => setEditingStudent({...editingStudent, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Register Number</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.regNo} onChange={e => setEditingStudent({...editingStudent, regNo: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Roll Number</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.rollNo || ''} onChange={e => setEditingStudent({...editingStudent, rollNo: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Gender</label>
                      <SearchableSelect 
                        options={[
                          { value: "Male", label: "Male" },
                          { value: "Female", label: "Female" },
                          { value: "Other", label: "Other" }
                        ]}
                        value={editingStudent.gender || ''}
                        onChange={value => setEditingStudent({...editingStudent, gender: value})}
                        placeholder="— Select —"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Date of Birth</label>
                      <input type="date" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.dob || ''} onChange={e => setEditingStudent({...editingStudent, dob: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Academic */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Academic</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Department</label>
                      <SearchableSelect 
                        options={DEPARTMENTS.slice(1).map(d => ({ value: d, label: d }))}
                        value={editingStudent.dept}
                        onChange={value => setEditingStudent({...editingStudent, dept: value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Batch</label>
                      <SearchableSelect 
                        options={batchOptions}
                        value={editingStudent ? String(getBatchRangeFromYear(editingStudent.year).endYear) : ''}
                        onChange={value => setEditingStudent({...editingStudent, year: value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">CGPA (Aggregate)</label>
                      <input type="number" step="0.01" min="0" max="10" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.cgpa} onChange={e => setEditingStudent({...editingStudent, cgpa: parseFloat(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">10th Score (%)</label>
                      <input type="number" step="0.01" min="0" max="100" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.tenth_score || ''} onChange={e => setEditingStudent({...editingStudent, tenth_score: parseFloat(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">12th Score (%)</label>
                      <input type="number" step="0.01" min="0" max="100" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.twelfth_score || ''} onChange={e => setEditingStudent({...editingStudent, twelfth_score: parseFloat(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Diploma Score (%) <span className="normal-case text-[9px]">optional</span></label>
                      <input type="number" step="0.01" min="0" max="100" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.diploma_score ?? ''} onChange={e => setEditingStudent({...editingStudent, diploma_score: e.target.value ? parseFloat(e.target.value) : null})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">Active Arrears (current)</label>
                      <input type="number" min="0" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.active_arrears ?? 0} onChange={e => setEditingStudent({...editingStudent, active_arrears: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">History of Arrears</label>
                      <SearchableSelect 
                        options={[
                          { value: "false", label: "No (Clean record)" },
                          { value: "true", label: "Yes (Previously had backlogs)" }
                        ]}
                        value={editingStudent.history_of_arrears ? 'true' : 'false'}
                        onChange={value => setEditingStudent({...editingStudent, history_of_arrears: value === 'true'})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted">LeetCode Solved</label>
                      <input type="number" className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                        value={editingStudent.leetcode} onChange={e => setEditingStudent({...editingStudent, leetcode: parseInt(e.target.value)})} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-border-subtle bg-background/50 flex gap-3">
                <button onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-surface border border-border-subtle text-xs font-black uppercase tracking-widest hover:bg-background transition-all">
                  Cancel
                </button>
                <button disabled={isSubmitting}
                  onClick={() => handleUpdateProfile(editingStudent.id, {
                    name: editingStudent.name,
                    email: editingStudent.email,
                    regNo: editingStudent.regNo,
                    rollNo: editingStudent.rollNo,
                    gender: editingStudent.gender,
                    dob: editingStudent.dob,
                    dept: editingStudent.dept,
                    year: editingStudent.year,
                    cgpa: editingStudent.cgpa,
                    tenth_score: editingStudent.tenth_score,
                    twelfth_score: editingStudent.twelfth_score,
                    diploma_score: editingStudent.diploma_score,
                    active_arrears: editingStudent.active_arrears,
                    history_of_arrears: editingStudent.history_of_arrears,
                    leetcode: editingStudent.leetcode,
                    specializations: editingStudent.specializations
                  })}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all disabled:opacity-50">
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
                  <SearchableSelect 
                    options={DEPARTMENTS.slice(1).map(d => ({ value: d, label: d }))}
                    value={newStudent.dept}
                    onChange={value => setNewStudent({...newStudent, dept: value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-muted mb-2">Batch</label>
                  <SearchableSelect 
                    options={batchOptions}
                    value={newStudent.year}
                    onChange={value => setNewStudent({...newStudent, year: value})}
                  />
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
              {/* Department */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Department</label>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS.map(dept => {
                    const isAll = dept === "All Departments";
                    const isSelected = isAll 
                      ? stagedFilters.depts.length === 0 
                      : stagedFilters.depts.includes(dept);
                    
                    return (
                      <button
                        key={dept}
                        onClick={() => {
                          if (isAll) {
                            setStagedFilters({ ...stagedFilters, depts: [] });
                          } else {
                            const newDepts = stagedFilters.depts.includes(dept)
                              ? stagedFilters.depts.filter(d => d !== dept)
                              : [...stagedFilters.depts, dept];
                            setStagedFilters({ ...stagedFilters, depts: newDepts });
                          }
                        }}
                        type="button"
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                          isSelected 
                            ? "bg-primary text-white border-primary shadow-tactile" 
                            : "bg-background border-border-subtle text-muted hover:border-primary/30"
                        )}
                      >
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Placement Status */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Placement Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => setStagedFilters({...stagedFilters, status})}
                      type="button"
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                        stagedFilters.status === status 
                          ? "bg-primary text-white border-primary shadow-tactile" 
                          : "bg-background border-border-subtle text-muted hover:border-primary/30"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

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
                      type="number" min="0" max="10" step="0.1"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                      value={stagedFilters.minCgpa}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setStagedFilters({...stagedFilters, minCgpa: isNaN(val) ? 0 : val});
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-muted font-bold">MAX</span>
                    <input 
                      type="number" min="0" max="10" step="0.1"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                      value={stagedFilters.maxCgpa}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setStagedFilters({...stagedFilters, maxCgpa: isNaN(val) ? 10 : val});
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* LeetCode Count */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">LeetCode Threshold</label>
                </div>
                <div className="relative group">
                  <input 
                    type="number" min="0" step="10"
                    placeholder="Min solved problems"
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all pr-20"
                    value={stagedFilters.minLeetcode}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setStagedFilters({...stagedFilters, minLeetcode: isNaN(val) ? 0 : val});
                    }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">Problems</span>
                </div>
              </div>

              {/* Placed Company */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Placed Company</label>
                <SearchableSelect
                  options={allCompanies.map(c => ({ value: c, label: c }))}
                  value={stagedFilters.company}
                  onChange={value => setStagedFilters({...stagedFilters, company: value})}
                  placeholder="All Companies"
                />
              </div>

              {/* Placement Interest */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Placement Interest</label>
                <div className="flex flex-wrap gap-2">
                  {["All Preferences", "Interested", "Not Interested: Higher Studies", "Not Interested: Entrepreneurship", "Not Interested"].map(pref => {
                    const isAll = pref === "All Preferences";
                    const isSelected = isAll 
                      ? stagedFilters.interests.length === 0 
                      : stagedFilters.interests.includes(pref);

                    const label = pref === "Not Interested: Higher Studies" ? "Higher Studies" :
                                  pref === "Not Interested: Entrepreneurship" ? "Entrepreneurship" :
                                  pref;

                    return (
                      <button
                        key={pref}
                        onClick={() => {
                          if (isAll) {
                            setStagedFilters({ ...stagedFilters, interests: [] });
                          } else {
                            const newInts = stagedFilters.interests.includes(pref)
                              ? stagedFilters.interests.filter(i => i !== pref)
                              : [...stagedFilters.interests, pref];
                            setStagedFilters({ ...stagedFilters, interests: newInts });
                          }
                        }}
                        type="button"
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                          isSelected 
                            ? "bg-primary text-white border-primary shadow-tactile" 
                            : "bg-background border-border-subtle text-muted hover:border-primary/30"
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {stagedFilters.interests.length > 1 && (
                  <div className="p-3 bg-background rounded-2xl border border-border-subtle flex items-center justify-between mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted">Interest Match Mode</span>
                    <div className="flex bg-surface p-1 rounded-xl border border-border-subtle/50">
                      <button
                        type="button"
                        onClick={() => setStagedFilters({ ...stagedFilters, interestMode: 'any' })}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          stagedFilters.interestMode === 'any'
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted hover:text-foreground"
                        )}
                      >
                        Any
                      </button>
                      <button
                        type="button"
                        onClick={() => setStagedFilters({ ...stagedFilters, interestMode: 'all' })}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          stagedFilters.interestMode === 'all'
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted hover:text-foreground"
                        )}
                      >
                        All
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Specializations */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted block">Specialized Domain</label>
                <div className="flex flex-wrap gap-2">
                  {["All Domains", "Cloud", "Python", "Java", "Fullstack", "DevOps", "AI/ML", "Data Science", "Cybersecurity"].map(domain => {
                    const isAll = domain === "All Domains";
                    const isSelected = isAll 
                      ? stagedFilters.specializations.length === 0 
                      : stagedFilters.specializations.includes(domain);

                    return (
                      <button
                        key={domain}
                        onClick={() => {
                          if (isAll) {
                            setStagedFilters({ ...stagedFilters, specializations: [] });
                          } else {
                            const newSpecs = stagedFilters.specializations.includes(domain)
                              ? stagedFilters.specializations.filter(s => s !== domain)
                              : [...stagedFilters.specializations, domain];
                            setStagedFilters({ ...stagedFilters, specializations: newSpecs });
                          }
                        }}
                        type="button"
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border",
                          isSelected 
                            ? "bg-primary text-white border-primary shadow-tactile" 
                            : "bg-background border-border-subtle text-muted hover:border-primary/30"
                        )}
                      >
                        {domain}
                      </button>
                    );
                  })}
                </div>

                {stagedFilters.specializations.length > 1 && (
                  <div className="p-3 bg-background rounded-2xl border border-border-subtle flex items-center justify-between mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted">Domain Match Mode</span>
                    <div className="flex bg-surface p-1 rounded-xl border border-border-subtle/50">
                      <button
                        type="button"
                        onClick={() => setStagedFilters({ ...stagedFilters, specializationMode: 'any' })}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          stagedFilters.specializationMode === 'any'
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted hover:text-foreground"
                        )}
                      >
                        Any
                      </button>
                      <button
                        type="button"
                        onClick={() => setStagedFilters({ ...stagedFilters, specializationMode: 'all' })}
                        className={cn(
                          "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                          stagedFilters.specializationMode === 'all'
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted hover:text-foreground"
                        )}
                      >
                        All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border-subtle bg-background/50 flex gap-3">
              <button 
                onClick={() => setStagedFilters({
                  minCgpa: 0,
                  maxCgpa: 10,
                  minLeetcode: 0,
                  specializations: [],
                  specializationMode: "any",
                  depts: [],
                  status: "All Statuses",
                  company: "All Companies",
                  interests: [],
                  interestMode: "any"
                })}
                type="button"
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
                    specialization: stagedFilters.specializations.length > 0 ? stagedFilters.specializations.join(',') : "All Domains",
                    specializationMode: stagedFilters.specializationMode,
                    dept: stagedFilters.depts.length > 0 ? stagedFilters.depts.join(',') : "All Departments",
                    status: stagedFilters.status,
                    company: stagedFilters.company,
                    interest: stagedFilters.interests.length > 0 ? stagedFilters.interests.join(',') : "All Preferences",
                    interestMode: stagedFilters.interestMode
                  });
                  setIsFilterDrawerOpen(false);
                }}
                type="button"
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
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Batch</p>
                      <p className="text-sm font-black">{selectedStudent.year}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Status</p>
                      <p className="text-sm font-black">{selectedStudent.status}</p>
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
                  ) : studentApplications.length === 0 ? (
                    <p className="text-xs font-bold text-muted italic bg-background/50 border border-border-subtle/50 p-4 rounded-2xl text-center">
                      No drive attendance records found.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {studentApplications.map((app: any) => {
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
                className="w-full py-3 rounded-xl bg-primary text-white font-black text-sm shadow-tactile hover:scale-[1.02] active:scale-[0.98] transition-all"
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
