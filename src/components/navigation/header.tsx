"use client";

import { usePathname } from "next/navigation";
import { STUDENT_NAV_ITEMS } from "./nav-config";
import { LuSearch, LuBell, LuUser, LuShield } from "react-icons/lu";
import Link from "next/link";
import { TypographyToggle } from "./typography-toggle";

export function Header() {
  const pathname = usePathname();
  const currentItem = STUDENT_NAV_ITEMS.find((item) => item.href === pathname);
  const title = currentItem?.title || "Placely";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-background/80 backdrop-blur-md px-6 md:px-12 border-b border-border-subtle/50">
      {/* Mobile Logo */}
      <div className="flex items-center gap-1 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-10 w-10 flex items-center justify-center overflow-hidden">
            <img src="/placely.png" alt="Placely" className="h-full w-full object-contain" />
          </div>
          <span className="font-display text-lg font-black tracking-tight uppercase">Placely</span>
        </Link>
      </div>

      {/* Desktop Title & Toggle */}
      <div className="hidden md:flex items-center gap-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        
        {/* Role Toggle */}
        <div className="flex items-center bg-surface border border-border-subtle rounded-full p-1">
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-primary text-background shadow-sm"
          >
            <LuUser size={14} />
            Student
          </button>
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all text-muted hover:text-foreground hover:bg-black/5"
          >
            <LuShield size={14} />
            Admin
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-surface border border-border-subtle rounded-full px-4 py-2 hidden lg:flex group focus-within:border-primary transition-colors">
          <LuSearch size={18} className="text-muted group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search everything..." 
            className="bg-transparent border-none outline-none px-3 text-xs font-semibold w-40 placeholder:text-muted/60"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Role Toggle (Icon only) */}
          <Link 
            href="/admin/dashboard"
            className="md:hidden relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 transition-all group border border-border-subtle"
            title="Switch to Admin"
          >
            <LuShield size={18} className="text-primary" />
          </Link>

          <TypographyToggle />

          <button className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5 transition-all group">
            <LuBell size={22} className="text-foreground group-hover:text-primary transition-colors" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 bg-primary border-2 border-background rounded-full animate-pulse"></span>
          </button>
          
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border-subtle">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black uppercase tracking-tight leading-none">John Doe</p>
              <p className="text-[10px] font-bold text-primary uppercase mt-1">Student</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-display text-sm font-bold text-primary overflow-hidden">
              JD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
