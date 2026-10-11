"use client";

import React, { useState, useEffect } from "react";
import {
  ProjectDetail,
  ProjectMilestone,
  ProjectTask,
  ProjectWorkSession,
  ProjectNote,
  ProjectStatus,
  MilestoneStatus,
  TaskStatus,
  TaskPriority,
  Api,
} from "../lib/api";
import {
  Target,
  Flag,
  FileText,
  Plus,
  Trash2,
  X,
  ArrowLeft,
  Clock,
  Pencil,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Portal } from "./Portal";

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
}

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; badgeClass: string }> = {
  ACTIVE: { label: "Active", badgeClass: "bg-[var(--pale-sage)] text-[var(--forest-green)]" },
  IN_PROGRESS: { label: "In Progress", badgeClass: "bg-[var(--pale-sage)] text-[var(--forest-green)] font-bold" },
  COMPLETED: { label: "Completed", badgeClass: "bg-[#D5E3D2] text-[#122419]" },
  PAUSED: { label: "Paused", badgeClass: "bg-[#F5E6D3] text-[#7C4A12]" },
  STOPPED: { label: "Stopped", badgeClass: "bg-[var(--surface-secondary)] text-[var(--text-muted)]" },
};

const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { label: string; badgeClass: string }> = {
  UPCOMING: { label: "Upcoming", badgeClass: "bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border-subtle)]" },
  IN_PROGRESS: { label: "In Progress", badgeClass: "bg-[var(--pale-sage)] text-[var(--forest-green)] font-bold" },
  COMPLETED: { label: "Completed", badgeClass: "bg-[#D5E3D2] text-[#122419]" },
  PAUSED: { label: "Paused", badgeClass: "bg-[#F5E6D3] text-[#7C4A12]" },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; badgeClass: string }> = {
  LOW: { label: "Low", badgeClass: "bg-[var(--surface-secondary)] text-[var(--text-muted)]" },
  MEDIUM: { label: "Medium", badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  HIGH: { label: "High", badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
};

function formatMinutes(mins: number): string {
  if (!mins || mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Not specified";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"milestones" | "sessions" | "notes" | "reports">("milestones");

  // Edit Project state
  const [editingProject, setEditingProject] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<ProjectStatus>("IN_PROGRESS");
  const [editNextAction, setEditNextAction] = useState("");

  // Modal State: Log Work Session
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [workSummary, setWorkSummary] = useState("");
  const [workDuration, setWorkDuration] = useState(45);
  const [workMilestoneId, setWorkMilestoneId] = useState<string>("");
  const [workTaskId, setWorkTaskId] = useState<string>("");
  const [workOutcome, setWorkOutcome] = useState("");
  const [workBlocker, setWorkBlocker] = useState("");
  const [workNextStep, setWorkNextStep] = useState("");

  // Modal State: Add/Edit Milestone
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDesc, setMilestoneDesc] = useState("");

  // Modal State: Add Task
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTargetMilestoneId, setTaskTargetMilestoneId] = useState<string>("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");

  // Modal State: Add/Edit Note
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCategory, setNoteCategory] = useState("Architecture / Decision");
  const [noteContent, setNoteContent] = useState("");

  const loadProjectDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await Api.getProjectById(projectId);
      setProject(data);
      setEditName(data.name);
      setEditCategory(data.category || "");
      setEditDesc(data.description || "");
      setEditStatus(data.status);
      setEditNextAction(data.nextAction || "");
    } catch (err: any) {
      setError(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectDetails();
  }, [projectId]);

  // --- Handlers ---
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await Api.updateProject(projectId, {
        name: editName.trim(),
        category: editCategory.trim() || null,
        description: editDesc.trim() || null,
        status: editStatus,
        nextAction: editNextAction.trim() || null,
      });
      setEditingProject(false);
      loadProjectDetails();
    } catch (err: any) {
      setError(err.message || "Failed to update project");
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Are you sure you want to delete "${project?.name}"? This will delete all milestones, tasks, work sessions, and notes.`)) {
      return;
    }
    try {
      await Api.deleteProject(projectId);
      onBack();
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    setLoading(true);
    try {
      await Api.createProjectMilestone(projectId, {
        title: milestoneTitle.trim(),
        description: milestoneDesc.trim() || undefined,
        status: "IN_PROGRESS",
      });
      setShowMilestoneModal(false);
      setMilestoneTitle("");
      setMilestoneDesc("");
      loadProjectDetails();
    } catch (err: any) {
      setError(err.message || "Failed to create milestone");
      setLoading(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm("Delete this milestone and disassociate its tasks?")) return;
    try {
      await Api.deleteProjectMilestone(projectId, milestoneId);
      loadProjectDetails();
    } catch (err: any) {
      setError(err.message || "Failed to delete milestone");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setLoading(true);
    try {
      await Api.createProjectTask(projectId, {
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        priority: taskPriority,
        milestoneId: taskTargetMilestoneId || undefined,
      });
      setShowTaskModal(false);
      setTaskTitle("");
      setTaskDesc("");
      loadProjectDetails();
    } catch (err: any) {
      setError(err.message || "Failed to create task");
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: ProjectTask) => {
    const nextStatus: TaskStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
    try {
      await Api.updateProjectTask(projectId, task.id, { status: nextStatus });
      loadProjectDetails();
    } catch (err: any) {
      setError(err.message || "Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await Api.deleteProjectTask(projectId, taskId);
      loadProjectDetails();
    } catch (err: any) {
      setError(err.message || "Failed to delete task");
    }
  };

  const handleLogWorkSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workSummary.trim()) return;
    setLoading(true);
    try {
      await Api.createProjectWorkSession(projectId, {
        summary: workSummary.trim(),
        durationMinutes: Number(workDuration),
        outcome: workOutcome.trim() || undefined,
        blocker: workBlocker.trim() || undefined,
        nextStep: workNextStep.trim() || undefined,
        milestoneId: workMilestoneId || undefined,
        taskId: workTaskId || undefined,
      });
      setShowWorkModal(false);
      setWorkSummary("");
      setWorkOutcome("");
      setWorkBlocker("");
      setWorkNextStep("");
      loadProjectDetails();
    } catch (err: any) {
      setError(err.message || "Failed to log work session");
      setLoading(false);
    }
  };

  const handleDeleteWorkSession = async (sessionId: string) => {
    if (!confirm("Delete this recorded work session?")) return;
    try {
      await Api.deleteProjectWorkSession(projectId, sessionId);
      loadProjectDetails();
    } catch (err: any) {
      setError(err.message || "Failed to delete work session");
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    setLoading(true);
    try {
      await Api.createProjectNote(projectId, {
        title: noteTitle.trim(),
        category: noteCategory.trim() || "Technical Decision",
        content: noteContent.trim(),
      });
      setShowNoteModal(false);
      setNoteTitle("");
      setNoteContent("");
      loadProjectDetails();
    } catch (err: any) {
      setError(err.message || "Failed to add note");
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await Api.deleteProjectNote(projectId, noteId);
      loadProjectDetails();
    } catch (err: any) {
      setError(err.message || "Failed to delete note");
    }
  };

  if (loading && !project) {
    return (
      <div className="space-y-3 animate-fadeIn">
        {/* Top Header Bar Skeleton */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="h-8 w-36 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-24 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] animate-pulse" />
            <div className="h-8 w-16 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] animate-pulse" />
          </div>
        </div>

        {/* Project Header Hero Card Skeleton */}
        <div className="paper-card p-3 sm:p-4 space-y-3 border border-[var(--border-default)] rounded-xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="h-6 w-52 rounded bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-3.5 w-28 rounded bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-[var(--surface-secondary)] animate-pulse mt-2" />
            </div>
            <div className="h-6 w-20 rounded-md bg-[var(--surface-secondary)] animate-pulse shrink-0" />
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-[var(--surface-secondary)] animate-pulse" />
            ))}
          </div>
        </div>

        {/* Tab Pills Bar Skeleton */}
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <div className="h-7 w-32 rounded-lg bg-[var(--surface-secondary)] animate-pulse shrink-0" />
          <div className="h-7 w-28 rounded-lg bg-[var(--surface-secondary)] animate-pulse shrink-0" />
          <div className="h-7 w-32 rounded-lg bg-[var(--surface-secondary)] animate-pulse shrink-0" />
        </div>

        {/* Milestone Cards Shimmer List Skeleton */}
        <div className="space-y-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="paper-card p-3.5 space-y-2.5 border border-[var(--border-default)] rounded-xl">
              <div className="flex items-center justify-between">
                <div className="h-5 w-40 rounded bg-[var(--surface-secondary)] animate-pulse" />
                <div className="h-5 w-16 rounded bg-[var(--surface-secondary)] animate-pulse" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-6 w-full rounded bg-[var(--surface-secondary)]/70 animate-pulse" />
                <div className="h-6 w-4/5 rounded bg-[var(--surface-secondary)]/70 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="paper-card p-8 sm:p-12 text-center space-y-3 border border-[var(--border-default)] rounded-xl">
        <div className="text-[var(--crimson)] font-bold text-sm">Project not found</div>
        <button onClick={onBack} className="paper-btn-secondary px-3.5 py-1.5 text-xs font-bold cursor-pointer">
          ← Back to Projects
        </button>
      </div>
    );
  }

  const milestones = project.milestones || [];
  const directTasks = project.directTasks || [];
  const allTasks = [...directTasks, ...milestones.flatMap((m) => m.tasks || [])];
  const workSessions = project.workSessions || [];
  const notes = project.notes || [];
  const metrics = project.metrics;

  const statusInfo = PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.IN_PROGRESS;

  return (
    <div className="space-y-3 pb-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="paper-btn-secondary px-3 py-1.5 text-xs font-bold flex items-center space-x-1.5 group cursor-pointer active:scale-95 shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 text-[var(--crimson)]" />
          <span>Back to Projects</span>
          {project.category && (
            <span className="hidden sm:inline text-[var(--text-muted)] font-normal ml-1">
              / {project.category}
            </span>
          )}
        </button>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => setShowWorkModal(true)}
            className="paper-btn-primary px-3 py-1.5 text-xs font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-xs"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Log Work</span>
          </button>
          <button
            onClick={() => setEditingProject(!editingProject)}
            className="paper-btn-secondary px-2.5 py-1.5 text-xs font-bold cursor-pointer active:scale-95"
          >
            {editingProject ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={handleDeleteProject}
            className="paper-btn-danger px-2.5 py-1.5 text-xs font-bold cursor-pointer active:scale-95"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs font-semibold text-red-500">
          {error}
        </div>
      )}

      {/* Project Header Info Card */}
      <div className="paper-card p-3 sm:p-4 space-y-3 border border-[var(--border-default)] rounded-xl">
        {editingProject ? (
          <form onSubmit={handleUpdateProject} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)]">Project Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="paper-input mt-1 w-full px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Category</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="paper-input mt-1 w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                  className="paper-input mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-primary)]"
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PAUSED">Paused</option>
                  <option value="STOPPED">Stopped</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)]">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                className="paper-input mt-1 w-full px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingProject(false)}
                className="paper-btn-secondary px-3 py-1.5 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="paper-btn-primary px-4 py-1.5 text-xs font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {project.category && (
                <span className="paper-badge px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--forest-green)]">
                  {project.category}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-heading)] leading-tight">
              {project.name}
            </h1>

            {project.description && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>
        )}

        {/* Compact Integrated Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[var(--border-subtle)]">
          <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Effort Logged</div>
            <div className="text-base sm:text-lg font-black text-[var(--forest-green)] mt-0.5">
              {formatMinutes(metrics.totalEffortMinutes)}
            </div>
          </div>

          <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tasks Done</div>
            <div className="text-base sm:text-lg font-black text-[var(--text-heading)] mt-0.5">
              {metrics.completedTasksCount} / {metrics.totalTasksCount}
            </div>
          </div>

          <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Milestones</div>
            <div className="text-base sm:text-lg font-black text-[var(--text-heading)] mt-0.5">
              {metrics.completedMilestonesCount} / {metrics.totalMilestonesCount}
            </div>
          </div>

          <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Days</div>
            <div className="text-base sm:text-lg font-black text-[var(--crimson)] mt-0.5">
              {metrics.activeDaysCount}
            </div>
          </div>
        </div>
      </div>

      {/* Next Action Banner — Compact & Contextual */}
      <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 sm:p-3 rounded-xl border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-0.5 min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--forest-green)] flex items-center space-x-1.5">
            <Target className="h-3.5 w-3.5 shrink-0" />
            <span>Next Action</span>
            {project.currentMilestone && (
              <span className="text-[var(--text-muted)] font-normal truncate">
                · {project.currentMilestone.title}
              </span>
            )}
          </div>
          <div className="text-xs sm:text-sm font-bold text-[var(--text-heading)] truncate">
            {project.nextAction || `Define your next focused step for ${project.name}`}
          </div>
        </div>

        <button
          onClick={() => {
            if (project.nextAction) setWorkSummary(`Work on: ${project.nextAction}`);
            setShowWorkModal(true);
          }}
          className="paper-btn-primary px-3 py-1.5 text-xs font-bold flex items-center justify-center space-x-1 shrink-0 cursor-pointer active:scale-95 shadow-2xs self-start sm:self-auto"
        >
          <Clock className="h-3 w-3" />
          <span>Log Work Session →</span>
        </button>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex border-b border-[var(--border-default)] gap-1 sm:gap-4 text-xs font-bold text-[var(--text-muted)] overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab("milestones")}
          className={`pb-2 px-2.5 transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === "milestones"
              ? "border-[var(--forest-green)] text-[var(--forest-green)] font-extrabold"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          Milestones & Tasks ({allTasks.length})
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`pb-2 px-2.5 transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === "sessions"
              ? "border-[var(--forest-green)] text-[var(--forest-green)] font-extrabold"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          Recent Work ({workSessions.length})
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`pb-2 px-2.5 transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === "notes"
              ? "border-[var(--forest-green)] text-[var(--forest-green)] font-extrabold"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          Notes & Context ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-2 px-2.5 transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === "reports"
              ? "border-[var(--forest-green)] text-[var(--forest-green)] font-extrabold"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          Reports & Progress
        </button>
      </div>

      {/* TAB 1: MILESTONES & TASKS */}
      {activeTab === "milestones" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">Milestones & Tasks</h2>
              <p className="text-[10px] text-[var(--text-muted)]">Stages and tasks broken down for execution</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setTaskTargetMilestoneId("");
                  setShowTaskModal(true);
                }}
                className="paper-btn-secondary px-2.5 py-1 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Task</span>
              </button>
              <button
                onClick={() => setShowMilestoneModal(true)}
                className="paper-btn-primary px-2.5 py-1 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Milestone</span>
              </button>
            </div>
          </div>

          {milestones.length === 0 && directTasks.length === 0 ? (
            <div className="paper-inset p-8 text-center space-y-2 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-subtle)]">
              <div className="flex justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pale-sage)] text-[var(--forest-green)] shadow-xs">
                  <Flag className="h-5 w-5" strokeWidth={1.8} />
                </span>
              </div>
              <div className="font-bold text-[var(--text-heading)] text-sm">No milestones or tasks yet</div>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                Add a milestone stage (e.g. B-Tree Indexing) or direct tasks as you build.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="paper-btn-primary px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                >
                  + Add First Milestone
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Milestones Hierarchy */}
              {milestones.map((milestone) => {
                const milestoneTasks = milestone.tasks || [];
                const completedMTasks = milestoneTasks.filter((t) => t.status === "COMPLETED").length;
                const mStatus = MILESTONE_STATUS_CONFIG[milestone.status] || MILESTONE_STATUS_CONFIG.UPCOMING;

                return (
                  <div key={milestone.id} className="paper-card p-3 sm:p-3.5 space-y-2.5 border border-[var(--border-default)] rounded-xl">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mStatus.badgeClass}`}>
                            {mStatus.label}
                          </span>
                          <h3 className="font-bold text-[var(--text-heading)] text-sm truncate">{milestone.title}</h3>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            ({completedMTasks}/{milestoneTasks.length} done)
                          </span>
                        </div>
                        {milestone.description && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{milestone.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setTaskTargetMilestoneId(milestone.id);
                            setShowTaskModal(true);
                          }}
                          className="paper-btn-secondary px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer"
                        >
                          + Task
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="text-[11px] text-[var(--text-muted)] hover:text-red-500 px-1 py-0.5 cursor-pointer transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Milestone Tasks */}
                    <div className="space-y-1.5">
                      {milestoneTasks.length > 0 ? (
                        milestoneTasks.map((task) => {
                          const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                          const isDone = task.status === "COMPLETED";

                          return (
                            <div
                              key={task.id}
                              className="paper-inset bg-[var(--surface-secondary)] p-2 sm:p-2.5 text-xs flex items-center justify-between gap-2.5 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--forest-green)]/40 transition-colors"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => handleToggleTaskStatus(task)}
                                  className="h-3.5 w-3.5 rounded accent-[var(--forest-green)] cursor-pointer shrink-0"
                                />
                                <span className={`font-semibold truncate min-w-0 ${isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-heading)]"}`}>
                                  {task.title}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityInfo.badgeClass}`}>
                                  {priorityInfo.label}
                                </span>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-[var(--text-muted)] hover:text-red-500 p-0.5 transition cursor-pointer"
                                  title="Delete task"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-[11px] text-[var(--text-muted)] italic py-0.5">No tasks in this milestone yet.</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Direct Un-grouped Tasks */}
              {directTasks.length > 0 && (
                <div className="paper-card p-3 sm:p-3.5 space-y-2 border border-[var(--border-default)] rounded-xl">
                  <h3 className="font-bold text-[var(--text-muted)] text-xs uppercase tracking-wider">
                    Direct Tasks (Un-grouped)
                  </h3>
                  <div className="space-y-1.5">
                    {directTasks.map((task) => {
                      const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                      const isDone = task.status === "COMPLETED";

                      return (
                        <div
                          key={task.id}
                          className="paper-inset bg-[var(--surface-secondary)] p-2 sm:p-2.5 text-xs flex items-center justify-between gap-2.5 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--forest-green)]/40 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => handleToggleTaskStatus(task)}
                              className="h-3.5 w-3.5 rounded accent-[var(--forest-green)] cursor-pointer shrink-0"
                            />
                            <span className={`font-semibold truncate min-w-0 ${isDone ? "line-through text-[var(--text-muted)]" : "text-[var(--text-heading)]"}`}>
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityInfo.badgeClass}`}>
                              {priorityInfo.label}
                            </span>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-[var(--text-muted)] hover:text-red-500 p-0.5 transition cursor-pointer"
                              title="Delete task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECENT WORK (SESSIONS LOG) */}
      {activeTab === "sessions" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">Recent Work & Activity Log</h2>
              <p className="text-[10px] text-[var(--text-muted)]">Logged deep work, debugging, and testing sessions</p>
            </div>
            <button
              onClick={() => setShowWorkModal(true)}
              className="paper-btn-primary px-3 py-1.5 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus className="h-3 w-3" />
              <span>Log Session</span>
            </button>
          </div>

          {workSessions.length === 0 ? (
            <div className="paper-inset p-8 text-center space-y-2 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-subtle)]">
              <div className="flex justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pale-sage)] text-[var(--forest-green)] shadow-xs">
                  <Clock className="h-5 w-5" strokeWidth={1.8} />
                </span>
              </div>
              <div className="font-bold text-[var(--text-heading)] text-sm">No work sessions recorded yet</div>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                Record work sessions to build evidence-backed momentum and effort history.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowWorkModal(true)}
                  className="paper-btn-primary px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                >
                  + Log First Session
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {workSessions.map((session) => (
                <div key={session.id} className="paper-card p-3 space-y-2 border border-[var(--border-default)] rounded-xl">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-[var(--forest-green)]">
                        {formatMinutes(session.durationMinutes)}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">· {formatDate(session.occurredAt)}</span>
                      {session.milestone && (
                        <span className="paper-badge px-2 py-0.5 text-[10px] font-bold text-[var(--forest-green)]">
                          {session.milestone.title}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteWorkSession(session.id)}
                      className="text-[11px] text-[var(--text-muted)] hover:text-red-500 font-bold transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-[var(--text-heading)]">{session.summary}</h4>

                  {(session.outcome || session.blocker || session.nextStep) && (
                    <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 rounded-lg text-xs space-y-1 text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      {session.outcome && (
                        <div>
                          <strong className="text-[var(--text-heading)] font-semibold">Outcome:</strong> {session.outcome}
                        </div>
                      )}
                      {session.blocker && (
                        <div>
                          <strong className="text-[var(--crimson)] font-semibold">Blocker:</strong> {session.blocker}
                        </div>
                      )}
                      {session.nextStep && (
                        <div>
                          <strong className="text-[var(--forest-green)] font-semibold">Next Action:</strong> {session.nextStep}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NOTES & TECHNICAL CONTEXT */}
      {activeTab === "notes" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">Notes & Technical Context</h2>
              <p className="text-[10px] text-[var(--text-muted)]">Design tradeoffs, architecture decisions, and links</p>
            </div>
            <button
              onClick={() => setShowNoteModal(true)}
              className="paper-btn-primary px-3 py-1.5 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus className="h-3 w-3" />
              <span>Add Note</span>
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="paper-inset p-8 text-center space-y-2 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-subtle)]">
              <div className="flex justify-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pale-sage)] text-[var(--forest-green)] shadow-xs">
                  <FileText className="h-5 w-5" strokeWidth={1.8} />
                </span>
              </div>
              <div className="font-bold text-[var(--text-heading)] text-sm">No notes captured yet</div>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                Record technical decisions and references right alongside your project.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="paper-btn-primary px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                >
                  + Add First Note
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {notes.map((note) => (
                <div key={note.id} className="paper-card p-3 space-y-2 border border-[var(--border-default)] rounded-xl flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-[var(--text-heading)] truncate">{note.title}</h4>
                      {note.category && (
                        <span className="paper-badge px-2 py-0.5 text-[9px] font-bold shrink-0">
                          {note.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed line-clamp-4">
                      {note.content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span>{formatDate(note.createdAt)}</span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="hover:text-red-500 font-bold transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REPORTS & PROGRESS */}
      {activeTab === "reports" && (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-heading)]">Project Progress & Effort Reports</h2>
            <p className="text-[10px] text-[var(--text-muted)]">Summary of completion metrics, consistency, and time invested</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="paper-card p-3.5 rounded-xl border border-[var(--border-default)] space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Task Completion Rate</div>
              <div className="text-xl sm:text-2xl font-black text-[var(--forest-green)]">
                {metrics.taskProgressPercentage !== null ? `${metrics.taskProgressPercentage}%` : "—"}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {metrics.completedTasksCount} of {metrics.totalTasksCount} tasks completed
              </div>
            </div>

            <div className="paper-card p-3.5 rounded-xl border border-[var(--border-default)] space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Milestones Progress</div>
              <div className="text-xl sm:text-2xl font-black text-[var(--text-heading)]">
                {metrics.completedMilestonesCount} / {metrics.totalMilestonesCount}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Milestones delivered</div>
            </div>

            <div className="paper-card p-3.5 rounded-xl border border-[var(--border-default)] space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Effort Invested</div>
              <div className="text-xl sm:text-2xl font-black text-[var(--crimson)]">
                {formatMinutes(metrics.totalEffortMinutes)}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">Across {metrics.activeDaysCount} active days</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG WORK SESSION */}
      {showWorkModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center pt-16 sm:pt-20 pb-8">
              <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-lg p-5 sm:p-6 space-y-4 rounded-xl border border-[var(--border-default)] max-h-[90vh] overflow-y-auto relative my-auto shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div>
                    <h3 className="text-base font-black text-[var(--text-heading)]">Log Work Session</h3>
                    <p className="text-xs text-[var(--text-muted)]">Record progress on {project.name}</p>
                  </div>
                  <button
                    onClick={() => setShowWorkModal(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleLogWorkSession} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">What did you work on? *</label>
                    <input
                      type="text"
                      placeholder="e.g. Implemented B-Tree node split & concurrency locks"
                      value={workSummary}
                      onChange={(e) => setWorkSummary(e.target.value)}
                      required
                      className="paper-input mt-1 w-full px-3 py-2 text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Link to Milestone (Optional)</label>
                    <select
                      value={workMilestoneId}
                      onChange={(e) => setWorkMilestoneId(e.target.value)}
                      className="paper-input mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-primary)]"
                    >
                      <option value="">-- General Project Work --</option>
                      {milestones.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Duration</label>
                    <div className="flex items-center flex-wrap gap-1.5 mt-1">
                      {[15, 30, 45, 60, 90, 120, 180].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setWorkDuration(mins)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            workDuration === mins
                              ? "bg-[var(--forest-green)] text-white shadow-2xs font-extrabold"
                              : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-heading)] border border-[var(--border-default)]"
                          }`}
                        >
                          {formatMinutes(mins)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Outcome / Accomplishment (Optional)</label>
                    <textarea
                      placeholder="e.g. All unit tests passing cleanly"
                      value={workOutcome}
                      onChange={(e) => setWorkOutcome(e.target.value)}
                      rows={2}
                      className="paper-input mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-muted)]">Blocker / Issue (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Concurrency deadlocks on high load"
                        value={workBlocker}
                        onChange={(e) => setWorkBlocker(e.target.value)}
                        className="paper-input mt-1 w-full px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--text-muted)]">Next Action (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Write recovery tests after WAL replay"
                        value={workNextStep}
                        onChange={(e) => setWorkNextStep(e.target.value)}
                        className="paper-input mt-1 w-full px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border-default)]">
                    <button
                      type="button"
                      onClick={() => setShowWorkModal(false)}
                      className="paper-btn-secondary px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="paper-btn-primary px-4 py-1.5 text-xs font-bold cursor-pointer">
                      Save Work Session
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL: ADD MILESTONE */}
      {showMilestoneModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center pt-16 sm:pt-20 pb-8">
              <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-md p-5 sm:p-6 space-y-4 rounded-xl border border-[var(--border-default)] relative my-auto shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div>
                    <h3 className="text-base font-black text-[var(--text-heading)]">Add Milestone</h3>
                    <p className="text-xs text-[var(--text-muted)]">Define a major stage or deliverable</p>
                  </div>
                  <button
                    onClick={() => setShowMilestoneModal(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateMilestone} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Milestone Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. B-Tree Indexing, WAL Recovery"
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      required
                      className="paper-input mt-1 w-full px-3 py-2 text-sm"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Description (Optional)</label>
                    <textarea
                      placeholder="Scope or objectives of this stage..."
                      value={milestoneDesc}
                      onChange={(e) => setMilestoneDesc(e.target.value)}
                      rows={2}
                      className="paper-input mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border-default)]">
                    <button
                      type="button"
                      onClick={() => setShowMilestoneModal(false)}
                      className="paper-btn-secondary px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="paper-btn-primary px-4 py-1.5 text-xs font-bold cursor-pointer">
                      Create Milestone
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL: ADD TASK */}
      {showTaskModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center pt-16 sm:pt-20 pb-8">
              <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-md p-5 sm:p-6 space-y-4 rounded-xl border border-[var(--border-default)] relative my-auto shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div>
                    <h3 className="text-base font-black text-[var(--text-heading)]">Add Task</h3>
                    <p className="text-xs text-[var(--text-muted)]">Create an actionable task for {project.name}</p>
                  </div>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Task Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Implement leaf node split logic"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      required
                      className="paper-input mt-1 w-full px-3 py-2 text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Milestone</label>
                    <select
                      value={taskTargetMilestoneId}
                      onChange={(e) => setTaskTargetMilestoneId(e.target.value)}
                      className="paper-input mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-primary)]"
                    >
                      <option value="">-- Direct Project Task (Un-grouped) --</option>
                      {milestones.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                      className="paper-input mt-1 w-full px-3 py-2 text-sm bg-[var(--surface-primary)]"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border-default)]">
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="paper-btn-secondary px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="paper-btn-primary px-4 py-1.5 text-xs font-bold cursor-pointer">
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL: ADD NOTE */}
      {showNoteModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center pt-16 sm:pt-20 pb-8">
              <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-md p-5 sm:p-6 space-y-4 rounded-xl border border-[var(--border-default)] relative my-auto shadow-2xl">
                <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                  <div>
                    <h3 className="text-base font-black text-[var(--text-heading)]">Add Technical Note</h3>
                    <p className="text-xs text-[var(--text-muted)]">Capture architecture, tradeoffs, or references</p>
                  </div>
                  <button
                    onClick={() => setShowNoteModal(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateNote} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. WAL Frame Header Architecture"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      required
                      className="paper-input mt-1 w-full px-3 py-2 text-sm"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Architectural Decision, Resource, Lesson Learned"
                      value={noteCategory}
                      onChange={(e) => setNoteCategory(e.target.value)}
                      className="paper-input mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)]">Content *</label>
                    <textarea
                      placeholder="Explain technical context, tradeoffs, links..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      required
                      rows={3}
                      className="paper-input mt-1 w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-[var(--border-default)]">
                    <button
                      type="button"
                      onClick={() => setShowNoteModal(false)}
                      className="paper-btn-secondary px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="paper-btn-primary px-4 py-1.5 text-xs font-bold cursor-pointer">
                      Save Note
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
