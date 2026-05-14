"use client";

import { useState, useEffect } from "react";
import { LuX, LuPlus, LuSave, LuFileText, LuMapPin, LuDollarSign, LuBriefcase, LuGraduationCap, LuCircleAlert, LuHistory } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { db } from "@/services/database";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const templateSchema = z.object({
  name: z.string().min(2, "Template name must be at least 2 characters"),
  roleTitle: z.string().min(2, "Role title must be at least 2 characters"),
  driveType: z.enum(["Full-time", "Internship", "Contract"]),
  package: z.string().min(1, "Package details are required"),
  location: z.string().min(1, "Location is required"),
  minCgpa: z.number().min(0).max(10),
  backlogsAllowed: z.number().min(0),
  branches: z.array(z.string()).min(1, "Select at least one branch"),
  historyOfArrears: z.boolean()
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template?: any;
}

export default function TemplateDialog({ isOpen, onClose, onSuccess, template }: TemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      roleTitle: "",
      driveType: "Full-time",
      package: "",
      location: "",
      minCgpa: 6.0,
      backlogsAllowed: 0,
      branches: ["CSE", "ECE", "MECH"],
      historyOfArrears: false
    }
  });

  const driveType = watch("driveType");

  useEffect(() => {
    if (isOpen) {
      if (template) {
        reset({
          name: template.name || "",
          roleTitle: template.role_title || "",
          driveType: template.drive_type || "Full-time",
          package: template.package_ctc || "",
          location: template.location || "",
          minCgpa: template.eligibility_rules?.min_cgpa || 6.0,
          backlogsAllowed: template.eligibility_rules?.backlogs_allowed || 0,
          branches: template.eligibility_rules?.branches || ["CSE", "ECE", "MECH"],
          historyOfArrears: template.eligibility_rules?.history_of_arrears || false
        });
      } else {
        reset({
          name: "",
          roleTitle: "",
          driveType: "Full-time",
          package: "",
          location: "",
          minCgpa: 6.0,
          backlogsAllowed: 0,
          branches: ["CSE", "ECE", "MECH"],
          historyOfArrears: false
        });
      }
    }
  }, [isOpen, template, reset]);

  const onFormSubmit = async (data: TemplateFormValues) => {
    setLoading(true);
    try {
      const templateData = {
        name: data.name,
        role_title: data.roleTitle,
        drive_type: data.driveType,
        package_ctc: data.package,
        location: data.location,
        eligibility_rules: {
          min_cgpa: data.minCgpa,
          backlogs_allowed: data.backlogsAllowed,
          branches: data.branches,
          history_of_arrears: data.historyOfArrears
        }
      };

      if (template && template.id) {
        await db.updateTemplate(template.id, templateData);
        toast.success("Template updated successfully");
      } else {
        await db.createTemplate(templateData);
        toast.success("New template created successfully");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save template:", error);
      toast.error(error.message || "Error saving template");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-2xl rounded-[32px] border border-border-subtle shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-background/50">
          <div>
            <h2 className="text-xl font-black tracking-tight">{template ? "Edit Template" : "Create Drive Template"}</h2>
            <p className="text-xs font-bold text-muted uppercase tracking-widest mt-1">Standardize Recruitment Processes</p>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-background transition-colors shadow-sm"
          >
            <LuX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template Name */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                <LuFileText size={12} className="text-primary" />
                Template Identifier
              </label>
              <input 
                {...register("name")}
                type="text" 
                placeholder="e.g. Standard SDE-1 Hiring"
                className={cn(
                  "w-full px-4 py-3.5 rounded-2xl border bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                  errors.name ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                )}
              />
              {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.name.message}</p>}
            </div>

            {/* Role Title */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                <LuBriefcase size={12} className="text-primary" />
                Job Role Title
              </label>
              <input 
                {...register("roleTitle")}
                type="text" 
                placeholder="e.g. Software Engineer"
                className={cn(
                  "w-full px-4 py-3.5 rounded-2xl border bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                  errors.roleTitle ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                )}
              />
              {errors.roleTitle && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.roleTitle.message}</p>}
            </div>

            {/* Drive Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Drive Type</label>
              <div className="flex gap-2 p-1 bg-background rounded-2xl border border-border-subtle">
                {["Full-time", "Internship", "Contract"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue("driveType", type as any)}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      driveType === type ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Package */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                <LuDollarSign size={12} className="text-primary" />
                Package (CTC)
              </label>
              <input 
                {...register("package")}
                type="text" 
                placeholder="e.g. 12 - 15 LPA"
                className={cn(
                  "w-full px-4 py-3.5 rounded-2xl border bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                  errors.package ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                )}
              />
              {errors.package && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.package.message}</p>}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                <LuMapPin size={12} className="text-primary" />
                Work Location
              </label>
              <input 
                {...register("location")}
                type="text" 
                placeholder="e.g. Bangalore, KA"
                className={cn(
                  "w-full px-4 py-3.5 rounded-2xl border bg-background text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all",
                  errors.location ? "border-red-500 focus:ring-red-500/20" : "border-border-subtle"
                )}
              />
              {errors.location && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.location.message}</p>}
            </div>

            {/* Target Departments */}
            <div className="md:col-span-2 space-y-2 mt-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1 flex items-center gap-2">
                <LuGraduationCap size={12} className="text-primary" />
                Target Departments
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 p-4 bg-background rounded-[24px] border border-border-subtle shadow-sm">
                {["AI&DS", "AI&ML", "CSE", "CYS", "CSBS", "CCE", "ECE", "EEE", "MECH"].map(branch => {
                  const selectedBranches = watch("branches") || [];
                  return (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => {
                        const current = selectedBranches;
                        if (current.includes(branch)) {
                          setValue("branches", current.filter(b => b !== branch));
                        } else {
                          setValue("branches", [...current, branch]);
                        }
                      }}
                      className={cn(
                        "px-2 py-3 rounded-2xl text-[10px] font-black transition-all border flex flex-col items-center justify-center gap-2",
                        selectedBranches.includes(branch)
                          ? "bg-primary text-white border-primary shadow-tactile scale-[1.02]"
                          : "bg-surface text-muted border-border-subtle hover:border-primary/50 hover:text-primary"
                      )}
                    >
                      {branch}
                    </button>
                  );
                })}
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
              ) : template ? (
                <>
                  <LuSave size={18} />
                  Update Template
                </>
              ) : (
                <>
                  <LuPlus size={18} />
                  Save Template
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
