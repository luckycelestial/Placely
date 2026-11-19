export interface ReportStats {
  placementRate: string;
  avgCTC: string;
  totalOffers: string | number;
  atRisk?: string | number;
  funnel?: { stage: string; count: number; pct: string }[];
}

export interface TrendPoint {
  month: string;
  placements: number;
  offers: number;
  drives?: number;
}

export interface DeptData {
  name: string;
  total: number;
  placed: number;
  unplaced: number;
  placementRate: number;
  avgCTC: number;
  maxCTC?: number;
}

export interface CompanyData {
  name: string;
  industry: string;
  hires: number;
  avgCTC: number;
  departments: string[];
  departmentCount: number;
}

export interface YearData {
  year: string;
  totalOffers: number;
  avgCTC: number;
  drives: number;
  placementRate: number;
}

export interface GroupData {
  name: string;
  total: number;
  placed: number;
  unplaced: number;
  placementRate: number;
  avgCTC: number;
  maxCTC?: number;
}

export interface CrossItem {
  name: string;
  hires: number;
  avgCTC: number;
}

export interface CrossData {
  companies: CrossItem[];
  depts: CrossItem[];
  years: (CrossItem & { year: string })[];
}

export type AnalyticsTab =
  | "overview"
  | "department"
  | "company"
  | "year"
  | "tech_domain"
  | "placement_group";

export type Selection = {
  type: "dept" | "company" | "year" | "tech_domain" | "placement_group";
  value: string;
} | null;

export const DEPT_PALETTE = [
  "#ff383c",
  "#ffd400",
  "#3b82f6",
  "#4ade80",
  "#a855f7",
  "#f97316",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f59e0b",
];

export const INDUSTRY_COLOR: Record<string, string> = {
  Technology: "#3b82f6",
  "IT Services": "#6366f1",
  "E-commerce": "#f97316",
  Consulting: "#a855f7",
  Finance: "#4ade80",
  Healthcare: "#06b6d4",
};

export const C = {
  primary: "#ff383c",
  secondary: "#ffd400",
  blue: "#3b82f6",
  purple: "#a855f7",
  muted: "#8e8e93",
};

export const TT = {
  contentStyle: {
    borderRadius: "16px",
    border: "1px solid #e6e6e6",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.07)",
    padding: "12px",
  },
  itemStyle: { fontSize: "11px", fontWeight: 800 },
  labelStyle: { fontSize: "12px", fontWeight: 900, marginBottom: "6px", color: "#1f1f1f" },
};

export function getClientCrossAnalytics(selected: Selection, students: any[]): CrossData {
  if (!selected) return { companies: [], depts: [], years: [] };

  const filtered = students.filter((s) => {
    if (s.status !== "Placed") return false;

    if (selected.type === "dept") {
      return s.dept === selected.value;
    }
    if (selected.type === "company") {
      return s.company === selected.value;
    }
    if (selected.type === "year") {
      return s.year && s.year.includes(selected.value);
    }
    if (selected.type === "tech_domain") {
      return s.specializations && s.specializations.includes(selected.value);
    }
    if (selected.type === "placement_group") {
      let val = "";
      const rawPref = s.placementGroup || "";
      if (rawPref.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(rawPref);
          val = parsed["placement_groups"] || parsed["placement_group"] || "";
        } catch (e) {}
      } else {
        val = rawPref;
      }
      return val === selected.value;
    }
    return false;
  });

  const aggregate = (key: "company" | "dept" | "year") => {
    const map: Record<string, { hires: number; ctcSum: number }> = {};
    filtered.forEach((s) => {
      let k = "";
      if (key === "company") k = s.company || "Unknown";
      else if (key === "dept") k = s.dept || "Unknown";
      else if (key === "year") {
        const match = s.year ? s.year.match(/^(\d{4}-\d{4})/) : null;
        k = match ? match[1] : s.year || "Unknown";
      }

      if (!k || k === "N/A") return;
      if (!map[k]) map[k] = { hires: 0, ctcSum: 0 };
      map[k].hires++;
      const val =
        typeof s.package_ctc === "number"
          ? s.package_ctc
          : parseFloat(String(s.package_ctc || "").replace(/[^0-9.]/g, ""));
      if (!isNaN(val) && val > 0) {
        map[k].ctcSum += val;
      }
    });

    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        hires: d.hires,
        avgCTC: d.hires > 0 ? parseFloat((d.ctcSum / d.hires).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.hires - a.hires);
  };

  const companies = aggregate("company");
  const depts = aggregate("dept");

  const yearMap: Record<string, { hires: number; ctcSum: number }> = {};
  filtered.forEach((s) => {
    const match = s.year ? s.year.match(/^(\d{4}-\d{4})/) : null;
    const yr = match ? match[1] : s.year || "";
    if (!yr || yr === "N/A") return;
    if (!yearMap[yr]) yearMap[yr] = { hires: 0, ctcSum: 0 };
    yearMap[yr].hires++;
    const val =
      typeof s.package_ctc === "number"
        ? s.package_ctc
        : parseFloat(String(s.package_ctc || "").replace(/[^0-9.]/g, ""));
    if (!isNaN(val) && val > 0) {
      yearMap[yr].ctcSum += val;
    }
  });

  const years = Object.entries(yearMap)
    .map(([year, d]) => ({
      year,
      name: year,
      hires: d.hires,
      avgCTC: d.hires > 0 ? parseFloat((d.ctcSum / d.hires).toFixed(1)) : 0,
    }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));

  return { companies, depts, years };
}
