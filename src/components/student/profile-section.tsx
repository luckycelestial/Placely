import { cn } from "@/lib/utils";

interface ProfileSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function ProfileSection({ 
  title, 
  description, 
  children, 
  className,
  actions 
}: ProfileSectionProps) {
  return (
    <section className={cn("app-card overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border-subtle bg-background/30 px-8 py-6">
        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">{title}</h3>
          {description && <p className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-muted/60 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-8">
        {children}
      </div>
    </section>
  );
}
