import { cn } from "@/lib/utils";
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: import("react-icons").IconType; 
  trend?: {
    value: string;
    isUp: boolean;
  };
  description?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description,
  className 
}: StatCardProps) {
  return (
    <div className={cn(
      "app-card p-6 group relative overflow-hidden",
      className
    )}>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <span className="section-label mb-1.5 block">{title}</span>
          <h3 className="font-display text-3xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">{value}</h3>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background border border-border-subtle text-primary transition-all group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20">
          <Icon size={22} />
        </div>
      </div>
      
      {(trend || description) && (
        <div className="mt-6 flex items-center gap-3 relative z-10">
          {trend && (
            <span className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
              trend.isUp ? "bg-emerald-50 text-emerald-600" : "bg-primary/5 text-primary"
            )}>
              {trend.isUp ? (
                <LuTrendingUp size={12} />
              ) : (
                <LuTrendingDown size={12} />
              )} 
              {trend.value}
            </span>
          )}
          {description && (
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{description}</p>
          )}
        </div>
      )}

      {/* Decorative Gradient */}
      <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
    </div>
  );
}
