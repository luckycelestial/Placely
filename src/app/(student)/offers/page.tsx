"use client";

import { useState } from "react";
import { 
  LuBuilding2, 
  LuCircleCheck, 
  LuArrowRight, 
  LuShieldCheck, 
  LuMapPin,
  LuSparkles,
  LuInfo,
  LuPartyPopper,
  LuChevronRight,
  LuTimer,
  LuClock,
  LuCalendar
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Offer {
  id: string;
  company: string;
  role: string;
  ctc: string;
  location: string;
  offerDate: string;
  joiningDate: string;
  status: "Offered" | "Accepted" | "Verified" | "Joining Soon" | "Joined";
  type: "Full Time" | "Internship" | "PPO";
  description: string;
  actionsRequired: string[];
}

const OFFERS: Offer[] = [
  {
    id: "1",
    company: "Microsoft",
    role: "Cloud Software Engineer",
    ctc: "42.5 LPA",
    location: "Hyderabad, India",
    offerDate: "Oct 12, 2025",
    joiningDate: "July 15, 2026",
    status: "Accepted",
    type: "Full Time",
    description: "Cloud + AI Division. Working on Azure Core compute services and distributed systems scaling.",
    actionsRequired: ["Upload Medical Certificate", "Verify ID Proofs"]
  },
  {
    id: "2",
    company: "Google",
    role: "Associate Product Manager",
    ctc: "36.0 LPA",
    location: "Bangalore, India",
    offerDate: "Oct 28, 2025",
    joiningDate: "August 01, 2026",
    status: "Offered",
    type: "Full Time",
    description: "Joining the Google Search team to work on next-gen AI search experiences.",
    actionsRequired: ["Accept Offer", "Choose Joining Date Slot"]
  }
];

export default function OffersJoiningPage() {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(OFFERS[0]);

  return (
    <div className="space-y-12 py-10 px-4 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-12 rounded-full bg-primary" />
          <span className="section-label text-primary">The Finish Line</span>
        </div>
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div>
            <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
              Offers & <span className="text-primary italic">Joining.</span>
            </h2>
            <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed mt-2">
              The culmination of your hard work. Manage your official offers, track verification, and prepare for your day one.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-surface border border-border-subtle p-4 rounded-2xl shadow-xl shadow-black/5">
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <LuPartyPopper size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Placement Status</p>
              <p className="font-display text-lg font-black text-foreground">Successfully Placed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Offer Cards */}
        <div className="xl:col-span-5 space-y-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Your Active Offers</h3>
          {OFFERS.map((offer) => (
            <div 
              key={offer.id}
              onClick={() => setSelectedOffer(offer)}
              className={cn(
                "app-card group cursor-pointer transition-all relative overflow-hidden",
                selectedOffer?.id === offer.id 
                  ? "border-primary shadow-2xl shadow-primary/5 ring-4 ring-primary/5" 
                  : "hover:border-primary/40"
              )}
            >
              {selectedOffer?.id === offer.id && (
                <div className="absolute top-0 right-0 p-6">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                </div>
              )}
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-foreground text-white flex items-center justify-center shadow-tactile group-hover:scale-105 transition-transform">
                    <LuBuilding2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-display text-2xl font-black tracking-tight">{offer.company}</h4>
                    <p className="font-sans text-sm font-semibold text-muted/60 uppercase tracking-widest">{offer.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-surface border border-border-subtle p-4 rounded-2xl">
                     <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Package</p>
                     <p className="font-display text-lg font-black text-primary">{offer.ctc}</p>
                   </div>
                   <div className="bg-surface border border-border-subtle p-4 rounded-2xl">
                     <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1">Location</p>
                     <p className="font-display text-lg font-black text-foreground truncate">{offer.location.split(',')[0]}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
                   <StatusBadge status={offer.status} />
                   <div className="flex items-center gap-2 text-[10px] font-black text-muted/40 uppercase tracking-widest">
                     Day One: {offer.joiningDate.split(',')[0]}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Offer Lifecycle & Actions */}
        {selectedOffer && (
          <div className="xl:col-span-7 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="app-card border-none bg-foreground text-white overflow-hidden shadow-2xl shadow-black/20">
              <div className="p-10 relative">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary-light border border-primary/30 text-[10px] font-black uppercase tracking-widest">
                      {selectedOffer.type}
                    </span>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Issued {selectedOffer.offerDate}</span>
                  </div>
                  <h3 className="font-display text-4xl md:text-5xl font-black tracking-tighter mb-4">
                    Full Details & <span className="text-primary italic">Roadmap.</span>
                  </h3>
                  <p className="font-sans text-lg text-white/60 leading-relaxed max-w-xl">
                    {selectedOffer.description}
                  </p>
                </div>
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-t border-white/10 divide-white/10">
                 <div className="p-8">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                     <LuTimer className="text-primary" />
                     The Milestone Track
                   </h5>
                   <div className="space-y-6">
                      <Milestone icon={<LuPartyPopper />} label="Offer Released" date={selectedOffer.offerDate} completed />
                      <Milestone icon={<LuCircleCheck />} label="Candidate Acceptance" date="In Progress" active={selectedOffer.status === "Offered"} completed={selectedOffer.status !== "Offered"} />
                      <Milestone icon={<LuShieldCheck />} label="Verification Complete" date="Pending" />
                      <Milestone icon={<LuMapPin />} label="Joining Day" date={selectedOffer.joiningDate} />
                   </div>
                 </div>
                 <div className="p-8 bg-white/[0.02]">
                   <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                     <LuSparkles className="text-primary" />
                     Immediate Actions
                   </h5>
                   <div className="space-y-4">
                      {selectedOffer.actionsRequired.map((action, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group/action cursor-pointer">
                          <span className="font-sans text-sm font-bold text-white/80">{action}</span>
                          <LuChevronRight size={18} className="text-white/20 group-hover/action:text-primary transition-all translate-x-0 group-hover/action:translate-x-1" />
                        </div>
                      ))}
                      {selectedOffer.status === "Offered" && (
                        <Link href="/dashboard" className="block w-full">
                          <button className="btn-primary w-full py-5 rounded-2xl mt-4 shadow-xl shadow-primary/20">
                            Sign & Accept Offer
                            <LuArrowRight size={20} />
                          </button>
                        </Link>
                      )}
                   </div>
                 </div>
              </div>
            </div>

            {/* Support Box */}
            <div className="bg-surface border border-border-subtle p-8 rounded-3xl flex items-center justify-between gap-6">
              <div className="flex gap-6 items-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                  <LuInfo size={32} />
                </div>
                <div>
                  <h6 className="font-display text-xl font-black">Offer Mismatch?</h6>
                  <p className="font-sans text-sm font-medium text-muted mt-1">If the details don&apos;t match your expectations or there is a discrepancy, contact our placement desk.</p>
                </div>
              </div>
              <button className="btn-secondary whitespace-nowrap px-6 py-4 h-auto text-[9px] uppercase tracking-widest">
                Raise Query
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Milestone({ icon, label, date, completed = false, active = false }: { icon: React.ReactNode, label: string, date: string, completed?: boolean, active?: boolean }) {
  return (
    <div className="flex items-center gap-4 group/ms">
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center border transition-all",
        completed ? "bg-primary border-primary text-white" : 
        active ? "bg-primary/20 border-primary text-primary" :
        "bg-white/5 border-white/10 text-white/20"
      )}>
        {icon}
      </div>
      <div>
        <p className={cn("text-[11px] font-black tracking-tight", completed || active ? "text-white" : "text-white/20")}>{label}</p>
        <p className={cn("text-[10px] font-semibold", completed ? "text-primary-light" : "text-white/40")}>{date}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string, icon: import("react-icons").IconType }> = {
    "Offered": { color: "text-amber-500 bg-amber-50", icon: LuClock },
    "Accepted": { color: "text-primary bg-primary/10", icon: LuCircleCheck },
    "Verified": { color: "text-emerald-500 bg-emerald-50", icon: LuShieldCheck },
    "Joining Soon": { color: "text-blue-500 bg-blue-50", icon: LuCalendar },
    "Joined": { color: "text-purple-500 bg-purple-50", icon: LuPartyPopper },
  };

  const config = configs[status] || configs["Offered"];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-[10px] font-black uppercase tracking-widest",
      config.color
    )}>
      <Icon size={14} />
      {status}
    </div>
  );
}
