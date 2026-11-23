"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { db } from "@/services/database";
import { getSettingByKey } from "@/services/settings";
import {
  type Stage,
  type Application,
  DEFAULT_STAGES,
  resolveStagesForDrive,
} from "./types";
import type { AtsDrive } from "./ats-column";

interface RawApplicationRow {
  id: string;
  applied_at?: string;
  updated_at?: string;
  current_stage?: string;
  package_ctc?: string | number;
  students?: {
    name?: string;
    roll_number?: string;
    register_number?: string;
    department?: string;
    users?: { name?: string };
  } | {
    name?: string;
    roll_number?: string;
    register_number?: string;
    department?: string;
    users?: { name?: string };
  }[];
  job_drives?: {
    batch?: string;
    role_title?: string;
    package_ctc?: string | number;
    companies?: { name?: string } | { name?: string }[];
  } | {
    batch?: string;
    role_title?: string;
    package_ctc?: string | number;
    companies?: { name?: string } | { name?: string }[];
  }[];
}

export function useAtsTracker() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [drives, setDrives] = useState<AtsDrive[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCtcId, setEditingCtcId] = useState<string | null>(null);

  // Filters
  const [activeDrive, setActiveDrive] = useState(() => searchParams.get("driveId") ?? "All Drives");
  const [activeBatch, setActiveBatch] = useState("All Batches");
  const [activeDept, setActiveDept] = useState("All Departments");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showHoverPreview, setShowHoverPreview] = useState(false);

  // Selection
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [targetStage, setTargetStage] = useState("shortlisted");

  // Stages
  const [stages, setStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [defaultStages, setDefaultStages] = useState<Stage[]>(DEFAULT_STAGES);
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [stageToRemove, setStageToRemove] = useState<string | null>(null);
  const [openMappingDropdown, setOpenMappingDropdown] = useState<string | null>(null);

  const [prevActiveDrive, setPrevActiveDrive] = useState(activeDrive);
  if (prevActiveDrive !== activeDrive) {
    setPrevActiveDrive(activeDrive);
    if (activeDrive !== "All Drives") {
      const drive = drives.find((d) => d.id === activeDrive);
      setStages(resolveStagesForDrive(drive));
    } else {
      setStages(defaultStages);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [drivesData, batchesData, deptsData] = await Promise.all([
          db.getDrives(),
          db.getDistinctBatches(),
          db.getDistinctDepartments(),
        ]);
        setDrives((drivesData || []) as AtsDrive[]);
        setBatches(batchesData || []);
        setDepartments(deptsData || []);

        const storedStages = await getSettingByKey<Stage[]>("ats_default_stages", DEFAULT_STAGES);
        if (storedStages && Array.isArray(storedStages) && storedStages.length > 0) {
          setDefaultStages(storedStages);
          setStages(storedStages);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const data = await db.getApplications({
          driveId: activeDrive === "All Drives" ? undefined : activeDrive,
          batch: activeBatch === "All Batches" ? undefined : activeBatch,
          department: activeDept === "All Departments" ? undefined : activeDept,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
        });

        const formatted: Application[] = (data || []).map((app: RawApplicationRow) => {
          const student = Array.isArray(app.students) ? app.students[0] : app.students;
          const drive = Array.isArray(app.job_drives) ? app.job_drives[0] : app.job_drives;
          const company = Array.isArray(drive?.companies) ? drive?.companies[0] : drive?.companies;

          const name = student?.users?.name || student?.name || "Unknown Student";
          const avatar = name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return {
            id: app.id,
            name,
            avatar,
            rollNo: student?.roll_number || "",
            regNo: student?.register_number || "REG-" + app.id.slice(0, 6),
            dept: student?.department || "CSE",
            batch: drive?.batch || "N/A",
            company: company?.name || "Tech Corp",
            role: drive?.role_title || "Software Engineer",
            stage: app.current_stage || "applied",
            updated: db.formatRelativeTime(app.updated_at || app.applied_at),
            ctc: String(app.package_ctc || drive?.package_ctc || "12 - 18 LPA"),
          };
        });

        setApplications(formatted);
      } catch (err) {
        console.error("Failed to fetch applications", err);
      }
    }
    fetchApplications();
  }, [activeDrive, activeBatch, activeDept, startDate, endDate]);

  return {
    search,
    setSearch,
    applications,
    setApplications,
    drives,
    batches,
    departments,
    loading,
    editingCtcId,
    setEditingCtcId,
    activeDrive,
    setActiveDrive,
    activeBatch,
    setActiveBatch,
    activeDept,
    setActiveDept,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isFilterOpen,
    setIsFilterOpen,
    showHoverPreview,
    setShowHoverPreview,
    selectedApps,
    setSelectedApps,
    showMoveModal,
    setShowMoveModal,
    targetStage,
    setTargetStage,
    stages,
    setStages,
    defaultStages,
    showAddStageModal,
    setShowAddStageModal,
    newStageName,
    setNewStageName,
    stageToRemove,
    setStageToRemove,
    openMappingDropdown,
    setOpenMappingDropdown,
    fetchApplications,
  };
}
