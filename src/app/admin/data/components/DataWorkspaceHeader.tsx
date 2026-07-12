"use client";

import { LuUpload, LuDownload, LuSearch, LuTrash2 } from "react-icons/lu";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { getBatchList } from "@/lib/batch-utils";

interface DataWorkspaceHeaderProps {
  selectedYear: string;
  isCompleted: boolean;
  searchQuery: string;
  selectedRowsCount: number;
  onYearChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onDeleteSelected: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export function DataWorkspaceHeader({
  selectedYear,
  isCompleted,
  searchQuery,
  selectedRowsCount,
  onYearChange,
  onSearchChange,
  onDeleteSelected,
  onFileUpload,
  onExport,
}: DataWorkspaceHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <LuSearch size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Data Workspace</h1>
          <p className="text-muted text-xs font-bold uppercase tracking-widest">Institutional Records Management</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border-subtle rounded-xl min-w-[180px]">
          <span className="text-[10px] font-black uppercase text-muted">Batch</span>
          <SearchableSelect
            options={getBatchList(isCompleted).map(b => ({ value: b.value, label: b.label }))}
            value={selectedYear}
            onChange={onYearChange}
          />
        </div>

        <div className="relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input
            type="text"
            placeholder="Search records..."
            className="pl-9 pr-4 py-2 bg-surface border border-border-subtle rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        {selectedRowsCount > 0 && (
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-2 rounded-xl bg-red-600 text-white px-4 py-2 text-xs font-black shadow-tactile hover:bg-red-700 transition-all animate-in zoom-in-95 duration-150"
          >
            <LuTrash2 size={14} />
            Delete Selected ({selectedRowsCount})
          </button>
        )}

        <label className="flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2 text-xs font-black shadow-tactile hover:bg-primary-dark cursor-pointer transition-all">
          <LuUpload size={14} />
          Import Excel/CSV
          <input
            id="file-import-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={onFileUpload}
          />
        </label>

        <button
          onClick={onExport}
          className="flex items-center gap-2 rounded-xl bg-surface border border-border-subtle px-4 py-2 text-xs font-black shadow-sm hover:bg-background transition-colors"
        >
          <LuDownload size={14} />
          Export Excel
        </button>
      </div>
    </div>
  );
}
