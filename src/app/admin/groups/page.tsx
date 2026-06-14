"use client";
import { useState, useEffect } from "react";
import { 
  LuLayers, 
  LuUser, 
  LuPlus, 
  LuTrash2, 
  LuX, 
  LuSearch, 
  LuChevronRight, 
  LuCircleCheck,
  LuLoader,
  LuSettings,
  LuActivity
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import { supabase } from "@/lib/supabase";
import { 
  getSettingByKey, 
  updateSettingByKey, 
  DEFAULT_CUSTOM_GROUPS, 
  type CustomGroup 
} from "@/services/settings";
import { toast } from "sonner";

export default function AdminGroupsPage() {
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Group creation state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<"student_selectable" | "admin_assigned">("student_selectable");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);

  // Option creation state
  const [newOptionName, setNewOptionName] = useState("");
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [confirmDeleteOption, setConfirmDeleteOption] = useState<string | null>(null);

  // Student assignment state
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [isUpdatingMember, setIsUpdatingMember] = useState<string | null>(null);

  // Load all settings & student lists
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [groupsData, studentsData] = await Promise.all([
          getSettingByKey<CustomGroup[]>('custom_groups', DEFAULT_CUSTOM_GROUPS),
          db.getAllStudents()
        ]);
        setCustomGroups(groupsData);
        setStudents(studentsData);

        // Select first group by default
        if (groupsData.length > 0) {
          setSelectedGroupId(groupsData[0].id);
        }
      } catch (err) {
        console.error("Error loading groups data:", err);
        toast.error("Failed to load groups configuration.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const activeGroup = customGroups.find(g => g.id === selectedGroupId);

  // Parse student selectable/assigned selections for the active group
  const getStudentSelectionsInGroup = (student: any, group: CustomGroup): string[] => {
    if (group.type === "student_selectable") {
      return (student.specializations || []).filter((opt: string) => group.options.includes(opt));
    } else {
      const rawPref = student.placementGroup || "";
      let val = "";
      if (rawPref.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(rawPref);
          val = parsed[group.id] || "";
        } catch (e) {}
      } else if (group.id === "placement_groups") {
        val = rawPref;
      }
      return val ? [val] : [];
    }
  };

  // Assign option helper
  const assignOptionToStudent = async (studentId: string, group: CustomGroup, option: string, action: 'add' | 'remove' | 'set') => {
    setIsUpdatingMember(studentId);
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      if (group.type === "student_selectable") {
        let newSpecs = [...(student.specializations || [])];
        if (action === 'add') {
          if (!newSpecs.includes(option)) newSpecs.push(option);
        } else if (action === 'remove') {
          newSpecs = newSpecs.filter(o => o !== option);
        } else if (action === 'set') {
          newSpecs = newSpecs.filter(o => !group.options.includes(o));
          if (option) newSpecs.push(option);
        }
        await db.updateStudentProfile(studentId, { specializations: newSpecs });
        
        setStudents(prev => prev.map(s => 
          s.id === studentId ? { ...s, specializations: newSpecs } : s
        ));
      } else {
        const currentPref = student.placementGroup || "";
        let map: Record<string, string> = {};
        if (currentPref.trim().startsWith('{')) {
          try {
            map = JSON.parse(currentPref);
          } catch (e) {}
        } else if (currentPref) {
          map["placement_groups"] = currentPref;
        }

        if (action === 'remove') {
          delete map[group.id];
        } else {
          map[group.id] = option;
        }

        const newPrefStr = JSON.stringify(map);
        await db.updateStudentProfile(studentId, { placement_group: newPrefStr });

        setStudents(prev => prev.map(s => 
          s.id === studentId ? { ...s, placementGroup: newPrefStr } : s
        ));
      }
      toast.success("Student membership updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update student membership.");
    } finally {
      setIsUpdatingMember(null);
    }
  };

  // Handle adding new custom group
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;

    const newId = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (customGroups.some(g => g.id === newId)) {
      toast.error("Group name already exists!");
      return;
    }

    const newGroupObj: CustomGroup = {
      id: newId,
      name: name,
      type: newGroupType,
      options: []
    };

    const updatedGroups = [...customGroups, newGroupObj];
    try {
      await updateSettingByKey<CustomGroup[]>('custom_groups', updatedGroups);
      setCustomGroups(updatedGroups);
      setSelectedGroupId(newId);
      setNewGroupName("");
      setIsAddingGroup(false);
      toast.success("Custom Group created!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create group.");
    }
  };

  // Handle deleting custom group
  const handleDeleteGroup = async (groupIdToDelete: string) => {
    const groupToDelete = customGroups.find(g => g.id === groupIdToDelete);
    if (!groupToDelete) return;

    const updatedGroups = customGroups.filter(g => g.id !== groupIdToDelete);

    try {
      // Clean up connections for all students in database and local state
      toast.loading("Cleaning up connections for students...");
      if (groupToDelete.type === "student_selectable") {
        if (groupToDelete.options && groupToDelete.options.length > 0) {
          const { error } = await supabase.rpc('unlink_specializations_by_options', { 
            options_to_remove: groupToDelete.options 
          });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.rpc('unlink_placement_group_by_key', { 
          group_id: groupToDelete.id 
        });
        if (error) throw error;
      }

      // Update settings
      await updateSettingByKey<CustomGroup[]>('custom_groups', updatedGroups);
      
      // Update local state
      setCustomGroups(updatedGroups);
      setStudents(prev => prev.map(student => {
        if (groupToDelete.type === "student_selectable") {
          return {
            ...student,
            specializations: (student.specializations || []).filter((s: string) => !groupToDelete.options.includes(s))
          };
        } else {
          const currentPref = student.placementGroup || "";
          if (currentPref.trim().startsWith('{')) {
            try {
              const map = JSON.parse(currentPref);
              delete map[groupToDelete.id];
              const mapStr = JSON.stringify(map);
              return { ...student, placementGroup: mapStr === '{}' ? "" : mapStr };
            } catch (e) {}
          } else if (groupToDelete.id === "placement_groups") {
            return { ...student, placementGroup: "" };
          }
          return student;
        }
      }));

      if (selectedGroupId === groupIdToDelete) {
        setSelectedGroupId(updatedGroups[0]?.id || "");
      }
      setConfirmDeleteGroupId(null);
      toast.dismiss();
      toast.success("Group deleted and student links cleaned up!");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to delete group and unlink students.");
    }
  };

  // Add Option to selected group
  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    const optionName = newOptionName.trim();
    if (!optionName) return;

    if (activeGroup.options.includes(optionName)) {
      toast.error("Option already exists inside this group!");
      return;
    }

    const updatedGroups = customGroups.map(g => {
      if (g.id === activeGroup.id) {
        return { ...g, options: [...g.options, optionName] };
      }
      return g;
    });

    try {
      await updateSettingByKey<CustomGroup[]>('custom_groups', updatedGroups);
      setCustomGroups(updatedGroups);
      setNewOptionName("");
      setIsAddingOption(false);
      toast.success("Option created!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add option.");
    }
  };

  // Delete Option from selected group
  const handleDeleteOption = async (optionToDelete: string) => {
    if (!activeGroup) return;
    const updatedOptions = activeGroup.options.filter(o => o !== optionToDelete);
    const updatedGroups = customGroups.map(g => {
      if (g.id === activeGroup.id) {
        return { ...g, options: updatedOptions };
      }
      return g;
    });

    try {
      toast.loading(`Unlinking option "${optionToDelete}" from students...`);
      if (activeGroup.type === "student_selectable") {
        const { error } = await supabase.rpc('unlink_specializations_by_options', { 
          options_to_remove: [optionToDelete] 
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('unlink_placement_group_option', { 
          group_id: activeGroup.id, 
          option_to_remove: optionToDelete 
        });
        if (error) throw error;
      }

      // Save to settings
      await updateSettingByKey<CustomGroup[]>('custom_groups', updatedGroups);
      setCustomGroups(updatedGroups);

      // Update students locally
      setStudents(prev => prev.map(student => {
        if (activeGroup.type === "student_selectable") {
          return {
            ...student,
            specializations: (student.specializations || []).filter((s: string) => s !== optionToDelete)
          };
        } else {
          const currentPref = student.placementGroup || "";
          if (currentPref.trim().startsWith('{')) {
            try {
              const map = JSON.parse(currentPref);
              if (map[activeGroup.id] === optionToDelete) {
                delete map[activeGroup.id];
              }
              const mapStr = JSON.stringify(map);
              return { ...student, placementGroup: mapStr === '{}' ? "" : mapStr };
            } catch (e) {}
          } else if (activeGroup.id === "placement_groups" && currentPref === optionToDelete) {
            return { ...student, placementGroup: "" };
          }
          return student;
        }
      }));

      setConfirmDeleteOption(null);
      toast.dismiss();
      toast.success("Option deleted and unlinked from students!");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to delete option.");
    }
  };

  // Get student members of the current selected group
  const currentMembers = students.filter(s => {
    if (!activeGroup) return false;
    return getStudentSelectionsInGroup(s, activeGroup).length > 0;
  });

  // Students who have NO selection / assignment for the active group
  const assignableStudents = students.filter(s => {
    if (!activeGroup) return false;
    const selections = getStudentSelectionsInGroup(s, activeGroup);
    if (selections.length > 0) return false;

    const searchVal = studentSearch.toLowerCase();
    return s.name.toLowerCase().includes(searchVal) || s.regNo.toLowerCase().includes(searchVal);
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LuLoader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted text-sm font-semibold tracking-wide">Loading Groups Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Custom Groups & Cohorts</h1>
        <p className="text-muted text-sm font-medium">Create custom categories (Groups) and add dynamic options for student mapping.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sidebar list of Groups */}
        <div className="lg:col-span-4 bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden">
          <div className="p-5 border-b border-border-subtle flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-muted">All Custom Groups</span>
            
            {/* Create Group Inline Button */}
            {!isAddingGroup && (
              <button
                onClick={() => setIsAddingGroup(true)}
                className="flex items-center gap-1 text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/15 hover:bg-primary/20 rounded-xl px-2.5 py-1 transition-all cursor-pointer"
              >
                <LuPlus size={12} /> Add Group
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Add Group Form */}
            {isAddingGroup && (
              <form onSubmit={handleAddGroup} className="space-y-3 p-4 bg-background/50 rounded-2xl border border-border-subtle animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted tracking-widest">Group Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Programming Languages..."
                    autoFocus
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted tracking-widest">Selectability</label>
                  <select
                    value={newGroupType}
                    onChange={(e) => setNewGroupType(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-background border border-border-subtle rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="student_selectable">Student Selectable (Profile Toggles)</option>
                    <option value="admin_assigned">Admin Assigned (Read-only for Students)</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingGroup(false);
                      setNewGroupName("");
                    }}
                    className="px-3 py-1.5 bg-surface border border-border-subtle text-muted hover:text-foreground rounded-xl text-[10px] font-black uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List of Groups */}
            <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
              {customGroups.map((group) => {
                const isSelected = selectedGroupId === group.id;
                const isDeleteConfirm = confirmDeleteGroupId === group.id;
                const totalAssigned = students.filter(s => getStudentSelectionsInGroup(s, group).length > 0).length;

                return (
                  <div
                    key={group.id}
                    onClick={() => {
                      if (!isDeleteConfirm) {
                        setSelectedGroupId(group.id);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group cursor-pointer",
                      isSelected
                        ? "bg-primary/[0.02] border-primary/20 text-primary shadow-sm"
                        : "border-transparent text-muted hover:bg-background/85 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <LuLayers size={16} className={cn(isSelected ? "text-primary" : "text-muted")} />
                      <div className="truncate">
                        <p className="text-xs font-black tracking-tight">{group.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md",
                            group.type === "student_selectable" 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-purple-50 text-purple-600 border border-purple-100"
                          )}>
                            {group.type === "student_selectable" ? "Selectable" : "Assigned"}
                          </span>
                          <span className="text-[9px] font-bold text-muted/60">{group.options.length} options • {totalAssigned} students</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Group Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isDeleteConfirm ? (
                        <div className="flex items-center gap-1.5 animate-in zoom-in duration-200">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-2 py-1 text-[8px] font-black uppercase cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteGroupId(null);
                            }}
                            className="bg-surface border border-border-subtle text-muted hover:text-foreground rounded-lg p-1 text-[8px] font-black cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteGroupId(group.id);
                          }}
                          className="text-muted/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"
                        >
                          <LuTrash2 size={14} />
                        </button>
                      )}
                      {!isDeleteConfirm && isSelected && (
                        <LuChevronRight size={14} className="text-primary/40" />
                      )}
                    </div>
                  </div>
                );
              })}
              {customGroups.length === 0 && (
                <div className="p-8 text-center text-xs text-muted font-bold italic">
                  No custom groups defined yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Group Option CRUD and Members Management */}
        <div className="lg:col-span-8 space-y-6">
          {activeGroup ? (
            <>
              {/* Option Management Section */}
              <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted">{activeGroup.name} Options</h3>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Define selections available within this group.</p>
                  </div>

                  {!isAddingOption ? (
                    <button
                      onClick={() => setIsAddingOption(true)}
                      className="flex items-center gap-1.5 text-xs font-black uppercase bg-primary hover:bg-primary-dark text-white rounded-xl px-3.5 py-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <LuPlus size={14} /> Add Option
                    </button>
                  ) : (
                    <form onSubmit={handleAddOption} className="flex gap-2 animate-in zoom-in-95 duration-200">
                      <input
                        type="text"
                        placeholder="Option name..."
                        autoFocus
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
                        className="px-3 py-1.5 bg-background border border-border-subtle rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <button
                        type="submit"
                        className="bg-primary hover:bg-primary-dark text-white rounded-xl px-3 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingOption(false);
                          setNewOptionName("");
                        }}
                        className="p-1.5 hover:bg-background border border-border-subtle/50 text-muted rounded-xl cursor-pointer"
                      >
                        <LuX size={14} />
                      </button>
                    </form>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeGroup.options.map((option) => {
                    const isDeleteConfirm = confirmDeleteOption === option;
                    return (
                      <div
                        key={option}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm bg-background border-border-subtle",
                          isDeleteConfirm && "border-red-300 bg-red-50/20"
                        )}
                      >
                        <span>{option}</span>
                        {isDeleteConfirm ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleDeleteOption(option)}
                              className="text-[9px] font-black uppercase text-red-500 hover:text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded cursor-pointer"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteOption(null)}
                              className="text-[9px] font-bold text-muted hover:text-foreground bg-surface px-1.5 py-0.5 rounded border border-border-subtle cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteOption(option)}
                            className="text-muted/40 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                          >
                            <LuX size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {activeGroup.options.length === 0 && (
                    <p className="text-xs text-muted font-semibold italic py-2">No options added yet. Click Add Option to build options list.</p>
                  )}
                </div>
              </div>

              {/* Members Management Section */}
              <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden">
                <div className="p-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black tracking-tight">{activeGroup.name} Memberships</h3>
                    <p className="text-xs font-semibold text-muted/80">{currentMembers.length} students mapped to options in this group</p>
                  </div>

                  {/* Student Search for Assignment */}
                  <div className="relative shrink-0">
                    {!isAddingStudent ? (
                      <button
                        onClick={() => setIsAddingStudent(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-soft"
                      >
                        <LuPlus size={14} /> Mappings Creator
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2.5 w-full sm:w-72 bg-background border border-border-subtle rounded-2xl p-3 absolute right-0 top-0 z-20 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="relative flex items-center">
                          <LuSearch size={14} className="absolute left-3 text-muted" />
                          <input
                            type="text"
                            placeholder="Search student..."
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="w-full bg-surface border border-border-subtle rounded-xl py-2 pl-9 pr-7 text-xs font-semibold focus:outline-none"
                          />
                          {studentSearch && (
                            <button onClick={() => setStudentSearch("")} className="absolute right-2 text-muted hover:text-foreground">
                              <LuX size={12} />
                            </button>
                          )}
                        </div>
                        
                        {/* Search list */}
                        <div className="mt-1 space-y-1.5 max-h-[220px] overflow-y-auto">
                          {assignableStudents.slice(0, 5).map((s) => (
                            <div
                              key={s.id}
                              className="flex flex-col gap-1.5 p-2 rounded-xl border border-border-subtle/50 bg-surface text-[11px] font-bold text-foreground transition-all"
                            >
                              <div>
                                <p className="font-black truncate">{s.name}</p>
                                <p className="text-[9px] text-muted/70">{s.regNo} • {s.dept}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <select
                                  id={`add-opt-${s.id}`}
                                  className="flex-1 text-[10px] bg-background border border-border-subtle rounded p-1"
                                >
                                  {activeGroup.options.map(o => (
                                    <option key={o} value={o}>{o}</option>
                                  ))}
                                  {activeGroup.options.length === 0 && (
                                    <option value="">No Options Available</option>
                                  )}
                                </select>
                                <button
                                  type="button"
                                  disabled={activeGroup.options.length === 0 || isUpdatingMember === s.id}
                                  onClick={() => {
                                    const selectElem = document.getElementById(`add-opt-${s.id}`) as HTMLSelectElement;
                                    if (selectElem && selectElem.value) {
                                      assignOptionToStudent(s.id, activeGroup, selectElem.value, activeGroup.type === 'student_selectable' ? 'add' : 'set');
                                      setIsAddingStudent(false);
                                      setStudentSearch("");
                                    }
                                  }}
                                  className="bg-primary text-white rounded p-1 px-2 text-[10px] font-black uppercase disabled:opacity-40 cursor-pointer"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          ))}
                          {studentSearch.length > 0 && assignableStudents.length === 0 && (
                            <p className="text-[10px] text-muted font-bold italic text-center py-2">No eligible students found.</p>
                          )}
                          {!studentSearch && (
                            <p className="text-[9px] text-muted font-bold text-center py-2">Search student to assign mapping</p>
                          )}
                        </div>
                        <div className="border-t border-border-subtle/50 mt-1 pt-1.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingStudent(false);
                              setStudentSearch("");
                            }}
                            className="text-[10px] font-black uppercase text-muted hover:text-foreground cursor-pointer px-2 py-1"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table of Memberships */}
                <div className="p-6">
                  {currentMembers.length > 0 ? (
                    <div className="overflow-x-auto border border-border-subtle rounded-2xl bg-background/50">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-border-subtle bg-surface/50 text-[10px] font-black uppercase tracking-wider text-muted">
                            <th className="p-4 pl-6">Student Info</th>
                            <th className="p-4">Reg No</th>
                            <th className="p-4">Dept & Year</th>
                            <th className="p-4">Active Mappings</th>
                            <th className="p-4 text-right pr-6">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/50">
                          {currentMembers.map((s) => {
                            const selections = getStudentSelectionsInGroup(s, activeGroup);
                            
                            return (
                              <tr key={s.id} className="text-xs font-semibold text-foreground hover:bg-background/20 transition-all">
                                <td className="p-4 pl-6">
                                  <p className="font-black text-foreground">{s.name}</p>
                                  <p className="text-[10px] text-muted-foreground/60">{s.email}</p>
                                </td>
                                <td className="p-4 text-muted font-mono">{s.regNo}</td>
                                <td className="p-4">
                                  <span>{s.dept}</span>
                                  <span className="ml-1.5 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded-full">{s.year.split(' ').pop()}</span>
                                </td>
                                <td className="p-4">
                                  {activeGroup.type === "student_selectable" ? (
                                    <div className="flex flex-wrap gap-1">
                                      {selections.map((sel) => (
                                        <span
                                          key={sel}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary rounded-md"
                                        >
                                          {sel}
                                          <button
                                            type="button"
                                            disabled={isUpdatingMember === s.id}
                                            onClick={() => assignOptionToStudent(s.id, activeGroup, sel, 'remove')}
                                            className="text-primary/40 hover:text-primary transition-colors p-0.5"
                                          >
                                            <LuX size={10} />
                                          </button>
                                        </span>
                                      ))}
                                      
                                      {/* Quick add dropdown for multi-selectable */}
                                      {activeGroup.options.filter(o => !selections.includes(o)).length > 0 && (
                                        <select
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (val) {
                                              assignOptionToStudent(s.id, activeGroup, val, 'add');
                                              e.target.value = "";
                                            }
                                          }}
                                          className="text-[9px] bg-surface border border-border-subtle rounded px-1.5 py-0.5 font-bold cursor-pointer"
                                        >
                                          <option value="">+ Add Option</option>
                                          {activeGroup.options.filter(o => !selections.includes(o)).map(o => (
                                            <option key={o} value={o}>{o}</option>
                                          ))}
                                        </select>
                                      )}
                                    </div>
                                  ) : (
                                    /* Single value select for admin_assigned */
                                    <select
                                      value={selections[0] || ""}
                                      disabled={isUpdatingMember === s.id}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) {
                                          assignOptionToStudent(s.id, activeGroup, val, 'set');
                                        } else {
                                          assignOptionToStudent(s.id, activeGroup, "", 'remove');
                                        }
                                      }}
                                      className="text-xs font-bold bg-background border border-border-subtle rounded-xl p-1.5 focus:outline-none cursor-pointer"
                                    >
                                      <option value="">Unassigned</option>
                                      {activeGroup.options.map(o => (
                                        <option key={o} value={o}>{o}</option>
                                      ))}
                                    </select>
                                  )}
                                </td>
                                <td className="p-4 text-right pr-6">
                                  <button
                                    type="button"
                                    disabled={isUpdatingMember === s.id}
                                    onClick={async () => {
                                      // Clear all mappings in this group for this student
                                      if (activeGroup.type === "student_selectable") {
                                        setIsUpdatingMember(s.id);
                                        toast.loading("Clearing all selections...");
                                        try {
                                          const newSpecs = (s.specializations || []).filter((opt: string) => !activeGroup.options.includes(opt));
                                          await db.updateStudentProfile(s.id, { specializations: newSpecs });
                                          setStudents(prev => prev.map(stud => 
                                            stud.id === s.id ? { ...stud, specializations: newSpecs } : stud
                                          ));
                                          toast.success("All selections cleared!");
                                        } catch (err) {
                                          console.error(err);
                                          toast.error("Failed to clear selections.");
                                        } finally {
                                          setIsUpdatingMember(null);
                                          toast.dismiss();
                                        }
                                      } else {
                                        assignOptionToStudent(s.id, activeGroup, "", 'remove');
                                      }
                                    }}
                                    className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors cursor-pointer"
                                  >
                                    Unassign All
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border-subtle rounded-3xl p-12 text-center text-muted font-bold bg-background/10">
                      <LuUser size={36} className="mx-auto text-muted/30 mb-4" />
                      <p className="text-sm font-black">No student memberships defined</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Click "Mappings Creator" to map students to options in this group.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-20 text-center text-muted font-bold border border-dashed border-border-subtle rounded-3xl bg-surface/50">
              <LuLayers size={40} className="mx-auto text-muted/30 mb-4 animate-pulse" />
              <h3 className="text-sm font-black">Select or Create a Group</h3>
              <p className="text-xs text-muted-foreground/60 mt-1">Select a custom group category from the sidebar to manage options and student mappings.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
