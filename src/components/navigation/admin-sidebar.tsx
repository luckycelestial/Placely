"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "./nav-config";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[80px] flex-col md:flex sticky top-0 z-50 shrink-0 relative">
      <div className="absolute top-0 left-0 h-full w-[80px] hover:w-[260px] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] border-r border-border-subtle bg-surface flex flex-col py-8 overflow-hidden shadow-sm hover:shadow-2xl group">
        
        {/* Header / Logo */}
        <div className="mb-6 px-3 flex items-center min-w-[260px]">
          <Link href="/admin/dashboard" className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden">
              <img src="/careerbridge.png" alt="CareerBridge" className="h-full w-full object-contain" />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              <span className="font-display text-xl font-black tracking-tight text-foreground block leading-none">CareerBridge</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Admin Console</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 min-w-[260px]">
          <div className="mb-6 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="section-label text-xs font-bold text-muted uppercase tracking-wider">Management</p>
          </div>
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-xl p-2.5 text-sm font-semibold transition-all hover:bg-primary/5 hover:text-primary relative overflow-hidden",
                  isActive ? "bg-primary/10 text-primary" : "text-foreground"
                )}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <Icon 
                    size={20} 
                    className={cn(
                      "transition-all duration-300",
                      isActive ? "scale-110 text-primary" : "group-hover:text-primary text-muted"
                    )} 
                  />
                </div>
                <span className="ml-4 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-bold">
                  {item.title}
                </span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Support Section */}
        <div className="mt-auto mx-4 rounded-2xl bg-background p-5 border border-border-subtle relative overflow-hidden min-w-[228px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative z-10 flex flex-col items-center justify-center min-h-[100px] gap-1.5 text-center">
            <p className="font-display text-sm font-bold text-foreground">Admin Support</p>
            <p className="text-[11px] text-muted leading-relaxed mb-2">Need help with operations?</p>
            <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline w-full">
              Contact Devs
            </button>
          </div>
          <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
        </div>
      </div>
    </aside>
  );
}
