"use client";

import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { LuUpload, LuUserPlus } from "react-icons/lu";
import { db } from "@/services/database";
import { useSearchParams, useRouter } from "next/navigation";
import { getSystemSettings } from "@/services/settings";
import { getBatchList } from "@/lib/batch-utils";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { toast } from "sonner";

import type { AdminStudent, SortField } from "./types";
import { StudentFilters } from "./components/StudentFilters";
import { StudentTable } from "./components/StudentTable";
import { StudentDetailModal, type StudentDetailApplication } from "./components/StudentDetailModal";
import { AddStudentModal, EditStudentModal } from "./components/StudentFormModal";
import { StudentImportModal } from "./components/StudentImportModal";

function StudentsPageContent() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(25);

  const [studentApplications, setStudentApplications] = useState<StudentDetailApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

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

  const [allCompanies, setAllCompanies] = useState<string[]>([]);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const data = await db.getCompanies();
        setAllCompanies(["All Companies", ...data.map((c: { name: string }) => c.name)]);
      } catch (err) {
        console.error("Failed to load companies:", err);
      }
    }
    loadCompanies();
  }, []);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);

  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    personalEmail: "",
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

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await db.getStudents({
        page: 1,
        pageSize: 10000,
        dept: deptFilter,
        status: statusFilter,
        ...advancedFilters
      });
      setStudents(data);
      setVisibleCount(25);
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setLoading(false);
    }
  }, [deptFilter, statusFilter, advancedFilters]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const { data } = await db.getStudents({
          page: 1,
          pageSize: 10000,
          dept: deptFilter,
          status: statusFilter,
          ...advancedFilters
        });
        if (!ignore) {
          setStudents(data);
          setVisibleCount(25);
        }
      } catch (error) {
        console.error("Failed to load students:", error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [deptFilter, statusFilter, advancedFilters]);

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else setSortField(null);
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredStudents = useMemo(() => {
    const list = students.filter(student => {
      return student.name.toLowerCase().includes(search.toLowerCase()) || 
             student.regNo.toLowerCase().includes(search.toLowerCase());
    });

    if (!sortField) return list;

    return [...list].sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      if (sortField === 'name') {
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
      } else if (sortField === 'dept') {
        aVal = `${a.dept || ''} ${a.section || ''}`.toLowerCase();
        bVal = `${b.dept || ''} ${b.section || ''}`.toLowerCase();
      } else if (sortField === 'cgpa') {
        aVal = Number(a.cgpa || 0);
        bVal = Number(b.cgpa || 0);
      } else if (sortField === 'technical') {
        aVal = Number(a.leetcode || 0);
        bVal = Number(b.leetcode || 0);
      } else if (sortField === 'profile') {
        aVal = Number(a.completeness || 0);
        bVal = Number(b.completeness || 0);
      } else if (sortField === 'status') {
        aVal = (a.status || '').toLowerCase();
        bVal = (b.status || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [students, search, sortField, sortDirection]);

  const visibleStudents = useMemo(() => {
    return filteredStudents.slice(0, visibleCount);
  }, [filteredStudents, visibleCount]);

  // Exports
  const fetchAllForExport = async () => {
    try {
      const { data } = await db.getStudents({
        page: 1,
        pageSize: 10000,
        dept: deptFilter,
        status: statusFilter,
        ...advancedFilters
      });
      return data.filter(student => 
        student.name.toLowerCase().includes(search.toLowerCase()) || 
        student.regNo.toLowerCase().includes(search.toLowerCase())
      );
    } catch (err) {
      console.error("Export fetch failed:", err);
      toast.error("Failed to fetch data for export");
      return [];
    }
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading("Exporting Excel...");
    try {
      const data = await fetchAllForExport();
      if (data.length === 0) {
        toast.error("No data to export");
        return;
      }
      const exportRows = data.map(s => ({
        "Name": s.name,
        "Register Number": s.regNo,
        "Department": s.dept,
        "Batch": s.year,
        "CGPA": s.cgpa,
        "LeetCode Solved": s.leetcode,
        "Status": s.status,
        "Company": s.company,
        "Package (CTC)": s.package_ctc,
        "Email": s.personal_email
      }));
      exportToExcel(exportRows, "Students_Report");
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export Excel");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading("Exporting PDF...");
    try {
      const data = await fetchAllForExport();
      if (data.length === 0) {
        toast.error("No data to export");
        return;
      }
      const headers = ["Name", "Reg No", "Dept", "Batch", "CGPA", "LeetCode", "Status", "Company", "CTC"];
      const rows = data.map(s => [
        s.name,
        s.regNo,
        s.dept,
        s.year,
        String(s.cgpa),
        String(s.leetcode),
        s.status,
        s.company,
        s.package_ctc || "N/A"
      ]);
      await exportToPDF("Students Directory", headers, rows, "Students_Report");
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleAddStudent = async (e: React.FormEvent, turnstileToken?: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!turnstileToken) {
        throw new Error("Security verification token required.");
      }

      // Verify token
      const verifyRes = await fetch("/api/turnstile/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: turnstileToken, action: "student_create" })
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson.ok) {
        throw new Error(verifyJson.error || "Security verification failed");
      }

      await db.createStudent(newStudent);
      setIsAddModalOpen(false);
      setNewStudent({ name: "", email: "", personalEmail: "", regNo: "", dept: "CSE", year: batchOptions[3]?.value || "" });
      toast.success("Student created successfully!");
      loadStudents();
    } catch (error: any) {
      console.error("Failed to add student:", error);
      toast.error(error?.message || "Failed to add student. Please check details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (studentId: string, data: Partial<AdminStudent>) => {
    setIsSubmitting(true);
    try {
      await db.updateStudentProfile(studentId, data);
      toast.success("Student profile updated!");
      await loadStudents();
      setIsEditModalOpen(false);
      setEditingStudent(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewStudent = async (student: AdminStudent) => {
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
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />
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
            <LuUserPlus size={16} />
            Add Student
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <StudentFilters
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        statusFilter={statusFilter}
        advancedFilters={advancedFilters}
        onApplyFilters={updateFilters}
        allCompanies={allCompanies}
      />

      {/* Table Section */}
      <StudentTable
        students={filteredStudents}
        visibleStudents={visibleStudents}
        loading={loading}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onEditStudent={(s) => {
          setEditingStudent(s);
          setIsEditModalOpen(true);
        }}
        onViewStudent={handleViewStudent}
      />

      {/* Modals & Drawers */}
      <StudentDetailModal
        isOpen={isDetailOpen}
        student={selectedStudent}
        applications={studentApplications}
        loadingApplications={loadingApplications}
        onClose={() => setIsDetailOpen(false)}
      />

      <AddStudentModal
        isOpen={isAddModalOpen}
        isSubmitting={isSubmitting}
        student={newStudent}
        batchOptions={batchOptions}
        onChange={setNewStudent}
        onSubmit={handleAddStudent}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditStudentModal
        isOpen={isEditModalOpen}
        student={editingStudent}
        isSubmitting={isSubmitting}
        batchOptions={batchOptions}
        onChange={setEditingStudent}
        onSave={handleUpdateProfile}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
        }}
      />

      <StudentImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={loadStudents}
      />
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
