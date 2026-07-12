"use client";

import { useState } from "react";
import { LuX } from "react-icons/lu";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

interface Option {
  value: string;
  label: string;
}

interface BroadcastModalProps {
  onClose: () => void;
  onBroadcast: (data: {
    title: string;
    category: string;
    description: string;
    priority: "Urgent" | "Reminder" | "Informational";
    batch: string;
    group: string;
  }) => Promise<void>;
  categoryOptions: Option[];
  priorityOptions: Option[];
  batchOptions: Option[];
  groupOptions: Option[];
}

export function BroadcastModal({
  onClose,
  onBroadcast,
  categoryOptions,
  priorityOptions,
  batchOptions,
  groupOptions
}: BroadcastModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Academic Proof");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Urgent" | "Reminder" | "Informational">("Informational");
  const [batch, setBatch] = useState("All Batches");
  const [group, setGroup] = useState("All Groups");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onBroadcast({
        title,
        category,
        description,
        priority,
        batch,
        group
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-background border border-border-subtle p-8 rounded-[32px] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-muted hover:text-foreground cursor-pointer"
        >
          <LuX size={20} />
        </button>
        <h3 className="font-display text-2xl font-black tracking-tight mb-6">Broadcast Upload Notice</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Requested Document Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 12th Marksheet, PAN Card"
              required
              className="w-full h-14 bg-surface border border-border-subtle rounded-2xl px-5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Category Type</label>
            <SearchableSelect 
              options={categoryOptions}
              value={category} 
              onChange={(val) => setCategory(val)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Description / Instructions</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details or guidelines for students..."
              required
              rows={3}
              className="w-full bg-surface border border-border-subtle rounded-2xl p-5 text-sm font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Priority</label>
              <SearchableSelect 
                options={priorityOptions}
                value={priority} 
                onChange={(val) => setPriority(val as any)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted">Target Batch</label>
              <SearchableSelect 
                options={batchOptions}
                value={batch} 
                onChange={(val) => setBatch(val)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Target Group / Domain</label>
            <SearchableSelect 
              options={groupOptions}
              value={group} 
              onChange={(val) => setGroup(val)}
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-border-subtle/50">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 h-14 bg-surface hover:bg-surface-hover text-muted text-xs font-black uppercase tracking-widest rounded-2xl border border-border-subtle cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="flex-1 h-14 btn-primary text-xs uppercase tracking-widest rounded-2xl cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? "Broadcasting..." : "Broadcast"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
