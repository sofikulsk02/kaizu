"use client";

import React, { useState, useEffect } from "react";
import {
  Api,
  GoalDetail,
  GoalTask,
  Milestone,
  GoalStatus,
  MilestoneStatus,
  TaskStatus,
  TaskPriority,
  CoachAnalysis,
} from "../lib/api";
import {
  ArrowLeft,
  Pencil,
  Clock,
  Target,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  Zap,
  Sprout,
  Map,
  Check,
  Plus,
  Bot,
  Trash2,
  Calendar,
  X,
} from "lucide-react";

interface GoalDetailViewProps {
  goalDetail: GoalDetail;
  onBack: () => void;
  onRefresh: () => void;
}

export const GoalDetailView: React.FC<GoalDetailViewProps> = ({
  goalDetail,
  onBack,
  onRefresh,
}) => {
  const [activeTabSection, setActiveTabSection] = useState<
    "focus" | "plan" | "tasks" | "actions" | "reflection"
  >("focus");

  // Coach Analysis State
  const [coachAnalysis, setCoachAnalysis] = useState<CoachAnalysis | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [generatingBreakdown, setGeneratingBreakdown] = useState(false);

  // Modal / Form States
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showLogAction, setShowLogAction] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);

  // Selected Milestone for Task Creation
  const [targetMilestoneId, setTargetMilestoneId] = useState<string | undefined>(undefined);

  // Add Milestone Form State
  const [msTitle, setMsTitle] = useState("");
  const [msDesc, setMsDesc] = useState("");
  const [msTargetDate, setMsTargetDate] = useState("");
  const [loadingMilestone, setLoadingMilestone] = useState(false);

  // Edit Milestone State
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editMsTitle, setEditMsTitle] = useState("");
  const [editMsDesc, setEditMsDesc] = useState("");
  const [editMsTargetDate, setEditMsTargetDate] = useState("");
  const [editMsStatus, setEditMsStatus] = useState<MilestoneStatus>("UPCOMING");
  const [loadingEditMilestone, setLoadingEditMilestone] = useState(false);

  // Deleting Milestone State
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);

  // Add Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskEstimate, setTaskEstimate] = useState<number | "">("");
  const [loadingTask, setLoadingTask] = useState(false);

  // Log Daily Action Form State
  const [actSummary, setActSummary] = useState("");
  const [actDuration, setActDuration] = useState<number | "">("");
  const [actTaskId, setActTaskId] = useState<string>("");
  const [actMilestoneId, setActMilestoneId] = useState<string>("");
  const [actOutcome, setActOutcome] = useState("");
  const [actBlocker, setActBlocker] = useState("");
  const [actNextStep, setActNextStep] = useState("");
  const [showReflectionInputs, setShowReflectionInputs] = useState(false);
  const [refWentWell, setRefWentWell] = useState("");
  const [refDifficulty, setRefDifficulty] = useState("");
  const [refLearning, setRefLearning] = useState("");
  const [refNextChange, setRefNextChange] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  // Goal Edit Form State
  const [editTitle, setEditTitle] = useState(goalDetail.title);
  const [editDesc, setEditDesc] = useState(goalDetail.description || "");
  const [editCategory, setEditCategory] = useState(goalDetail.category || "");
  const [editSuccess, setEditSuccess] = useState(goalDetail.successDefinition || "");
  const [editTargetDate, setEditTargetDate] = useState(
    goalDetail.targetDate ? goalDetail.targetDate.split("T")[0] : ""
  );
  const [editStatus, setEditStatus] = useState<GoalStatus>(goalDetail.status);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Load Intelligent Goal Coach Analysis
  useEffect(() => {
    let isMounted = true;
    setLoadingCoach(true);
    Api.getCoachAnalysis(goalDetail.id)
      .then((data) => {
        if (isMounted) setCoachAnalysis(data);
      })
      .catch((err) => console.error("Coach analysis error:", err))
      .finally(() => {
        if (isMounted) setLoadingCoach(false);
      });

    return () => {
      isMounted = false;
    };
  }, [goalDetail.id, goalDetail.updatedAt]);

  const handleGenerateBreakdown = async () => {
    setGeneratingBreakdown(true);
    try {
      await Api.generateGoalBreakdown(goalDetail.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to generate plan breakdown");
    } finally {
      setGeneratingBreakdown(false);
    }
  };

  // Handlers
  const handleToggleTaskStatus = async (task: GoalTask) => {
    try {
      const newStatus: TaskStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
      await Api.updateGoalTask(goalDetail.id, task.id, { status: newStatus });
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to update task status");
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle.trim()) return;
    setLoadingMilestone(true);
    try {
      await Api.createMilestone(goalDetail.id, {
        title: msTitle.trim(),
        description: msDesc.trim() || undefined,
        targetDate: msTargetDate || undefined,
      });
      setMsTitle("");
      setMsDesc("");
      setMsTargetDate("");
      setShowAddMilestone(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to create milestone");
    } finally {
      setLoadingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string, milestoneTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete milestone "${milestoneTitle}"? Any tasks in this milestone will remain in the goal without a milestone.`
      )
    ) {
      return;
    }
    setDeletingMilestoneId(milestoneId);
    try {
      await Api.deleteMilestone(goalDetail.id, milestoneId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete milestone");
    } finally {
      setDeletingMilestoneId(null);
    }
  };

  const handleOpenEditMilestone = (ms: Milestone) => {
    setEditingMilestone(ms);
    setEditMsTitle(ms.title);
    setEditMsDesc(ms.description || "");
    setEditMsTargetDate(ms.targetDate ? ms.targetDate.split("T")[0] : "");
    setEditMsStatus(ms.status);
  };

  const handleSaveMilestoneEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone || !editMsTitle.trim()) return;
    setLoadingEditMilestone(true);
    try {
      await Api.updateMilestone(goalDetail.id, editingMilestone.id, {
        title: editMsTitle.trim(),
        description: editMsDesc.trim() || null,
        targetDate: editMsTargetDate || null,
        status: editMsStatus,
      });
      setEditingMilestone(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to update milestone");
    } finally {
      setLoadingEditMilestone(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await Api.deleteGoalTask(goalDetail.id, taskId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete task");
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setLoadingTask(true);
    try {
      await Api.createGoalTask(goalDetail.id, {
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        milestoneId: targetMilestoneId,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        estimateMinutes: typeof taskEstimate === "number" ? taskEstimate : undefined,
      });
      setTaskTitle("");
      setTaskDesc("");
      setTaskDueDate("");
      setTaskEstimate("");
      setShowAddTask(false);
      setTargetMilestoneId(undefined);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to create task");
    } finally {
      setLoadingTask(false);
    }
  };

  const handleLogDailyAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actSummary.trim()) return;
    setLoadingAction(true);
    try {
      await Api.createDailyAction(goalDetail.id, {
        summary: actSummary.trim(),
        taskId: actTaskId || undefined,
        milestoneId: actMilestoneId || undefined,
        durationMinutes: typeof actDuration === "number" ? actDuration : undefined,
        outcome: actOutcome.trim() || undefined,
        blocker: actBlocker.trim() || undefined,
        nextStep: actNextStep.trim() || undefined,
        reflection: showReflectionInputs
          ? {
              wentWell: refWentWell.trim() || undefined,
              difficulty: refDifficulty.trim() || undefined,
              learning: refLearning.trim() || undefined,
              nextChange: refNextChange.trim() || undefined,
            }
          : undefined,
      });
      setActSummary("");
      setActDuration("");
      setActTaskId("");
      setActMilestoneId("");
      setActOutcome("");
      setActBlocker("");
      setActNextStep("");
      setRefWentWell("");
      setRefDifficulty("");
      setRefLearning("");
      setRefNextChange("");
      setShowReflectionInputs(false);
      setShowLogAction(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to log daily action");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSaveGoalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingEdit(true);
    try {
      await Api.updateGoal(goalDetail.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
        category: editCategory.trim() || undefined,
        successDefinition: editSuccess.trim() || undefined,
        targetDate: editTargetDate || undefined,
        status: editStatus,
      });
      setShowEditGoal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to update goal");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (confirm("Are you sure you want to delete this goal and all its milestones and tasks?")) {
      try {
        await Api.deleteGoal(goalDetail.id);
        onBack();
      } catch (err: any) {
        alert(err.message || "Failed to delete goal");
      }
    }
  };

  const handleCreateTaskFromNextStep = (nextStepText: string) => {
    setTaskTitle(nextStepText);
    setShowAddTask(true);
  };

  // Metrics
  const { metrics, todaysFocusTask } = goalDetail;
  const formattedTargetDate = goalDetail.targetDate
    ? new Date(goalDetail.targetDate).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-3 sm:space-y-4 pb-6">
      {/* Top Header Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="paper-btn-secondary px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold flex items-center space-x-1.5 group shadow-2xs cursor-pointer active:scale-95 shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 text-[var(--crimson)]" />
          <span className="hidden sm:inline">Back to Goals</span>
          <span className="sm:hidden">Goals</span>
          {goalDetail.category && (
            <span className="hidden md:inline text-[var(--text-muted)] font-normal ml-1">
              / {goalDetail.category}
            </span>
          )}
        </button>

        {/* Action Group */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <button
            onClick={() => setShowLogAction(true)}
            className="paper-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log Work / Action</span>
            <span className="sm:hidden">Log Action</span>
          </button>

          <button
            onClick={() => setShowEditGoal(true)}
            className="paper-btn-secondary px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer active:scale-95"
            title="Edit Goal"
          >
            <Pencil className="h-3 w-3" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            onClick={handleDeleteGoal}
            className="paper-btn-danger px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer active:scale-95"
            title="Delete Goal"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Goal Hero Header & Analytics */}
      <div className="paper-card p-3 sm:p-4 space-y-2.5 sm:space-y-3 border border-[var(--border-default)]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="paper-badge px-2.5 py-0.5 text-[11px] font-bold text-[var(--forest-green)]">
              {goalDetail.category || "Career / Goal"}
            </span>
            <span
              className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-md ${
                goalDetail.status === "COMPLETED"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : goalDetail.status === "PAUSED"
                  ? "bg-amber-500/20 text-amber-400"
                  : goalDetail.status === "STOPPED"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-[var(--surface-secondary)] text-[var(--text-heading)] border border-[var(--border-default)]"
              }`}
            >
              {goalDetail.status}
            </span>
            {formattedTargetDate && (
              <span className="text-[11px] font-medium text-[var(--text-muted)] inline-flex items-center gap-1 ml-1">
                <Calendar className="h-3 w-3" />
                Target: {formattedTargetDate}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--text-heading)] leading-tight">
            {goalDetail.title}
          </h1>

          {goalDetail.description && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
              {goalDetail.description}
            </p>
          )}

          {goalDetail.successDefinition && (
            <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 sm:p-3 rounded-lg text-xs space-y-1 border border-[var(--border-subtle)]">
              <div className="font-extrabold uppercase tracking-wider text-[var(--crimson)] inline-flex items-center gap-1.5 text-[10px] sm:text-[11px]">
                <Target className="h-3.5 w-3.5" />
                <span>Success Criteria / Desired Outcome</span>
              </div>
              <div className="text-[var(--text-heading)] font-medium leading-relaxed">
                {goalDetail.successDefinition}
              </div>
            </div>
          )}

          {/* Integrated Execution Progress Bar */}
          <div className="mt-2.5 p-2 sm:p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] flex items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 min-w-0">
              <Sparkles className="h-4 w-4 text-[var(--forest-green)] shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-[var(--text-heading)] truncate block">
                  Execution Progress
                </span>
                <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] block truncate">
                  {metrics.completedTasksCount} of {metrics.totalTasksCount} tasks completed
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2.5 shrink-0">
              <div className="w-20 sm:w-36 h-2 bg-[var(--border-default)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--forest-green)] transition-all duration-500 rounded-full"
                  style={{ width: `${metrics.taskProgressPercentage ?? 0}%` }}
                />
              </div>
              <span className="text-xs font-black text-[var(--forest-green)] min-w-[32px] text-right">
                {metrics.taskProgressPercentage !== null ? `${metrics.taskProgressPercentage}%` : "0%"}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Analytics Metrics Cards with Balanced 2x2 Mobile Proportions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-1 border-t border-[var(--border-subtle)]">
          <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-3 border border-[var(--border-default)] card-lift">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Milestones</span>
              <Map className="h-3.5 w-3.5 text-[var(--forest-green)]" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-[var(--text-heading)] mt-1">
              {metrics.completedMilestonesCount} / {metrics.totalMilestonesCount}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">
              {metrics.totalMilestonesCount > 0 ? "Stages reached" : "No milestones"}
            </div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-3 border border-[var(--border-default)] card-lift">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Tasks Done</span>
              <Check className="h-3.5 w-3.5 text-[var(--forest-green)]" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-[var(--forest-green)] mt-1">
              {metrics.completedTasksCount} / {metrics.totalTasksCount}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">Actionable items</div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-3 border border-[var(--border-default)] card-lift">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Logged Effort</span>
              <Clock className="h-3.5 w-3.5 text-[var(--crimson)]" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-[var(--crimson)] mt-1">
              {metrics.totalDurationMinutes > 0
                ? `${Math.floor(metrics.totalDurationMinutes / 60)}h ${metrics.totalDurationMinutes % 60}m`
                : "0m"}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">Actual time recorded</div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-3 border border-[var(--border-default)] card-lift">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Consistency</span>
              <Zap className="h-3.5 w-3.5 text-[var(--forest-green)]" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-[var(--text-heading)] mt-1">
              {metrics.activeDaysCount} {metrics.activeDaysCount === 1 ? "day" : "days"}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">Active effort days</div>
          </div>
        </div>
      </div>

      {/* INTELLIGENT GOAL COACH WIDGET */}
      {coachAnalysis && (
        <div className="paper-card p-3 sm:p-4 space-y-2.5 bg-[var(--surface-secondary)] border border-[var(--forest-green)]/30 rounded-xl card-lift">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="paper-badge bg-[var(--surface-primary)] px-2.5 py-0.5 text-xs font-black text-[var(--forest-green)] inline-flex items-center gap-1.5 border border-[var(--border-default)]">
                <Bot className="h-3.5 w-3.5" />
                <span>GOAL COACH</span>
              </span>
              {coachAnalysis.isStalled && (
                <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-extrabold inline-flex items-center gap-1 bg-red-500/20 text-red-300 border border-red-500/30">
                  <AlertTriangle className="h-3 w-3" />
                  <span>STALLED GOAL</span>
                </span>
              )}
            </div>

            <button
              onClick={handleGenerateBreakdown}
              disabled={generatingBreakdown}
              className="paper-btn-primary px-3 sm:px-3.5 py-1.5 text-xs font-extrabold shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-95 self-start sm:self-auto"
            >
              {generatingBreakdown ? (
                "Generating..."
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="sm:hidden">Auto-Breakdown</span>
                  <span className="hidden sm:inline">Auto-Breakdown into Milestones & Tasks</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-1.5">
            <div className="font-semibold text-xs sm:text-sm text-[var(--text-heading)] inline-flex items-start gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{coachAnalysis.advice}</span>
            </div>
            {coachAnalysis.stalledReason && (
              <p className="text-amber-500 text-xs font-medium pl-5">
                {coachAnalysis.stalledReason}
              </p>
            )}
          </div>

          {coachAnalysis.recurringBlockers.length > 0 && (
            <div className="pt-1 text-xs">
              <span className="font-bold text-[var(--text-muted)] text-[11px]">Recurring Blockers: </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {coachAnalysis.recurringBlockers.map((b, i) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] font-medium rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. TODAY'S FOCUS SECTION */}
      <div className="paper-card bg-[var(--surface-secondary)] p-3 sm:p-4 space-y-2.5 border border-[var(--border-default)] card-lift">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="inline-flex items-center space-x-1.5 paper-badge px-2.5 py-0.5 text-[11px] font-bold text-[var(--forest-green)]">
              <Zap className="h-3.5 w-3.5" />
              <span>TODAY'S FOCUS WORKFLOW</span>
            </div>
            <h2 className="mt-1 text-base sm:text-xl font-black text-[var(--text-heading)] leading-snug">
              What is one meaningful action you can do next?
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Focus on execution over clutter. Choose your next step and record your actual effort.
            </p>
          </div>

          <button
            onClick={() => setShowLogAction(true)}
            className="paper-btn-primary px-3.5 sm:px-4 py-2 text-xs font-black shadow-xs self-start sm:self-auto cursor-pointer inline-flex items-center gap-1.5 active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log What I Did Today</span>
          </button>
        </div>

        {todaysFocusTask ? (
          <div className="paper-card bg-[var(--surface-primary)] p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-[var(--border-default)]">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[10px] font-black rounded bg-[var(--surface-secondary)] text-[var(--forest-green)] border border-[var(--border-default)]">
                  {todaysFocusTask.priority} PRIORITY
                </span>
                {todaysFocusTask.estimateMinutes && (
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{todaysFocusTask.estimateMinutes}m est.
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-heading)] truncate">{todaysFocusTask.title}</h3>
              {todaysFocusTask.description && (
                <p className="text-xs text-[var(--text-muted)] line-clamp-2">{todaysFocusTask.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => handleToggleTaskStatus(todaysFocusTask)}
                className="paper-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Complete Task</span>
              </button>
              <button
                onClick={() => {
                  setActTaskId(todaysFocusTask.id);
                  setActSummary(`Worked on: ${todaysFocusTask.title}`);
                  setShowLogAction(true);
                }}
                className="paper-btn-secondary px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Log Work</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="paper-card bg-[var(--surface-primary)] p-4 sm:p-6 text-center space-y-2 rounded-xl border border-dashed border-[var(--border-default)]">
            <div className="flex justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--forest-green)] shadow-2xs">
                <Sprout className="h-5 w-5" strokeWidth={1.8} />
              </span>
            </div>
            <div className="font-bold text-[var(--text-heading)] text-xs sm:text-sm">
              No tasks planned yet. Choose your next step.
            </div>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Start by adding a task or milestone, or log work directly without needing a predefined plan.
            </p>
            <div className="flex justify-center gap-2 pt-1">
              <button
                onClick={() => {
                  setTargetMilestoneId(undefined);
                  setShowAddTask(true);
                }}
                className="paper-btn-secondary px-3 py-1.5 text-xs font-bold cursor-pointer"
              >
                + Add Task
              </button>
              <button
                onClick={() => setShowAddMilestone(true)}
                className="paper-btn-secondary px-3 py-1.5 text-xs font-bold cursor-pointer"
              >
                + Add Milestone
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs matching SubjectDetailView */}
      <div className="flex space-x-1 sm:space-x-4 border-b border-[var(--border-default)] text-xs font-bold overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTabSection("focus")}
          className={`pb-2.5 pt-1 px-2.5 sm:px-2 transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
            activeTabSection === "focus" || activeTabSection === "plan"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-black"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-heading)]"
          }`}
        >
          <Map className="h-3.5 w-3.5 text-[var(--forest-green)]" />
          <span className="sm:hidden">Milestones</span>
          <span className="hidden sm:inline">Plan & Milestones</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--surface-secondary)] text-[var(--text-muted)]">
            {goalDetail.milestones.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSection("tasks")}
          className={`pb-2.5 pt-1 px-2.5 sm:px-2 transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
            activeTabSection === "tasks"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-black"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-heading)]"
          }`}
        >
          <Check className="h-3.5 w-3.5 text-[var(--forest-green)]" />
          <span>Tasks</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--surface-secondary)] text-[var(--text-muted)]">
            {goalDetail.tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSection("actions")}
          className={`pb-2.5 pt-1 px-2.5 sm:px-2 transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
            activeTabSection === "actions"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-black"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-heading)]"
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-[var(--crimson)]" />
          <span className="sm:hidden">Actions</span>
          <span className="hidden sm:inline">Daily Actions</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--surface-secondary)] text-[var(--text-muted)]">
            {goalDetail.dailyActions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabSection("reflection")}
          className={`pb-2.5 pt-1 px-2.5 sm:px-2 transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
            activeTabSection === "reflection"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-black"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-heading)]"
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span className="sm:hidden">Reflections</span>
          <span className="hidden sm:inline">Hansei & Reflections</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--surface-secondary)] text-[var(--text-muted)]">
            {goalDetail.reflections.length}
          </span>
        </button>
      </div>

      {/* 2. PLAN & MILESTONES SECTION */}
      {(activeTabSection === "focus" || activeTabSection === "plan") && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-base sm:text-xl font-black text-[var(--text-heading)]">Plan & Milestones</h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
                Break the outcome into meaningful stages
              </p>
            </div>
            <button
              onClick={() => setShowAddMilestone(true)}
              className="paper-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold flex items-center space-x-1 shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Milestone</span>
            </button>
          </div>

          {goalDetail.milestones.length === 0 ? (
            <div className="paper-card p-6 sm:p-8 text-center space-y-3 bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded-xl">
              <div className="flex justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-primary)] text-[var(--forest-green)] shadow-xs">
                  <Map className="h-6 w-6" strokeWidth={1.8} />
                </span>
              </div>
              <div className="font-bold text-[var(--text-heading)] text-base">No milestones added yet</div>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                Add milestones when you know the major stages required to achieve this goal.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  onClick={() => setShowAddMilestone(true)}
                  className="paper-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add First Milestone</span>
                </button>
                <button
                  onClick={handleGenerateBreakdown}
                  disabled={generatingBreakdown}
                  className="paper-btn-primary px-4 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {generatingBreakdown ? (
                    <>
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Generating Plan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Auto-Suggest Milestones</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {goalDetail.milestones.map((ms, idx) => {
                const msCompletedTasks = ms.tasks.filter((t) => t.status === "COMPLETED").length;
                return (
                  <div key={ms.id} className="paper-card p-3 sm:p-4 space-y-2.5 border border-[var(--border-default)] rounded-xl shadow-2xs hover:border-[var(--border-strong)] transition-all">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[var(--forest-green)] text-white font-black text-xs shrink-0 shadow-2xs">
                          {String(idx + 1).padStart(2, "0")}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h3 className="font-extrabold text-[var(--text-heading)] text-sm sm:text-base truncate">{ms.title}</h3>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded shrink-0 ${
                                ms.status === "COMPLETED"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-[var(--surface-secondary)] text-[var(--text-muted)]"
                              }`}
                            >
                              {ms.status}
                            </span>
                          </div>
                          {ms.description && (
                            <p className="text-[11px] text-[var(--text-muted)] truncate">{ms.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                        <span className="hidden sm:inline text-xs font-bold text-[var(--text-muted)]">
                          {msCompletedTasks} / {ms.tasks.length} tasks
                        </span>
                        <button
                          onClick={() => {
                            setTargetMilestoneId(ms.id);
                            setShowAddTask(true);
                          }}
                          className="btn-pill-action px-2.5 py-1 text-xs font-bold space-x-1 cursor-pointer active:scale-95"
                          title="Add task to milestone"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Task</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditMilestone(ms)}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                          title="Edit milestone"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMilestone(ms.id, ms.title)}
                          disabled={deletingMilestoneId === ms.id}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete milestone"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Milestone Child Tasks */}
                    {ms.tasks.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        {ms.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="paper-card bg-[var(--surface-primary)] p-2.5 sm:p-3 rounded-lg border border-[var(--border-default)] flex items-center justify-between gap-2.5 text-xs hover:border-[var(--forest-green)] transition-all"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={task.status === "COMPLETED"}
                                onChange={() => handleToggleTaskStatus(task)}
                                className="h-4 w-4 rounded accent-[var(--forest-green)] cursor-pointer shrink-0"
                              />
                              <span
                                className={`font-bold truncate ${
                                  task.status === "COMPLETED"
                                    ? "line-through text-[var(--text-muted)]"
                                    : "text-[var(--text-heading)]"
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-[var(--surface-secondary)] text-[var(--text-muted)]">
                                {task.priority}
                              </span>
                              {task.estimateMinutes && (
                                <span className="text-[10px] text-[var(--text-muted)] font-semibold">
                                  {task.estimateMinutes}m
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-400 hover:text-red-500 cursor-pointer p-1 transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--text-muted)] italic py-2 px-3 bg-[var(--surface-secondary)]/50 rounded-lg border border-dashed border-[var(--border-default)]">
                        No tasks in this milestone yet. Click "+ Task" to add one.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. TASKS SECTION (Unfinished / All Tasks) */}
      {activeTabSection === "tasks" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-base sm:text-xl font-black text-[var(--text-heading)]">Tasks & Actionable Work</h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
                Manage specific steps required for this goal
              </p>
            </div>
            <button
              onClick={() => {
                setTargetMilestoneId(undefined);
                setShowAddTask(true);
              }}
              className="paper-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold flex items-center space-x-1 shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {goalDetail.tasks.length === 0 ? (
            <div className="paper-card bg-[var(--surface-secondary)] p-6 sm:p-8 text-center text-xs text-[var(--text-muted)] rounded-xl border border-[var(--border-default)]">
              No tasks defined yet. Click "+ Add Task" to create one.
            </div>
          ) : (
            <div className="space-y-2">
              {goalDetail.tasks.map((task) => (
                <div
                  key={task.id}
                  className="paper-card bg-[var(--surface-primary)] p-2.5 sm:p-3 rounded-xl border border-[var(--border-default)] flex items-center justify-between gap-2.5 text-xs shadow-2xs hover:border-[var(--forest-green)] transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.status === "COMPLETED"}
                      onChange={() => handleToggleTaskStatus(task)}
                      className="h-4 w-4 rounded accent-[var(--forest-green)] cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div
                        className={`font-bold truncate ${
                          task.status === "COMPLETED"
                            ? "line-through text-[var(--text-muted)]"
                            : "text-[var(--text-heading)]"
                        }`}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-[var(--surface-secondary)] text-[var(--forest-green)] border border-[var(--border-default)]">
                      {task.priority}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-[11px] font-bold text-red-400 hover:text-red-500 cursor-pointer p-1"
                      title="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. DAILY ACTIONS SECTION */}
      {activeTabSection === "actions" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-base sm:text-xl font-black text-[var(--text-heading)]">Daily Actions Log</h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
                Record of work actually performed toward this goal
              </p>
            </div>
            <button
              onClick={() => setShowLogAction(true)}
              className="paper-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold flex items-center space-x-1 shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Work</span>
            </button>
          </div>

          {goalDetail.dailyActions.length === 0 ? (
            <div className="paper-card bg-[var(--surface-secondary)] p-6 sm:p-8 text-center text-xs text-[var(--text-muted)] rounded-xl border border-[var(--border-default)]">
              No daily actions logged yet. Log what you actually did today to build evidence of progress!
            </div>
          ) : (
            <div className="space-y-2.5">
              {goalDetail.dailyActions.map((action) => (
                <div key={action.id} className="paper-card bg-[var(--surface-primary)] p-3 sm:p-3.5 space-y-2 rounded-xl border border-[var(--border-default)] shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-[var(--forest-green)] flex items-center gap-1.5">
                        <span>
                          {new Date(action.occurredAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {action.durationMinutes && (
                          <span className="text-[var(--text-muted)] font-normal inline-flex items-center gap-1">
                            · <Clock className="h-3 w-3 inline" /> {action.durationMinutes} mins
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-[var(--text-heading)] mt-0.5">{action.summary}</h4>
                    </div>
                    <button
                      onClick={() => Api.deleteDailyAction(goalDetail.id, action.id).then(onRefresh)}
                      className="text-red-400 hover:text-red-500 cursor-pointer p-1 shrink-0"
                      title="Delete action"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {action.outcome && (
                    <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 rounded-lg text-xs border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <strong className="text-[var(--forest-green)]">Accomplishment:</strong>{" "}
                      {action.outcome}
                    </div>
                  )}

                  {action.blocker && (
                    <div className="paper-inset bg-amber-500/10 p-2.5 rounded-lg text-xs border border-amber-500/20 text-amber-300">
                      <strong>Blocker / Difficulty:</strong> {action.blocker}
                    </div>
                  )}

                  {action.nextStep && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-[var(--pale-sage)] text-[var(--forest-green)] p-2.5 rounded-lg border border-[var(--sage)]/40">
                      <div>
                        <strong>Next Step:</strong> {action.nextStep}
                      </div>
                      <button
                        onClick={() => handleCreateTaskFromNextStep(action.nextStep!)}
                        className="paper-btn-secondary px-2.5 py-1 text-[10px] font-bold cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        + Convert to Task
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. REFLECTION & HANSEI SECTION */}
      {activeTabSection === "reflection" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="pb-2 border-b border-[var(--border-subtle)]">
            <h2 className="text-base sm:text-xl font-black text-[var(--text-heading)]">Hansei & Reflections</h2>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
              Interpret what happened, capture learnings, and adjust your execution loop.
            </p>
          </div>

          {goalDetail.reflections.length === 0 ? (
            <div className="paper-card bg-[var(--surface-secondary)] p-6 sm:p-8 text-center text-xs text-[var(--text-muted)] rounded-xl border border-[var(--border-default)]">
              No reflections recorded yet. Add a reflection when logging work or reviewing progress.
            </div>
          ) : (
            <div className="space-y-2.5">
              {goalDetail.reflections.map((ref) => (
                <div key={ref.id} className="paper-card bg-[var(--surface-primary)] p-3 sm:p-3.5 space-y-2 rounded-xl border border-[var(--border-default)] shadow-2xs">
                  <div className="text-xs font-bold text-[var(--forest-green)]">
                    Reflection on {new Date(ref.createdAt).toLocaleDateString()}
                  </div>
                  {ref.wentWell && (
                    <div className="text-xs text-emerald-400">
                      <strong>What went well?</strong> {ref.wentWell}
                    </div>
                  )}
                  {ref.difficulty && (
                    <div className="text-xs text-amber-400">
                      <strong>What was difficult?</strong> {ref.difficulty}
                    </div>
                  )}
                  {ref.learning && (
                    <div className="text-xs text-sky-400">
                      <strong>What did I learn?</strong> {ref.learning}
                    </div>
                  )}
                  {ref.nextChange && (
                    <div className="text-xs text-rose-400">
                      <strong>What will I change next time?</strong> {ref.nextChange}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD MILESTONE */}
      {showAddMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="paper-card bg-[var(--surface-primary)] w-full max-w-md p-5 sm:p-6 space-y-4 rounded-2xl border border-[var(--border-default)] shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-black text-[var(--text-heading)]">Add Milestone / Stage</h3>
              <button
                type="button"
                onClick={() => setShowAddMilestone(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateMilestone} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Choose target repository and contribute PR"
                  value={msTitle}
                  onChange={(e) => setMsTitle(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="What major outcome must happen in this stage?"
                  value={msDesc}
                  onChange={(e) => setMsDesc(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs h-20"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={msTargetDate}
                  onChange={(e) => setMsTargetDate(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMilestone(false)}
                  className="paper-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingMilestone}
                  className="paper-btn-primary px-5 py-2 text-xs font-extrabold cursor-pointer"
                >
                  {loadingMilestone ? "Creating..." : "Save Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MILESTONE */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="paper-card bg-[var(--surface-primary)] w-full max-w-md p-5 sm:p-6 space-y-4 rounded-2xl border border-[var(--border-default)] shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-black text-[var(--text-heading)]">Edit Milestone</h3>
              <button
                type="button"
                onClick={() => setEditingMilestone(null)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMilestoneEdit} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={editMsTitle}
                  onChange={(e) => setEditMsTitle(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Status
                </label>
                <select
                  value={editMsStatus}
                  onChange={(e) => setEditMsStatus(e.target.value as MilestoneStatus)}
                  className="paper-input w-full p-2.5 text-xs font-semibold"
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="What major outcome must happen in this stage?"
                  value={editMsDesc}
                  onChange={(e) => setEditMsDesc(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs h-20"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={editMsTargetDate}
                  onChange={(e) => setEditMsTargetDate(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = editingMilestone.id;
                    const titleToDelete = editingMilestone.title;
                    setEditingMilestone(null);
                    handleDeleteMilestone(idToDelete, titleToDelete);
                  }}
                  className="paper-btn-danger px-3 py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingMilestone(null)}
                    className="paper-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingEditMilestone}
                    className="paper-btn-primary px-5 py-2 text-xs font-extrabold cursor-pointer"
                  >
                    {loadingEditMilestone ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="paper-card bg-[var(--surface-primary)] w-full max-w-md p-5 sm:p-6 space-y-4 rounded-2xl border border-[var(--border-default)] shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-black text-[var(--text-heading)]">Add Actionable Task</h3>
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read contribution guide"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="paper-input w-full p-2.5 text-xs"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Milestone (Optional)
                </label>
                <select
                  value={targetMilestoneId || ""}
                  onChange={(e) => setTargetMilestoneId(e.target.value || undefined)}
                  className="paper-input w-full p-2.5 text-xs"
                >
                  <option value="">Direct Goal Task (No Milestone)</option>
                  {goalDetail.milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                    Estimate (Mins)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={taskEstimate}
                    onChange={(e) =>
                      setTaskEstimate(e.target.value ? parseInt(e.target.value) : "")
                    }
                    className="paper-input w-full p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="paper-input w-full p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="paper-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingTask}
                  className="paper-btn-primary px-5 py-2 text-xs font-extrabold cursor-pointer"
                >
                  {loadingTask ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG DAILY ACTION & WORK */}
      {showLogAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="paper-card bg-[var(--surface-primary)] w-full max-w-lg p-5 sm:p-6 space-y-4 rounded-2xl border border-[var(--border-default)] shadow-xl my-6">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-black text-[var(--text-heading)]">Log Work & Action</h3>
              <button
                type="button"
                onClick={() => setShowLogAction(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleLogDailyAction} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  What did you work on today? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read contribution guide and explored issue tracker"
                  value={actSummary}
                  onChange={(e) => setActSummary(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs font-semibold"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                    Time Spent (Mins)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={actDuration}
                    onChange={(e) =>
                      setActDuration(e.target.value ? parseInt(e.target.value) : "")
                    }
                    className="paper-input w-full p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                    Related Task (Optional)
                  </label>
                  <select
                    value={actTaskId}
                    onChange={(e) => setActTaskId(e.target.value)}
                    className="paper-input w-full p-2.5 text-xs"
                  >
                    <option value="">None / General Work</option>
                    {goalDetail.tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  What did you accomplish / outcome?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Understood repo structure and found 3 issues"
                  value={actOutcome}
                  onChange={(e) => setActOutcome(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Blockers / Difficulties (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Build setup failed initially"
                  value={actBlocker}
                  onChange={(e) => setActBlocker(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  What is the next step? (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Set up project locally and reproduce issue #12"
                  value={actNextStep}
                  onChange={(e) => setActNextStep(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs"
                />
              </div>

              {/* Optional Hansei Reflection Toggle */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowReflectionInputs(!showReflectionInputs)}
                  className="text-xs font-bold text-[var(--forest-green)] hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>{showReflectionInputs ? "▼ Hide Reflection" : "▶ Add Optional Reflection (Hansei)"}</span>
                </button>

                {showReflectionInputs && (
                  <div className="space-y-2.5 pt-2.5 pl-2.5 border-l-2 border-[var(--forest-green)]">
                    <div>
                      <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                        What went well?
                      </label>
                      <input
                        type="text"
                        value={refWentWell}
                        onChange={(e) => setRefWentWell(e.target.value)}
                        className="paper-input w-full p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                        What did you learn?
                      </label>
                      <input
                        type="text"
                        value={refLearning}
                        onChange={(e) => setRefLearning(e.target.value)}
                        className="paper-input w-full p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                        What should you do differently next time?
                      </label>
                      <input
                        type="text"
                        value={refNextChange}
                        onChange={(e) => setRefNextChange(e.target.value)}
                        className="paper-input w-full p-2 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogAction(false)}
                  className="paper-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="paper-btn-primary px-5 py-2 text-xs font-extrabold cursor-pointer"
                >
                  {loadingAction ? "Saving..." : "Save Daily Work"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT GOAL */}
      {showEditGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="paper-card bg-[var(--surface-primary)] w-full max-w-lg p-5 sm:p-6 space-y-4 rounded-2xl border border-[var(--border-default)] shadow-xl my-6">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-base font-black text-[var(--text-heading)]">Edit Goal Details</h3>
              <button
                type="button"
                onClick={() => setShowEditGoal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveGoalEdit} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Career, Learning"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="paper-input w-full p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as GoalStatus)}
                    className="paper-input w-full p-2.5 text-xs"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="STOPPED">STOPPED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Reason / Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs h-20"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Success Definition / Outcome
                </label>
                <input
                  type="text"
                  placeholder="e.g. Submit a strong proposal and get accepted"
                  value={editSuccess}
                  onChange={(e) => setEditSuccess(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] mb-1 uppercase tracking-wider text-[10px]">
                  Target Date
                </label>
                <input
                  type="date"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  className="paper-input w-full p-2.5 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={handleDeleteGoal}
                  className="text-xs font-bold text-red-400 hover:underline cursor-pointer"
                >
                  Delete Goal
                </button>
                <div className="flex space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEditGoal(false)}
                    className="paper-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingEdit}
                    className="paper-btn-primary px-5 py-2 text-xs font-extrabold cursor-pointer"
                  >
                    {loadingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
