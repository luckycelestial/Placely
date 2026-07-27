"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  LuAward, 
  LuCode, 
  LuFolder, 
  LuSearch, 
  LuBriefcase, 
  LuSlidersHorizontal,
  LuTrophy,
  LuMedal,
  LuFileText
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Sk } from "@/components/ui/skeleton";
import { ExportDropdown } from "@/components/ui/ExportDropdown";
import { exportToExcel, exportToPDF } from "@/lib/export-utils";
import { toast } from "sonner";

interface StudentLeaderboardRow {
  id: string;
  name: string;
  department: string;
  year: number;
  leetcodeCount: number;
  projectsCount: number;
  offersCount: number;
  applicationsCount: number;
}

export function LeaderboardView() {
  const [tab, setTab] = useState<"coding" | "drives" | "projects">("coding");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<StudentLeaderboardRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [batchFilter, setBatchFilter] = useState("All");

  useEffect(() => {
    async function fetchLeaderboardData() {
      setLoading(true);
      try {
        const [studentsRes, profilesRes, projectsRes, offersRes, appsRes] = await Promise.all([
          supabase.from("students").select("id, name, department, year"),
          supabase.from("student_profiles").select("student_id, leetcode_count"),
          supabase.from("student_projects").select("student_id"),
          supabase.from("offers").select("student_id, acceptance_status"),
          supabase.from("applications").select("student_id")
        ]);

        const students = studentsRes.data || [];
        const profiles = profilesRes.data || [];
        const projects = projectsRes.data || [];
        const offers = offersRes.data || [];
        const apps = appsRes.data || [];

        // Build data structure
        const formatted: StudentLeaderboardRow[] = students.map(s => {
          const profile = profiles.find(p => p.student_id === s.id);
          const sProj = projects.filter(p => p.student_id === s.id);
          const sOff = offers.filter(o => o.student_id === s.id);
          const sApps = apps.filter(a => a.student_id === s.id);

          return {
            id: s.id,
            name: s.name || "Unknown Student",
            department: s.department || "N/A",
            year: Number(s.year) || 2026,
            leetcodeCount: profile?.leetcode_count || 0,
            projectsCount: sProj.length,
            offersCount: sOff.length,
            applicationsCount: sApps.length
          };
        });

        setRows(formatted);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboardData();
  }, []);

  // Get unique departments and batches for filtering
  const departments = useMemo(() => {
    const list = new Set(rows.map(r => r.department));
    return ["All", ...Array.from(list).sort()];
  }, [rows]);

  const batches = useMemo(() => {
    const list = new Set(rows.map(r => String(r.year)));
    return ["All", ...Array.from(list).sort()];
  }, [rows]);

  // Sort and filter rows based on tab
  const sortedAndFilteredRows = useMemo(() => {
    let list = [...rows];

    // Filters
    if (searchQuery) {
      list = list.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (deptFilter !== "All") {
      list = list.filter(r => r.department === deptFilter);
    }
    if (batchFilter !== "All") {
      list = list.filter(r => String(r.year) === batchFilter);
    }

    // Sort based on tab
    if (tab === "coding") {
      list.sort((a, b) => b.leetcodeCount - a.leetcodeCount || a.name.localeCompare(b.name));
    } else if (tab === "drives") {
      list.sort((a, b) => b.offersCount - a.offersCount || b.applicationsCount - a.applicationsCount || a.name.localeCompare(b.name));
    } else if (tab === "projects") {
      list.sort((a, b) => b.projectsCount - a.projectsCount || a.name.localeCompare(b.name));
    }

    return list;
  }, [rows, tab, searchQuery, deptFilter, batchFilter]);

  const handleExportExcel = async () => {
    const toastId = toast.loading("Exporting Excel...");
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      let exportRows: any[] = [];
      const filename = `Leaderboard_${tab}_Report`;
      
      sortedAndFilteredRows.forEach((row, idx) => {
        const base = {
          "Rank": idx + 1,
          "Student Name": row.name,
          "Department": row.department,
          "Batch Year": row.year
        };

        if (tab === "coding") {
          exportRows.push({ ...base, "LeetCode Solved": row.leetcodeCount });
        } else if (tab === "drives") {
          exportRows.push({
            ...base,
            "Offers Secured": row.offersCount,
            "Applications Submitted": row.applicationsCount
          });
        } else if (tab === "projects") {
          exportRows.push({ ...base, "Projects Count": row.projectsCount });
        }
      });

      exportToExcel(exportRows, filename, tab.toUpperCase());
      toast.success("Excel exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Excel");
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading("Exporting PDF...");
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
      let headers: string[] = ["Rank", "Student Name", "Department", "Batch"];
      let rows: any[][] = [];
      const filename = `Leaderboard_${tab}_Report`;

      if (tab === "coding") {
        headers.push("LeetCode Solved");
        rows = sortedAndFilteredRows.map((row, idx) => [
          String(idx + 1),
          row.name,
          row.department,
          String(row.year),
          String(row.leetcodeCount)
        ]);
      } else if (tab === "drives") {
        headers.push("Offers", "Applications");
        rows = sortedAndFilteredRows.map((row, idx) => [
          String(idx + 1),
          row.name,
          row.department,
          String(row.year),
          String(row.offersCount),
          String(row.applicationsCount)
        ]);
      } else if (tab === "projects") {
        headers.push("Projects Count");
        rows = sortedAndFilteredRows.map((row, idx) => [
          String(idx + 1),
          row.name,
          row.department,
          String(row.year),
          String(row.projectsCount)
        ]);
      }

      await exportToPDF(`Leaderboard - ${tab.toUpperCase()}`, headers, rows, filename);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    } finally {
      toast.dismiss(toastId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-4">
        <Sk.Block className="h-10 w-64 rounded-xl" />
        <Sk.CardGrid count={3} cols={3} />
        <div className="space-y-4">
          <Sk.Block className="h-12 w-full rounded-2xl animate-pulse" />
          <Sk.Block className="h-12 w-full rounded-2xl animate-pulse" />
          <Sk.Block className="h-12 w-full rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="font-display text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
            <LuTrophy className="text-primary animate-bounce" size={36} />
            Unified <span className="text-primary">Leaderboard.</span>
          </h2>
          <p className="font-sans text-sm font-medium text-muted max-w-xl">
            See how you compare with peer students across LeetCode progress, secured placement offers, and developer projects.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle gap-8 pt-2">
        {[
          { id: "coding", label: "Coding stats", icon: <LuCode size={16} /> },
          { id: "drives", label: "Placement Drive", icon: <LuBriefcase size={16} /> },
          { id: "projects", label: "Project count", icon: <LuFolder size={16} /> }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={cn(
              "pb-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all cursor-pointer",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-surface border border-border-subtle p-6 rounded-3xl shadow-sm space-y-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative w-full md:w-80 group">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search by student name..." 
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-border-subtle bg-background text-sm text-foreground focus:outline-none focus:border-primary transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted">
            <LuSlidersHorizontal size={14} />
            Filters:
          </div>
          
          <div className="flex items-center gap-2 bg-background border border-border-subtle px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-black uppercase text-muted tracking-widest">Dept</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-foreground focus:outline-none outline-none cursor-pointer"
            >
              {departments.map(d => (
                <option key={d} value={d} className="bg-surface text-foreground font-sans">{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-background border border-border-subtle px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-black uppercase text-muted tracking-widest">Batch</span>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-foreground focus:outline-none outline-none cursor-pointer"
            >
              {batches.map(b => (
                <option key={b} value={b} className="bg-surface text-foreground font-sans">{b}</option>
              ))}
            </select>
          </div>
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
          />
        </div>
      </div>

      {/* Leaderboard Rankings List */}
      <div className="bg-surface border border-border-subtle rounded-3xl overflow-hidden shadow-xl shadow-black/5 divide-y divide-border-subtle/50">
        {sortedAndFilteredRows.map((row, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          const avatar = row.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

          // Dynamic rendering for score
          let scoreText = "";
          let scoreIcon: React.ReactNode = null;

          if (tab === "coding") {
            scoreText = `${row.leetcodeCount} Solved`;
            scoreIcon = <LuCode className="text-primary" size={14} />;
          } else if (tab === "drives") {
            scoreText = `${row.offersCount} Offers (${row.applicationsCount} Apps)`;
            scoreIcon = <LuBriefcase className="text-emerald-500" size={14} />;
          } else if (tab === "projects") {
            scoreText = `${row.projectsCount} Projects`;
            scoreIcon = <LuFolder className="text-purple-500" size={14} />;
          }

          return (
            <div 
              key={row.id} 
              className={cn(
                "flex items-center justify-between p-6 hover:bg-background/40 transition-colors group",
                isTop3 && "bg-primary/[0.005]"
              )}
            >
              <div className="flex items-center gap-6 min-w-0">
                {/* Rank indicator */}
                <div className="w-10 flex justify-center shrink-0">
                  {rank === 1 ? (
                    <span className="h-8 w-8 rounded-full bg-yellow-500/10 text-yellow-600 flex items-center justify-center font-black text-sm border border-yellow-500/20">
                      <LuMedal size={16} />
                    </span>
                  ) : rank === 2 ? (
                    <span className="h-8 w-8 rounded-full bg-slate-350/15 text-slate-500 flex items-center justify-center font-black text-sm border border-slate-400/20">
                      <LuMedal size={16} />
                    </span>
                  ) : rank === 3 ? (
                    <span className="h-8 w-8 rounded-full bg-amber-700/10 text-amber-800 flex items-center justify-center font-black text-sm border border-amber-800/20">
                      <LuMedal size={16} />
                    </span>
                  ) : (
                    <span className="text-xs font-black text-muted tracking-tight">#{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="h-10 w-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-transform border border-border-subtle/50">
                  {avatar}
                </div>

                {/* Student Info */}
                <div className="min-w-0">
                  <h4 className="font-display text-base font-bold tracking-tight group-hover:text-primary transition-colors truncate">
                    {row.name}
                  </h4>
                  <p className="font-sans text-[10px] font-black text-muted uppercase mt-0.5 tracking-widest flex items-center gap-1.5">
                    <span>{row.department}</span>
                    <span className="h-1 w-1 rounded-full bg-muted/40" />
                    <span>Batch {row.year}</span>
                  </p>
                </div>
              </div>

              {/* Score output */}
              <div className="flex items-center gap-3 shrink-0 bg-background/50 border border-border-subtle/50 px-4 py-2 rounded-2xl shadow-sm">
                {scoreIcon}
                <span className="text-xs font-black uppercase tracking-widest text-foreground">
                  {scoreText}
                </span>
              </div>
            </div>
          );
        })}

        {sortedAndFilteredRows.length === 0 && (
          <div className="py-24 text-center">
            <h4 className="font-display text-xl font-bold tracking-tight">No Rankings Found</h4>
            <p className="text-sm font-semibold text-muted mt-1">Try broadening your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
