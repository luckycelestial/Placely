import { LuBuilding2, LuMapPin, LuCalendar, LuArrowRight } from "react-icons/lu";
import { SiGoogle, SiAtlassian } from "react-icons/si";
import { FaMicrosoft } from "react-icons/fa";
import Link from "next/link";

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

const MOCK_DRIVES: Drive[] = [
  {
    id: "1",
    companyName: "Google",
    role: "Software Engineer",
    location: "Bangalore",
    package: "24-30 LPA",
    deadline: "2 days left",
    icon: SiGoogle,
    color: "#4285F4",
  },
  {
    id: "2",
    companyName: "Microsoft",
    role: "Cloud Associate",
    location: "Hyderabad",
    package: "18-22 LPA",
    deadline: "5 days left",
    icon: FaMicrosoft,
    color: "#00A4EF",
  },
  {
    id: "3",
    companyName: "Atlassian",
    role: "Product Intern",
    location: "Remote",
    package: "80k / month",
    deadline: "Tomorrow",
    icon: SiAtlassian,
    color: "#0052CC",
  },
];

export function ActiveDrives() {
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
        {MOCK_DRIVES.map((drive) => {
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
                <Link href="/applications" className="btn-primary py-2.5 px-6 text-sm group/btn">
                  Apply Now
                  <LuArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
