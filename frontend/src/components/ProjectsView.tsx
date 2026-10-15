"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProjectListItem, ProjectStatus, Api } from "../lib/api";
import { FolderKanban, Plus, Flag, ArrowRight, Search, X, GripVertical } from "lucide-react";
import { Portal } from "./Portal";

interface ProjectsViewProps {
  onSelectProject: (projectId: string) => void;
  loadingProjectId?: string | null;
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

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onSelectProject, loadingProjectId }) => {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localLoadingId, setLocalLoadingId] = useState<string | null>(null);

  const activeLoadingId = loadingProjectId || localLoadingId;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const touchDragIdRef = useRef<string | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const isFilterActive = !!searchTerm.trim() || selectedStatusFilter !== "ALL";

  const handleCardClick = (projectId: string) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    if (activeLoadingId) return;
    setLocalLoadingId(projectId);
    onSelectProject(projectId);
  };

  // Drag & drop handlers (HTML5 Desktop)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isFilterActive) return;
    isDraggingRef.current = true;
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (isFilterActive || !draggedId || draggedId === id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (id: string) => {
    if (dragOverId === id) {
      setDragOverId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggedId;
    setDraggedId(null);
    setDragOverId(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);

    if (!sourceId || sourceId === targetId || isFilterActive) return;

    const sourceIndex = projects.findIndex((p) => p.id === sourceId);
    const targetIndex = projects.findIndex((p) => p.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const next = [...projects];
    const [removed] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, removed);

    setProjects(next);
    try {
      await Api.reorderProjects(next.map((p) => p.id));
    } catch (err: any) {
      console.error("Failed to persist project reorder:", err);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  // Touch Drag Handlers (Mobile)
  const handleTouchStart = (id: string) => {
    if (isFilterActive) return;
    touchDragIdRef.current = id;
    setDraggedId(id);
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragIdRef.current || isFilterActive) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardEl = targetEl?.closest("[data-reorder-id]");
    if (cardEl) {
      const overId = cardEl.getAttribute("data-reorder-id");
      if (overId && overId !== touchDragIdRef.current) {
        setDragOverId(overId);
      }
    }
  };

  const handleTouchEnd = async () => {
    const sourceId = touchDragIdRef.current;
    const targetId = dragOverId;
    touchDragIdRef.current = null;
    setDraggedId(null);
    setDragOverId(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);

    if (!sourceId || !targetId || sourceId === targetId || isFilterActive) return;

    const sourceIndex = projects.findIndex((p) => p.id === sourceId);
    const targetIndex = projects.findIndex((p) => p.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const next = [...projects];
    const [removed] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, removed);

    setProjects(next);
    try {
      await Api.reorderProjects(next.map((p) => p.id));
    } catch (err: any) {
      console.error("Failed to persist project reorder:", err);
    }
  };

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
    <div className="space-y-3 sm:space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[var(--text-heading)] sm:text-2xl">Projects</h1>
            {!isFilterActive && projects.length > 1 && (
              <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)] hidden sm:inline-flex items-center gap-1">
                <GripVertical className="h-2.5 w-2.5" />
                <span>Drag cards to reorder</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Things you're building or delivering. Plan work, execute, and drag to rearrange.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="paper-btn-primary px-3.5 py-2 text-xs font-bold self-start sm:self-center shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          + Create Project
        </button>
      </div>

      {error && (
        <div className="paper-card bg-red-500/10 p-3 text-xs font-semibold text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Summary Stat Counter Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-2.5 text-center border border-[var(--border-subtle)] rounded-lg">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Active / In Progress</div>
          <div className="text-base sm:text-lg font-black text-[var(--forest-green)] mt-0.5">{activeCount}</div>
        </div>
        <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-2.5 text-center border border-[var(--border-subtle)] rounded-lg">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Completed</div>
          <div className="text-base sm:text-lg font-black text-[var(--text-heading)] mt-0.5">{completedCount}</div>
        </div>
        <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-2.5 text-center border border-[var(--border-subtle)] rounded-lg">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Paused / Stopped</div>
          <div className="text-base sm:text-lg font-black text-[var(--crimson)] mt-0.5">{pausedCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search projects by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="paper-input w-full px-3.5 py-2 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center flex-wrap gap-1 text-[11px] font-bold text-[var(--text-muted)]">
          {["ALL", "IN_PROGRESS", "ACTIVE", "COMPLETED", "PAUSED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                selectedStatusFilter === st
                  ? "bg-[var(--forest-green)] text-white font-extrabold shadow-2xs"
                  : "bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-subtle)]"
              }`}
            >
              {st === "ALL" ? "All" : STATUS_CONFIG[st as ProjectStatus]?.label || st}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <div className="paper-card p-8 text-center text-xs text-[var(--text-muted)] animate-pulse border border-[var(--border-default)] rounded-xl">
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="paper-card bg-[var(--surface-secondary)] p-8 text-center space-y-3 border border-[var(--border-default)] rounded-xl">
          <div className="flex justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pale-sage)] text-[var(--forest-green)] shadow-xs">
              <FolderKanban className="h-5 w-5" strokeWidth={1.8} />
            </span>
          </div>
          <div className="text-base font-bold text-[var(--text-heading)]">
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
              className="paper-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-2">
          {filteredProjects.map((project) => {
            const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.IN_PROGRESS;
            const isLoading = activeLoadingId === project.id;
            const isOtherLoading = activeLoadingId !== null && !isLoading;
            const isBeingDragged = draggedId === project.id;
            const isDropTarget = dragOverId === project.id;

            return (
              <div
                key={project.id}
                data-reorder-id={project.id}
                draggable={!isFilterActive && !isLoading}
                onDragStart={(e) => handleDragStart(e, project.id)}
                onDragOver={(e) => handleDragOver(e, project.id)}
                onDragLeave={() => handleDragLeave(project.id)}
                onDrop={(e) => handleDrop(e, project.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick(project.id)}
                className={`group paper-card-interactive p-3 sm:p-3.5 space-y-2.5 transition-all border flex flex-col justify-between relative overflow-hidden rounded-xl select-none ${
                  isBeingDragged
                    ? "opacity-35 scale-95 border-dashed border-[var(--forest-green)] bg-[var(--pale-sage)]/20 shadow-none cursor-grabbing"
                    : isDropTarget
                    ? "border-[var(--forest-green)] ring-2 ring-[var(--forest-green)]/60 bg-[var(--pale-sage)]/30 scale-[1.02] shadow-md"
                    : isLoading
                    ? "border-[var(--forest-green)] ring-2 ring-[var(--forest-green)]/40 bg-[var(--surface-hover)] shadow-md scale-[1.01]"
                    : isOtherLoading
                    ? "opacity-50 pointer-events-none border-[var(--border-default)]"
                    : "border-[var(--border-default)] hover:border-[var(--forest-green)] cursor-grab active:cursor-grabbing"
                }`}
              >
                {/* Top Shimmer Loading Line when this card is opening */}
                {isLoading && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--surface-inset)] overflow-hidden z-10">
                    <div className="h-full bg-gradient-to-r from-[var(--forest-green)] via-[var(--crimson)] to-[var(--forest-green)] wave-shimmer-anim w-full" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-[var(--text-heading)] group-hover:text-[var(--crimson)] transition-colors truncate">
                        {project.name}
                      </h2>
                      {project.category && (
                        <span className="text-[10px] font-bold text-[var(--forest-green)] uppercase tracking-wider block mt-0.5">
                          {project.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${statusInfo.badgeClass}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {project.description ? (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">{project.description}</p>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] italic">No description provided</p>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
                  {/* Current milestone indicator */}
                  {project.currentMilestoneTitle && (
                    <div className="text-[11px] text-[var(--forest-green)] font-medium bg-[var(--pale-sage)] px-2.5 py-1 rounded-md flex items-center space-x-1.5">
                      <Flag className="h-3 w-3 text-[var(--forest-green)] shrink-0" />
                      <span className="truncate">Current milestone: <strong>{project.currentMilestoneTitle}</strong></span>
                    </div>
                  )}

                  {/* Task progress & Effort summary */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>
                      <strong className="text-[var(--text-heading)]">{project.completedTasksCount}</strong> of{" "}
                      <strong className="text-[var(--text-heading)]">{project.totalTasksCount}</strong> tasks completed
                    </span>

                    <span className="font-bold text-[var(--forest-green)]">
                      {formatMinutes(project.totalEffortMinutes)} logged
                    </span>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    {isLoading ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--crimson)] animate-pulse">
                        <div className="h-2.5 w-2.5 rounded-full border-2 border-[var(--crimson)] border-t-transparent animate-spin" />
                        <span>Opening project...</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-[var(--crimson)] group-hover:underline">
                        <span>Open project</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center pt-16 sm:pt-20 pb-8">
              <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-lg p-6 space-y-5 rounded-xl border border-[var(--border-default)] shadow-2xl relative my-auto">
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
          </div>
        </Portal>
      )}
    </div>
  );
};
