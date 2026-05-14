"use client";

import { useState, useEffect } from "react";
import { LuX, LuPlus, LuSave, LuBuilding2, LuGlobe, LuMail, LuPhone, LuUser } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const companySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(2, "Industry is required"),
  website: z.string().url("Please enter a valid URL").or(z.literal("")),
  logo_url: z.string().url("Please enter a valid URL").or(z.literal("")),
  hr_name: z.string().min(2, "HR name is required"),
  hr_email: z.string().email("Invalid email address"),
  hr_phone: z.string().min(10, "Invalid phone number"),
  status: z.enum(["active", "inactive"])
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  company?: any; // If present, we are in edit mode
}

export default function CompanyDialog({ isOpen, onClose, onSuccess, company }: CompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      industry: "",
      website: "",
      logo_url: "",
      hr_name: "",
      hr_email: "",
      hr_phone: "",
      status: "active"
    }
  });

  const status = watch("status");

  useEffect(() => {
    if (isOpen) {
      if (company) {
        reset({
          name: company.name || "",
          industry: company.industry || "",
          website: company.website || "",
          logo_url: company.logo_url || "",
          hr_name: company.hr_name || "",
          hr_email: company.hr_email || "",
          hr_phone: company.hr_phone || "",
          status: company.status?.toLowerCase() || "active"
        });
      } else {
        reset({
          name: "",
          industry: "",
          website: "",
          logo_url: "",
          hr_name: "",
          hr_email: "",
          hr_phone: "",
          status: "active"
        });
      }
    }
  }, [isOpen, company, reset]);

  const onFormSubmit = async (data: CompanyFormValues) => {
    setLoading(true);
    try {
      if (company) {
        await db.updateCompany(company.id, data);
        toast.success("Company updated successfully");
      } else {
        await db.createCompany(data);
        toast.success("New company registered successfully");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save company:", error);
      toast.error(error.message || "Error saving company");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-xl rounded-[32px] border border-border-subtle shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-background/50">
          <div>
            <h2 className="text-xl font-black tracking-tight">{company ? "Edit Company Profile" : "Register New Company"}</h2>
            <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">Corporate Partnership Management</p>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-background transition-colors shadow-sm"
          >
            <LuX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-8">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuBuilding2 size={12} className="text-primary" />
                  Company Name
                </label>
                <input 
                  {...register("name")}
                  type="text" 
                  placeholder="e.g. Google India"
                  className={cn(
                    "w-full px-4 py-3.5 rounded-2xl border bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                    errors.name ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                  )}
                />
                {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Corporate Industry Sector</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Technology", "Finance", "Consulting", "Healthcare", "Manufacturing", "E-commerce", "Automotive", "Education"].map(ind => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setValue("industry", ind)}
                      className={cn(
                        "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        watch("industry") === ind
                          ? "bg-primary text-white border-primary shadow-tactile"
                          : "bg-background text-muted border-border-subtle hover:border-primary/30"
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
                {errors.industry && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.industry.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuGlobe size={12} className="text-primary" />
                  Official Website
                </label>
                <input 
                  {...register("website")}
                  type="url" 
                  placeholder="https://company.com"
                  className={cn(
                    "w-full px-4 py-3.5 rounded-2xl border bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                    errors.website ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                  )}
                />
                {errors.website && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.website.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuBuilding2 size={12} className="text-primary" />
                  Logo URL
                </label>
                <input 
                  {...register("logo_url")}
                  type="url" 
                  placeholder="https://logo.com/icon.png"
                  className={cn(
                    "w-full px-4 py-3.5 rounded-2xl border bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                    errors.logo_url ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                  )}
                />
                {errors.logo_url && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.logo_url.message}</p>}
              </div>
            </div>

            {/* HR Contact */}
            <div className="p-6 rounded-3xl bg-background border border-border-subtle space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">HR Contact Details</p>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                  <LuUser size={12} />
                  Contact Person
                </label>
                <input 
                  {...register("hr_name")}
                  type="text" 
                  placeholder="HR Manager Name"
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl border bg-surface text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                    errors.hr_name ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                  )}
                />
                {errors.hr_name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.hr_name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                    <LuMail size={12} />
                    HR Email
                  </label>
                  <input 
                    {...register("hr_email")}
                    type="email" 
                    placeholder="hr@company.com"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border bg-surface text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                      errors.hr_email ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                    )}
                  />
                  {errors.hr_email && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.hr_email.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                    <LuPhone size={12} />
                    HR Phone
                  </label>
                  <input 
                    {...register("hr_phone")}
                    type="tel" 
                    placeholder="+91 98765 43210"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border bg-surface text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                      errors.hr_phone ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                    )}
                  />
                  {errors.hr_phone && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.hr_phone.message}</p>}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-background rounded-[24px] border border-border-subtle">
              <p className="text-xs font-black uppercase tracking-widest text-foreground/80">Partnership Status</p>
              <div className="flex gap-2">
                {["active", "inactive"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue("status", s as any)}
                    className={cn(
                      "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all",
                      status === s 
                        ? "bg-primary text-white border-primary shadow-sm" 
                        : "bg-surface text-muted border-border-subtle hover:bg-background"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-surface border-2 border-border-subtle text-sm font-black uppercase tracking-widest hover:bg-background transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
              ) : company ? (
                <>
                  <LuSave size={18} />
                  Update Profile
                </>
              ) : (
                <>
                  <LuPlus size={18} />
                  Add Company
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
