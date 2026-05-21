/**
 * Skeleton loader primitives and pre-built page-level skeletons.
 * Usage: import { Sk } from "@/components/ui/skeleton";
 * Then: <Sk.StatCardGrid count={5} /> or <Sk.TableRows cols={7} rows={10} />
 */
import { cn } from "@/lib/utils";

// ─── Base pulse block ─────────────────────────────────────────────────────────
interface BlockProps {
  className?: string;
  style?: React.CSSProperties;
}
function Block({ className, style }: BlockProps) {
  return (
    <div
      className={cn("bg-black/[0.07] rounded-lg animate-pulse", className)}
      style={style}
    />
  );
}

// ─── Circle variant ───────────────────────────────────────────────────────────
function Circle({ className }: BlockProps) {
  return <Block className={cn("rounded-full", className)} />;
}

// ─── Stat card skeleton ───────────────────────────────────────────────────────
function StatCard() {
  return (
    <div className="bg-surface rounded-2xl border border-border-subtle p-5 space-y-4 shadow-soft">
      <div className="flex items-center justify-between">
        <Block className="h-3 w-24" />
        <Circle className="h-9 w-9" />
      </div>
      <Block className="h-8 w-20" />
      <Block className="h-3 w-16" />
    </div>
  );
}

function StatCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        count === 5 ? "grid-cols-2 md:grid-cols-5" :
        count === 4 ? "grid-cols-2 lg:grid-cols-4" :
        count === 3 ? "grid-cols-1 md:grid-cols-3" :
        "grid-cols-2"
      )}
    >
      {Array.from({ length: count }).map((_, i) => <StatCard key={i} />)}
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────
function TableRows({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border-subtle last:border-0">
          {/* Avatar + text combo first col */}
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Circle className="h-9 w-9 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Block className="h-3 w-28" />
                <Block className="h-2.5 w-20" />
              </div>
            </div>
          </td>
          {/* Generic cols */}
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <td key={j} className="px-6 py-4">
              <Block className={cn("h-3", j % 3 === 0 ? "w-16" : j % 3 === 1 ? "w-24" : "w-20")} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Card skeleton (generic card with icon + title + body) ───────────────────
function Card({ className }: BlockProps) {
  return (
    <div className={cn("bg-surface rounded-3xl border border-border-subtle p-6 space-y-4 shadow-soft", className)}>
      <div className="flex items-start justify-between">
        <Block className="h-12 w-12 rounded-2xl" />
        <Block className="h-6 w-16 rounded-lg" />
      </div>
      <Block className="h-5 w-3/4" />
      <Block className="h-3 w-full" />
      <Block className="h-3 w-4/5" />
      <div className="pt-2 flex gap-3">
        <Block className="h-9 flex-1 rounded-xl" />
        <Block className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  );
}

function CardGrid({ count = 4, cols = 2 }: { count?: number; cols?: number }) {
  return (
    <div
      className={cn(
        "grid gap-6",
        cols === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" :
        cols === 2 ? "grid-cols-1 md:grid-cols-2" :
        "grid-cols-1"
      )}
    >
      {Array.from({ length: count }).map((_, i) => <Card key={i} />)}
    </div>
  );
}

// ─── List-item skeleton ───────────────────────────────────────────────────────
function ListItem() {
  return (
    <div className="flex items-center gap-4 p-5 border-b border-border-subtle last:border-0">
      <Circle className="h-10 w-10 shrink-0" />
      <div className="flex-1 space-y-2">
        <Block className="h-3.5 w-48" />
        <Block className="h-2.5 w-32" />
      </div>
      <Block className="h-6 w-16 rounded-full" />
    </div>
  );
}

function ListItems({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-surface rounded-3xl border border-border-subtle shadow-soft overflow-hidden">
      {Array.from({ length: count }).map((_, i) => <ListItem key={i} />)}
    </div>
  );
}

// ─── Notice/Event row skeleton ────────────────────────────────────────────────
function NoticeRow() {
  return (
    <div className="bg-surface p-6 rounded-3xl border border-border-subtle shadow-soft relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-black/[0.06] rounded-none" />
      <div className="flex justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <Block className="h-5 w-16 rounded-md" />
            <Block className="h-5 w-24 rounded-md" />
          </div>
          <Block className="h-5 w-3/4" />
          <Block className="h-3 w-full" />
          <Block className="h-3 w-5/6" />
        </div>
        <div className="flex gap-2 shrink-0">
          <Block className="h-10 w-10 rounded-xl" />
          <Block className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Drive card skeleton ──────────────────────────────────────────────────────
function DriveCard() {
  return (
    <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-soft space-y-4">
      <div className="flex items-center gap-3">
        <Block className="h-12 w-12 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Block className="h-4 w-32" />
          <Block className="h-3 w-24" />
        </div>
        <Block className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Block className="h-14 rounded-xl" />
        <Block className="h-14 rounded-xl" />
        <Block className="h-14 rounded-xl" />
      </div>
      <div className="flex gap-2 pt-2">
        <Block className="h-9 flex-1 rounded-xl" />
        <Block className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Profile skeleton ─────────────────────────────────────────────────────────
function Profile() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-8 flex flex-col md:flex-row gap-6 items-start">
        <Circle className="h-24 w-24 shrink-0" />
        <div className="flex-1 space-y-3">
          <Block className="h-7 w-48" />
          <Block className="h-4 w-32" />
          <div className="flex gap-2 pt-1">
            <Block className="h-6 w-20 rounded-full" />
            <Block className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Block className="h-10 w-32 rounded-xl" />
      </div>
      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface rounded-2xl border border-border-subtle p-5 space-y-3">
            <Block className="h-3 w-20" />
            <Block className="h-6 w-28" />
            <Block className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-surface rounded-3xl border border-border-subtle p-6 space-y-4">
        <Block className="h-5 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Block key={i} className="h-10 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Page header skeleton ─────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <Block className="h-7 w-48" />
        <Block className="h-4 w-72" />
      </div>
      <div className="flex gap-2">
        <Block className="h-9 w-28 rounded-xl" />
        <Block className="h-9 w-32 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Dashboard welcome skeleton ───────────────────────────────────────────────
function DashboardWelcome() {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-3">
        <Block className="h-3 w-32" />
        <Block className="h-12 w-72 md:w-96" />
        <Block className="h-4 w-80" />
      </div>
      <div className="flex gap-2">
        <Block className="h-12 w-12 rounded-2xl" />
        <Block className="h-12 w-36 rounded-full" />
      </div>
    </div>
  );
}

// ─── Activity feed skeleton ───────────────────────────────────────────────────
function ActivityRows({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-border-subtle">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-5 p-6">
          <Block className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Block className="h-4 w-2/3" />
            <Block className="h-2.5 w-1/3" />
          </div>
          <Block className="h-8 w-8 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar widget skeleton ──────────────────────────────────────────────────
function SidebarWidget() {
  return (
    <div className="bg-surface rounded-3xl border border-border-subtle overflow-hidden shadow-soft">
      <div className="px-8 py-6 border-b border-border-subtle bg-background/30 flex items-center justify-between">
        <Block className="h-5 w-32" />
        <Block className="h-5 w-5 rounded-full" />
      </div>
      <div className="p-6 space-y-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <Block className="h-2.5 w-20" />
            <Block className="h-4 w-3/4" />
            <Block className="h-2.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ATS Kanban column skeleton ───────────────────────────────────────────────
function KanbanColumn({ cards = 3 }: { cards?: number }) {
  return (
    <div className="bg-background rounded-2xl border border-border-subtle p-4 space-y-3 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <Block className="h-4 w-28" />
        <Block className="h-6 w-8 rounded-lg" />
      </div>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-surface rounded-xl border border-border-subtle p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Circle className="h-8 w-8 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Block className="h-3 w-24" />
              <Block className="h-2.5 w-16" />
            </div>
          </div>
          <Block className="h-2.5 w-full" />
          <Block className="h-2.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

// ─── Reports / chart skeleton ─────────────────────────────────────────────────
function ChartBlock({ className }: BlockProps) {
  return (
    <div className={cn("bg-surface rounded-3xl border border-border-subtle p-6 space-y-4 shadow-soft", className)}>
      <div className="flex items-center justify-between">
        <Block className="h-5 w-40" />
        <Block className="h-8 w-28 rounded-xl" />
      </div>
      {/* Bar chart placeholder */}
      <div className="flex items-end gap-2 h-40 pt-4">
        {[60, 85, 45, 70, 55, 90, 65, 40, 75].map((h, i) => (
          <Block
            key={i}
            className="flex-1 rounded-t-lg"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="flex gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1.5">
            <Block className="h-3 w-3 rounded-sm" />
            <Block className="h-2.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Offers card skeleton ─────────────────────────────────────────────────────
function OfferCard() {
  return (
    <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-soft space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Block className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Block className="h-4 w-32" />
            <Block className="h-3 w-24" />
          </div>
        </div>
        <Block className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-1.5">
            <Block className="h-2.5 w-12" />
            <Block className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-border-subtle flex gap-2">
        <Block className="h-9 flex-1 rounded-xl" />
        <Block className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Namespace export ─────────────────────────────────────────────────────────
export const Sk = {
  Block,
  Circle,
  StatCard,
  StatCardGrid,
  TableRows,
  Card,
  CardGrid,
  ListItem,
  ListItems,
  NoticeRow,
  DriveCard,
  Profile,
  PageHeader,
  DashboardWelcome,
  ActivityRows,
  SidebarWidget,
  KanbanColumn,
  ChartBlock,
  OfferCard,
};
