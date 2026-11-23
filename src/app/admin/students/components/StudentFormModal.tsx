"use client";

import { useEffect, useState } from "react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { toast } from "sonner";
import { DEPARTMENTS, type AdminStudent } from "../types";
import { getBatchRangeFromYear } from "@/lib/batch-utils";

export interface AddStudentFormData {
  name: string;
  email: string;
  personalEmail: string;
  regNo: string;
  dept: string;
  year: string;
}

interface AddStudentModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  student: AddStudentFormData;
  batchOptions: { value: string; label: string }[];
  onChange: (updated: AddStudentFormData) => void;
  onSubmit: (e: React.FormEvent, turnstileToken?: string) => void;
  onClose: () => void;
}

export function AddStudentModal({
  isOpen,
  isSubmitting,
  student,
  batchOptions,
  onChange,
  onSubmit,
  onClose,
}: AddStudentModalProps) {
  const [turnstileToken, setTurnstileToken] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setTurnstileToken("");
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      toast.error("Please complete the Cloudflare security verification.");
      return;
    }
    onSubmit(e, turnstileToken);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-title"
        className="relative w-full max-w-lg bg-surface rounded-3xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-200"
      >
        <div className="p-8 border-b border-border-subtle bg-background/50">
          <h3 id="add-student-title" className="text-xl font-black tracking-tight">Add New Student</h3>
          <p className="text-xs text-muted font-medium mt-1">Create a new student record in the placement database.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. John Doe"
              value={student.name}
              onChange={e => onChange({ ...student, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Register Number</label>
              <input 
                type="text" 
                required
                placeholder="e.g. 717821P101"
                value={student.regNo}
                onChange={e => onChange({ ...student, regNo: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">Department</label>
              <SearchableSelect 
                options={DEPARTMENTS.slice(1).map(d => ({ value: d, label: d }))}
                value={student.dept}
                onChange={value => onChange({ ...student, dept: value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">College Email (Login)</label>
            <input 
              type="email" 
              required
              placeholder="e.g. john.d@college.edu"
              value={student.email}
              onChange={e => onChange({ ...student, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Personal Email</label>
            <input 
              type="email" 
              placeholder="e.g. personal.john@gmail.com"
              value={student.personalEmail}
              onChange={e => onChange({ ...student, personalEmail: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted uppercase tracking-wider">Batch</label>
            <SearchableSelect 
              options={batchOptions}
              value={student.year}
              onChange={value => onChange({ ...student, year: value })}
            />
          </div>

          <div className="py-2 flex justify-center">
            <TurnstileWidget
              action="student_create"
              onSuccess={(tok) => setTurnstileToken(tok)}
              onError={() => setTurnstileToken("")}
              onExpire={() => setTurnstileToken("")}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-border-subtle font-bold text-sm text-muted hover:text-foreground hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-tactile hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditStudentModalProps {
  isOpen: boolean;
  student: AdminStudent | null;
  isSubmitting: boolean;
  batchOptions: { value: string; label: string }[];
  onChange: (student: AdminStudent) => void;
  onSave: (studentId: string, data: Partial<AdminStudent>) => void;
  onClose: () => void;
}

export function EditStudentModal({
  isOpen,
  student,
  isSubmitting,
  batchOptions,
  onChange,
  onSave,
  onClose,
}: EditStudentModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-student-title"
        className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl overflow-hidden border border-border-subtle animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-border-subtle bg-background/50 shrink-0">
          <h3 id="edit-student-title" className="text-xl font-black tracking-tight">Edit Student Profile</h3>
          <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">{student.regNo}</p>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Identity */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Identity</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                  value={student.name} 
                  onChange={e => onChange({ ...student, name: e.target.value })} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">College Email (Login)</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                  value={student.email || ''} 
                  onChange={e => onChange({ ...student, email: e.target.value })} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Personal Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                  value={student.personal_email || ''} 
                  onChange={e => onChange({ ...student, personal_email: e.target.value })} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Register Number</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                  value={student.regNo} 
                  onChange={e => onChange({ ...student, regNo: e.target.value })} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Roll Number</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                  value={student.rollNo || ''} 
                  onChange={e => onChange({ ...student, rollNo: e.target.value })} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Gender</label>
                <SearchableSelect 
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" }
                  ]}
                  value={student.gender || ''}
                  onChange={value => onChange({ ...student, gender: value })}
                  placeholder="— Select —"
                />
              </div>
            </div>
          </div>

          {/* Academic */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">Academic</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Department</label>
                <SearchableSelect 
                  options={DEPARTMENTS.slice(1).map(d => ({ value: d, label: d }))}
                  value={student.dept}
                  onChange={value => onChange({ ...student, dept: value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Batch</label>
                <SearchableSelect 
                  options={batchOptions}
                  value={String(getBatchRangeFromYear(student.year).endYear)}
                  onChange={value => onChange({ ...student, year: value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">CGPA (Aggregate)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="10" 
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                  value={student.cgpa} 
                  onChange={e => onChange({ ...student, cgpa: parseFloat(e.target.value) || 0 })} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">LeetCode Solved</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border-subtle font-bold text-sm focus:border-primary outline-none transition-all"
                  value={student.leetcode} 
                  onChange={e => onChange({ ...student, leetcode: parseInt(e.target.value) || 0 })} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-border-subtle bg-background/50 flex gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-surface border border-border-subtle text-xs font-black uppercase tracking-widest hover:bg-background transition-all"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={() => onSave(student.id, {
              name: student.name,
              email: student.email,
              personal_email: student.personal_email || '',
              regNo: student.regNo,
              rollNo: student.rollNo,
              dept: student.dept,
              year: student.year,
              cgpa: student.cgpa,
              gender: student.gender,
              leetcode: student.leetcode,
            })}
            className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
