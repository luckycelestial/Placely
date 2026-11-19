"use client";

import { useEffect } from "react";
import { LuX, LuPlus, LuTrash2, LuTriangleAlert } from "react-icons/lu";
import { cn } from "@/lib/utils";
import type { CustomGroup } from "@/services/settings";

interface GroupConfigDrawerProps {
  isOpen: boolean;
  activeGroup: CustomGroup | null;
  optionCounts: Record<string, number>;
  isAddingOption: boolean;
  newOptionName: string;
  confirmDeleteOption: string | null;
  confirmDeleteGroupId: string | null;
  onClose: () => void;
  onUpdateGroupType: (groupId: string, newType: 'student_selectable' | 'admin_assigned') => void;
  onStartAddOption: () => void;
  onCancelAddOption: () => void;
  onOptionNameChange: (name: string) => void;
  onAddOption: (e: React.FormEvent) => void;
  onSetConfirmDeleteOption: (opt: string | null) => void;
  onDeleteOption: (opt: string) => void;
  onSetConfirmDeleteGroupId: (id: string | null) => void;
  onDeleteGroup: (groupId: string) => void;
}

export function GroupConfigDrawer({
  isOpen,
  activeGroup,
  optionCounts,
  isAddingOption,
  newOptionName,
  confirmDeleteOption,
  confirmDeleteGroupId,
  onClose,
  onUpdateGroupType,
  onStartAddOption,
  onCancelAddOption,
  onOptionNameChange,
  onAddOption,
  onSetConfirmDeleteOption,
  onDeleteOption,
  onSetConfirmDeleteGroupId,
  onDeleteGroup,
}: GroupConfigDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !activeGroup) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-config-title"
        className="fixed inset-y-0 right-0 max-w-md w-full bg-white border-l border-border-subtle shadow-2xl z-50 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border-subtle/50 pb-4 mb-6">
          <div>
            <h3 id="group-config-title" className="text-lg font-black text-foreground">Configure Group</h3>
            <p className="text-xs text-muted-foreground">Manage options and segments for {activeGroup.name}</p>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close drawer"
            className="p-1.5 rounded-xl hover:bg-background border border-border-subtle/50 text-muted hover:text-foreground cursor-pointer"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Configuration Options */}
        <div className="space-y-6 flex-1 flex flex-col">
          
          {/* Selectability Toggle */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black uppercase text-muted tracking-widest block">Group Selectability</label>
            <div className="grid grid-cols-2 gap-2 bg-background border border-border-subtle p-1 rounded-2xl shadow-sm">
              <button
                type="button"
                onClick={() => onUpdateGroupType(activeGroup.id, 'student_selectable')}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeGroup.type === 'student_selectable' 
                    ? "bg-emerald-500 text-white shadow-tactile" 
                    : "text-muted hover:text-foreground"
                )}
              >
                Selectable
              </button>
              <button
                type="button"
                onClick={() => onUpdateGroupType(activeGroup.id, 'admin_assigned')}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  activeGroup.type === 'admin_assigned' 
                    ? "bg-purple-500 text-white shadow-tactile" 
                    : "text-muted hover:text-foreground"
                )}
              >
                Assigned
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              {activeGroup.type === 'student_selectable' 
                ? "Students can select options in their profile page."
                : "Only administrators can map students to options in this cohort."}
            </p>
          </div>

          <div className="h-px bg-border-subtle/50" />

          {/* Options list inside Drawer */}
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-muted tracking-widest block">Options List</label>
              
              {!isAddingOption ? (
                <button
                  type="button"
                  onClick={onStartAddOption}
                  className="flex items-center gap-1 text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/15 hover:bg-primary/20 rounded-xl px-2.5 py-1.5 transition-all cursor-pointer"
                >
                  <LuPlus size={12} /> Add Option
                </button>
              ) : (
                <form onSubmit={onAddOption} className="flex gap-1.5 animate-in zoom-in-95 duration-200">
                  <input
                    type="text"
                    placeholder="Option name..."
                    autoFocus
                    required
                    value={newOptionName}
                    onChange={(e) => onOptionNameChange(e.target.value)}
                    className="px-2.5 py-1 bg-background border border-border-subtle rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white rounded-xl px-2.5 text-[9px] font-black uppercase cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={onCancelAddOption}
                    className="p-1 hover:bg-background border border-border-subtle/50 text-muted rounded-xl cursor-pointer"
                  >
                    <LuX size={12} />
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
              {activeGroup.options.map((option) => {
                const count = optionCounts[option] || 0;
                const isDeleteConfirm = confirmDeleteOption === option;

                return (
                  <div
                    key={option}
                    className={cn(
                      "flex items-center justify-between p-3.5 bg-background border border-border-subtle rounded-2xl shadow-sm transition-all",
                      isDeleteConfirm && "border-red-300 bg-red-50/20"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-foreground">{option}</span>
                      <span className="text-[9px] font-black text-muted bg-muted/10 px-1.5 py-0.2 rounded-md">
                        {count} students
                      </span>
                    </div>

                    <div>
                      {isDeleteConfirm ? (
                        <div className="flex items-center gap-1.5 ml-1 animate-in zoom-in-95 duration-200">
                          <button
                            type="button"
                            onClick={() => onDeleteOption(option)}
                            className="text-[9px] font-black uppercase text-red-500 hover:text-white hover:bg-red-500 bg-red-500/10 px-2.5 py-1 rounded cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => onSetConfirmDeleteOption(null)}
                            className="text-[9px] font-bold text-muted hover:text-foreground bg-white px-2.5 py-1 rounded border border-border-subtle cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSetConfirmDeleteOption(option)}
                          className="text-muted/40 hover:text-red-500 transition-colors p-1.5 cursor-pointer"
                        >
                          <LuTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {activeGroup.options.length === 0 && (
                <div className="text-center text-xs text-muted font-bold italic py-8 bg-background border border-dashed border-border-subtle rounded-2xl">
                  No options defined yet.
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone: Delete Group */}
          {activeGroup.id !== "departments" && activeGroup.id !== "batches" && (
            <div className="border border-red-100 bg-red-50/10 p-5 rounded-2xl space-y-3.5 mt-auto">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-600 flex items-center gap-1 select-none">
                <LuTriangleAlert size={14} /> Danger Zone
              </h4>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                Deleting this custom group will clean up and unlink all student selections from the database. This action is irreversible.
              </p>
              
              {confirmDeleteGroupId === activeGroup.id ? (
                <div className="flex items-center gap-2 pt-1 animate-in zoom-in-95 duration-200">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteGroup(activeGroup.id);
                      onClose();
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-xs font-black uppercase tracking-widest cursor-pointer shadow-sm text-center"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetConfirmDeleteGroupId(null)}
                    className="flex-1 bg-white border border-border-subtle text-muted hover:text-foreground rounded-xl py-2.5 text-xs font-black uppercase tracking-widest cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSetConfirmDeleteGroupId(activeGroup.id)}
                  className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-200 text-red-600 rounded-xl py-2.5 text-xs font-black uppercase tracking-widest cursor-pointer transition-all text-center"
                >
                  Delete Group
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
