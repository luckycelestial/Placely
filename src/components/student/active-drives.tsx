import { LuBuilding2, LuMapPin, LuCalendar, LuArrowRight } from "react-icons/lu";
import { SiGoogle, SiAtlassian } from "react-icons/si";
import { FaMicrosoft, FaBuilding } from "react-icons/fa";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/services/database";

interface Drive {
  id: string;
  companyName: string;
  role: string;
  location: string;
  package: string;
  deadline: string;
  icon: any;
  color: string;
}

const ICON_MAP: Record<string, any> = {
  'Google': SiGoogle,
  'Microsoft': FaMicrosoft,
  'Atlassian': SiAtlassian,
  'default': FaBuilding
};

const COLOR_MAP: Record<string, string> = {
  'Google': '#4285F4',
  'Microsoft': '#00A4EF',
  'Atlassian': '#0052CC',
  'default': '#6366f1'
};

export function ActiveDrives() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDrives() {
      try {
        const data = await db.getDrives();
        const formatted = (data || []).map((d: any) => ({
          id: d.id,
          companyName: d.companies?.name || 'Unknown',
          role: d.role_title,
          location: d.location || 'Remote',
          package: d.package_ctc || 'N/A',
          deadline: d.application_end ? db.formatRelativeTime(d.application_end) : 'Ongoing',
          icon: ICON_MAP[d.companies?.name] || ICON_MAP.default,
          color: COLOR_MAP[d.companies?.name] || COLOR_MAP.default
        }));
        setDrives(formatted.slice(0, 3));
      } catch (error) {
        console.error("Failed to load drives:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDrives();
  }, []);

  if (loading) return (
    <div className="app-card p-12 text-center">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-bold text-muted mt-4 uppercase tracking-widest">Loading Opportunities...</p>
    </div>
  );

  return (
    <div className="app-card overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-background/30">
        <div>
          <h3 className="font-display text-xl font-bold tracking-tight">Active Drives</h3>
          <p className="text-[10px] font-bold text-muted mt-0.5 uppercase tracking-widest">Latest Opportunities</p>
        </div>
        <Link href="/drives" className="btn-secondary px-6 py-2 h-auto text-[10px] uppercase tracking-widest">
          View all
        </Link>
      </div>

      <div className="divide-y border-border-subtle">
        {drives.map((drive) => {
          const BrandIcon = drive.icon;
          return (
            <div key={drive.id} className="p-6 transition-all hover:bg-background/50 group relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div 
                    className="h-12 w-12 rounded-xl bg-surface border border-border-subtle flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                    style={{ color: drive.color }}
                  >
                    <BrandIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-display text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                      {drive.role}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 mt-2 font-bold uppercase text-[10px] tracking-widest text-muted">
                      <span className="flex items-center gap-1.5">
                        <LuBuilding2 size={14} className="text-primary/60" />
                        {drive.companyName}
                      </span>
                      <span className="flex items-center gap-1.5 border-l border-border-subtle pl-4">
                        <LuMapPin size={14} className="text-primary/60" />
                        {drive.location}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1.5">
                  <p className="font-display text-lg font-black text-foreground">{drive.package}</p>
                  <div className="flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                    <LuCalendar size={12} />
                    {drive.deadline}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Link href="/drives" className="btn-primary py-2.5 px-6 text-sm group/btn">
                  Apply Now
                  <LuArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
        {drives.length === 0 && (
          <div className="p-12 text-center text-muted italic text-sm">No active drives at the moment.</div>
        )}
      </div>
    </div>
  );
}

