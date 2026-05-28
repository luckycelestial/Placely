"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STUDENT_NAV_ITEMS } from "./nav-config";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav suppressHydrationWarning className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-surface px-2 md:hidden">
      {STUDENT_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted hover:text-foreground"
            )}
          >
            <item.icon size={22} className={cn(isActive && "animate-in fade-in zoom-in duration-300")} />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
