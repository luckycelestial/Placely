"use client";

import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "./nav-config";
import { LuSearch, LuBell } from "react-icons/lu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TypographyToggle } from "./typography-toggle";
import { DesignToggle } from "./design-toggle";

export function AdminHeader() {
  const pathname = usePathname();
  const currentItem = ADMIN_NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));
  const title = currentItem?.title || "CareerBridge Admin";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-background/80 backdrop-blur-md px-6 md:px-12 border-b border-border-subtle/50">
      {/* Mobile Logo */}
      <div className="flex items-center gap-1 md:hidden">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 flex items-center justify-center overflow-hidden">
            <img src="/careerbridge.png" alt="CareerBridge" className="h-full w-full object-contain" />
          </div>
          <span className="font-display text-lg font-black tracking-tight uppercase">CareerBridge Admin</span>
        </Link>
      </div>

      {/* Desktop Title */}
      <div className="hidden md:flex items-center gap-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-surface border border-border-subtle rounded-full px-4 py-2 hidden lg:flex group focus-within:border-primary transition-colors">
          <LuSearch size={18} className="text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search students, drives..." 
            className="bg-transparent border-none outline-none px-3 text-xs font-semibold w-48 placeholder:text-muted/60"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* COMMENTED OUT: Design & Typography Toggles
          <DesignToggle />
          <TypographyToggle />
          */}

          <button className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 transition-all group">
            <LuBell size={22} className="text-foreground group-hover:text-primary transition-colors" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 bg-red-500 border-2 border-background rounded-full"></span>
          </button>
          
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border-subtle">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black uppercase tracking-tight leading-none">Admin User</p>
              <p className="text-[10px] font-bold text-primary uppercase mt-1 capitalize">Admin</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-display text-sm font-bold text-primary overflow-hidden">
              AU
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
