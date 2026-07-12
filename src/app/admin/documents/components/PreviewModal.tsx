"use client";

import { LuX, LuCircleAlert, LuExternalLink } from "react-icons/lu";
import { cn } from "@/lib/utils";

interface PreviewDocInfo {
  title: string;
  type: string;
  url: string;
  studentName: string;
  studentRegisterNumber: string;
  submissionId: string;
  status: "Completed" | "Pending" | "Rejected" | "Not Provided";
}

interface PreviewModalProps {
  previewDoc: PreviewDocInfo;
  onClose: () => void;
  onUpdateStatus: (submissionId: string, status: "Completed" | "Rejected") => Promise<void>;
}

function getGoogleDrivePreviewUrl(url: string): string | null {
  if (!url) return null;
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
  }
  const docIdMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docIdMatch && docIdMatch[1]) {
    return `https://docs.google.com/document/d/${docIdMatch[1]}/preview`;
  }
  const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetIdMatch && sheetIdMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/preview`;
  }
  const presIdMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (presIdMatch && presIdMatch[1]) {
    return `https://docs.google.com/presentation/d/${presIdMatch[1]}/preview`;
  }
  return null;
}

export function PreviewModal({ previewDoc, onClose, onUpdateStatus }: PreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-background border border-border-subtle p-8 rounded-[32px] w-full max-w-4xl shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-muted hover:text-foreground cursor-pointer z-10"
        >
          <LuX size={20} />
        </button>
        
        <div className="mb-6 pr-10">
          <h3 className="font-display text-2xl font-black tracking-tight mb-1">{previewDoc.title}</h3>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
            Submitted by {previewDoc.studentName} ({previewDoc.studentRegisterNumber}) • {previewDoc.type}
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border-subtle overflow-hidden relative">
          {getGoogleDrivePreviewUrl(previewDoc.url) ? (
            <iframe 
              src={getGoogleDrivePreviewUrl(previewDoc.url)!} 
              className="w-full h-[550px] border-0" 
              allow="autoplay"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center space-y-6">
              <div className="h-16 w-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center">
                <LuCircleAlert size={32} />
              </div>
              <div className="space-y-2">
                <h5 className="font-display text-xl font-bold">No Direct Preview Available</h5>
                <p className="text-sm font-semibold text-muted max-w-sm">This link structure does not support inline embedding, or is formatted incorrectly.</p>
              </div>
              <a 
                href={previewDoc.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-primary flex items-center gap-2 px-6"
              >
                Open Link in Google Drive <LuExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-subtle/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateStatus(previewDoc.submissionId, "Completed")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                previewDoc.status === "Completed"
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white"
              )}
            >
              Approve
            </button>
            <button
              onClick={() => onUpdateStatus(previewDoc.submissionId, "Rejected")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border",
                previewDoc.status === "Rejected"
                  ? "bg-red-500 border-red-500 text-white"
                  : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
              )}
            >
              Reject
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href={previewDoc.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1.5"
            >
              Open in New Tab <LuExternalLink size={14} />
            </a>
            <button 
              onClick={onClose}
              className="bg-surface hover:bg-surface-hover text-muted text-xs font-black uppercase tracking-widest rounded-2xl border border-border-subtle px-6 py-3 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
