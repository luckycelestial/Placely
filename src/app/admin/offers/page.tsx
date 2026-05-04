"use client";

import { useState, useEffect } from "react";
import { 
  LuSearch, 
  LuFilter, 
  LuDownload, 
  LuCircleCheck, 
  LuCircleX, 
  LuClock, 
  LuCalendar, 
  LuBuilding2, 
  LuUser, 
  LuEllipsis, 
  LuTriangleAlert,
  LuMapPin,
  LuBriefcase,
  LuShieldCheck,
  LuArrowUpRight
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";

const FILTERS = ["All", "Pending", "Verified", "Joined", "Deferred", "Mismatch"];

export default function OffersPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    mismatch: 0
  });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await db.getOffers();
        const mappedOffers = data.map((offer: any) => {
          const student = Array.isArray(offer.students) ? offer.students[0] : offer.students;
          const user = Array.isArray(student?.users) ? student.users[0] : student?.users;
          const company = Array.isArray(offer.companies) ? offer.companies[0] : offer.companies;

          return {
            id: offer.id,
            studentName: user?.name || "Unknown",
            regNo: student?.register_number || "N/A",
            company: company?.name || "Unknown",
            role: offer.role_title,
            package: offer.package_ctc,
            status: offer.acceptance_status,
            joiningDate: offer.joining_date || "N/A",
            outcome: offer.offer_status,
            verification: offer.verification_status,
            avatar: (user?.name || "U").split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2)
          };
        });
        setOffers(mappedOffers);
        
        // Compute stats
        setStats({
          total: mappedOffers.length,
          verified: mappedOffers.filter((o: any) => ['verified', 'joined'].includes(o.verification)).length,
          pending: mappedOffers.filter((o: any) => o.verification === 'pending').length,
          mismatch: mappedOffers.filter((o: any) => o.verification === 'rejected').length
        });
      } catch (error) {
        console.error("Failed to fetch offers:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.studentName.toLowerCase().includes(search.toLowerCase()) || 
      offer.company.toLowerCase().includes(search.toLowerCase()) ||
      offer.regNo.toLowerCase().includes(search.toLowerCase());
    
    if (activeFilter === "All") return matchesSearch;
    return matchesSearch && offer.verification.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Offers & Joinees</h1>
          <p className="text-muted text-sm font-medium">Verify final outcomes and track the offer-to-joining lifecycle.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-white border border-border-subtle px-4 py-2 text-sm font-bold shadow-sm hover:bg-background transition-colors">
            <LuDownload size={16} />
            Export Final List
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-tactile hover:bg-primary-dark transition-all">
            Upload Bulk Results
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Offers", value: stats.total.toString(), color: "text-foreground" },
          { label: "Verified", value: stats.verified.toString(), color: "text-emerald-600" },
          { label: "Pending", value: stats.pending.toString(), color: "text-blue-600" },
          { label: "Mismatches", value: stats.mismatch.toString(), color: "text-red-600" }
        ].map((stat) => (
          <div key={stat.label} className="p-5 rounded-3xl border border-border-subtle bg-white shadow-soft">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-black", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-1 bg-background p-1 rounded-2xl w-fit border border-border-subtle overflow-x-auto no-scrollbar">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap",
                activeFilter === filter 
                  ? "bg-white text-primary shadow-sm" 
                  : "text-muted hover:text-foreground"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Search student or company..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border-subtle bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-3xl border border-border-subtle shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-background/50">
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Candidate</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Placement Details</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Package</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Verification</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted">Outcome</th>
                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-muted text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted font-bold text-sm">
                    Loading offers...
                  </td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted font-bold text-sm">
                    No offers found.
                  </td>
                </tr>
              ) : filteredOffers.map((offer) => (
                <tr key={offer.id} className="group hover:bg-primary/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                        {offer.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-none mb-1">{offer.studentName}</p>
                        <p className="text-muted text-[11px] font-medium uppercase tracking-wider">{offer.regNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <LuBuilding2 size={12} className="text-muted" />
                        <p className="text-sm font-bold text-foreground/80">{offer.company}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <LuBriefcase size={12} className="text-muted" />
                        <p className="text-[11px] font-medium text-muted uppercase tracking-wider">{offer.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-foreground/70">{offer.package}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {offer.verification === "verified" ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg">
                          <LuShieldCheck size={14} />
                          Verified
                        </span>
                      ) : offer.verification === "pending" ? (
                        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight text-orange-600 bg-orange-500/10 px-2 py-1 rounded-lg">
                          <LuClock size={14} />
                          Pending
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-tight text-red-600 bg-red-500/10 px-2 py-1 rounded-lg">
                          <LuTriangleAlert size={14} />
                          Mismatch
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className={cn(
                        "text-xs font-bold mb-1 uppercase tracking-wider",
                        offer.outcome === "accepted" ? "text-emerald-600" : 
                        offer.outcome === "issued" ? "text-blue-600" :
                        offer.outcome === "rejected" ? "text-red-600" : "text-muted"
                      )}>
                        {offer.outcome}
                      </p>
                      <div className="flex items-center gap-1.5 text-muted">
                        <LuCalendar size={10} />
                        <p className="text-[10px] font-black uppercase tracking-tighter">
                          {offer.joiningDate !== "N/A" ? `DOJ: ${offer.joiningDate}` : "No Date"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-border-subtle bg-white hover:border-primary/30 hover:text-primary transition-all shadow-sm">
                        <LuCircleCheck size={18} />
                      </button>
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-border-subtle bg-white hover:border-red-500/30 hover:text-red-600 transition-all shadow-sm">
                        <LuCircleX size={18} />
                      </button>
                      <button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors">
                        <LuEllipsis size={18} className="text-muted" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Audit Footnote */}
        <div className="px-6 py-4 border-t border-border-subtle bg-background/30">
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.1em] text-center">
            All outcome changes are logged for audit purposes. Data synchronized with College Super Admin.
          </p>
        </div>
      </div>
    </div>
  );
}

