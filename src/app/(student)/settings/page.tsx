"use client";

import { 
  LuSettings, 
  LuUser, 
  LuBell, 
  LuLock, 
  LuGlobe, 
  LuCircleHelp, 
  LuLogOut, 
  LuChevronRight,
  LuCircleCheck
} from "react-icons/lu";

export default function SettingsPage() {
  const SETTINGS_GROUPS = [
    {
      title: "Account",
      items: [
        { label: "Profile Information", icon: LuUser, description: "Update your personal and academic details" },
        { label: "Password & Security", icon: LuLock, description: "Change your password and manage sessions" },
        { label: "Notification Preferences", icon: LuBell, description: "Choose how you want to be notified" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { label: "Language & Region", icon: LuGlobe, description: "Set your preferred language and time zone" },
        { label: "Accessibility", icon: LuCircleCheck, description: "Customize your visual and interaction experience" },
      ]
    },
    {
      title: "Support",
      items: [
        { label: "Help Center", icon: LuCircleHelp, description: "Find answers and contact support" },
        { label: "Sign Out", icon: LuLogOut, description: "Safely exit your current session", color: "text-red-500" },
      ]
    }
  ];

  return (
    <div className="space-y-10 py-10 px-4 max-w-[1000px] mx-auto">
      {/* Header Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-12 rounded-full bg-primary" />
          <span className="section-label text-primary">System Parameters</span>
        </div>
        <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
          System <span className="text-primary italic">Settings.</span>
        </h2>
        <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed">
          Customize your experience, manage your account security, and configure notification protocols.
        </p>
      </section>

      {/* Settings Grid */}
      <div className="space-y-12">
        {SETTINGS_GROUPS.map((group, i) => (
          <div key={i} className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted ml-2">{group.title}</h3>
            <div className="app-card overflow-hidden divide-y border-border-subtle">
              {group.items.map((item, j) => {
                const Icon = item.icon;
                return (
                  <div key={j} className="p-8 hover:bg-background/50 transition-all group flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-6">
                      <div className={`h-12 w-12 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-primary/30 ${item.color || "text-muted group-hover:text-primary"}`}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <h4 className={`font-display text-lg font-bold tracking-tight transition-colors ${item.color || "group-hover:text-primary"}`}>
                          {item.label}
                        </h4>
                        <p className="text-sm font-medium text-muted mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <LuChevronRight size={20} className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-10 text-center border-t border-border-subtle">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted/40">
          Placely v1.2.0 • Build 2026.05.02
        </p>
      </div>
    </div>
  );
}
