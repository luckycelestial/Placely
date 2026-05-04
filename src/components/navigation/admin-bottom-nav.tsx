"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "./nav-config";
import { cn } from "@/lib/utils";

export function AdminBottomNav() {
  const pathname = usePathname();

  // Show only top 5 items for mobile to prevent overflow
  const mobileNavItems = ADMIN_NAV_ITEMS.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-surface px-2 md:hidden">
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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
            <span className="truncate max-w-[60px] text-center">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
