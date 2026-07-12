"use client";

import { useState, useEffect } from "react";
import { LuCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";

const DESIGN_THEMES = [
  { id: "default", name: "Timespent", class: "" },
  { id: "geometric", name: "Geometric", class: "design-geometric" },
  { id: "hp", name: "HP Enterprise", class: "design-hp" },
  { id: "sece", name: "SECE Academic", class: "design-sece" },
];

const DIcon = ({ className }: { className?: string }) => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 4h6a8 8 0 0 1 0 16H4V4z" />
  </svg>
);

export function DesignToggle() {
  const [currentDesign, setCurrentDesign] = useState("default");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("careerbridge-design") || "default";
    setCurrentDesign(saved);
    applyDesign(saved);
  }, []);

  const applyDesign = (designId: string) => {
    const design = DESIGN_THEMES.find(d => d.id === designId);
    if (!design) return;

    const html = document.documentElement;
    DESIGN_THEMES.forEach(d => {
      if (d.class) html.classList.remove(d.class);
    });
    if (design.class) html.classList.add(design.class);
    
    localStorage.setItem("careerbridge-design", designId);
  };

  const handleSelect = (designId: string) => {
    setCurrentDesign(designId);
    applyDesign(designId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border-subtle hover:bg-primary/5 hover:border-primary/20 transition-all shadow-sm group"
        title="Change Design System"
      >
        <DIcon className="text-foreground group-hover:text-primary transition-colors" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-surface border border-border-subtle shadow-xl z-[60] py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-2 border-b border-border-subtle mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Design System</p>
            </div>
            {DESIGN_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-primary/5",
                  currentDesign === theme.id ? "text-primary" : "text-foreground"
                )}
              >
                {theme.name}
                {currentDesign === theme.id && <LuCheck size={16} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
