"use client";

import { useState, useEffect, useCallback } from "react";
import { LuCheck, LuChevronDown, LuPalette } from "react-icons/lu";
import { cn } from "@/lib/utils";

const DESIGN_THEMES = [
  { id: "default", name: "Default Design", class: "" },
  { id: "executive", name: "Executive Navy (New)", class: "design-executive" },
];

export function DesignToggle() {
  const [currentDesign, setCurrentDesign] = useState("default");
  const [isOpen, setIsOpen] = useState(false);

  const applyDesign = useCallback((designId: string) => {
    const design = DESIGN_THEMES.find((d) => d.id === designId);
    if (!design) return;

    const html = document.documentElement;
    DESIGN_THEMES.forEach((d) => {
      if (d.class) html.classList.remove(d.class);
    });
    if (design.class) html.classList.add(design.class);

    localStorage.setItem("careerbridge-design", designId);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("careerbridge-design") || "default";
    setCurrentDesign(saved);
    applyDesign(saved);
  }, [applyDesign]);

  const handleSelect = (designId: string) => {
    setCurrentDesign(designId);
    applyDesign(designId);
    setIsOpen(false);
  };

  const currentTheme = DESIGN_THEMES.find((d) => d.id === currentDesign) || DESIGN_THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-border-subtle hover:bg-background text-xs font-bold text-foreground transition-all shadow-xs"
        title="Switch Design System"
      >
        <LuPalette size={14} className="text-primary shrink-0" />
        <span>{currentTheme.name}</span>
        <LuChevronDown size={12} className={cn("text-muted transition-transform shrink-0", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 rounded-xl bg-surface border border-border-subtle shadow-xl z-[60] py-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 border-b border-border-subtle/60 mb-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted">Design System Theme</p>
            </div>
            {DESIGN_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-xs font-bold transition-colors hover:bg-foreground/5",
                  currentDesign === theme.id ? "text-primary font-black bg-primary/5" : "text-foreground"
                )}
              >
                <span>{theme.name}</span>
                {currentDesign === theme.id && <LuCheck size={14} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
