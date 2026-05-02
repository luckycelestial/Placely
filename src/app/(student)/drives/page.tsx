"use client";

import { useState } from "react";
import { 
  LuBuilding2, 
  LuMapPin, 
  LuCalendar, 
  LuArrowRight, 
  LuSearch, 
  LuFilter,
  LuChevronDown,
  LuHeart,
  LuInfo,
  LuX,
  LuCircleCheck,
  LuTriangleAlert
} from "react-icons/lu";
import { 
  SiGoogle, 
  SiAtlassian, 
  SiUber, 
  SiAirbnb, 
  SiSpotify
} from "react-icons/si";
import { FaMicrosoft, FaAmazon } from "react-icons/fa";
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
  type: "Full-time" | "Internship";
  category: "Tech" | "Product" | "Design";
  isEligible: boolean;
  eligibilityReason?: string;
  description: string;
}

const ALL_DRIVES: Drive[] = [
  {
    id: "1",
    companyName: "Google",
    role: "Software Engineer",
    location: "Bangalore",
    package: "24-30 LPA",
    deadline: "2 days left",
    icon: SiGoogle,
    color: "#4285F4",
    type: "Full-time",
    category: "Tech",
    isEligible: true,
    description: "Join Google's Core Engineering team to build the next generation of search algorithms. You will be working on large-scale distributed systems and high-performance computing.",
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
    type: "Full-time",
    category: "Tech",
    isEligible: true,
    description: "Empower every person and every organization on the planet to achieve more. As a Cloud Associate, you will help customers migrate their workloads to Azure.",
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
    type: "Internship",
    category: "Product",
    isEligible: false,
    eligibilityReason: "Requires CGPA > 8.5 (Current: 8.2)",
    description: "Help us build the future of collaboration. You will work alongside product managers to define and ship features for Jira and Confluence.",
  },
  {
    id: "4",
    companyName: "Uber",
    role: "Backend Engineer",
    location: "Gurgaon",
    package: "22-26 LPA",
    deadline: "1 week left",
    icon: SiUber,
    color: "#000000",
    type: "Full-time",
    category: "Tech",
    isEligible: true,
    description: "Uber is looking for Backend Engineers to join our Mobility and Delivery teams. You will be responsible for building scalable services that power millions of rides daily.",
  },
  {
    id: "5",
    companyName: "Airbnb",
    role: "Frontend Engineer",
    location: "Remote",
    package: "28-32 LPA",
    deadline: "3 days left",
    icon: SiAirbnb,
    color: "#FF5A5F",
    type: "Full-time",
    category: "Tech",
    isEligible: true,
    description: "Create experiences that make people feel at home anywhere in the world. You will be working with React, TypeScript, and modern CSS to build beautiful UIs.",
  },
  {
    id: "6",
    companyName: "Spotify",
    role: "Product Designer",
    location: "Stockholm / Remote",
    package: "35-40 LPA",
    deadline: "Expired",
    icon: SiSpotify,
    color: "#1DB954",
    type: "Full-time",
    category: "Design",
    isEligible: true,
    description: "Design the future of audio. Join our design team to create seamless experiences for millions of listeners and creators worldwide.",
  },
  {
    id: "7",
    companyName: "Amazon",
    role: "SDE Intern",
    location: "Chennai",
    package: "60k / month",
    deadline: "4 days left",
    icon: FaAmazon,
    color: "#FF9900",
    type: "Internship",
    category: "Tech",
    isEligible: true,
    description: "Work on Earth's most customer-centric company. As an SDE Intern, you will be part of a team that builds and operates large-scale software systems.",
  },
];

export default function JobDrivesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [savedDrives, setSavedDrives] = useState<string[]>([]);
  const [selectedDrive, setSelectedDrive] = useState<Drive | null>(null);

  const filteredDrives = ALL_DRIVES.filter(drive => {
    const matchesSearch = drive.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         drive.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || drive.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedDrives(prev => 
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-10 py-10 px-4 max-w-[1400px] mx-auto min-h-screen relative">
      {/* Header Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-12 rounded-full bg-primary" />
          <span className="section-label text-primary">Opportunity Hub</span>
        </div>
        <h2 className="font-display text-5xl md:text-6xl font-black tracking-tighter text-foreground leading-tight">
          Job <span className="text-primary italic">Drives.</span>
        </h2>
        <p className="font-sans text-xl font-medium text-muted max-w-2xl leading-relaxed">
          Discover and apply to the most exclusive placement opportunities tailored for your profile.
        </p>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4">
        <div className="relative w-full md:w-96 group">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search companies or roles..." 
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-subtle bg-surface shadow-soft focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
          {["All", "Tech", "Product", "Design"].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCategory === category 
                  ? "bg-primary text-white shadow-tactile scale-105" 
                  : "bg-surface border border-border-subtle text-muted hover:border-primary hover:text-primary"
              }`}
            >
              {category}
            </button>
          ))}
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-surface border border-border-subtle text-[10px] font-black uppercase tracking-widest text-muted hover:border-primary hover:text-primary transition-all">
            <LuFilter size={14} />
            Filters
            <LuChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {filteredDrives.map((drive) => {
          const BrandIcon = drive.icon;
          const isExpired = drive.deadline === "Expired";
          const isSaved = savedDrives.includes(drive.id);
          
          return (
            <div 
              key={drive.id} 
              onClick={() => setSelectedDrive(drive)}
              className="app-card group relative flex flex-col h-full hover:border-primary/50 cursor-pointer transition-all hover:shadow-hover"
            >
              {/* Card Header */}
              <div className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div 
                    className="h-16 w-16 rounded-2xl bg-background border border-border-subtle flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"
                    style={{ color: drive.color }}
                  >
                    <BrandIcon size={32} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={(e) => toggleSave(drive.id, e)}
                      className={`h-10 w-10 rounded-full flex items-center justify-center border transition-all ${
                        isSaved ? "bg-red-50 border-red-200 text-red-500 shadow-sm" : "bg-surface border-border-subtle text-muted hover:border-red-200 hover:text-red-500"
                      }`}
                    >
                      <LuHeart size={18} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      drive.type === "Full-time" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                    }`}>
                      {drive.type}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${
                      drive.isEligible ? "text-primary" : "text-amber-500"
                    }`}>
                      {drive.isEligible ? (
                        <>
                          <LuCircleCheck size={12} />
                          Eligible
                        </>
                      ) : (
                        <>
                          <LuTriangleAlert size={12} />
                          Not Eligible
                        </>
                      )}
                    </div>
                  </div>
                  <h4 className="font-display text-2xl font-bold tracking-tight group-hover:text-primary transition-colors leading-tight">
                    {drive.role}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-sans text-sm font-bold text-muted">{drive.companyName}</span>
                    <span className="h-1 w-1 rounded-full bg-border-subtle" />
                    <span className="font-sans text-sm font-bold text-muted">{drive.category}</span>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="px-8 py-6 space-y-4 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted">
                    <LuMapPin size={16} className="text-primary/60" />
                    <span className="font-bold">{drive.location}</span>
                  </div>
                  <div className="font-display text-lg font-black text-foreground">{drive.package}</div>
                </div>

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                  <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                    isExpired ? "text-red-500" : "text-primary"
                  }`}>
                    <LuCalendar size={14} />
                    {drive.deadline}
                  </div>
                  {!isExpired && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                      124 Applied
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-background/30 border-t border-border-subtle group-hover:bg-primary/5 transition-colors">
                <Link href="/applications" className="w-full">
                  <button 
                    disabled={isExpired || !drive.isEligible}
                    className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${
                      isExpired || !drive.isEligible
                        ? "bg-border-subtle text-muted cursor-not-allowed" 
                        : "bg-surface border border-border-subtle group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-tactile"
                    }`}
                  >
                    {isExpired ? "Drive Closed" : !drive.isEligible ? "Ineligible" : "Apply to Drive"}
                    {!isExpired && drive.isEligible && <LuArrowRight size={18} />}
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDrives.length === 0 && (
        <div className="py-20 text-center">
          <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6">
            <LuSearch size={32} />
          </div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-foreground">No drives found</h3>
          <p className="text-muted mt-2 font-medium">Try adjusting your search or filters to find more opportunities.</p>
          <button 
            onClick={() => {setSearchQuery(""); setActiveCategory("All");}}
            className="mt-8 text-xs font-black uppercase tracking-widest text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Drive Detail Overlay */}
      {selectedDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelectedDrive(null)} />
          <div className="relative bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-8 border-b border-border-subtle flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div 
                  className="h-20 w-20 rounded-3xl bg-background border border-border-subtle flex items-center justify-center shadow-sm"
                  style={{ color: selectedDrive.color }}
                >
                  <selectedDrive.icon size={40} />
                </div>
                <div>
                  <h3 className="font-display text-3xl font-black tracking-tight">{selectedDrive.role}</h3>
                  <p className="font-sans text-xl font-bold text-muted">{selectedDrive.companyName}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDrive(null)}
                className="h-10 w-10 rounded-full bg-background border border-border-subtle flex items-center justify-center text-muted hover:text-primary transition-colors"
              >
                <LuX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-background border border-border-subtle">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Package</p>
                  <p className="font-display text-xl font-black text-primary">{selectedDrive.package}</p>
                </div>
                <div className="p-4 rounded-2xl bg-background border border-border-subtle">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Location</p>
                  <p className="font-display text-xl font-black">{selectedDrive.location}</p>
                </div>
              </div>

              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">About the Role</h5>
                <p className="font-sans text-lg text-foreground leading-relaxed">
                  {selectedDrive.description}
                </p>
              </div>

              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-muted mb-4">Eligibility Status</h5>
                <div className={`p-6 rounded-2xl border flex items-start gap-4 ${
                  selectedDrive.isEligible ? "bg-primary/5 border-primary/20" : "bg-amber-50 border-amber-200"
                }`}>
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    selectedDrive.isEligible ? "bg-primary text-white" : "bg-amber-500 text-white"
                  }`}>
                    {selectedDrive.isEligible ? <LuCircleCheck size={24} /> : <LuTriangleAlert size={24} />}
                  </div>
                  <div>
                    <p className={`font-display text-lg font-bold ${
                      selectedDrive.isEligible ? "text-primary" : "text-amber-700"
                    }`}>
                      {selectedDrive.isEligible ? "You are eligible to apply!" : "You are currently ineligible."}
                    </p>
                    {selectedDrive.eligibilityReason && (
                      <p className="text-sm font-medium text-muted mt-1">{selectedDrive.eligibilityReason}</p>
                    )}
                    <button className="text-[10px] font-black uppercase tracking-widest text-primary mt-4 flex items-center gap-2 hover:underline">
                      <LuInfo size={14} />
                      View detailed criteria
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-border-subtle bg-background/50 flex items-center gap-4">
              <button 
                onClick={(e) => toggleSave(selectedDrive.id, e)}
                className={`flex-1 py-4 rounded-2xl border font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                  savedDrives.includes(selectedDrive.id) 
                    ? "bg-red-50 border-red-200 text-red-500" 
                    : "bg-surface border-border-subtle text-muted hover:border-red-200 hover:text-red-500"
                }`}
              >
                <LuHeart size={18} fill={savedDrives.includes(selectedDrive.id) ? "currentColor" : "none"} />
                {savedDrives.includes(selectedDrive.id) ? "Saved to Profile" : "Save for Later"}
              </button>
              <Link href="/applications" className="flex-[2]">
                <button 
                  disabled={selectedDrive.deadline === "Expired" || !selectedDrive.isEligible}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-tactile transition-all ${
                    selectedDrive.deadline === "Expired" || !selectedDrive.isEligible
                      ? "bg-border-subtle text-muted cursor-not-allowed"
                      : "bg-primary text-white hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {selectedDrive.deadline === "Expired" ? "Drive Closed" : "Proceed to Apply"}
                  {selectedDrive.deadline !== "Expired" && selectedDrive.isEligible && <LuArrowRight size={20} />}
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
