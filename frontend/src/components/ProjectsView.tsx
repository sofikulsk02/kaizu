"use client";

import React, { useState, useEffect } from "react";
import { ProjectListItem, ProjectStatus, Api } from "../lib/api";
import { FolderKanban, Plus, Flag, ArrowRight, Search, X } from "lucide-react";

interface ProjectsViewProps {
  onSelectProject: (projectId: string) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; badgeClass: string }> = {
  ACTIVE: { label: "Active", badgeClass: "bg-[var(--pale-sage)] text-[var(--forest-green)]" },
  IN_PROGRESS: { label: "In Progress", badgeClass: "bg-[var(--pale-sage)] text-[var(--forest-green)] font-bold" },
  COMPLETED: { label: "Completed", badgeClass: "bg-[#D5E3D2] text-[#122419]" },
  PAUSED: { label: "Paused", badgeClass: "bg-[#F5E6D3] text-[#7C4A12]" },
  STOPPED: { label: "Stopped", badgeClass: "bg-[var(--surface-secondary)] text-[var(--text-muted)]" },
};

function formatMinutes(mins: number): string {
  if (!mins || mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Create Project Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newStatus, setNewStatus] = useState<ProjectStatus>("IN_PROGRESS");
  const [newNextAction, setNewNextAction] = useState("");

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await Api.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const created = await Api.createProject({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        category: newCategory.trim() || undefined,
        status: newStatus,
        nextAction: newNextAction.trim() || undefined,
      });
      setShowCreateModal(false);
      setNewName("");
      setNewDesc("");
      setNewCategory("");
      setNewNextAction("");
      onSelectProject(created.id);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      setLoading(false);
    }
  };

  // Filter logic
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedStatusFilter === "ALL") return true;
    return p.status === selectedStatusFilter;
  });

  // Summary counts
  const activeCount = projects.filter((p) => p.status === "ACTIVE" || p.status === "IN_PROGRESS").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;
  const pausedCount = projects.filter((p) => p.status === "PAUSED" || p.status === "STOPPED").length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-heading)]">Projects</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Things you're building or delivering. Plan work, execute, log activity, and track progress.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="paper-btn-primary px-5 py-2.5 text-xs font-bold self-start sm:self-center shadow-xs"
        >
          + Create Project
        </button>
      </div>

      {error && (
        <div className="paper-card bg-red-500/10 p-4 text-xs font-semibold text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Summary Stat Counter Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="paper-card bg-[var(--surface-secondary)] p-4 text-center border border-[var(--border-default)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Active / In Progress</div>
          <div className="text-2xl font-black text-[var(--forest-green)] mt-1">{activeCount}</div>
        </div>
        <div className="paper-card bg-[var(--surface-secondary)] p-4 text-center border border-[var(--border-default)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Completed</div>
          <div className="text-2xl font-black text-[#122419] mt-1">{completedCount}</div>
        </div>
        <div className="paper-card bg-[var(--surface-secondary)] p-4 text-center border border-[var(--border-default)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Paused / Stopped</div>
          <div className="text-2xl font-black text-[var(--crimson)] mt-1">{pausedCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="paper-input w-full px-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-bold text-[var(--text-muted)]">
          {["ALL", "IN_PROGRESS", "ACTIVE", "COMPLETED", "PAUSED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1.5 rounded transition-colors ${
                selectedStatusFilter === st
                  ? "bg-[var(--forest-green)] text-white font-extrabold"
                  : "bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-default)]"
              }`}
            >
              {st === "ALL" ? "All" : STATUS_CONFIG[st as ProjectStatus]?.label || st}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <div className="paper-card p-12 text-center text-sm text-[var(--text-muted)] animate-pulse">
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="paper-card bg-[var(--surface-secondary)] p-12 text-center space-y-4 border border-[var(--border-default)]">
          <div className="flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--pale-sage)] text-[var(--forest-green)] shadow-xs">
              <FolderKanban className="h-7 w-7" strokeWidth={1.8} />
            </span>
          </div>
          <div className="text-lg font-bold text-[var(--text-heading)]">
            {searchTerm ? "No projects match your filter" : "No projects created yet"}
          </div>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            {searchTerm
              ? `Try adjusting your search query "${searchTerm}" or clearing status filters.`
              : "Projects represent things you are building or delivering (e.g. Cella DB, Kaizu OS). Start by creating your first project!"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="paper-btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {filteredProjects.map((project) => {
            const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.IN_PROGRESS;
            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="group paper-card-interactive p-6 space-y-5 cursor-pointer hover:border-[var(--forest-green)] transition-all border border-[var(--border-default)] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--text-heading)] group-hover:text-[var(--crimson)] transition-colors">
                        {project.name}
                      </h2>
                      {project.category && (
                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mt-0.5">
                          {project.category}
                        </span>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold shrink-0 ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {project.description ? (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">{project.description}</p>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] italic">No description provided</p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--border-default)]">
                  {/* Current milestone indicator */}
                  {project.currentMilestoneTitle && (
                    <div className="text-xs text-[var(--forest-green)] font-medium bg-[var(--pale-sage)] px-3 py-1.5 rounded flex items-center space-x-2">
                      <Flag className="h-3.5 w-3.5 text-[var(--forest-green)] shrink-0" />
                      <span className="truncate">Current milestone: <strong>{project.currentMilestoneTitle}</strong></span>
                    </div>
                  )}

                  {/* Task progress & Effort summary */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
                    <span>
                      <strong className="text-[var(--text-heading)]">{project.completedTasksCount}</strong> of{" "}
                      <strong className="text-[var(--text-heading)]">{project.totalTasksCount}</strong> tasks completed
                    </span>

                    <span className="font-bold text-[var(--forest-green)]">
                      {formatMinutes(project.totalEffortMinutes)} logged
                    </span>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <span className="inline-flex items-center gap-1 text-xs font-black text-[var(--crimson)] group-hover:underline">
                      <span>Open project</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-lg p-6 space-y-5 rounded-xl border border-[var(--border-default)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text-heading)]">Create New Project</h3>
                <p className="text-xs text-[var(--text-muted)]">Define a new software or delivery project</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Cella DB, Kaizu OS, Vector Indexer"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Category / Work Area</label>
                <input
                  type="text"
                  placeholder="e.g. Database Kernel, Web Application, Compiler"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Description</label>
                <textarea
                  placeholder="What is this project delivering or building?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Initial Next Action (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Implement B-Tree leaf node split logic"
                  value={newNextAction}
                  onChange={(e) => setNewNextAction(e.target.value)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="paper-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="paper-btn-primary px-6 py-2 text-xs font-bold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
