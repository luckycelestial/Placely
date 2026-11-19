"use client";

import { useState } from "react";
import { 
  LuArrowUpDown, 
  LuArrowUp, 
  LuArrowDown, 
  LuEllipsis, 
  LuUser, 
  LuEye 
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Sk } from "@/components/ui/skeleton";
import type { AdminStudent, SortField } from "../types";

interface StudentTableProps {
  students: AdminStudent[];
  visibleStudents: AdminStudent[];
  loading: boolean;
  sortField: SortField | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  onEditStudent: (student: AdminStudent) => void;
  onViewStudent: (student: AdminStudent) => void;
}

export function StudentTable({
  students,
  visibleStudents,
  loading,
  sortField,
  sortDirection,
  onSort,
  onEditStudent,
  onViewStudent,
}: StudentTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-background/50 select-none">
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">
                <button onClick={() => onSort('name')} className="flex items-center gap-1.5 hover:text-foreground transition-colors group/th">
                  STUDENT
                  {sortField === 'name' ? (
                    sortDirection === 'asc' ? <LuArrowUp size={13} className="text-primary" /> : <LuArrowDown size={13} className="text-primary" />
                  ) : (
                    <LuArrowUpDown size={13} className="text-muted/40 group-hover/th:text-muted transition-colors" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">
                <button onClick={() => onSort('dept')} className="flex items-center gap-1.5 hover:text-foreground transition-colors group/th">
                  DEPT &amp; BATCH
                  {sortField === 'dept' ? (
                    sortDirection === 'asc' ? <LuArrowUp size={13} className="text-primary" /> : <LuArrowDown size={13} className="text-primary" />
                  ) : (
                    <LuArrowUpDown size={13} className="text-muted/40 group-hover/th:text-muted transition-colors" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-center">
                <button onClick={() => onSort('cgpa')} className="flex items-center justify-center gap-1.5 w-full hover:text-foreground transition-colors group/th">
                  CGPA
                  {sortField === 'cgpa' ? (
                    sortDirection === 'asc' ? <LuArrowUp size={13} className="text-primary" /> : <LuArrowDown size={13} className="text-primary" />
                  ) : (
                    <LuArrowUpDown size={13} className="text-muted/40 group-hover/th:text-muted transition-colors" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">
                <button onClick={() => onSort('technical')} className="flex items-center gap-1.5 hover:text-foreground transition-colors group/th">
                  TECHNICAL
                  {sortField === 'technical' ? (
                    sortDirection === 'asc' ? <LuArrowUp size={13} className="text-primary" /> : <LuArrowDown size={13} className="text-primary" />
                  ) : (
                    <LuArrowUpDown size={13} className="text-muted/40 group-hover/th:text-muted transition-colors" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">
                <button onClick={() => onSort('profile')} className="flex items-center gap-1.5 hover:text-foreground transition-colors group/th">
                  PROFILE
                  {sortField === 'profile' ? (
                    sortDirection === 'asc' ? <LuArrowUp size={13} className="text-primary" /> : <LuArrowDown size={13} className="text-primary" />
                  ) : (
                    <LuArrowUpDown size={13} className="text-muted/40 group-hover/th:text-muted transition-colors" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">
                <button onClick={() => onSort('status')} className="flex items-center gap-1.5 hover:text-foreground transition-colors group/th">
                  STATUS
                  {sortField === 'status' ? (
                    sortDirection === 'asc' ? <LuArrowUp size={13} className="text-primary" /> : <LuArrowDown size={13} className="text-primary" />
                  ) : (
                    <LuArrowUpDown size={13} className="text-muted/40 group-hover/th:text-muted transition-colors" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loading ? (
              <Sk.TableRows cols={7} rows={8} />
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-muted font-bold">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              visibleStudents.map((student) => (
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
                      <p className="text-sm font-bold text-foreground">
                        {student.dept} {student.section ? `• Sec ${student.section}` : ""}
                      </p>
                      <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{student.year}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "text-sm font-black tracking-tight",
                      student.cgpa >= 8.5 ? "text-emerald-600" : 
                      student.cgpa >= 7.5 ? "text-blue-600" : 
                      "text-amber-600"
                    )}>
                      {Number(student.cgpa).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-foreground/90">LC: {student.leetcode || 0}</span>
                      <div className="flex flex-wrap gap-1 text-[10px] font-medium text-muted">
                        {(student.specializations || []).slice(0, 2).join(', ')}
                        {(student.specializations || []).length > 2 && (
                          <span className="text-muted/60">+{(student.specializations || []).length - 2}</span>
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
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          Placed {(student as any).package_ctc ? `(${(student as any).package_ctc})` : ""}
                        </div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-wider mt-0.5">{student.company}</p>
                      </div>
                    ) : student.eligible ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        Available
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                          Not Eligible
                        </div>
                        <p className="text-[10px] font-medium text-muted uppercase tracking-wider mt-0.5">{student.reason || 'Requirement Gap'}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 relative">
                      <div className="relative">
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                          aria-label="Student actions"
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
                                  onEditStudent(student);
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
                        onClick={() => onViewStudent(student)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-surface border border-border-subtle shadow-sm hover:text-primary hover:border-primary/30 transition-all"
                        title="View Profile"
                        aria-label={`View profile of ${student.name}`}
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
    </div>
  );
}
