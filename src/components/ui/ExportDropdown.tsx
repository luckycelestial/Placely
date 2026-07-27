"use client";

import { useState, useRef, useEffect } from "react";
import { LuDownload, LuFileSpreadsheet, LuFileText } from "react-icons/lu";

interface ExportDropdownProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  align?: "left" | "right";
  buttonText?: string;
  className?: string;
}

export function ExportDropdown({
  onExportExcel,
  onExportPDF,
  align = "right",
  buttonText = "Export",
  className = "",
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl bg-surface border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors cursor-pointer text-foreground"
      >
        <LuDownload size={16} />
        <span>{buttonText}</span>
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-48 rounded-2xl bg-surface border border-border-subtle shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150`}
        >
          <button
            type="button"
            onClick={() => {
              onExportExcel();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold hover:bg-background transition-colors text-foreground text-left cursor-pointer"
          >
            <LuFileSpreadsheet className="text-emerald-500" size={16} />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onExportPDF();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold hover:bg-background transition-colors text-foreground text-left cursor-pointer"
          >
            <LuFileText className="text-red-500" size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}
