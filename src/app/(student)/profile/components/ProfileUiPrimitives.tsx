"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LuArrowRight } from "react-icons/lu";

export function Chip({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all",
        highlight
          ? "bg-primary/10 border-primary/20 text-primary"
          : "bg-surface border-border-subtle text-foreground"
      )}
    >
      <Icon size={14} className={highlight ? "text-primary" : "text-muted"} />
      {label && <span className="text-[10px] text-muted uppercase tracking-widest font-black">{label}</span>}
      <span>{value}</span>
    </div>
  );
}

export function HeaderDetailItem({
  value,
  icon: Icon,
}: {
  value: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-4 bg-surface/50 border border-border-subtle p-4 rounded-2xl w-full lg:min-w-[340px] shadow-sm hover:shadow-md transition-shadow">
      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0">
        <Icon size={20} />
      </div>
      <div className="text-sm font-bold text-foreground truncate w-full">{value}</div>
    </div>
  );
}

export function ScoreCard({
  label,
  value,
  unit,
  optional,
}: {
  label: string;
  value?: number | null;
  unit: string;
  optional?: boolean;
}) {
  const hasValue = value !== null && value !== undefined && value > 0;
  return (
    <div
      className={cn(
        "p-5 rounded-3xl border flex flex-col gap-2 transition-all",
        hasValue ? "bg-background border-border-subtle" : "bg-background/50 border-dashed border-border-subtle"
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-muted">
        {label}
        {optional && " (Optional)"}
      </p>
      {hasValue ? (
        <p className="font-display text-3xl font-black text-foreground">
          {value}
          <span className="text-sm text-muted font-bold ml-1">{unit}</span>
        </p>
      ) : (
        <p className="font-display text-xl font-bold text-muted/30">—</p>
      )}
    </div>
  );
}

export function DetailItem({
  value,
  icon: Icon,
}: {
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex items-center gap-4 group bg-background/50 rounded-3xl p-5 border border-border-subtle hover:border-primary transition-all">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all flex-shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-lg font-display font-bold tracking-tight text-foreground break-words whitespace-normal">
          {value}
        </p>
      </div>
    </div>
  );
}

export function LinkCard({
  title,
  url,
  icon: Icon,
  color,
}: {
  title: string;
  url: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}) {
  const isPlaceholder = url.includes("—") || url.length < 5;
  return (
    <a
      href={isPlaceholder ? undefined : `https://${url.replace(/^https?:\/\//, "")}`}
      target={isPlaceholder ? undefined : "_blank"}
      rel="noreferrer"
      className={cn(
        "flex items-center justify-between p-6 rounded-3xl bg-background border border-border-subtle hover:border-primary hover:bg-surface hover:shadow-xl hover:shadow-black/5 transition-all group",
        isPlaceholder && "opacity-50 cursor-default"
      )}
    >
      <div className="flex items-center gap-5">
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center border border-border-subtle group-hover:border-transparent transition-all"
          style={{ color }}
        >
          <Icon size={28} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-display text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
            {title}
          </p>
          <p className="font-sans text-xs font-semibold text-muted/60 lowercase">{url}</p>
        </div>
      </div>
      {!isPlaceholder && (
        <div className="h-10 w-10 rounded-full border border-border-subtle flex items-center justify-center text-muted group-hover:text-primary group-hover:border-primary transition-all">
          <LuArrowRight size={20} />
        </div>
      )}
    </a>
  );
}
