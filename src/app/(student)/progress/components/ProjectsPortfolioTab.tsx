"use client";

import React from "react";
import {
  LuFolder,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuGithub,
  LuExternalLink,
} from "react-icons/lu";

interface ProjectsPortfolioTabProps {
  projects: any[];
  onOpenProjectModal: (proj?: any) => void;
  onSetDeletingProjectId: (id: string) => void;
}

export function ProjectsPortfolioTab({
  projects,
  onOpenProjectModal,
  onSetDeletingProjectId,
}: ProjectsPortfolioTabProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-3xl font-black tracking-tight">
            Project <span className="text-primary">Showcase.</span>
          </h3>
          <p className="text-sm font-medium text-muted mt-1">
            Manage, CRUD, and showcase your developer projects here.
          </p>
        </div>
        <button
          onClick={() => onOpenProjectModal()}
          className="btn-primary py-3 px-6 text-xs font-black uppercase tracking-widest rounded-xl flex items-center gap-2 cursor-pointer"
        >
          <LuPlus size={16} />
          Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="app-card p-6 flex flex-col justify-between relative group border hover:border-primary/20"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h4 className="font-display text-xl font-bold tracking-tight text-foreground truncate max-w-[80%]">
                  {proj.title}
                </h4>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onOpenProjectModal(proj)}
                    className="p-2 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-colors cursor-pointer"
                    title="Edit Project"
                  >
                    <LuPencil size={14} />
                  </button>
                  <button
                    onClick={() => onSetDeletingProjectId(proj.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors cursor-pointer"
                    title="Delete Project"
                  >
                    <LuTrash2 size={14} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted font-medium line-clamp-3 leading-relaxed">
                {proj.description || "No description provided."}
              </p>

              {proj.technologies && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {proj.technologies.split(",").map((tech: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 rounded bg-primary/5 text-primary text-[9px] font-black uppercase tracking-wider"
                    >
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 mt-6 border-t border-border-subtle/50">
              {proj.github_url && (
                <a
                  href={
                    proj.github_url.startsWith("http")
                      ? proj.github_url
                      : `https://${proj.github_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <LuGithub size={14} />
                  Code Repository
                </a>
              )}
              {proj.live_url && (
                <a
                  href={
                    proj.live_url.startsWith("http") ? proj.live_url : `https://${proj.live_url}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1.5 transition-colors"
                >
                  <LuExternalLink size={14} />
                  Live Demo
                </a>
              )}
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-2 py-24 text-center app-card">
            <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6">
              <LuFolder size={28} />
            </div>
            <h3 className="font-display text-2xl font-black tracking-tight text-foreground">
              No Projects Found
            </h3>
            <p className="text-muted mt-2 font-medium text-base">
              You haven&apos;t added any projects to your portfolio yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
