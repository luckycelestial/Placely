"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  LuLayers, 
  LuUser, 
  LuPlus, 
  LuTrash2, 
  LuX, 
  LuSearch, 
  LuChevronRight, 
  LuChevronLeft,
  LuCircleCheck,
  LuLoader,
  LuSettings,
  LuActivity,
  LuUsers,
  LuSlidersHorizontal,
  LuListFilter,
  LuCheck,
  LuTriangleAlert,
  LuInfo,
  LuMail
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
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { getBatchDetails } from "@/lib/batch-utils";
import { getSystemSettings } from "@/services/settings";

export default function AdminGroupsPage() {
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
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

        let finalGroups = [...groupsData];
        let neededUpdate = false;
        const systemGroupIds = ["departments", "batches", "placement_lock"];
        DEFAULT_CUSTOM_GROUPS.forEach(defaultGrp => {
          if (systemGroupIds.includes(defaultGrp.id) && !finalGroups.some(g => g.id === defaultGrp.id)) {
            finalGroups.push(defaultGrp);
            neededUpdate = true;
          }
        });

        if (neededUpdate) {
          await updateSettingByKey<CustomGroup[]>('custom_groups', finalGroups);
        }

        setCustomGroups(finalGroups);
        setStudents(studentsData);

        // Select first group by default
        if (finalGroups.length > 0) {
          setSelectedGroupId(finalGroups[0].id);
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

  // Reset page filters when selected group changes
  useEffect(() => {
    setSelectedOptionFilter("");
    setSelectedStudentIds([]);
    setBatchOptionVal("");
  }, [selectedGroupId]);

  // Parse student selectable/assigned selections for the active group
  const getStudentSelectionsInGroup = useCallback((student: any, group: CustomGroup): string[] => {
    if (group.id === "departments") {
      return student.dept ? [student.dept] : [];
    }
    if (group.id === "batches") {
      if (student.year) {
        const match = student.year.match(/^(\d{4}-\d{4})/);
        return match ? [match[1]] : [student.year];
      }
      return [];
    }

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
      } else if (group.id === "placement_groups" || group.id === "placement_group") {
        val = rawPref;
      }
      return val ? [val] : [];
    }
  }, []);

  // Assign option helper for a single student
  const assignOptionToStudent = async (studentId: string, group: CustomGroup, option: string, action: 'add' | 'remove' | 'set') => {
    setIsUpdatingMember(studentId);
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      if (group.id === "departments") {
        const val = action === 'set' ? option : "";
        const { error } = await supabase
          .from("students")
          .update({ department: val })
          .eq("id", studentId);
        
        if (error) throw error;
        
        setStudents(prev => prev.map(s => 
          s.id === studentId ? { ...s, dept: val } : s
        ));
      } else if (group.id === "batches") {
        const val = action === 'set' ? option : "";
        let formattedYear = "";
        let dbYear = 0;
        if (val) {
          const parts = val.split('-');
          const endYear = parseInt(parts[parts.length - 1]);
          if (!isNaN(endYear)) dbYear = endYear;
          const currentYear = new Date().getFullYear();
          const yrNum = Math.max(1, Math.min(4, 4 - (endYear - currentYear)));
          const roman = ["I", "II", "III", "IV"][yrNum - 1] || "IV";
          formattedYear = `${val} (${roman} Year)`;
        }
        
        const { error } = await supabase
          .from("students")
          .update({ year: dbYear })
          .eq("id", studentId);
        
        if (error) throw error;
        
        setStudents(prev => prev.map(s => 
          s.id === studentId ? { ...s, year: formattedYear } : s
        ));
      } else if (group.type === "student_selectable") {
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
          map["placement_group"] = currentPref;
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

  // Batch update helper for multiple students
  const handleBatchAssign = async (option: string, clear = false) => {
    if (!activeGroup || selectedStudentIds.length === 0) return;
    setIsBatchUpdating(true);
    const toastId = toast.loading(clear ? "Removing student mappings..." : `Mapping students to "${option}"...`);
    try {
      const promises = selectedStudentIds.map(async (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        if (activeGroup.id === "departments") {
          const val = clear ? "" : option;
          const { error } = await supabase
            .from("students")
            .update({ department: val })
            .eq("id", studentId);
          if (error) throw error;
        } else if (activeGroup.id === "batches") {
          const val = clear ? "" : option;
          let dbYear = 0;
          if (val) {
            const parts = val.split('-');
            const endYear = parseInt(parts[parts.length - 1]);
            if (!isNaN(endYear)) dbYear = endYear;
          }
          const { error } = await supabase
            .from("students")
            .update({ year: dbYear })
            .eq("id", studentId);
          if (error) throw error;
        } else if (activeGroup.type === "student_selectable") {
          let newSpecs = [...(student.specializations || [])];
          if (clear) {
            newSpecs = newSpecs.filter(o => !activeGroup.options.includes(o));
          } else {
            if (!newSpecs.includes(option)) newSpecs.push(option);
          }
          await db.updateStudentProfile(studentId, { specializations: newSpecs });
        } else {
          const currentPref = student.placementGroup || "";
          let map: Record<string, string> = {};
          if (currentPref.trim().startsWith('{')) {
            try {
              map = JSON.parse(currentPref);
            } catch (e) {}
          } else if (currentPref) {
            map["placement_group"] = currentPref;
          }

          if (clear) {
            delete map[activeGroup.id];
          } else {
            map[activeGroup.id] = option;
          }

          const newPrefStr = JSON.stringify(map);
          await db.updateStudentProfile(studentId, { placement_group: newPrefStr });
        }
      });

      await Promise.all(promises);

      // Local State Update
      setStudents(prev => prev.map(s => {
        if (!selectedStudentIds.includes(s.id)) return s;
        
        if (activeGroup.id === "departments") {
          return { ...s, dept: clear ? "" : option };
        } else if (activeGroup.id === "batches") {
          let formattedYear = "";
          if (!clear && option) {
            const parts = option.split('-');
            const endYear = parseInt(parts[parts.length - 1]);
            const currentYear = new Date().getFullYear();
            const yrNum = Math.max(1, Math.min(4, 4 - (endYear - currentYear)));
            const roman = ["I", "II", "III", "IV"][yrNum - 1] || "IV";
            formattedYear = `${option} (${roman} Year)`;
          }
          return { ...s, year: formattedYear };
        } else if (activeGroup.type === "student_selectable") {
          let newSpecs = [...(s.specializations || [])];
          if (clear) {
            newSpecs = newSpecs.filter(o => !activeGroup.options.includes(o));
          } else {
            if (!newSpecs.includes(option)) newSpecs.push(option);
          }
          return { ...s, specializations: newSpecs };
        } else {
          const currentPref = s.placementGroup || "";
          let map: Record<string, string> = {};
          if (currentPref.trim().startsWith('{')) {
            try {
              map = JSON.parse(currentPref);
            } catch (e) {}
          } else if (currentPref) {
            map["placement_group"] = currentPref;
          }

          if (clear) {
            delete map[activeGroup.id];
          } else {
            map[activeGroup.id] = option;
          }
          const newPrefStr = JSON.stringify(map);
          return { ...s, placementGroup: newPrefStr };
        }
      }));

      setSelectedStudentIds([]);
      setBatchOptionVal("");
      toast.success(clear ? "Mappings cleared successfully!" : "Mappings updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete bulk mapping.");
    } finally {
      setIsBatchUpdating(false);
      toast.dismiss(toastId);
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

    // Protect system groups from deletion
    const PROTECTED_GROUP_IDS = ["departments", "batches", "placement_lock"];
    if (PROTECTED_GROUP_IDS.includes(groupIdToDelete)) {
      toast.error("This is a system group and cannot be deleted.");
      setConfirmDeleteGroupId(null);
      return;
    }

    const updatedGroups = customGroups.filter(g => g.id !== groupIdToDelete);


    try {
      toast.loading("Cleaning up connections for students...");
      if (groupToDelete.id === "departments") {
        const { error } = await supabase
          .from("students")
          .update({ department: "" })
          .not("id", "is", null);
        if (error) throw error;
      } else if (groupToDelete.id === "batches") {
        const { error } = await supabase
          .from("students")
          .update({ year: 0 })
          .not("id", "is", null);
        if (error) throw error;
      } else if (groupToDelete.type === "student_selectable") {
        if (groupToDelete.options && groupToDelete.options.length > 0) {
          const { data: profiles, error: fetchErr } = await supabase
            .from("student_profiles")
            .select("id, specializations")
            .overlaps("specializations", groupToDelete.options);
          if (fetchErr) throw fetchErr;

          for (const profile of (profiles || [])) {
            const currentSpecs = profile.specializations || [];
            const updatedSpecs = currentSpecs.filter((s: string) => !groupToDelete.options.includes(s));
            const { error: updateErr } = await supabase
              .from("student_profiles")
              .update({ specializations: updatedSpecs })
              .eq("id", profile.id);
            if (updateErr) throw updateErr;
          }
        }
      } else {
        const { data: preferences, error: fetchErr } = await supabase
          .from("student_preferences")
          .select("id, work_mode_preference")
          .not("work_mode_preference", "is", null);
        if (fetchErr) throw fetchErr;

        for (const preference of (preferences || [])) {
          const currentPref = preference.work_mode_preference || "";
          let updatedPref = currentPref;
          let changed = false;

          if (currentPref.trim().startsWith('{')) {
            try {
              const map = JSON.parse(currentPref);
              if (groupToDelete.id in map) {
                delete map[groupToDelete.id];
                changed = true;
              }
              if (changed) {
                const mapStr = JSON.stringify(map);
                updatedPref = mapStr === '{}' ? "" : mapStr;
              }
            } catch (e) {}
          } else if (groupToDelete.id === "placement_groups") {
            updatedPref = "";
            changed = true;
          }

          if (changed) {
            const { error: updateErr } = await supabase
              .from("student_preferences")
              .update({ work_mode_preference: updatedPref })
              .eq("id", preference.id);
            if (updateErr) throw updateErr;
          }
        }
      }

      // Update settings
      await updateSettingByKey<CustomGroup[]>('custom_groups', updatedGroups);
      
      // Update local state
      setCustomGroups(updatedGroups);
      setStudents(prev => prev.map(student => {
        if (groupToDelete.id === "departments") {
          return { ...student, dept: "" };
        } else if (groupToDelete.id === "batches") {
          return { ...student, year: "" };
        } else if (groupToDelete.type === "student_selectable") {
          return {
            ...student,
            specializations: (student.specializations || []).filter((s: string) => !groupToDelete.options.includes(s))
          };
        } else {
          const currentPref = student.placementGroup || "";
          if (currentPref.trim().startsWith('{')) {
            try {
              const map = JSON.parse(student.placementGroup || "");
              delete map[groupToDelete.id];
              const mapStr = JSON.stringify(map);
              return { ...student, placementGroup: mapStr === '{}' ? "" : mapStr };
            } catch (e) {}
          } else if (groupToDelete.id === "placement_groups" || groupToDelete.id === "placement_group") {
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
      toast.error("Failed to delete group.");
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

  // Delete Option
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
      if (activeGroup.id === "departments") {
        const { error } = await supabase
          .from("students")
          .update({ department: "" })
          .eq("department", optionToDelete);
        if (error) throw error;
      } else if (activeGroup.id === "batches") {
        const parts = optionToDelete.split('-');
        const endYear = parseInt(parts[parts.length - 1]);
        if (!isNaN(endYear)) {
          const { error } = await supabase
            .from("students")
            .update({ year: 0 })
            .eq("year", endYear);
          if (error) throw error;
        }
      } else if (activeGroup.type === "student_selectable") {
        const { data: profiles, error: fetchErr } = await supabase
          .from("student_profiles")
          .select("id, specializations")
          .contains("specializations", [optionToDelete]);
        if (fetchErr) throw fetchErr;

        for (const profile of (profiles || [])) {
          const currentSpecs = profile.specializations || [];
          const updatedSpecs = currentSpecs.filter((s: string) => s !== optionToDelete);
          const { error: updateErr } = await supabase
            .from("student_profiles")
            .update({ specializations: updatedSpecs })
            .eq("id", profile.id);
          if (updateErr) throw updateErr;
        }
      } else {
        const { data: preferences, error: fetchErr } = await supabase
          .from("student_preferences")
          .select("id, work_mode_preference")
          .not("work_mode_preference", "is", null);
        if (fetchErr) throw fetchErr;

        for (const preference of (preferences || [])) {
          const currentPref = preference.work_mode_preference || "";
          let updatedPref = currentPref;
          let changed = false;

          if (currentPref.trim().startsWith('{')) {
            try {
              const map = JSON.parse(currentPref);
              if (map[activeGroup.id] === optionToDelete) {
                delete map[activeGroup.id];
                changed = true;
              }
              if (changed) {
                const mapStr = JSON.stringify(map);
                updatedPref = mapStr === '{}' ? "" : mapStr;
              }
            } catch (e) {}
          } else if (activeGroup.id === "placement_groups" && currentPref === optionToDelete) {
            updatedPref = "";
            changed = true;
          }

          if (changed) {
            const { error: updateErr } = await supabase
              .from("student_preferences")
              .update({ work_mode_preference: updatedPref })
              .eq("id", preference.id);
            if (updateErr) throw updateErr;
          }
        }
      }

      // Save to settings
      await updateSettingByKey<CustomGroup[]>('custom_groups', updatedGroups);
      setCustomGroups(updatedGroups);

      // Update students locally
      setStudents(prev => prev.map(student => {
        if (activeGroup.id === "departments") {
          return student.dept === optionToDelete ? { ...student, dept: "" } : student;
        } else if (activeGroup.id === "batches") {
          const match = student.year && student.year.match(/^(\d{4}-\d{4})/);
          const isMatch = (match && match[1] === optionToDelete) || (student.year === optionToDelete);
          return isMatch ? { ...student, year: "" } : student;
        } else if (activeGroup.type === "student_selectable") {
          return {
            ...student,
            specializations: (student.specializations || []).filter((s: string) => s !== optionToDelete)
          };
        } else {
          const currentPref = student.placementGroup || "";
          if (currentPref.trim().startsWith('{')) {
            try {
              const map = JSON.parse(student.placementGroup || "");
              if (map[activeGroup.id] === optionToDelete) {
                delete map[activeGroup.id];
              }
              const mapStr = JSON.stringify(map);
              return { ...student, placementGroup: mapStr === '{}' ? "" : mapStr };
            } catch (e) {}
          } else if ((activeGroup.id === "placement_groups" || activeGroup.id === "placement_group") && currentPref === optionToDelete) {
            return { ...student, placementGroup: "" };
          }
          return student;
        }
      }));

      setConfirmDeleteOption(null);
      toast.dismiss();
      toast.success("Option deleted!");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to delete option.");
    }
  };

  const handleUpdateGroupType = async (groupId: string, newType: 'student_selectable' | 'admin_assigned') => {
    const updatedGroups = customGroups.map(g => {
      if (g.id === groupId) {
        return { ...g, type: newType };
      }
      return g;
    });

    try {
      await updateSettingByKey<CustomGroup[]>('custom_groups', updatedGroups);
      setCustomGroups(updatedGroups);
      toast.success("Group type updated successfully!");
    } catch (err) {
      console.error("Failed to update group type:", err);
      toast.error("Failed to update group type.");
    }
  };

  // Get options counts dynamically
  const optionCounts = useMemo(() => {
    if (!activeGroup) return {};
    const counts: Record<string, number> = {};
    activeGroup.options.forEach(o => {
      counts[o] = 0;
    });
    students.forEach(s => {
      if (!activeGroup) return;
      const selections = getStudentSelectionsInGroup(s, activeGroup);
      selections.forEach(sel => {
        counts[sel] = (counts[sel] || 0) + 1;
      });
    });
    return counts;
  }, [students, activeGroup, getStudentSelectionsInGroup]);

  // Unique list of departments/years for dropdown filters
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => { if (s.dept) set.add(s.dept); });
    return Array.from(set).sort();
  }, [students]);

  const batchesList = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.year) {
        const match = s.year.match(/^(\d{4}-\d{4})/);
        set.add(match ? match[1] : s.year);
      }
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered list of students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Search term
      if (searchTerm) {
        const nameMatch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const regMatch = s.regNo?.toLowerCase().includes(searchTerm.toLowerCase());
        const rollMatch = s.rollNo?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!nameMatch && !regMatch && !rollMatch) return false;
      }

      // 2. Dept filter
      if (deptFilter && s.dept !== deptFilter) return false;

      // 3. Batch filter
      if (batchFilter) {
        if (!s.year) return false;
        const match = s.year.match(/^(\d{4}-\d{4})/);
        const yStr = match ? match[1] : s.year;
        if (yStr !== batchFilter) return false;
      }

      // 4. Mapped selections in activeGroup
      if (!activeGroup) return false;
      const selections = getStudentSelectionsInGroup(s, activeGroup);
      
      // 5. Option filter card selected
      if (selectedOptionFilter && !selections.includes(selectedOptionFilter)) return false;

      // 6. Only show members toggle
      if (showOnlyMembers && selections.length === 0) return false;

      return true;
    });
  }, [students, activeGroup, searchTerm, deptFilter, batchFilter, selectedOptionFilter, showOnlyMembers, getStudentSelectionsInGroup]);

  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, deptFilter, batchFilter, selectedOptionFilter, showOnlyMembers, selectedGroupId]);

  const paginatedStudents = useMemo(() => {
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize;
    return filteredStudents.slice(from, to);
  }, [filteredStudents, currentPage]);

  // Membership counts
  const memberCount = useMemo(() => {
    if (!activeGroup) return 0;
    return students.filter(s => getStudentSelectionsInGroup(s, activeGroup).length > 0).length;
  }, [students, activeGroup, getStudentSelectionsInGroup]);

  // Toggle selection for individual student
  const handleToggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  // Toggle select all filtered students
  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredStudents.map(s => s.id);
    const areAllSelected = allFilteredIds.every(id => selectedStudentIds.includes(id));

    if (areAllSelected) {
      // Remove all filtered from selection
      setSelectedStudentIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Add missing filtered to selection
      setSelectedStudentIds(prev => {
        const union = new Set([...prev, ...allFilteredIds]);
        return Array.from(union);
      });
    }
  };

  const handleExportExcel = async () => {
    if (!activeGroup) return;
    const toastId = toast.loading("Exporting Excel...");
    await new Promise(resolve => setTimeout(resolve, 50));
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
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      const headers = ["Student Name", "Register Number", "Dept", "Cohort Option Mapping"];
      const rows = filteredStudents.map(s => {
        const selections = getStudentSelectionsInGroup(s, activeGroup);
        return [
          s.name,
          s.regNo,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle/50 pb-5">
        <div className="flex items-center gap-3.5 flex-wrap">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Cohorts</h1>
          <span className="text-2xl text-muted/30 font-light select-none">/</span>
          
          {/* Dropdown Selector */}
          <div className="relative">
            <button
              onClick={() => setIsGroupSwitcherOpen(!isGroupSwitcherOpen)}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-surface hover:bg-background border border-border-subtle text-foreground text-base font-black rounded-2xl shadow-sm transition-all cursor-pointer select-none"
            >
              <span>{activeGroup?.name}</span>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border",
                activeGroup?.type === "student_selectable" 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-purple-50 text-purple-600 border-purple-100"
              )}>
                {activeGroup?.type === "student_selectable" ? "Selectable" : "Assigned"}
              </span>
              <LuChevronRight size={16} className={cn("transition-transform text-muted", isGroupSwitcherOpen && "rotate-90")} />
            </button>
            
            {isGroupSwitcherOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsGroupSwitcherOpen(false)} />
                <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-border-subtle bg-white shadow-2xl py-3.5 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 pb-2 border-b border-border-subtle/50 mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted block">Switch Cohort</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto px-2 space-y-1.5">
                    {customGroups.map(g => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setSelectedGroupId(g.id);
                          setIsGroupSwitcherOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition-all",
                          selectedGroupId === g.id
                            ? "bg-primary/[0.03] text-primary"
                            : "text-muted hover:text-foreground hover:bg-background"
                        )}
                      >
                        <span>{g.name}</span>
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded border bg-surface text-muted">
                          {g.type === "student_selectable" ? "Selectable" : "Assigned"}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border-subtle/50 mt-2.5 pt-2.5 px-3">
                    <button
                      onClick={() => {
                        setIsAddingGroup(true);
                        setIsGroupSwitcherOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-black uppercase cursor-pointer"
                    >
                      <LuPlus size={14} /> Create Cohort Group
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Configure Panel Drawer Button */}
          <button
            onClick={() => setIsConfigDrawerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-black uppercase bg-surface hover:bg-background border border-border-subtle text-foreground rounded-2xl px-4 py-2.5 shadow-sm transition-all cursor-pointer"
          >
            <LuSettings size={14} /> Configure Cohort
          </button>
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />
        </div>

        {/* Mapped stats */}
        <div className="flex items-center gap-4 bg-surface border border-border-subtle p-3 rounded-2xl shadow-sm shrink-0">
          <div className="text-center px-4 border-r border-border-subtle/50">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted block">Cohort Size</span>
            <span className="text-lg font-black text-foreground">{memberCount}</span>
          </div>
          <div className="text-center px-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted block">Options Count</span>
            <span className="text-lg font-black text-foreground">{activeGroup?.options.length || 0}</span>
          </div>
        </div>
      </div>

      {activeGroup ? (
        <div className="space-y-6">
          
          {/* Options Filtering Cards Row (Full Width) */}
          {activeGroup.options.length > 0 && (
            <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft p-5 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase text-muted tracking-widest mr-2 select-none">Filter Table:</span>
                <button
                  onClick={() => setSelectedOptionFilter("")}
                  className={cn(
                    "flex items-center gap-2.5 px-4.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer",
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
                      key={option}
                      onClick={() => setSelectedOptionFilter(option)}
                      className={cn(
                        "flex items-center gap-2.5 px-4.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer",
                        isSelected
                          ? "bg-primary/[0.04] border-primary text-primary shadow-tactile scale-[1.01]"
                          : "bg-background text-muted border-border-subtle hover:border-primary/30"
                      )}
                    >
                      <span>{option}</span>
                      <span className={cn(
                        "text-[9px] font-black px-1.5 py-0.2 rounded-md",
                        isSelected ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted"
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
                      onChange={(e) => setShowOnlyMembers(e.target.checked)}
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-background border border-border-subtle rounded-xl py-2.5 pl-9.5 pr-7 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute right-2.5 text-muted hover:text-foreground">
                      <LuX size={12} />
                    </button>
                  )}
                </div>

                {/* Department Dropdown Filter */}
                <div className="sm:col-span-3">
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
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
                    onChange={(e) => setBatchFilter(e.target.value)}
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
                            onChange={handleToggleSelectAll}
                            className="rounded text-primary border-border-subtle focus:ring-primary h-4 w-4 cursor-pointer"
                          />
                        </th>
                        <th className="p-4">Student</th>
                        <th className="p-4">Reg No</th>
                        <th className="p-4">Dept & Year</th>
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
                                onChange={() => handleToggleStudentSelection(s.id)}
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
                                        onClick={() => assignOptionToStudent(s.id, activeGroup, sel, 'remove')}
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
                                          assignOptionToStudent(s.id, activeGroup, val, 'add');
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
                                /* Single value select for admin_assigned */
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
                                      assignOptionToStudent(s.id, activeGroup, val, 'set');
                                    } else {
                                      assignOptionToStudent(s.id, activeGroup, "", 'remove');
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
                                onClick={async () => {
                                  if (activeGroup.type === "student_selectable") {
                                    setIsUpdatingMember(s.id);
                                    toast.loading("Clearing all selections...");
                                    try {
                                      const newSpecs = (s.specializations || []).filter((opt: string) => !activeGroup.options.includes(opt));
                                      await db.updateStudentProfile(s.id, { specializations: newSpecs });
                                      setStudents(prev => prev.map(stud => 
                                        stud.id === s.id ? { ...stud, specializations: newSpecs } : stud
                                      ));
                                      toast.success("Selections cleared!");
                                    } catch (err) {
                                      console.error(err);
                                      toast.error("Failed to clear mappings.");
                                    } finally {
                                      setIsUpdatingMember(null);
                                      toast.dismiss();
                                    }
                                  } else {
                                    assignOptionToStudent(s.id, activeGroup, "", 'remove');
                                  }
                                }}
                                className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              >
                                Unassign
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
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="p-1.5 border border-border-subtle rounded-xl text-muted hover:text-foreground disabled:opacity-30 transition-colors cursor-pointer"
                      >
                        <LuChevronLeft size={16} />
                      </button>
                      <span className="text-[10px] font-black uppercase text-foreground">
                        Page {currentPage} / {Math.ceil(filteredStudents.length / pageSize)}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage >= Math.ceil(filteredStudents.length / pageSize)}
                        onClick={() => setCurrentPage(p => p + 1)}
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
      ) : (
        <div className="p-24 text-center text-muted font-bold border border-dashed border-border-subtle rounded-3xl bg-surface/50">
          <LuLayers size={48} className="mx-auto text-muted/30 mb-4 animate-pulse" />
          <h3 className="text-base font-black">Select or Create a Group</h3>
          <p className="text-xs text-muted-foreground/60 mt-1">Select a custom group category to manage options and student mappings.</p>
        </div>
      )}

      {/* Slide-out configuration drawer */}
      {isConfigDrawerOpen && activeGroup && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsConfigDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white border-l border-border-subtle shadow-2xl z-50 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border-subtle/50 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-foreground">Configure Group</h3>
                <p className="text-xs text-muted-foreground">Manage options and segments for {activeGroup.name}</p>
              </div>
              <button 
                onClick={() => setIsConfigDrawerOpen(false)} 
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
                    onClick={() => handleUpdateGroupType(activeGroup.id, 'student_selectable')}
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
                    onClick={() => handleUpdateGroupType(activeGroup.id, 'admin_assigned')}
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
                      onClick={() => setIsAddingOption(true)}
                      className="flex items-center gap-1 text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/15 hover:bg-primary/20 rounded-xl px-2.5 py-1.5 transition-all cursor-pointer"
                    >
                      <LuPlus size={12} /> Add Option
                    </button>
                  ) : (
                    <form onSubmit={handleAddOption} className="flex gap-1.5 animate-in zoom-in-95 duration-200">
                      <input
                        type="text"
                        placeholder="Option name..."
                        autoFocus
                        required
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
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
                        onClick={() => {
                          setIsAddingOption(false);
                          setNewOptionName("");
                        }}
                        className="p-1 hover:bg-background border border-border-subtle/50 text-muted rounded-xl cursor-pointer"
                      >
                        <LuX size={12} />
                      </button>
                    </form>
                  )}
                </div>

                <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
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
                                onClick={() => handleDeleteOption(option)}
                                className="text-[9px] font-black uppercase text-red-500 hover:text-white hover:bg-red-500 bg-red-500/10 px-2.5 py-1 rounded cursor-pointer"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteOption(null)}
                                className="text-[9px] font-bold text-muted hover:text-foreground bg-white px-2.5 py-1 rounded border border-border-subtle cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteOption(option)}
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
                        onClick={() => {
                          handleDeleteGroup(activeGroup.id);
                          setIsConfigDrawerOpen(false);
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2.5 text-xs font-black uppercase tracking-widest cursor-pointer shadow-sm text-center"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteGroupId(null)}
                        className="flex-1 bg-white border border-border-subtle text-muted hover:text-foreground rounded-xl py-2.5 text-xs font-black uppercase tracking-widest cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteGroupId(activeGroup.id)}
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
      )}

      {/* Create Group Modal */}
      {isAddingGroup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-border-subtle shadow-2xl rounded-3xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle/50 pb-3">
              <h3 className="text-lg font-black text-foreground">Create New Cohort Group</h3>
              <button 
                type="button" 
                onClick={() => { setIsAddingGroup(false); setNewGroupName(""); }}
                className="text-muted hover:text-foreground cursor-pointer p-1 rounded-lg hover:bg-background"
              >
                <LuX size={16} />
              </button>
            </div>
            <form onSubmit={handleAddGroup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted tracking-widest">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Programming Languages..."
                  autoFocus
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted tracking-widest">Selectability</label>
                <select
                  value={newGroupType}
                  onChange={(e) => setNewGroupType(e.target.value as any)}
                  className="w-full px-2.5 py-2.5 bg-background border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="student_selectable">Student Selectable (Profile Toggles)</option>
                  <option value="admin_assigned">Admin Assigned (Read-only for Students)</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest cursor-pointer shadow-sm"
                >
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingGroup(false);
                    setNewGroupName("");
                  }}
                  className="px-4 py-2.5 bg-surface border border-border-subtle text-muted hover:text-foreground rounded-xl text-xs font-black uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Batch Action Panel */}
      {selectedStudentIds.length > 0 && activeGroup && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-4.5 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-8 duration-300 border border-muted/20 w-[92%] sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-background/10 flex items-center justify-center text-background shrink-0">
              <LuUsers size={14} />
            </div>
            <span className="text-xs font-black whitespace-nowrap">
              {selectedStudentIds.length} students selected
            </span>
          </div>

          <div className="h-5 w-px bg-background/15 shrink-0" />

          {/* Action selection dropdown + Apply buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={batchOptionVal}
              onChange={(e) => setBatchOptionVal(e.target.value)}
              className="bg-background text-foreground text-xs font-bold border-none rounded-lg p-2.5 cursor-pointer focus:outline-none"
            >
              <option value="">Assign to Option...</option>
              {activeGroup.options.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>

            <button
              onClick={() => handleBatchAssign(batchOptionVal, false)}
              disabled={!batchOptionVal || isBatchUpdating}
              className="bg-primary hover:bg-primary-dark text-white rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer transition-colors shadow-sm"
            >
              Apply Map
            </button>

            <button
              onClick={() => handleBatchAssign("", true)}
              disabled={isBatchUpdating}
              className="bg-background/10 hover:bg-background/25 text-background border border-background/20 rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider disabled:opacity-45 cursor-pointer transition-colors"
            >
              Unassign All
            </button>
          </div>

          <div className="h-5 w-px bg-background/15 shrink-0" />

          {/* Close Panel Button */}
          <button
            onClick={() => {
              setSelectedStudentIds([]);
              setBatchOptionVal("");
            }}
            className="text-background/50 hover:text-background p-1.5 transition-colors cursor-pointer"
          >
            <LuX size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
