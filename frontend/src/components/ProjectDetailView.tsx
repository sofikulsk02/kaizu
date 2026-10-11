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
import { Target, Flag, FileText, Plus, Trash2, X } from "lucide-react";
import { Portal } from "./Portal";

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
}

const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; badgeClass: string }> = {
  ACTIVE: { label: "Active", badgeClass: "bg-[#1e3a5f] text-[#60a5fa]" },
  IN_PROGRESS: { label: "In Progress", badgeClass: "bg-[#064e3b] text-[#34d399]" },
  COMPLETED: { label: "Completed", badgeClass: "bg-[#14532d] text-[#4ade80]" },
  PAUSED: { label: "Paused", badgeClass: "bg-[#7c2d12] text-[#fb923c]" },
  STOPPED: { label: "Stopped", badgeClass: "bg-[#1e2732] text-[#8b98a5]" },
};

const MILESTONE_STATUS_CONFIG: Record<MilestoneStatus, { label: string; badgeClass: string }> = {
  UPCOMING: { label: "Upcoming", badgeClass: "bg-[#1e2732] text-[#8b98a5]" },
  IN_PROGRESS: { label: "In Progress", badgeClass: "bg-[#064e3b] text-[#34d399]" },
  COMPLETED: { label: "Completed", badgeClass: "bg-[#14532d] text-[#4ade80]" },
  PAUSED: { label: "Paused", badgeClass: "bg-[#7c2d12] text-[#fb923c]" },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  LOW: { label: "Low", color: "text-[#8b98a5]" },
  MEDIUM: { label: "Medium", color: "text-[#60a5fa]" },
  HIGH: { label: "High", color: "text-[#fb923c]" },
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
        milestoneId: taskTargetMilestoneId || undefined,
        priority: taskPriority,
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
      <div className="space-y-4 animate-fadeIn">
        {/* Top Header Bar Skeleton */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="h-8 w-36 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] animate-pulse" />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-24 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] animate-pulse" />
            <div className="h-8 w-16 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)] animate-pulse" />
          </div>
        </div>

        {/* Project Header Hero Card Skeleton */}
        <div className="paper-card p-4 sm:p-5 space-y-4 border border-[var(--border-default)] relative overflow-hidden">
          {/* Top shimmer wave */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--surface-inset)] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--forest-green)] via-[var(--crimson)] to-[var(--forest-green)] wave-shimmer-anim w-full" />
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="h-6 w-52 rounded bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-3.5 w-28 rounded bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-[var(--surface-secondary)] animate-pulse mt-2" />
            </div>
            <div className="h-6 w-20 rounded-md bg-[var(--surface-secondary)] animate-pulse shrink-0" />
          </div>

          {/* Current milestone & metrics skeleton */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
            <div className="h-8 w-full rounded bg-[var(--surface-secondary)] animate-pulse" />
            <div className="flex justify-between items-center pt-1">
              <div className="h-3 w-36 rounded bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-3 w-20 rounded bg-[var(--surface-secondary)] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tab Pills Bar Skeleton */}
        <div className="flex space-x-2 overflow-x-auto pb-1">
          <div className="h-8 w-36 rounded-lg bg-[var(--surface-secondary)] animate-pulse shrink-0" />
          <div className="h-8 w-28 rounded-lg bg-[var(--surface-secondary)] animate-pulse shrink-0" />
          <div className="h-8 w-36 rounded-lg bg-[var(--surface-secondary)] animate-pulse shrink-0" />
        </div>

        {/* Milestone Cards Shimmer List Skeleton */}
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="paper-card p-4 space-y-3 border border-[var(--border-default)] relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded bg-[var(--surface-secondary)] animate-pulse" />
                  <div className="h-5 w-40 rounded bg-[var(--surface-secondary)] animate-pulse" />
                </div>
                <div className="h-5 w-16 rounded bg-[var(--surface-secondary)] animate-pulse" />
              </div>
              <div className="space-y-2 pl-6 pt-1">
                <div className="h-7 w-full rounded bg-[var(--surface-secondary)]/70 animate-pulse" />
                <div className="h-7 w-4/5 rounded bg-[var(--surface-secondary)]/70 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="clay-surface p-12 text-center space-y-4">
        <div className="text-[#fb923c] font-bold">Project not found</div>
        <button onClick={onBack} className="clay-btn-secondary px-4 py-2 text-xs font-bold">
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
    <div className="space-y-4">
      {/* Top Background Sync Shimmer */}
      {loading && project && (
        <div className="fixed top-14 sm:top-16 left-0 right-0 z-50 h-0.5 sm:h-1 bg-[var(--surface-secondary)] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--forest-green)] via-[var(--crimson)] to-[var(--forest-green)] wave-shimmer-anim w-full" />
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          onClick={onBack}
          className="clay-btn-secondary px-3 py-1.5 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
        >
          <span>← Back to Projects</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowWorkModal(true)}
            className="clay-btn-primary px-3 py-1.5 text-xs font-bold flex items-center space-x-1 cursor-pointer"
          >
            <span>⏱ Log Work</span>
          </button>
          <button
            onClick={() => setEditingProject(!editingProject)}
            className="clay-btn-secondary px-3 py-1.5 text-xs font-bold cursor-pointer"
          >
            {editingProject ? "Cancel" : "Edit"}
          </button>
          <button onClick={handleDeleteProject} className="clay-btn-danger px-3 py-1.5 text-xs font-bold cursor-pointer">
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="clay-surface bg-red-500/10 p-3.5 text-xs font-semibold text-red-300">
          {error}
        </div>
      )}

      {/* Project Header Info */}
      <div className="clay-surface p-4 sm:p-5 space-y-4 border border-[#232d39]">
        {editingProject ? (
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8b98a5]">Project Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8b98a5]">Category</label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8b98a5]">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8b98a5]">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm bg-[#10171e]"
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="PAUSED">Paused</option>
                <option value="STOPPED">Stopped</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="submit" disabled={loading} className="clay-btn-primary px-5 py-2 text-xs font-bold">
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-black text-white">{project.name}</h1>
                  <span className={`px-3 py-1 rounded text-xs font-bold ${statusInfo.badgeClass}`}>
                    {statusInfo.label}
                  </span>
                </div>
                {project.category && (
                  <div className="text-xs font-bold text-[#60a5fa] uppercase tracking-wider mt-1">
                    {project.category}
                  </div>
                )}
                {project.description && (
                  <p className="mt-2 text-sm text-[#8b98a5]">{project.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2">
          <div className="clay-surface bg-[#10171e] p-3 sm:p-3.5 rounded-lg border border-[#232d39]">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8b98a5]">Effort Logged</div>
            <div className="text-lg sm:text-xl font-black text-white mt-0.5">{formatMinutes(metrics.totalEffortMinutes)}</div>
          </div>

          <div className="clay-surface bg-[#10171e] p-3 sm:p-3.5 rounded-lg border border-[#232d39]">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8b98a5]">Tasks</div>
            <div className="text-lg sm:text-xl font-black text-[#60a5fa] mt-0.5">
              {metrics.completedTasksCount} / {metrics.totalTasksCount}
            </div>
          </div>

          <div className="clay-surface bg-[#10171e] p-3 sm:p-3.5 rounded-lg border border-[#232d39]">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8b98a5]">Milestones</div>
            <div className="text-lg sm:text-xl font-black text-[#34d399] mt-0.5">
              {metrics.completedMilestonesCount} / {metrics.totalMilestonesCount}
            </div>
          </div>

          <div className="clay-surface bg-[#10171e] p-3 sm:p-3.5 rounded-lg border border-[#232d39]">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8b98a5]">Active Days</div>
            <div className="text-lg sm:text-xl font-black text-[#fb923c] mt-0.5">{metrics.activeDaysCount}</div>
          </div>
        </div>
      </div>

      {/* Next Action Hero Card */}
      <div className="clay-surface bg-gradient-to-r from-[#172431] to-[#121c27] p-4 sm:p-6 border border-[#26374a] rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <div className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#10b981] flex items-center space-x-1.5">
              <Target className="h-4 w-4 shrink-0" />
              <span>Next Action</span>
            </div>
            {project.nextAction ? (
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white mt-1 break-words">{project.nextAction}</h3>
                {project.currentMilestone && (
                  <div className="text-xs text-[#8b98a5] mt-0.5 truncate">
                    Milestone: <span className="text-[#60a5fa] font-semibold">{project.currentMilestone.title}</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white mt-1">No next action set for {project.name}</h3>
                <p className="text-xs text-[#8b98a5]">Set your next meaningful action to keep momentum moving forward.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (project.nextAction) {
                setWorkSummary(`Work on: ${project.nextAction}`);
              }
              setShowWorkModal(true);
            }}
            className="clay-btn-primary px-5 py-2.5 sm:px-6 sm:py-3 text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-transform flex items-center justify-center space-x-2 w-full sm:w-auto shrink-0 cursor-pointer"
          >
            <span>Log Work Session →</span>
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="flex border-b border-[#232d39] gap-1 sm:gap-6 text-xs sm:text-sm font-bold text-[#8b98a5] overflow-x-auto no-scrollbar scroll-smooth pb-px">
        <button
          onClick={() => setActiveTab("milestones")}
          className={`pb-2.5 px-3 sm:px-1 transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === "milestones"
              ? "border-[#10b981] text-white font-extrabold"
              : "border-transparent hover:text-white"
          }`}
        >
          Milestones & Tasks ({allTasks.length})
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`pb-2.5 px-3 sm:px-1 transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === "sessions"
              ? "border-[#10b981] text-white font-extrabold"
              : "border-transparent hover:text-white"
          }`}
        >
          Recent Work ({workSessions.length})
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`pb-2.5 px-3 sm:px-1 transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === "notes"
              ? "border-[#10b981] text-white font-extrabold"
              : "border-transparent hover:text-white"
          }`}
        >
          Notes & Context ({notes.length})
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-2.5 px-3 sm:px-1 transition-colors border-b-2 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === "reports"
              ? "border-[#10b981] text-white font-extrabold"
              : "border-transparent hover:text-white"
          }`}
        >
          Reports & Progress
        </button>
      </div>

      {/* TAB 1: MILESTONES & TASKS */}
      {activeTab === "milestones" && (
        <div className="clay-surface p-4 sm:p-7 space-y-4 sm:space-y-6 border border-[#232d39]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Milestones & Tasks</h2>
              <p className="text-xs text-[#8b98a5]">Organize work into stages and tasks without upfront syllabus lock</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setTaskTargetMilestoneId("");
                  setShowTaskModal(true);
                }}
                className="clay-btn-secondary flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-bold text-center justify-center whitespace-nowrap cursor-pointer"
              >
                + Add Direct Task
              </button>
              <button
                onClick={() => setShowMilestoneModal(true)}
                className="clay-btn-primary flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-bold text-center justify-center whitespace-nowrap cursor-pointer"
              >
                + Add Milestone
              </button>
            </div>
          </div>

          {milestones.length === 0 && directTasks.length === 0 ? (
            <div className="clay-surface bg-[#10171e] p-8 text-center space-y-3">
              <div className="flex justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e2a38] text-[#60a5fa] shadow-xs">
                  <Flag className="h-6 w-6" strokeWidth={1.8} />
                </span>
              </div>
              <div className="font-bold text-white text-lg">No milestones or tasks added yet.</div>
              <p className="text-xs text-[#8b98a5]">
                Add a milestone stage (e.g. WAL Recovery) or add tasks directly as you build.
              </p>
              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="clay-btn-primary px-5 py-2.5 text-xs font-bold"
                >
                  + Add First Milestone
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Milestones Hierarchy */}
              {milestones.map((milestone) => {
                const milestoneTasks = milestone.tasks || [];
                const completedMTasks = milestoneTasks.filter((t) => t.status === "COMPLETED").length;
                const mStatus = MILESTONE_STATUS_CONFIG[milestone.status] || MILESTONE_STATUS_CONFIG.UPCOMING;

                return (
                  <div key={milestone.id} className="clay-surface bg-[#10171e] p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 border border-[#232d39]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#232d39] pb-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold ${mStatus.badgeClass}`}>
                            {mStatus.label}
                          </span>
                          <h3 className="font-bold text-white text-sm sm:text-base break-words">{milestone.title}</h3>
                          <span className="text-xs font-semibold text-[#8b98a5]">
                            ({completedMTasks}/{milestoneTasks.length} tasks)
                          </span>
                        </div>
                        {milestone.description && (
                          <p className="text-xs text-[#8b98a5] mt-1 break-words">{milestone.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <button
                          onClick={() => {
                            setTaskTargetMilestoneId(milestone.id);
                            setShowTaskModal(true);
                          }}
                          className="bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 text-[#60a5fa] px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer"
                        >
                          + Add Task
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="text-xs font-semibold text-[#8b98a5] hover:text-red-400 px-2 py-1 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Milestone Tasks */}
                    <div className="space-y-2">
                      {milestoneTasks.length > 0 ? (
                        milestoneTasks.map((task) => {
                          const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                          const isDone = task.status === "COMPLETED";

                          return (
                            <div
                              key={task.id}
                              className="clay-surface bg-[#161e27] p-2.5 sm:p-3 text-xs flex items-center justify-between gap-3 hover:border-[#3b82f6]/40 transition-colors"
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => handleToggleTaskStatus(task)}
                                  className="h-4 w-4 rounded accent-[#10b981] cursor-pointer shrink-0"
                                />
                                <span className={`font-semibold break-words min-w-0 ${isDone ? "line-through text-[#8b98a5]" : "text-white"}`}>
                                  {task.title}
                                </span>
                              </div>

                              <div className="flex items-center space-x-2.5 shrink-0">
                                <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/5 ${priorityInfo.color}`}>
                                  {priorityInfo.label}
                                </span>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-[#8b98a5] hover:text-red-400 p-1 rounded transition cursor-pointer"
                                  title="Delete task"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-[#8b98a5] italic py-1">No tasks in this milestone yet.</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Direct Un-grouped Tasks */}
              {directTasks.length > 0 && (
                <div className="clay-surface bg-[#10171e] p-3.5 sm:p-5 space-y-3 border border-[#232d39]">
                  <h3 className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider text-[#8b98a5]">
                    Direct Project Tasks (Un-grouped)
                  </h3>
                  <div className="space-y-2">
                    {directTasks.map((task) => {
                      const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                      const isDone = task.status === "COMPLETED";

                      return (
                        <div
                          key={task.id}
                          className="clay-surface bg-[#161e27] p-2.5 sm:p-3 text-xs flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => handleToggleTaskStatus(task)}
                              className="h-4 w-4 rounded accent-[#10b981] cursor-pointer shrink-0"
                            />
                            <span className={`font-semibold break-words min-w-0 ${isDone ? "line-through text-[#8b98a5]" : "text-white"}`}>
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2.5 shrink-0">
                            <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/5 ${priorityInfo.color}`}>
                              {priorityInfo.label}
                            </span>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-[#8b98a5] hover:text-red-400 p-1 rounded transition cursor-pointer"
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
        <div className="clay-surface p-4 sm:p-7 space-y-4 sm:space-y-6 border border-[#232d39]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Recent Work & Activity Log</h2>
              <p className="text-xs text-[#8b98a5]">Record coding, debugging, testing, and research sessions for {project.name}</p>
            </div>
            <button
              onClick={() => setShowWorkModal(true)}
              className="clay-btn-primary px-4 py-2 text-xs font-bold w-full sm:w-auto text-center justify-center cursor-pointer"
            >
              + Log Work Session
            </button>
          </div>

          {workSessions.length === 0 ? (
            <div className="clay-surface bg-[#10171e] p-8 text-center space-y-3">
              <div className="text-3xl">⏱</div>
              <div className="font-bold text-white text-lg">No work sessions recorded yet.</div>
              <p className="text-xs text-[#8b98a5]">
                Record your coding sessions and actual work done to build a clean history.
              </p>
              <button
                onClick={() => setShowWorkModal(true)}
                className="clay-btn-primary px-5 py-2.5 text-xs font-bold"
              >
                + Log First Work Session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {workSessions.map((session) => (
                <div key={session.id} className="clay-surface bg-[#10171e] p-5 space-y-3 border border-[#232d39]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-[#10b981]">
                          {formatMinutes(session.durationMinutes)}
                        </span>
                        <span className="text-xs text-[#8b98a5]">· {formatDate(session.occurredAt)}</span>
                        {session.milestone && (
                          <span className="bg-[#1e3a5f] text-[#60a5fa] px-2 py-0.5 rounded text-[11px] font-bold">
                            {session.milestone.title}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{session.summary}</h4>
                    </div>

                    <button
                      onClick={() => handleDeleteWorkSession(session.id)}
                      className="text-[#8b98a5] hover:text-red-400 text-xs font-bold self-end sm:self-center"
                    >
                      Delete
                    </button>
                  </div>

                  {(session.outcome || session.blocker || session.nextStep) && (
                    <div className="bg-[#161e27] p-3 rounded text-xs space-y-1 text-[#8b98a5]">
                      {session.outcome && (
                        <div>
                          <strong className="text-white">Outcome:</strong> {session.outcome}
                        </div>
                      )}
                      {session.blocker && (
                        <div>
                          <strong className="text-[#fb923c]">Blocker:</strong> {session.blocker}
                        </div>
                      )}
                      {session.nextStep && (
                        <div>
                          <strong className="text-[#34d399]">Next Action:</strong> {session.nextStep}
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
        <div className="clay-surface p-4 sm:p-7 space-y-4 sm:space-y-6 border border-[#232d39]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">Technical Context & Decisions</h2>
              <p className="text-xs text-[#8b98a5]">Architectural decisions, links, notes, and lessons learned</p>
            </div>
            <button
              onClick={() => setShowNoteModal(true)}
              className="clay-btn-primary px-4 py-2 text-xs font-bold w-full sm:w-auto text-center justify-center cursor-pointer"
            >
              + Add Technical Note
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="clay-surface bg-[#10171e] p-8 text-center space-y-3">
              <div className="flex justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1e2a38] text-[#60a5fa] shadow-xs">
                  <FileText className="h-6 w-6" strokeWidth={1.8} />
                </span>
              </div>
              <div className="font-bold text-white text-lg">No notes or decisions captured yet.</div>
              <p className="text-xs text-[#8b98a5]">
                Preserve technical context, design tradeoffs, and useful docs right alongside your project code.
              </p>
              <button
                onClick={() => setShowNoteModal(true)}
                className="clay-btn-primary px-5 py-2.5 text-xs font-bold"
              >
                + Add First Note
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {notes.map((note) => (
                <div key={note.id} className="clay-surface bg-[#10171e] p-5 space-y-3 border border-[#232d39] flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-white">{note.title}</h4>
                      {note.category && (
                        <span className="bg-[#1e3a5f] text-[#60a5fa] px-2.5 py-0.5 rounded text-[10px] font-bold">
                          {note.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#e7e9ea] whitespace-pre-wrap">{note.content}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-[#8b98a5]">
                    <span>{formatDate(note.createdAt)}</span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="hover:text-red-400 font-bold"
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
        <div className="clay-surface p-4 sm:p-7 space-y-4 sm:space-y-6 border border-[#232d39]">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Project Progress & Effort Reports</h2>
            <p className="text-xs text-[#8b98a5]">Honest metrics on completed tasks, active days, and logged effort</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="clay-surface bg-[#10171e] p-4 sm:p-5 rounded-lg border border-[#232d39] space-y-1.5 sm:space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#8b98a5]">Task Completion Rate</div>
              <div className="text-2xl sm:text-3xl font-black text-[#34d399]">
                {metrics.taskProgressPercentage !== null ? `${metrics.taskProgressPercentage}%` : "—"}
              </div>
              <div className="text-xs text-[#8b98a5]">
                {metrics.completedTasksCount} of {metrics.totalTasksCount} tasks completed
              </div>
            </div>

            <div className="clay-surface bg-[#10171e] p-4 sm:p-5 rounded-lg border border-[#232d39] space-y-1.5 sm:space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#8b98a5]">Milestones Progress</div>
              <div className="text-2xl sm:text-3xl font-black text-[#60a5fa]">
                {metrics.completedMilestonesCount} / {metrics.totalMilestonesCount}
              </div>
              <div className="text-xs text-[#8b98a5]">Milestones finished</div>
            </div>

            <div className="clay-surface bg-[#10171e] p-4 sm:p-5 rounded-lg border border-[#232d39] space-y-1.5 sm:space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#8b98a5]">Total Effort Invested</div>
              <div className="text-2xl sm:text-3xl font-black text-white">
                {formatMinutes(metrics.totalEffortMinutes)}
              </div>
              <div className="text-xs text-[#8b98a5]">Across {metrics.activeDaysCount} active days</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG WORK SESSION */}
      {showWorkModal && (
        <Portal>
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-xs p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center pt-16 sm:pt-20 pb-8">
              <div className="clay-surface bg-[#161e27] w-full max-w-xl p-7 space-y-5 rounded-xl border border-[#232d39] max-h-[90vh] overflow-y-auto relative my-auto">
            <div className="flex items-center justify-between border-b border-[#232d39] pb-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text-heading)]">Log Work Session</h3>
                <p className="text-xs text-[var(--text-muted)]">Record work done on {project.name}</p>
              </div>
              <button
                onClick={() => setShowWorkModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[#232d39] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLogWorkSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8b98a5]">What did you work on? *</label>
                <input
                  type="text"
                  placeholder="e.g. Implemented B-Tree node split & concurrency locks"
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  required
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
                  autoFocus
                />
              </div>

              {/* Milestone selection */}
              <div>
                <label className="block text-xs font-bold text-[#8b98a5]">Link to Milestone (Optional)</label>
                <select
                  value={workMilestoneId}
                  onChange={(e) => setWorkMilestoneId(e.target.value)}
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm bg-[#10171e]"
                >
                  <option value="">-- General Project Work --</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time presets */}
              <div>
                <label className="block text-xs font-bold text-[#8b98a5]">Duration</label>
                <div className="flex items-center space-x-2 mt-1.5">
                  {[15, 30, 45, 60, 90, 120, 180].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setWorkDuration(mins)}
                      className={`px-3 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                        workDuration === mins
                          ? "bg-[var(--forest-green)] text-white font-extrabold"
                          : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-heading)] border border-[var(--border-default)]"
                      }`}
                    >
                      {formatMinutes(mins)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b98a5]">Outcome / Accomplishment (Optional)</label>
                <textarea
                  placeholder="e.g. All 14 concurrency unit tests passing cleanly."
                  value={workOutcome}
                  onChange={(e) => setWorkOutcome(e.target.value)}
                  rows={2}
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b98a5]">Blocker / Issue (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Page boundary overflow during large keys"
                  value={workBlocker}
                  onChange={(e) => setWorkBlocker(e.target.value)}
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b98a5]">Next Action (Will update project next action)</label>
                <input
                  type="text"
                  placeholder="e.g. Write crash recovery test after WAL replay"
                  value={workNextStep}
                  onChange={(e) => setWorkNextStep(e.target.value)}
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#232d39]">
                <button
                  type="button"
                  onClick={() => setShowWorkModal(false)}
                  className="clay-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="clay-btn-primary px-6 py-2 text-xs font-bold">
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
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-xs p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center pt-16 sm:pt-20 pb-8">
              <div className="clay-surface bg-[#161e27] w-full max-w-lg p-7 space-y-5 rounded-xl border border-[#232d39] relative my-auto">
            <div className="flex items-center justify-between border-b border-[#232d39] pb-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text-heading)]">Add Milestone</h3>
                <p className="text-xs text-[var(--text-muted)]">Define a major stage or focus area</p>
              </div>
              <button
                onClick={() => setShowMilestoneModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[#232d39] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Milestone Title *</label>
                <input
                  type="text"
                  placeholder="e.g. B-Tree Indexing, WAL Recovery"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  required
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
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
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="clay-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="clay-btn-primary px-6 py-2 text-xs font-bold cursor-pointer">
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
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-xs p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center pt-16 sm:pt-20 pb-8">
              <div className="clay-surface bg-[#161e27] w-full max-w-lg p-7 space-y-5 rounded-xl border border-[#232d39] relative my-auto">
            <div className="flex items-center justify-between border-b border-[#232d39] pb-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text-heading)]">Add Task</h3>
                <p className="text-xs text-[var(--text-muted)]">Create an actionable task for {project.name}</p>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[#232d39] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Implement leaf node split logic"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Milestone</label>
                <select
                  value={taskTargetMilestoneId}
                  onChange={(e) => setTaskTargetMilestoneId(e.target.value)}
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm bg-[var(--surface-dialog)]"
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
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm bg-[var(--surface-dialog)]"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="clay-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="clay-btn-primary px-6 py-2 text-xs font-bold cursor-pointer">
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
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-xs p-4 sm:p-6">
            <div className="flex min-h-full items-center justify-center pt-16 sm:pt-20 pb-8">
              <div className="clay-surface bg-[#161e27] w-full max-w-lg p-7 space-y-5 rounded-xl border border-[#232d39] relative my-auto">
            <div className="flex items-center justify-between border-b border-[#232d39] pb-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text-heading)]">Add Technical Note / Decision</h3>
                <p className="text-xs text-[var(--text-muted)]">Capture context, architectural choices, and lessons learned</p>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[#232d39] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8b98a5]">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. WAL Frame Header Architecture"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  required
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b98a5]">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Architectural Decision, Resource, Lesson Learned"
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8b98a5]">Content *</label>
                <textarea
                  placeholder="Explain technical context, tradeoffs, links..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  required
                  rows={4}
                  className="clay-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#232d39]">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="clay-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="clay-btn-primary px-6 py-2 text-xs font-bold">
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
