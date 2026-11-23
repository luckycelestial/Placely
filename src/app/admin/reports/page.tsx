"use client";

import { Sk } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import {
  LuChartPie,
  LuLayers,
  LuBuilding2,
  LuGraduationCap,
  LuCalendar,
  LuActivity,
} from "react-icons/lu";
import { db } from "@/services/database";
import { getSettingByKey, DEFAULT_CUSTOM_GROUPS, type CustomGroup } from "@/services/settings";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import { exportToExcel } from "@/lib/export-utils";
import { toast } from "sonner";
import {
  ReportStats,
  TrendPoint,
  DeptData,
  CompanyData,
  YearData,
  AnalyticsTab,
  Selection,
  CrossAnalyticsStudent,
  getClientCrossAnalytics,
} from "./types";
import { TabBtn, PlacedStudentsDirectoryTable, PredictiveTeaser } from "./components/ReportsUiPrimitives";
import { DrillDownPanel } from "./components/DrillDownPanel";
import { OverviewTab } from "./components/OverviewTab";
import { DepartmentTab } from "./components/DepartmentTab";
import { CompanyTab } from "./components/CompanyTab";
import { YearTab } from "./components/YearTab";
import { GroupTab } from "./components/GroupTab";

export default function ReportsPage() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [deptData, setDeptData] = useState<DeptData[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [yearData, setYearData] = useState<YearData[]>([]);
  const [students, setStudents] = useState<CrossAnalyticsStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setIsExporting] = useState(false);
  const [customGroups, setCustomGroups] = useState<CustomGroup[]>([]);

  // Drill-down state
  const [selected, setSelected] = useState<Selection>(null);
  const drillData = useMemo(() => (selected ? getClientCrossAnalytics(selected, students) : null), [selected, students]);
  const drillLoading = false;

  // Load page data
  useEffect(() => {
    async function load() {
      try {
        const [s, t, d, c, y, allStuds, groupsData] = await Promise.all([
          db.getReportStats(),
          db.getTrendData(),
          db.getDepartmentAnalytics(),
          db.getCompanyAnalytics(),
          db.getYearAnalytics(),
          db.getAllStudents(),
          getSettingByKey<CustomGroup[]>("custom_groups", DEFAULT_CUSTOM_GROUPS),
        ]);
        setStats(s);
        setTrendData(t);
        setDeptData(d as DeptData[]);
        setCompanyData(c as CompanyData[]);
        setYearData(y as YearData[]);
        setStudents(allStuds);

        const finalGroups = [...groupsData];
        const systemGroupIds = ["departments", "batches"];
        DEFAULT_CUSTOM_GROUPS.forEach((defaultGrp) => {
          if (systemGroupIds.includes(defaultGrp.id) && !finalGroups.some((g) => g.id === defaultGrp.id)) {
            finalGroups.push(defaultGrp);
          }
        });
        setCustomGroups(finalGroups);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Memoized analytics for custom groups
  const techDomainData = useMemo(() => {
    const group =
      customGroups.find((g) => g.id === "tech_domains") ||
      DEFAULT_CUSTOM_GROUPS.find((g) => g.id === "tech_domains");
    if (!group) return [];

    return group.options.map((option) => {
      const optionStudents = students.filter(
        (s) => s.specializations && s.specializations.includes(option)
      );
      const total = optionStudents.length;
      const placedStudents = optionStudents.filter((s) => s.status === "Placed");
      const placed = placedStudents.length;

      const packages = placedStudents
        .map((s) =>
          typeof s.package_ctc === "number"
            ? s.package_ctc
            : parseFloat(String(s.package_ctc || "").replace(/[^0-9.]/g, ""))
        )
        .filter((p) => !isNaN(p) && p > 0);
      const avgCTC =
        packages.length > 0
          ? parseFloat((packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1))
          : 0;
      const maxCTC = packages.length > 0 ? Math.max(...packages) : 0;

      return {
        name: option,
        total,
        placed,
        unplaced: total - placed,
        placementRate: total ? Math.round((placed / total) * 100) : 0,
        avgCTC,
        maxCTC,
      };
    });
  }, [students, customGroups]);

  const placementGroupData = useMemo(() => {
    const group =
      customGroups.find((g) => g.id === "placement_groups" || g.id === "placement_group") ||
      DEFAULT_CUSTOM_GROUPS.find((g) => g.id === "placement_groups" || g.id === "placement_group");
    if (!group) return [];

    return group.options.map((option) => {
      const optionStudents = students.filter((s) => {
        let val = "";
        const rawPref = s.placementGroup || "";
        if (rawPref.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(rawPref);
            val = parsed["placement_groups"] || parsed["placement_group"] || "";
          } catch {
            /* ignore JSON parse failure */
          }
        } else {
          val = rawPref;
        }
        return val === option;
      });

      const total = optionStudents.length;
      const placedStudents = optionStudents.filter((s) => s.status === "Placed");
      const placed = placedStudents.length;

      const packages = placedStudents
        .map((s) =>
          typeof s.package_ctc === "number"
            ? s.package_ctc
            : parseFloat(String(s.package_ctc || "").replace(/[^0-9.]/g, ""))
        )
        .filter((p) => !isNaN(p) && p > 0);
      const avgCTC =
        packages.length > 0
          ? parseFloat((packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1))
          : 0;
      const maxCTC = packages.length > 0 ? Math.max(...packages) : 0;

      return {
        name: option,
        total,
        placed,
        unplaced: total - placed,
        placementRate: total ? Math.round((placed / total) * 100) : 0,
        avgCTC,
        maxCTC,
      };
    });
  }, [students, customGroups]);

  const handleSelect = useCallback(
    (type: "dept" | "company" | "year" | "tech_domain" | "placement_group", value: string) => {
      setSelected((prev) => (prev?.value === value ? null : { type, value }));
    },
    []
  );

  const handleTabChange = (tab: AnalyticsTab) => {
    setActiveTab(tab);
    setSelected(null);
  };

  const handleExportExcel = async () => {
    const toastId = toast.loading("Exporting Excel...");
    await new Promise((resolve) => setTimeout(resolve, 50));
    try {
      let exportRows: Record<string, unknown>[] = [];
      const filename = `Analytics_${activeTab}_Report`;
      const sheetName = activeTab.substring(0, 31).toUpperCase();

      if (activeTab === "overview") {
        exportRows = trendData.map((t) => ({
          Month: t.month,
          Placements: t.placements,
          Offers: t.offers,
          Drives: t.drives || 0,
        }));
      } else if (activeTab === "department") {
        exportRows = deptData.map((d) => ({
          Department: d.name,
          "Total Students": d.total,
          Placed: d.placed,
          Unplaced: d.unplaced,
          "Placement Rate": `${d.placementRate}%`,
          "Average CTC (LPA)": d.avgCTC,
          "Max CTC (LPA)": d.maxCTC || 0,
        }));
      } else if (activeTab === "company") {
        exportRows = companyData.map((c) => ({
          Company: c.name,
          Industry: c.industry,
          Hires: c.hires,
          "Average CTC (LPA)": c.avgCTC,
          "Departments Reached": c.departments.join(", "),
        }));
      } else if (activeTab === "year") {
        exportRows = yearData.map((y) => ({
          "Batch Year": y.year,
          "Total Offers": y.totalOffers,
          "Average CTC (LPA)": y.avgCTC,
          "Drives Conducted": y.drives,
          "Placement Rate": `${y.placementRate}%`,
        }));
      } else if (activeTab === "tech_domain") {
        exportRows = techDomainData.map((td) => ({
          Domain: td.name,
          "Total Students": td.total,
          Placed: td.placed,
          Unplaced: td.unplaced,
          "Placement Rate": `${td.placementRate}%`,
          "Average CTC (LPA)": td.avgCTC,
          "Max CTC (LPA)": td.maxCTC,
        }));
      } else if (activeTab === "placement_group") {
        exportRows = placementGroupData.map((pg) => ({
          "Placement Group": pg.name,
          "Total Students": pg.total,
          Placed: pg.placed,
          Unplaced: pg.unplaced,
          "Placement Rate": `${pg.placementRate}%`,
          "Average CTC (LPA)": pg.avgCTC,
          "Max CTC (LPA)": pg.maxCTC,
        }));
      }

      exportToExcel(exportRows, filename, sheetName);
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Failed to export Excel:", error);
      toast.error("Failed to export Excel");
    } finally {
      toast.dismiss(toastId);
    }
  };

  if (loading || !mounted) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between no-print">
          <div className="space-y-2">
            <Sk.Block className="h-10 w-64" />
            <Sk.Block className="h-4 w-96" />
          </div>
          <Sk.Block className="h-10 w-40 rounded-xl" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Sk.Block className="h-10 w-32 rounded-full" />
          <Sk.Block className="h-10 w-32 rounded-full" />
          <Sk.Block className="h-10 w-32 rounded-full" />
          <Sk.Block className="h-10 w-32 rounded-full" />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Sk.Block className="h-16 rounded-2xl" />
            <Sk.Block className="h-16 rounded-2xl" />
            <Sk.Block className="h-16 rounded-2xl" />
            <Sk.Block className="h-16 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Sk.ChartBlock className="h-[400px]" />
            </div>
            <div>
              <Sk.ChartBlock className="h-[400px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: LuChartPie },
    { id: "department" as const, label: "Department", icon: LuGraduationCap },
    { id: "company" as const, label: "Company", icon: LuBuilding2 },
    { id: "year" as const, label: "Batch-wise", icon: LuCalendar },
    { id: "tech_domain" as const, label: "Tech Domain", icon: LuActivity },
    { id: "placement_group" as const, label: "Placement Group", icon: LuLayers },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between no-print">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Reports &amp; Analytics</h1>
          <p className="text-muted font-medium">
            Cross-dimensional placement insights — click any row to drill-down.
          </p>
        </div>
        <ExportDropdown
          onExportExcel={handleExportExcel}
          onExportPDF={() => {
            setIsExporting(true);
            setTimeout(() => {
              window.print();
              setIsExporting(false);
            }, 800);
          }}
          className="self-start md:self-auto"
        />
      </div>

      {/* Print header */}
      <div className="hidden print-only mb-8 border-b-2 border-primary pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter">CareerBridge Placement Report</h1>
        <p className="text-muted font-bold">Generated · {new Date().toLocaleDateString()}</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none no-print pb-1">
        {tabs.map((tab) => (
          <TabBtn
            key={tab.id}
            id={tab.id}
            active={activeTab === tab.id}
            icon={tab.icon}
            label={tab.label}
            onClick={() => handleTabChange(tab.id)}
          />
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-6 animate-in fade-in duration-300">
        {activeTab === "overview" && (
          <OverviewTab
            stats={stats}
            trendData={trendData}
            students={students}
            companyData={companyData}
          />
        )}

        {activeTab === "department" && (
          <>
            <DepartmentTab data={deptData} selected={selected} onSelect={(v) => handleSelect("dept", v)} />
            {selected?.type === "dept" && (() => {
              const selectedDeptData = deptData.find((d) => d.name === selected.value);
              const deptAvg = selectedDeptData?.avgCTC || 0;
              const deptMax = selectedDeptData?.maxCTC || 0;
              const placedList = students.filter(
                (s) => s.dept === selected.value && s.status === "Placed"
              );
              return (
                <>
                  <DrillDownPanel
                    selected={selected}
                    data={drillData}
                    loading={drillLoading}
                    onClose={() => setSelected(null)}
                  />
                  <PlacedStudentsDirectoryTable
                    title={`Placed Students · ${selected.value}`}
                    placedStudents={placedList}
                    avgCTC={deptAvg}
                    maxCTC={deptMax}
                  />
                </>
              );
            })()}
          </>
        )}

        {activeTab === "company" && (
          <>
            <CompanyTab data={companyData} selected={selected} onSelect={(v) => handleSelect("company", v)} />
            {selected?.type === "company" && (() => {
              const placedInCompany = students.filter(
                (s) => s.company === selected.value && s.status === "Placed"
              );
              const companyPackages = placedInCompany
                .map((s) => parseFloat(s.package_ctc))
                .filter((p) => !isNaN(p));
              const companyAvg =
                companyPackages.length > 0
                  ? companyPackages.reduce((a, b) => a + b, 0) / companyPackages.length
                  : 0;
              const companyMax = companyPackages.length > 0 ? Math.max(...companyPackages) : 0;
              return (
                <>
                  <DrillDownPanel
                    selected={selected}
                    data={drillData}
                    loading={drillLoading}
                    onClose={() => setSelected(null)}
                  />
                  <PlacedStudentsDirectoryTable
                    title={`Placed Students · ${selected.value}`}
                    placedStudents={placedInCompany}
                    avgCTC={companyAvg}
                    maxCTC={companyMax}
                    showDept
                  />
                </>
              );
            })()}
          </>
        )}

        {activeTab === "year" && (
          <>
            <YearTab data={yearData} selected={selected} onSelect={(v) => handleSelect("year", v)} />
            {selected?.type === "year" && (() => {
              const placedInBatch = students.filter(
                (s) => s.year?.includes(selected.value) && s.status === "Placed"
              );
              const batchPackages = placedInBatch
                .map((s) => parseFloat(s.package_ctc))
                .filter((p) => !isNaN(p));
              const batchAvg =
                batchPackages.length > 0
                  ? batchPackages.reduce((a, b) => a + b, 0) / batchPackages.length
                  : 0;
              const batchMax = batchPackages.length > 0 ? Math.max(...batchPackages) : 0;
              return (
                <>
                  <DrillDownPanel
                    selected={selected}
                    data={drillData}
                    loading={drillLoading}
                    onClose={() => setSelected(null)}
                  />
                  <PlacedStudentsDirectoryTable
                    title={`Placed Students · Batch of ${selected.value}`}
                    placedStudents={placedInBatch}
                    avgCTC={batchAvg}
                    maxCTC={batchMax}
                    showDept
                  />
                </>
              );
            })()}
          </>
        )}

        {activeTab === "tech_domain" && (
          <>
            <GroupTab
              title="Tech Domain Performance"
              groupName="Tech Domain"
              data={techDomainData}
              selected={selected}
              onSelect={(v) => handleSelect("tech_domain", v)}
            />
            {selected?.type === "tech_domain" && (() => {
              const selectedGroupData = techDomainData.find((d) => d.name === selected.value);
              const groupAvg = selectedGroupData?.avgCTC || 0;
              const groupMax = selectedGroupData?.maxCTC || 0;
              const placedList = students.filter(
                (s) => s.specializations && s.specializations.includes(selected.value) && s.status === "Placed"
              );
              return (
                <>
                  <DrillDownPanel
                    selected={selected}
                    data={drillData}
                    loading={drillLoading}
                    onClose={() => setSelected(null)}
                  />
                  <PlacedStudentsDirectoryTable
                    title={`Placed Students · Tech Domain: ${selected.value}`}
                    placedStudents={placedList}
                    avgCTC={groupAvg}
                    maxCTC={groupMax}
                  />
                </>
              );
            })()}
          </>
        )}

        {activeTab === "placement_group" && (
          <>
            <GroupTab
              title="Placement Group Performance"
              groupName="Placement Group"
              data={placementGroupData}
              selected={selected}
              onSelect={(v) => handleSelect("placement_group", v)}
            />
            {selected?.type === "placement_group" && (() => {
              const selectedGroupData = placementGroupData.find((d) => d.name === selected.value);
              const groupAvg = selectedGroupData?.avgCTC || 0;
              const groupMax = selectedGroupData?.maxCTC || 0;

              const isMatch = (s: CrossAnalyticsStudent) => {
                let val = "";
                const rawPref = s.placementGroup || "";
                if (rawPref.trim().startsWith("{")) {
                  try {
                    const parsed = JSON.parse(rawPref);
                    val = parsed["placement_groups"] || parsed["placement_group"] || "";
                  } catch {
                    /* ignore JSON parse failure */
                  }
                } else {
                  val = rawPref;
                }
                return val === selected.value;
              };

              const placedList = students.filter((s) => isMatch(s) && s.status === "Placed");
              return (
                <>
                  <DrillDownPanel
                    selected={selected}
                    data={drillData}
                    loading={drillLoading}
                    onClose={() => setSelected(null)}
                  />
                  <PlacedStudentsDirectoryTable
                    title={`Placed Students · Placement Group: ${selected.value}`}
                    placedStudents={placedList}
                    avgCTC={groupAvg}
                    maxCTC={groupMax}
                  />
                </>
              );
            })()}
          </>
        )}
      </div>

      {/* Predictive teaser */}
      <PredictiveTeaser />
    </div>
  );
}
