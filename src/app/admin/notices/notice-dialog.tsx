"use client";

import { useState, useEffect } from "react";
import {
  LuX, LuPlus, LuSave, LuBell, LuUsers, LuAlignLeft, LuClock, LuSend
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { getSettingByKey, DEFAULT_CUSTOM_GROUPS, type CustomGroup } from "@/services/settings";
import { CohortSelector } from '@/components/ui/CohortSelector';

export type Notice = {
  id: string;
  title: string;
  summary: string;
  audience: string;
  priority: "Urgent" | "Informational" | "Reminder";
  status: "Published" | "Scheduled" | "Draft";
  date: string;
  time: string;
  pinned?: boolean;
};

interface NoticeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notice: Notice) => void;
  notice?: Notice | null;
}

const PRIORITY_OPTIONS = ["Urgent", "Informational", "Reminder"] as const;
const STATUS_OPTIONS = ["Draft", "Scheduled", "Published"] as const;

export default function NoticeDialog({ isOpen, onClose, onSave, notice }: NoticeDialogProps) {
  const isEdit = !!notice;
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    summary: "",
    selectedCohorts: [] as string[],
    operator: "OR" as "AND" | "OR",
    customAudience: "",
    showCustomAudience: false,
    priority: "Informational" as Notice["priority"],
    status: "Draft" as Notice["status"],
    date: new Date().toISOString().split("T")[0],
    time: "10:00 AM",
  });
  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      try {
        const groups = await getSettingByKey<CustomGroup[]>('custom_groups', DEFAULT_CUSTOM_GROUPS);
        const deptsGroup = groups?.find(g => g.id === 'departments');
        const batchesGroup = groups?.find(g => g.id === 'batches');

        const depts = deptsGroup?.options || ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];
        const batches = batchesGroup?.options || [];

        const others: string[] = [];
        groups?.forEach(g => {
          if (g.id !== 'departments' && g.id !== 'batches' && g.options) {
            others.push(...g.options);
          }
        });

        if (notice) {
          const aud = notice.audience || "All Students";
          let isCustom = true;
          let cohortList: string[] = [];
          let opVal: "AND" | "OR" = "OR";

          if (aud === "All Students" || aud === "All Batches | All Groups") {
            isCustom = false;
            cohortList = [];
            opVal = "OR";
          } else if (aud.startsWith('{') && aud.endsWith('}')) {
            try {
              const parsed = JSON.parse(aud);
              cohortList = parsed.cohorts || [];
              opVal = parsed.operator || "OR";
              isCustom = false;
            } catch (e) {
              isCustom = true;
            }
          } else if (aud.includes(" | ")) {
            const parts = aud.split(" | ");
            const batchVal = parts[0]?.trim();
            const deptVal = parts[1]?.trim();
            
            if (batchVal && batchVal !== "All Batches") cohortList.push(batchVal);
            if (deptVal && deptVal !== "All Groups") cohortList.push(deptVal);
            opVal = "AND";
            isCustom = false;
          } else {
            const isBatch = batches.includes(aud);
            const isDept = depts.includes(aud);
            const isOther = others.includes(aud);
            if (isBatch || isDept || isOther) {
              cohortList = [aud];
              opVal = "OR";
              isCustom = false;
            }
          }

          setForm({
            title: notice.title,
            summary: notice.summary,
            selectedCohorts: cohortList,
            operator: opVal,
            customAudience: isCustom ? aud : "",
            showCustomAudience: isCustom,
            priority: notice.priority,
            status: notice.status,
            date: notice.date,
            time: notice.time,
          });
        } else {
          setForm({
            title: "",
            summary: "",
            selectedCohorts: [],
            operator: "OR",
            customAudience: "",
            showCustomAudience: false,
            priority: "Informational",
            status: "Draft",
            date: new Date().toISOString().split("T")[0],
            time: "10:00 AM",
          });
        }
      } catch (error) {
        console.error("Failed to load audience settings:", error);
      }
    };

    loadOptions();
  }, [isOpen, notice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.summary.trim()) { toast.error("Summary is required"); return; }

    setLoading(true);
    try {
      // Simulate async save
      await new Promise((r) => setTimeout(r, 400));
      
      const audienceValue = form.showCustomAudience 
        ? form.customAudience 
        : form.selectedCohorts.length === 0
          ? "All Students"
          : JSON.stringify({ operator: form.operator, cohorts: form.selectedCohorts });

      const saved: Notice = {
        id: notice?.id || `NOT${Date.now()}`,
        title: form.title,
        summary: form.summary,
        audience: audienceValue,
        priority: form.priority,
        status: form.status,
        date: form.date,
        time: form.time,
        pinned: notice?.pinned ?? false,
      };
      onSave(saved);
      toast.success(isEdit ? "Notice updated!" : "Notice created!");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-xl max-h-[90vh] rounded-[32px] border border-border-subtle shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-subtle flex items-center justify-between bg-background/50 shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight">{isEdit ? "Edit Notice" : "Create Notice"}</h2>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">
              {isEdit ? "Update notice details" : "Broadcast a new notice to students"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-background transition-colors shadow-sm"
          >
            <LuX size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-5 no-scrollbar">

            {/* Title */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                <LuBell size={12} className="text-primary" />
                Notice Title
              </label>
              <input
                type="text"
                placeholder="e.g. Google SWE Interview Schedule Released"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-5 py-4 rounded-2xl border border-border-subtle bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm"
              />
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                <LuAlignLeft size={12} className="text-primary" />
                Message / Summary
              </label>
              <textarea
                placeholder="Write the notice content..."
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                rows={4}
                className="w-full px-5 py-4 rounded-2xl border border-border-subtle bg-background text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all hover:border-primary/30 shadow-sm resize-none leading-relaxed"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Priority Level</label>
              <div className="flex gap-2 p-1.5 bg-background rounded-2xl border border-border-subtle">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priority: p }))}
                    className={cn(
                      "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      form.priority === p
                        ? p === "Urgent"
                          ? "bg-red-500 text-white shadow-sm"
                          : p === "Reminder"
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-blue-500 text-white shadow-sm"
                        : "text-muted hover:text-foreground hover:bg-surface/50"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

             {/* Target Audience */}
             <CohortSelector
               selectedCohorts={form.selectedCohorts}
               operator={form.operator}
               customAudience={form.customAudience}
               showCustomAudience={form.showCustomAudience}
               onChange={(data) => setForm(f => ({ ...f, ...data }))}
             />

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                  <LuClock size={12} className="text-primary" /> Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-4 rounded-2xl border border-border-subtle bg-background text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Time</label>
                <SearchableSelect
                  value={form.time}
                  onChange={(val) => setForm((f) => ({ ...f, time: val }))}
                  options={((): {value: string, label: string}[] => {
                    const preset = ["08:00 AM","09:00 AM","10:00 AM","10:30 AM","11:00 AM","12:00 PM","02:00 PM","03:00 PM","04:00 PM","04:15 PM","05:00 PM","06:00 PM"];
                    const times = preset.includes(form.time) ? preset : [...preset, form.time];
                    return times.map(t => ({ value: t, label: t }));
                  })()}
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Visibility</label>
              <div className="flex gap-2 p-1.5 bg-background rounded-2xl border border-border-subtle">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={cn(
                      "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      form.status === s
                        ? "bg-surface text-primary shadow-tactile border border-primary/10"
                        : "text-muted hover:text-foreground hover:bg-surface/50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-subtle bg-background/50 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl bg-surface border-2 border-border-subtle text-sm font-black uppercase tracking-widest hover:bg-background transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-3.5 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest shadow-tactile hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : isEdit ? (
                <><LuSave size={16} /> Update Notice</>
              ) : (
                <><LuSend size={16} /> {form.status === "Draft" ? "Save Draft" : "Publish Notice"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
