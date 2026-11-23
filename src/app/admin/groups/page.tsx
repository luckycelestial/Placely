"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { LuLayers, LuLoader } from "react-icons/lu";
import { db } from "@/services/database";
import { 
  getSettingByKey, 
  updateSettingByKey, 
  DEFAULT_CUSTOM_GROUPS, 
  type CustomGroup,
  getSystemSettings
} from "@/services/settings";
import { toast } from "sonner";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";

import { GroupHeader } from "./components/GroupHeader";
import { GroupTable, type GroupStudent } from "./components/GroupTable";
import { GroupConfigDrawer } from "./components/GroupConfigDrawer";
import { CreateGroupModal } from "./components/CreateGroupModal";

export default function AdminGroupsPage() {
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    getSystemSettings().then(sys => setIsCompleted(sys.isAcademicYearCompleted)).catch(() => {});
  }, []);

  // Configuration Drawer and Switcher states
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [isGroupSwitcherOpen, setIsGroupSwitcherOpen] = useState(false);

  // Group creation state
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<"student_selectable" | "admin_assigned">("student_selectable");
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);

  // Option creation state
  const [newOptionName, setNewOptionName] = useState("");
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [confirmDeleteOption, setConfirmDeleteOption] = useState<string | null>(null);

  // Filters & selection
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [showOnlyMembers, setShowOnlyMembers] = useState(false);
  const [selectedOptionFilter, setSelectedOptionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Batch action selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [batchOptionVal, setBatchOptionVal] = useState("");

  // Membership updates loader
  const [isUpdatingMember, setIsUpdatingMember] = useState<string | null>(null);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  // Load all settings & student lists
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [groupsData, studentsData] = await Promise.all([
          getSettingByKey<CustomGroup[]>('custom_groups', DEFAULT_CUSTOM_GROUPS),
          db.getAllStudents({ lightweight: true })
        ]);

        const rawGroups = Array.isArray(groupsData) && groupsData.length > 0 ? groupsData : DEFAULT_CUSTOM_GROUPS;
        // Sanitize groups to ensure they have valid options array
        const finalGroups = rawGroups.map(g => {
          const defaultMatch = DEFAULT_CUSTOM_GROUPS.find(d => d.id === g.id);
          return {
            ...g,
            type: g.type || defaultMatch?.type || 'admin_assigned',
            options: Array.isArray(g.options) ? g.options : (defaultMatch?.options || [])
          };
        });

        let neededUpdate = false;
        const systemGroupIds = ["departments", "batches", "placement_lock"];
        DEFAULT_CUSTOM_GROUPS.forEach(defaultGrp => {
          if (systemGroupIds.includes(defaultGrp.id) && !finalGroups.some(g => g.id === defaultGrp.id)) {
            finalGroups.push(defaultGrp);
            neededUpdate = true;
          }
        });

        if (neededUpdate) {
          updateSettingByKey('custom_groups', finalGroups).catch(console.error);
        }

        setCustomGroups(finalGroups);
        if (finalGroups.length > 0) {
          setSelectedGroupId(finalGroups[0].id);
        }
        setStudents(studentsData);
      } catch (err) {
        console.error("Failed to load custom groups:", err);
        toast.error("Failed to load custom groups data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const activeGroup = useMemo(() => {
    const grp = customGroups.find(g => g.id === selectedGroupId) || customGroups[0] || null;
    if (!grp) return null;
    return {
      ...grp,
      options: Array.isArray(grp.options) ? grp.options : []
    };
  }, [customGroups, selectedGroupId]);

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.dept) set.add(s.dept); });
    return Array.from(set).sort();
  }, [students]);

  const batchesList = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.year) set.add(s.year); });
    return Array.from(set).sort();
  }, [students]);

  const getStudentSelectionsInGroup = useCallback((student: GroupStudent, group: CustomGroup): string[] => {
    if (!student || !group) return [];

    if (group.id === "departments") {
      return student.dept ? [student.dept] : [];
    }
    if (group.id === "batches") {
      return student.year ? [student.year] : [];
    }

    if (group.type === "student_selectable") {
      const specs = student.specializations || [];
      const opts = Array.isArray(group.options) ? group.options : [];
      return specs.filter((s: string) => opts.includes(s));
    }

    const currentPref = student.placementGroup || "";
    if (currentPref.trim().startsWith('{')) {
      try {
        const map = JSON.parse(currentPref);
        const val = map[group.id];
        return val ? [val] : [];
      } catch {
        return [];
      }
    } else if (group.id === "placement_groups" || group.id === "placement_group") {
      return currentPref ? [currentPref] : [];
    }
    return [];
  }, []);

  const optionCounts = useMemo(() => {
    if (!activeGroup) return {};
    const counts: Record<string, number> = {};
    const options = Array.isArray(activeGroup.options) ? activeGroup.options : [];
    options.forEach(opt => { counts[opt] = 0; });

    students.forEach(s => {
      const selections = getStudentSelectionsInGroup(s, activeGroup);
      selections.forEach(sel => {
        if (counts[sel] !== undefined) counts[sel]++;
      });
    });
    return counts;
  }, [students, activeGroup, getStudentSelectionsInGroup]);

  const memberCount = useMemo(() => {
    if (!activeGroup) return 0;
    return students.filter(s => getStudentSelectionsInGroup(s, activeGroup).length > 0).length;
  }, [students, activeGroup, getStudentSelectionsInGroup]);

  const filteredStudents = useMemo(() => {
    if (!activeGroup) return [];

    return students.filter(student => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = student.name?.toLowerCase().includes(term);
        const matchesReg = student.regNo?.toLowerCase().includes(term);
        if (!matchesName && !matchesReg) return false;
      }

      if (deptFilter && student.dept !== deptFilter) return false;
      if (batchFilter && student.year !== batchFilter) return false;

      const selections = getStudentSelectionsInGroup(student, activeGroup);

      if (showOnlyMembers && selections.length === 0) return false;
      if (selectedOptionFilter && !selections.includes(selectedOptionFilter)) return false;

      return true;
    });
  }, [students, activeGroup, searchTerm, deptFilter, batchFilter, showOnlyMembers, selectedOptionFilter, getStudentSelectionsInGroup]);

  const paginatedStudents = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    return filteredStudents.slice(from, from + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Handle single student assignment
  const assignOptionToStudent = async (
    studentId: string,
    group: CustomGroup,
    option: string,
    action: 'add' | 'remove' | 'set'
  ) => {
    setIsUpdatingMember(studentId);
    try {
      const targetStudent = students.find(s => s.id === studentId);
      if (!targetStudent) return;

      if (group.id === "departments") {
        const newDept = action === 'remove' ? "" : option;
        await db.updateTableCell("students", studentId, { department: newDept });
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, dept: newDept } : s));
      } else if (group.id === "batches") {
        let newYear = 0;
        if (action !== 'remove' && option) {
          const parts = option.split('-');
          newYear = parseInt(parts[parts.length - 1]) || 0;
        }
        await db.updateTableCell("students", studentId, { year: newYear });
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, year: action === 'remove' ? "" : option } : s));
      } else if (group.type === "student_selectable") {
        const currentSpecs: string[] = targetStudent.specializations || [];
        let updatedSpecs: string[];

        if (action === 'add') {
          updatedSpecs = Array.from(new Set([...currentSpecs, option]));
        } else if (action === 'remove') {
          updatedSpecs = currentSpecs.filter(s => s !== option);
        } else {
          updatedSpecs = [option];
        }

        await db.updateStudentProfile(studentId, { specializations: updatedSpecs });
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, specializations: updatedSpecs } : s));
      } else {
        const currentPref = targetStudent.placementGroup || "";
        let map: Record<string, string> = {};
        if (currentPref.trim().startsWith('{')) {
          try {
            map = JSON.parse(currentPref);
          } catch {
            /* ignore JSON parse error */
          }
        } else if (currentPref) {
          map["placement_group"] = currentPref;
        }

        if (action === 'remove') {
          delete map[group.id];
        } else {
          map[group.id] = option;
        }

        const newPrefStr = JSON.stringify(map);
        await db.updateStudentProfile(studentId, { placement_group: newPrefStr });
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, placementGroup: newPrefStr } : s));
      }

      toast.success("Updated student mapping!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update student mapping.");
    } finally {
      setIsUpdatingMember(null);
    }
  };

  const clearStudentOptions = async (studentId: string) => {
    if (!activeGroup) return;
    setIsUpdatingMember(studentId);
    try {
      if (activeGroup.type === "student_selectable") {
        const targetStudent = students.find(s => s.id === studentId);
        const groupOpts = activeGroup.options || [];
        const newSpecs = (targetStudent?.specializations || []).filter((opt: string) => !groupOpts.includes(opt));
        await db.updateStudentProfile(studentId, { specializations: newSpecs });
        setStudents(prev => prev.map(stud => stud.id === studentId ? { ...stud, specializations: newSpecs } : stud));
      } else {
        await assignOptionToStudent(studentId, activeGroup, "", 'remove');
      }
      toast.success("Selections unassigned!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to unassign.");
    } finally {
      setIsUpdatingMember(null);
    }
  };

  // Batch assignment
  const handleBatchAssign = async (option: string, clear: boolean = false) => {
    if (selectedStudentIds.length === 0 || !activeGroup) return;

    setIsBatchUpdating(true);
    const toastId = toast.loading(clear ? "Clearing options for selected..." : `Assigning "${option}" to selected...`);

    try {
      const promises = selectedStudentIds.map(async (studentId) => {
        const targetStudent = students.find(s => s.id === studentId);
        if (!targetStudent) return;

        if (activeGroup.id === "departments") {
          await db.updateTableCell("students", studentId, { department: clear ? "" : option });
        } else if (activeGroup.id === "batches") {
          const parts = option.split('-');
          const endYear = parseInt(parts[parts.length - 1]) || 0;
          await db.updateTableCell("students", studentId, { year: clear ? 0 : endYear });
        } else if (activeGroup.type === "student_selectable") {
          const currentSpecs: string[] = targetStudent.specializations || [];
          let updatedSpecs: string[];
          if (clear) {
            updatedSpecs = currentSpecs.filter(s => !activeGroup.options.includes(s));
          } else {
            updatedSpecs = Array.from(new Set([...currentSpecs, option]));
          }
          await db.updateStudentProfile(studentId, { specializations: updatedSpecs });
        } else {
          const currentPref = targetStudent.placementGroup || "";
          let map: Record<string, string> = {};
          if (currentPref.trim().startsWith('{')) {
            try { map = JSON.parse(currentPref); } catch { /* ignore */ }
          } else if (currentPref) {
            map["placement_group"] = currentPref;
          }

          if (clear) delete map[activeGroup.id];
          else map[activeGroup.id] = option;

          await db.updateStudentProfile(studentId, { placement_group: JSON.stringify(map) });
        }
      });

      await Promise.all(promises);

      setStudents(prev => prev.map(s => {
        if (!selectedStudentIds.includes(s.id)) return s;
        if (activeGroup.id === "departments") {
          return { ...s, dept: clear ? "" : option };
        } else if (activeGroup.id === "batches") {
          return { ...s, year: clear ? "" : option };
        } else if (activeGroup.type === "student_selectable") {
          let newSpecs = [...(s.specializations || [])];
          if (clear) newSpecs = newSpecs.filter(o => !activeGroup.options.includes(o));
          else if (!newSpecs.includes(option)) newSpecs.push(option);
          return { ...s, specializations: newSpecs };
        } else {
          let map: Record<string, string> = {};
          try { map = JSON.parse(s.placementGroup || "{}"); } catch { /* ignore */ }
          if (clear) delete map[activeGroup.id];
          else map[activeGroup.id] = option;
          return { ...s, placementGroup: JSON.stringify(map) };
        }
      }));

      setSelectedStudentIds([]);
      setBatchOptionVal("");
      toast.success(clear ? "Options cleared successfully!" : "Options assigned successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete bulk mapping.");
    } finally {
      setIsBatchUpdating(false);
      toast.dismiss(toastId);
    }
  };

  // Create Group
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
      name,
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
      toast.success("Cohort group created!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create group.");
    }
  };

  // Delete Group
  const handleDeleteGroup = async (groupIdToDelete: string) => {
    const PROTECTED_GROUP_IDS = ["departments", "batches", "placement_lock"];
    if (PROTECTED_GROUP_IDS.includes(groupIdToDelete)) {
      toast.error("This is a system group and cannot be deleted.");
      return;
    }

    const updatedGroups = customGroups.filter(g => g.id !== groupIdToDelete);
    try {
      await updateSettingByKey<CustomGroup[]>('custom_groups', updatedGroups);
      setCustomGroups(updatedGroups);
      if (selectedGroupId === groupIdToDelete) {
        setSelectedGroupId(updatedGroups[0]?.id || "");
      }
      toast.success("Group deleted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete group.");
    }
  };

  // Add Option
  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    const optionName = newOptionName.trim();
    if (!optionName) return;

    const groupOpts = activeGroup.options || [];
    if (groupOpts.includes(optionName)) {
      toast.error("Option already exists inside this group!");
      return;
    }

    const updatedGroups = customGroups.map(g => {
      if (g.id === activeGroup.id) {
        return { ...g, options: [...(g.options || []), optionName] };
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

  // Delete Option
  const handleDeleteOption = async (optionToDelete: string) => {
    if (!activeGroup) return;
    const updatedOptions = (activeGroup.options || []).filter(o => o !== optionToDelete);
    const updatedGroups = customGroups.map(g => {
      if (g.id === activeGroup.id) {
        return { ...g, options: updatedOptions };
      }
      return g;
    });

    try {
      await updateSettingByKey<CustomGroup[]>('custom_groups', updatedGroups);
      setCustomGroups(updatedGroups);
      setConfirmDeleteOption(null);
      toast.success("Option deleted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete option.");
    }
  };

  const handleUpdateGroupType = async (groupId: string, newType: 'student_selectable' | 'admin_assigned') => {
    const updatedGroups = customGroups.map(g => {
      if (g.id === groupId) return { ...g, type: newType };
      return g;
    });

    try {
      await updateSettingByKey<CustomGroup[]>('custom_groups', updatedGroups);
      setCustomGroups(updatedGroups);
      toast.success("Group type updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update group type.");
    }
  };

  const handleExportExcel = async () => {
    if (!activeGroup) return;
    const toastId = toast.loading("Exporting Excel...");
    try {
      const exportRows = filteredStudents.map(s => {
        const selections = getStudentSelectionsInGroup(s, activeGroup);
        return {
          "Student Name": s.name,
          "Email": s.email || "N/A",
          "Register Number": s.regNo,
          "Department": s.dept || "N/A",
          "Cohort Mapping Option": selections.join(', ') || 'Unassigned'
        };
      });
      exportToExcel(exportRows, `Cohort_${activeGroup.name.replace(/\s+/g, '_')}_Report`, activeGroup.name.substring(0, 31));
      toast.success("Excel exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleExportPDF = async () => {
    if (!activeGroup) return;
    const toastId = toast.loading("Exporting PDF...");
    try {
      const headers = ["Student Name", "Register Number", "Dept", "Cohort Option Mapping"];
      const rows = filteredStudents.map(s => {
        const selections = getStudentSelectionsInGroup(s, activeGroup);
        return [
          s.name || "N/A",
          s.regNo || "N/A",
          s.dept || "N/A",
          selections.join(', ') || 'Unassigned'
        ];
      });
      await exportToPDF(`Cohort Mapping: ${activeGroup.name}`, headers, rows, `Cohort_${activeGroup.name.replace(/\s+/g, '_')}_Report`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    } finally {
      toast.dismiss(toastId);
    }
  };

  if (isLoading && customGroups.length === 0) {
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
      {/* Header and Switches */}
      <GroupHeader
        customGroups={customGroups}
        activeGroup={activeGroup}
        selectedGroupId={selectedGroupId}
        isGroupSwitcherOpen={isGroupSwitcherOpen}
        memberCount={memberCount}
        totalStudents={students.length}
        onSelectGroup={setSelectedGroupId}
        onToggleSwitcher={() => setIsGroupSwitcherOpen(!isGroupSwitcherOpen)}
        onCloseSwitcher={() => setIsGroupSwitcherOpen(false)}
        onOpenCreateGroup={() => setIsAddingGroup(true)}
        onOpenConfigDrawer={() => setIsConfigDrawerOpen(true)}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
      />

      {/* Main Table / Directory Content */}
      {activeGroup ? (
        <GroupTable
          activeGroup={activeGroup}
          filteredStudents={filteredStudents}
          paginatedStudents={paginatedStudents}
          selectedStudentIds={selectedStudentIds}
          isCompleted={isCompleted}
          searchTerm={searchTerm}
          deptFilter={deptFilter}
          batchFilter={batchFilter}
          showOnlyMembers={showOnlyMembers}
          selectedOptionFilter={selectedOptionFilter}
          memberCount={memberCount}
          optionCounts={optionCounts}
          departmentsList={departmentsList}
          batchesList={batchesList}
          currentPage={currentPage}
          pageSize={pageSize}
          isUpdatingMember={isUpdatingMember}
          isBatchUpdating={isBatchUpdating}
          batchOptionVal={batchOptionVal}
          onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          onDeptFilterChange={(val) => { setDeptFilter(val); setCurrentPage(1); }}
          onBatchFilterChange={(val) => { setBatchFilter(val); setCurrentPage(1); }}
          onShowOnlyMembersChange={(val) => { setShowOnlyMembers(val); setCurrentPage(1); }}
          onOptionFilterSelect={(opt) => { setSelectedOptionFilter(opt); setCurrentPage(1); }}
          onToggleSelectAll={() => {
            const allFilteredIds = filteredStudents.map(s => s.id);
            const areAllSelected = allFilteredIds.every(id => selectedStudentIds.includes(id));
            if (areAllSelected) {
              setSelectedStudentIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
            } else {
              setSelectedStudentIds(Array.from(new Set([...selectedStudentIds, ...allFilteredIds])));
            }
          }}
          onToggleStudentSelection={(id) => {
            setSelectedStudentIds(prev => 
              prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
          }}
          onBatchOptionValChange={setBatchOptionVal}
          onBatchAssign={handleBatchAssign}
          onAssignOptionToStudent={assignOptionToStudent}
          onClearStudentOptions={clearStudentOptions}
          onPageChange={setCurrentPage}
          getStudentSelectionsInGroup={getStudentSelectionsInGroup}
        />
      ) : (
        <div className="p-24 text-center text-muted font-bold border border-dashed border-border-subtle rounded-3xl bg-surface/50">
          <LuLayers size={48} className="mx-auto text-muted/30 mb-4 animate-pulse" />
          <h3 className="text-base font-black">Select or Create a Group</h3>
          <p className="text-xs text-muted-foreground/60 mt-1">Select a custom group category to manage options and student mappings.</p>
        </div>
      )}

      {/* Configuration Drawer */}
      <GroupConfigDrawer
        isOpen={isConfigDrawerOpen}
        activeGroup={activeGroup}
        optionCounts={optionCounts}
        isAddingOption={isAddingOption}
        newOptionName={newOptionName}
        confirmDeleteOption={confirmDeleteOption}
        confirmDeleteGroupId={confirmDeleteGroupId}
        onClose={() => setIsConfigDrawerOpen(false)}
        onUpdateGroupType={handleUpdateGroupType}
        onStartAddOption={() => setIsAddingOption(true)}
        onCancelAddOption={() => {
          setIsAddingOption(false);
          setNewOptionName("");
        }}
        onOptionNameChange={setNewOptionName}
        onAddOption={handleAddOption}
        onSetConfirmDeleteOption={setConfirmDeleteOption}
        onDeleteOption={handleDeleteOption}
        onSetConfirmDeleteGroupId={setConfirmDeleteGroupId}
        onDeleteGroup={handleDeleteGroup}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isAddingGroup}
        groupName={newGroupName}
        groupType={newGroupType}
        onNameChange={setNewGroupName}
        onTypeChange={setNewGroupType}
        onSubmit={handleAddGroup}
        onClose={() => {
          setIsAddingGroup(false);
          setNewGroupName("");
        }}
      />
    </div>
  );
}
