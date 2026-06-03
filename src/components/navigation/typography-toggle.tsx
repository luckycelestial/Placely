"use client";

import { useState, useEffect } from "react";
import { LuType, LuCheck } from "react-icons/lu";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "default", name: "Timespent", class: "" },
  { id: "modern", name: "Geometric", class: "theme-modern" },
];

export function TypographyToggle() {
  const [currentTheme, setCurrentTheme] = useState("default");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("careerbridge-theme") || "default";
    setCurrentTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;

    const html = document.documentElement;
    THEMES.forEach(t => {
      if (t.class) html.classList.remove(t.class);
    });
    if (theme.class) html.classList.add(theme.class);
    
    localStorage.setItem("careerbridge-theme", themeId);
  };

  const handleSelect = (themeId: string) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border-subtle hover:bg-primary/5 hover:border-primary/20 transition-all shadow-sm group"
        title="Change Typography"
      >
        <LuType size={18} className="text-foreground group-hover:text-primary transition-colors" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-50" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-surface border border-border-subtle shadow-xl z-[60] py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-2 border-b border-border-subtle mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Typography</p>
            </div>
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-primary/5",
                  currentTheme === theme.id ? "text-primary" : "text-foreground"
                )}
              >
                {theme.name}
                {currentTheme === theme.id && <LuCheck size={16} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
