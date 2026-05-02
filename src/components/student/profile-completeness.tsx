import { LuTriangleAlert, LuArrowRight, LuCircleCheck } from "react-icons/lu";
import Link from "next/link";

interface ProfileCompletenessProps {
  percentage: number;
  missingItems: string[];
}

export function ProfileCompleteness({ percentage, missingItems }: ProfileCompletenessProps) {
  const isComplete = percentage === 100;

  return (
    <div className="app-card p-6 relative overflow-hidden group">
      <div className="flex flex-col gap-1.5 mb-6 relative z-10">
        <div className="flex items-center justify-between">
          <span className="section-label">Performance Metric</span>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {isComplete ? <LuCircleCheck size={22} /> : <LuTriangleAlert size={22} />}
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-3">
          <h3 className="font-display text-xl font-bold tracking-tight">Completeness</h3>
          <span className="font-display text-4xl font-black text-primary">{percentage}%</span>
        </div>
      </div>

      <div className="relative h-3 w-full rounded-full bg-background border border-border-subtle mb-6 overflow-hidden shadow-inner">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out rounded-full relative" 
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">Action Required for Approval:</p>
        <div className="grid gap-3">
          {missingItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2.5 bg-background/50 rounded-xl p-3 border border-border-subtle group-hover:bg-white transition-colors">
              <div className="h-5 w-5 rounded-md bg-primary/5 flex items-center justify-center text-primary">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <span className="text-[11px] font-bold text-foreground/80 uppercase tracking-tight">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <Link 
        href="/profile" 
        className="btn-primary mt-6 w-full py-3 text-sm group/btn"
      >
        <span>Improve Score</span>
        <LuArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
      </Link>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
    </div>
  );
}
