"use client";

import { useEffect } from "react";

export function ThemeSync() {
  useEffect(() => {
    try {
      const savedDesign = localStorage.getItem("careerbridge-design") || "default";
      const savedTheme = localStorage.getItem("careerbridge-theme") || "default";
      const html = document.documentElement;

      html.classList.remove(
        "design-geometric",
        "design-hp",
        "design-sece",
        "design-executive",
        "theme-modern",
        "theme-technical",
        "theme-rubik",
        "theme-cambria"
      );

      if (savedDesign === "executive") {
        html.classList.add("design-executive");
      } else {
        html.classList.add("theme-default");
      }

      if (savedTheme && savedTheme !== "default") {
        html.classList.add(`theme-${savedTheme}`);
      }
    } catch {
      // Ignore localStorage unavailable errors
    }
  }, []);

  return null;
}
