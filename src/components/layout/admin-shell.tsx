"use client";

import { AdminSidebar } from "@/components/navigation/admin-sidebar";
import { AdminBottomNav } from "@/components/navigation/admin-bottom-nav";
import { AdminHeader } from "@/components/navigation/admin-header";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24 md:p-6 md:pb-6 scroll-smooth">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
        <AdminBottomNav />
      </div>
    </div>
  );
}
