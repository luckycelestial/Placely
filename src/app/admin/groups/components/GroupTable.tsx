"use client";

import { 
  LuSearch, 
  LuX, 
  LuChevronLeft, 
  LuChevronRight, 
  LuUser, 
  LuMail, 
  LuTrash2, 
  LuSlidersHorizontal, 
  LuCheck 
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { getBatchDetails } from "@/lib/batch-utils";
import type { CustomGroup } from "@/services/settings";

interface GroupTableProps {
  activeGroup: CustomGroup;
  filteredStudents: any[];
  paginatedStudents: any[];
  selectedStudentIds: string[];
  isCompleted: boolean;
  searchTerm: string;
  deptFilter: string;
  batchFilter: string;
  showOnlyMembers: boolean;
  selectedOptionFilter: string;
  memberCount: number;
  optionCounts: Record<string, number>;
  departmentsList: string[];
  batchesList: string[];
  currentPage: number;
  pageSize: number;
  isUpdatingMember: string | null;
  isBatchUpdating: boolean;
  batchOptionVal: string;
  onSearchChange: (val: string) => void;
  onDeptFilterChange: (val: string) => void;
  onBatchFilterChange: (val: string) => void;
  onShowOnlyMembersChange: (val: boolean) => void;
  onOptionFilterSelect: (opt: string) => void;
  onToggleSelectAll: () => void;
  onToggleStudentSelection: (id: string) => void;
  onBatchOptionValChange: (val: string) => void;
  onBatchAssign: (option: string, clear?: boolean) => void;
  onAssignOptionToStudent: (studentId: string, group: CustomGroup, option: string, action: 'add' | 'remove' | 'set') => void;
  onClearStudentOptions: (studentId: string) => void;
  onPageChange: (page: number) => void;
  getStudentSelectionsInGroup: (student: any, group: CustomGroup) => string[];
}

export function GroupTable({
  activeGroup,
  filteredStudents,
  paginatedStudents,
  selectedStudentIds,
  isCompleted,
  searchTerm,
  deptFilter,
  batchFilter,
  showOnlyMembers,
  selectedOptionFilter,
  memberCount,
  optionCounts,
  departmentsList,
  batchesList,
  currentPage,
  pageSize,
  isUpdatingMember,
  isBatchUpdating,
  batchOptionVal,
  onSearchChange,
  onDeptFilterChange,
  onBatchFilterChange,
  onShowOnlyMembersChange,
  onOptionFilterSelect,
  onToggleSelectAll,
  onToggleStudentSelection,
  onBatchOptionValChange,
  onBatchAssign,
  onAssignOptionToStudent,
  onClearStudentOptions,
  onPageChange,
  getStudentSelectionsInGroup,
}: GroupTableProps) {
  const totalPages = Math.ceil(filteredStudents.length / pageSize);

  return (
    <div className="space-y-4">
      {/* Option Filter Chips */}
      {activeGroup.options.length > 0 && (
        <div className="bg-surface p-4 rounded-2xl border border-border-subtle shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-muted tracking-widest">
              Segment By Option
            </span>
            {selectedOptionFilter && (
              <button
                type="button"
                onClick={() => onOptionFilterSelect("")}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Clear option filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <button
              type="button"
              onClick={() => onOptionFilterSelect("")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer",
                selectedOptionFilter === ""
                  ? "bg-foreground text-background border-foreground shadow-tactile scale-[1.01]"
                  : "bg-background text-muted border-border-subtle hover:border-primary/30"
              )}
            >
              <span>All Options</span>
              <span className={cn(
                "text-[9px] font-black px-1.5 py-0.2 rounded-md",
                selectedOptionFilter === "" ? "bg-background/20 text-background" : "bg-muted/10 text-muted"
              )}>
                {memberCount}
              </span>
            </button>

            {activeGroup.options.map((option) => {
              const isSelected = selectedOptionFilter === option;
              const count = optionCounts[option] || 0;

              return (
                <button
                  type="button"
                  key={option}
                  onClick={() => onOptionFilterSelect(option)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer",
                    isSelected
                      ? "bg-primary/10 border-primary text-primary font-black scale-[1.02]"
                      : count > 0
                      ? "bg-background text-foreground border-border-subtle hover:border-primary/40"
                      : "bg-background/40 text-muted/60 border-border-subtle/60 hover:opacity-100 hover:text-foreground opacity-65"
                  )}
                >
                  <span>{option}</span>
                  <span className={cn(
                    "text-[9px] font-black px-1.5 py-0.2 rounded-md",
                    isSelected
                      ? "bg-primary text-white"
                      : count > 0
                      ? "bg-primary/10 text-primary"
                      : "bg-muted/10 text-muted/70"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Full-width Members Directory Table */}
      <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden space-y-4">
        {/* Search, Filter Control Panel */}
        <div className="p-6 pb-2 border-b border-border-subtle/50 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black tracking-tight text-foreground">Cohort Members</h3>
              <p className="text-xs font-semibold text-muted/80">{filteredStudents.length} students matching filters</p>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <label className="flex items-center gap-2 text-xs font-black text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOnlyMembers}
                  onChange={(e) => onShowOnlyMembersChange(e.target.checked)}
                  className="rounded text-primary border-border-subtle focus:ring-primary h-3.5 w-3.5"
                />
                <span>Members Only</span>
              </label>
            </div>
          </div>

          {/* Control Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-6 relative flex items-center">
              <LuSearch size={14} className="absolute left-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search student by name, register number..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-background border border-border-subtle rounded-xl py-2.5 pl-9.5 pr-7 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {searchTerm && (
                <button type="button" onClick={() => onSearchChange("")} className="absolute right-2.5 text-muted hover:text-foreground">
                  <LuX size={12} />
                </button>
              )}
            </div>

            {/* Department Dropdown Filter */}
            <div className="sm:col-span-3">
              <select
                value={deptFilter}
                onChange={(e) => onDeptFilterChange(e.target.value)}
                className="w-full bg-background border border-border-subtle rounded-xl py-2.5 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">All Departments</option>
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Batch Dropdown Filter */}
            <div className="sm:col-span-3">
              <select
                value={batchFilter}
                onChange={(e) => onBatchFilterChange(e.target.value)}
                className="w-full bg-background border border-border-subtle rounded-xl py-2.5 px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="">All Batches</option>
                {batchesList.map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Batch Actions Toolbar */}
        {selectedStudentIds.length > 0 && activeGroup.options.length > 0 && (
          <div className="mx-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground font-black text-xs flex items-center justify-center">
                {selectedStudentIds.length}
              </span>
              <span className="text-xs font-bold text-foreground">students selected</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={batchOptionVal}
                onChange={(e) => onBatchOptionValChange(e.target.value)}
                className="text-xs font-bold bg-surface border border-border-subtle rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
              >
                <option value="">Select option to apply...</option>
                {activeGroup.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <button
                type="button"
                disabled={!batchOptionVal || isBatchUpdating}
                onClick={() => onBatchAssign(batchOptionVal, false)}
                className="px-3.5 py-2 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-tactile hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <LuCheck size={14} />
                Assign Option
              </button>

              <button
                type="button"
                disabled={isBatchUpdating}
                onClick={() => onBatchAssign("", true)}
                className="px-3 py-2 bg-surface border border-red-200 text-red-600 font-bold text-xs rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Clear Option
              </button>
            </div>
          </div>
        )}

        {/* Main Table Grid */}
        <div className="px-6 pb-6">
          {filteredStudents.length > 0 ? (
            <>
              <div className="overflow-x-auto border border-border-subtle rounded-2xl bg-background/30">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface/50 text-[10px] font-black uppercase tracking-wider text-muted select-none">
                      <th className="p-4 pl-5 w-10">
                        <input
                          type="checkbox"
                          checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.includes(s.id))}
                          onChange={onToggleSelectAll}
                          aria-label="Select all students"
                          className="rounded text-primary border-border-subtle focus:ring-primary h-4 w-4 cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Student</th>
                      <th className="p-4">Reg No</th>
                      <th className="p-4">Dept &amp; Year</th>
                      <th className="p-4 w-[220px]">Mapping Option</th>
                      <th className="p-4 text-right pr-6 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50">
                    {paginatedStudents.map((s) => {
                      const selections = getStudentSelectionsInGroup(s, activeGroup);
                      const isChecked = selectedStudentIds.includes(s.id);
                      
                      return (
                        <tr 
                          key={s.id} 
                          className={cn(
                            "text-xs font-semibold transition-all hover:bg-background/40",
                            isChecked ? "bg-primary/[0.01]" : ""
                          )}
                        >
                          {/* Checkbox select */}
                          <td className="p-4 pl-5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => onToggleStudentSelection(s.id)}
                              aria-label={`Select student ${s.name}`}
                              className="rounded text-primary border-border-subtle focus:ring-primary h-4 w-4 cursor-pointer"
                            />
                          </td>
                          
                          {/* Student Profile Info */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 select-none">
                                {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-foreground truncate">{s.name}</p>
                                <p className="text-[10px] text-muted-foreground/60 truncate flex items-center gap-1">
                                  <LuMail size={10} className="shrink-0" />
                                  <span>{s.email}</span>
                                </p>
                              </div>
                            </div>
                          </td>
                          
                          {/* Reg No */}
                          <td className="p-4 text-muted font-mono">{s.regNo}</td>
                          
                          {/* Dept & Batch */}
                          <td className="p-4">
                            <div>
                              <p className="text-xs font-bold text-foreground">{s.dept || "N/A"}</p>
                              <p className="text-[10px] font-medium text-muted mt-0.5">
                                {getBatchDetails(s.year, isCompleted).formatLabel}
                              </p>
                            </div>
                          </td>

                          {/* Option Selector */}
                          <td className="p-4">
                            {activeGroup.type === "student_selectable" ? (
                              <div className="flex flex-wrap gap-1 items-center">
                                {selections.map((sel) => (
                                  <span
                                    key={sel}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary rounded-md"
                                  >
                                    {sel}
                                    <button
                                      type="button"
                                      disabled={isUpdatingMember === s.id}
                                      onClick={() => onAssignOptionToStudent(s.id, activeGroup, sel, 'remove')}
                                      className="text-primary/45 hover:text-primary transition-colors p-0.5"
                                    >
                                      <LuX size={10} />
                                    </button>
                                  </span>
                                ))}
                                
                                {/* Quick add dropdown */}
                                {activeGroup.options.filter(o => !selections.includes(o)).length > 0 && (
                                  <select
                                    disabled={isUpdatingMember === s.id}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val) {
                                        onAssignOptionToStudent(s.id, activeGroup, val, 'add');
                                        e.target.value = "";
                                      }
                                    }}
                                    className="text-[9px] bg-surface border border-border-subtle rounded px-2 py-0.5 font-bold cursor-pointer focus:outline-none"
                                  >
                                    <option value="">+ Add Option</option>
                                    {activeGroup.options.filter(o => !selections.includes(o)).map(o => (
                                      <option key={o} value={o}>{o}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            ) : (
                              <SearchableSelect
                                options={[
                                  { value: "", label: "Unassigned" },
                                  ...activeGroup.options.map(o => ({ value: o, label: o }))
                                ]}
                                value={selections[0] || ""}
                                placeholder="Unassigned"
                                disabled={isUpdatingMember === s.id}
                                onChange={(val) => {
                                  if (val) {
                                    onAssignOptionToStudent(s.id, activeGroup, val, 'set');
                                  } else {
                                    onAssignOptionToStudent(s.id, activeGroup, "", 'remove');
                                  }
                                }}
                                className="w-40"
                              />
                            )}
                          </td>
                          
                          {/* Actions */}
                          <td className="p-4 text-right pr-6">
                            <button
                              type="button"
                              disabled={selections.length === 0 || isUpdatingMember === s.id}
                              onClick={() => onClearStudentOptions(s.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200/60 bg-red-50/60 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                              <LuTrash2 size={11} />
                              <span>Unassign</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {filteredStudents.length > pageSize && (
                <div className="mt-4 flex items-center justify-between border-t border-border-subtle/50 pt-4 px-2 select-none">
                  <span className="text-[10px] font-bold text-muted uppercase">
                    Showing {Math.min(filteredStudents.length, (currentPage - 1) * pageSize + 1)}-{Math.min(filteredStudents.length, currentPage * pageSize)} of {filteredStudents.length}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                      aria-label="Previous page"
                      className="p-1.5 border border-border-subtle rounded-xl text-muted hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <LuChevronLeft size={16} />
                    </button>
                    <span className="text-[10px] font-black uppercase text-foreground">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => onPageChange(currentPage + 1)}
                      aria-label="Next page"
                      className="p-1.5 border border-border-subtle rounded-xl text-muted hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <LuChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-dashed border-border-subtle rounded-3xl p-16 text-center text-muted font-bold bg-background/10">
              <LuUser size={40} className="mx-auto text-muted/30 mb-4" />
              <p className="text-sm font-black">No matching students found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Refine your filters, search term, or option filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
