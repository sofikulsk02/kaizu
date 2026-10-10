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
import { ArrowLeft, Pencil, Clock, Target, AlertTriangle, Sparkles, Lightbulb, Zap, Sprout, Map, Check, Plus, Bot } from "lucide-react";

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
    <div className="space-y-8 pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--crimson)] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 text-[var(--crimson)]" />
          <span className="group-hover:underline">Back to Goals</span>
          <span className="text-[var(--border-strong)] mx-1">/</span>
          <span className="text-[var(--text-heading)] font-black">
            {goalDetail.category || "General"}
          </span>
        </button>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setShowEditGoal(true)}
            className="paper-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Goal</span>
          </button>
          <button
            onClick={() => setShowLogAction(true)}
            className="paper-btn-primary inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Log Work / Action</span>
          </button>
        </div>
      </div>

      {/* Goal Header Panel */}
      <div className="clay-surface p-7 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="clay-badge bg-[var(--badge-bg)] px-3 py-0.5 text-xs font-black text-[var(--accent-color)]">
                {goalDetail.category || "Career / Goal"}
              </span>
              <span
                className={`clay-badge px-3 py-0.5 text-xs font-extrabold ${
                  goalDetail.status === "COMPLETED"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : goalDetail.status === "PAUSED"
                    ? "bg-amber-500/20 text-amber-300"
                    : goalDetail.status === "STOPPED"
                    ? "bg-red-500/20 text-red-300"
                    : "bg-[var(--badge-bg)] text-[var(--fg-main)]"
                }`}
              >
                {goalDetail.status}
              </span>
              {formattedTargetDate && (
                <span className="text-xs font-bold text-[var(--muted-text)]">
                  Target: {formattedTargetDate}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[var(--text-heading)]">
              {goalDetail.title}
            </h1>

            {goalDetail.description && (
              <p className="text-sm text-[var(--muted-text)] leading-relaxed">
                {goalDetail.description}
              </p>
            )}

            {goalDetail.successDefinition && (
              <div className="clay-surface bg-[var(--surface-nested)] p-4 text-xs space-y-1">
                <div className="font-black uppercase tracking-wider text-[var(--accent-color)] inline-flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  <span>Success Criteria / Desired Outcome</span>
                </div>
                <div className="text-[var(--text-primary)] font-medium">{goalDetail.successDefinition}</div>
              </div>
            )}
          </div>

          {/* Header Quick Status Control */}
          <div className="clay-surface bg-[var(--surface-nested)] p-5 text-center min-w-[200px] space-y-3">
            <div className="text-[10px] font-black uppercase tracking-wider text-[var(--muted-text)]">
              Execution Progress
            </div>
            <div className="text-2xl font-black text-[var(--accent-color)]">
              {metrics.taskProgressPercentage !== null
                ? `${metrics.taskProgressPercentage}%`
                : "Plan your first step"}
            </div>
            <div className="text-xs font-bold text-[var(--muted-text)]">
              {metrics.completedTasksCount} of {metrics.totalTasksCount} tasks completed
            </div>
          </div>
        </div>

        {/* Explainable Summary Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-[var(--inset-highlight)]">
          <div className="clay-surface bg-[var(--surface-nested)] p-4 space-y-1">
            <div className="text-[10px] font-black uppercase text-[var(--muted-text)]">
              Milestones Completed
            </div>
            <div className="text-xl font-black text-[var(--text-heading)]">
              {metrics.completedMilestonesCount} / {metrics.totalMilestonesCount}
            </div>
            <div className="text-[11px] text-[var(--muted-text)]">
              {metrics.totalMilestonesCount > 0 ? "Stages reached" : "No milestones created"}
            </div>
          </div>

          <div className="clay-surface bg-[var(--surface-nested)] p-4 space-y-1">
            <div className="text-[10px] font-black uppercase text-[var(--muted-text)]">
              Task Execution
            </div>
            <div className="text-xl font-black text-[var(--text-heading)]">
              {metrics.completedTasksCount} / {metrics.totalTasksCount}
            </div>
            <div className="text-[11px] text-[var(--muted-text)]">Actionable work items</div>
          </div>

          <div className="clay-surface bg-[var(--surface-nested)] p-4 space-y-1">
            <div className="text-[10px] font-black uppercase text-[var(--muted-text)]">
              Logged Effort
            </div>
            <div className="text-xl font-black text-[var(--accent-color)]">
              {metrics.totalDurationMinutes > 0
                ? `${Math.floor(metrics.totalDurationMinutes / 60)}h ${metrics.totalDurationMinutes % 60}m`
                : "Not logged yet"}
            </div>
            <div className="text-[11px] text-[var(--muted-text)]">Actual time recorded</div>
          </div>

          <div className="clay-surface bg-[var(--surface-nested)] p-4 space-y-1">
            <div className="text-[10px] font-black uppercase text-[var(--muted-text)]">
              Consistency
            </div>
            <div className="text-xl font-black text-[var(--text-heading)]">
              {metrics.activeDaysCount} {metrics.activeDaysCount === 1 ? "active day" : "active days"}
            </div>
            <div className="text-[11px] text-[var(--muted-text)]">Days with logged action</div>
          </div>
        </div>
      </div>

      {/* INTELLIGENT GOAL COACH WIDGET (Kaizu V2 Feature) */}
      {coachAnalysis && (
        <div className="clay-surface p-6 space-y-4 bg-gradient-to-r from-[var(--surface-bg)] to-[var(--surface-nested)] border border-[var(--accent-color)]/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="clay-badge bg-[var(--badge-bg)] px-3 py-1 text-xs font-black text-[var(--accent-color)] inline-flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5" />
                <span>INTELLIGENT GOAL COACH</span>
              </span>
              {coachAnalysis.isStalled && (
                <span className="clay-badge bg-red-500/20 text-red-300 px-2.5 py-0.5 text-xs font-extrabold inline-flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>STALLED GOAL DETECTED</span>
                </span>
              )}
            </div>

            <button
              onClick={handleGenerateBreakdown}
              disabled={generatingBreakdown}
              className="clay-btn-primary px-3.5 py-1.5 text-xs font-extrabold text-[var(--btn-primary-text)] shadow cursor-pointer inline-flex items-center gap-1.5"
            >
              {generatingBreakdown ? (
                "Generating..."
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Auto-Breakdown into Milestones & Tasks</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
            <div className="font-semibold text-sm text-[var(--fg-main)] inline-flex items-start gap-1.5">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{coachAnalysis.advice}</span>
            </div>
            {coachAnalysis.stalledReason && (
              <p className="text-amber-600 dark:text-amber-300 font-medium">
                {coachAnalysis.stalledReason}
              </p>
            )}
          </div>

          {coachAnalysis.recurringBlockers.length > 0 && (
            <div className="pt-2 text-xs">
              <span className="font-bold text-[var(--muted-text)]">Recurring Blockers Detected: </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {coachAnalysis.recurringBlockers.map((b, i) => (
                  <span key={i} className="clay-badge bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px]">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1. TODAY'S FOCUS SECTION (Most Prominent Action Area) */}
      <div className="clay-surface p-7 space-y-5 border-2 border-[var(--accent-color)]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 clay-badge bg-[var(--badge-bg)] px-3.5 py-1 text-xs font-bold text-[var(--accent-color)]">
              <Zap className="h-3.5 w-3.5" />
              <span>TODAY'S FOCUS WORKFLOW</span>
            </div>
            <h2 className="mt-2 text-xl font-black text-[var(--text-heading)] sm:text-2xl">
              What is one meaningful action you can do next?
            </h2>
            <p className="text-xs text-[var(--muted-text)] mt-0.5">
              Focus on execution over clutter. Choose your next step and record your actual effort.
            </p>
          </div>

          <button
            onClick={() => setShowLogAction(true)}
            className="paper-btn-primary px-5 py-3 text-xs font-black shadow-xs self-start sm:self-auto cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Log What I Did Today</span>
          </button>
        </div>

        {todaysFocusTask ? (
          <div className="clay-surface bg-[var(--surface-nested)] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="clay-badge bg-[var(--badge-bg)] px-2.5 py-0.5 text-[10px] font-black text-[var(--accent-color)]">
                  {todaysFocusTask.priority} PRIORITY
                </span>
                {todaysFocusTask.estimateMinutes && (
                  <span className="text-xs text-[var(--muted-text)] font-semibold inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ~{todaysFocusTask.estimateMinutes} min estimate
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-[var(--text-heading)]">{todaysFocusTask.title}</h3>
              {todaysFocusTask.description && (
                <p className="text-xs text-[var(--muted-text)]">{todaysFocusTask.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleToggleTaskStatus(todaysFocusTask)}
                className="paper-btn-primary px-4 py-2.5 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5"
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
                className="paper-btn-secondary px-4 py-2.5 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Log Work Against Task</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="clay-surface bg-[var(--surface-nested)] p-6 text-center space-y-3">
            <div className="flex justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--badge-bg)] text-[var(--accent-color)] shadow-xs">
                <Sprout className="h-6 w-6" strokeWidth={1.8} />
              </span>
            </div>
            <div className="font-bold text-[var(--text-heading)] text-sm">
              No tasks planned yet. Choose your next step.
            </div>
            <p className="text-xs text-[var(--muted-text)] max-w-md mx-auto">
              Start by adding a task or milestone, or log work directly without needing a predefined plan.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setTargetMilestoneId(undefined);
                  setShowAddTask(true);
                }}
                className="paper-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
              >
                + Add Task
              </button>
              <button
                onClick={() => setShowAddMilestone(true)}
                className="paper-btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
              >
                + Add Milestone
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs for Goal Sections */}
      <div className="flex space-x-2 border-b border-[var(--border-subtle)] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTabSection("focus")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTabSection === "focus"
              ? "bg-[var(--forest-green)] text-white shadow-xs"
              : "text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Plan & Milestones ({goalDetail.milestones.length})
        </button>
        <button
          onClick={() => setActiveTabSection("tasks")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTabSection === "tasks"
              ? "bg-[var(--forest-green)] text-white shadow-xs"
              : "text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Tasks ({goalDetail.tasks.length})
        </button>
        <button
          onClick={() => setActiveTabSection("actions")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTabSection === "actions"
              ? "bg-[var(--forest-green)] text-white shadow-xs"
              : "text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Daily Actions ({goalDetail.dailyActions.length})
        </button>
        <button
          onClick={() => setActiveTabSection("reflection")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTabSection === "reflection"
              ? "bg-[var(--forest-green)] text-white shadow-xs"
              : "text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          Hansei & Reflections ({goalDetail.reflections.length})
        </button>
      </div>

      {/* 2. PLAN & MILESTONES SECTION */}
      {(activeTabSection === "focus" || activeTabSection === "plan") && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-heading)]">Plan & Milestones</h2>
              <p className="text-xs text-[var(--muted-text)]">
                Break the outcome into meaningful stages
              </p>
            </div>
            <button
              onClick={() => setShowAddMilestone(true)}
              className="paper-btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
            >
              + Add Milestone
            </button>
          </div>

          {goalDetail.milestones.length === 0 ? (
            <div className="clay-surface p-8 text-center space-y-3 bg-[var(--surface-nested)]">
              <div className="flex justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--badge-bg)] text-[var(--accent-color)] shadow-xs">
                  <Map className="h-6 w-6" strokeWidth={1.8} />
                </span>
              </div>
              <div className="font-bold text-[var(--text-heading)] text-sm">No milestones added yet</div>
              <p className="text-xs text-[var(--muted-text)]">
                Add milestones when you know the major stages required to achieve this goal.
              </p>
              <div className="flex justify-center gap-3 pt-2">
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
                  className="paper-btn-primary px-4 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Auto-Suggest Milestones</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {goalDetail.milestones.map((ms, idx) => {
                const msCompletedTasks = ms.tasks.filter((t) => t.status === "COMPLETED").length;
                return (
                  <div key={ms.id} className="clay-surface p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="clay-badge bg-[var(--badge-bg)] px-2.5 py-0.5 text-[10px] font-black text-[var(--accent-color)]">
                            STAGE {idx + 1}
                          </span>
                          <span
                            className={`clay-badge px-2.5 py-0.5 text-[10px] font-bold ${
                              ms.status === "COMPLETED"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-[var(--badge-bg)] text-[var(--muted-text)]"
                            }`}
                          >
                            {ms.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-[var(--text-heading)]">{ms.title}</h3>
                        {ms.description && (
                          <p className="text-xs text-[var(--muted-text)]">{ms.description}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right text-xs text-[var(--muted-text)]">
                          <div className="font-bold text-[var(--text-heading)]">
                            {msCompletedTasks} / {ms.tasks.length} tasks
                          </div>
                          {ms.targetDate && (
                            <div>Target: {new Date(ms.targetDate).toLocaleDateString()}</div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setTargetMilestoneId(ms.id);
                            setShowAddTask(true);
                          }}
                          className="paper-btn-secondary px-3 py-1.5 text-xs font-bold cursor-pointer"
                        >
                          + Task
                        </button>
                      </div>
                    </div>

                    {/* Milestone Child Tasks */}
                    {ms.tasks.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {ms.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="clay-surface bg-[var(--surface-nested)] p-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={task.status === "COMPLETED"}
                                onChange={() => handleToggleTaskStatus(task)}
                                className="h-4 w-4 rounded accent-[var(--accent-color)] cursor-pointer"
                              />
                              <span
                                className={`font-bold ${
                                  task.status === "COMPLETED"
                                    ? "line-through text-[var(--muted-text)]"
                                    : "text-[var(--text-heading)]"
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="clay-badge bg-[var(--badge-bg)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--muted-text)]">
                                {task.priority}
                              </span>
                              {task.estimateMinutes && (
                                <span className="text-[10px] text-[var(--muted-text)] font-semibold">
                                  {task.estimateMinutes}m
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
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
        <div className="clay-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-heading)]">Tasks & Actionable Work</h2>
              <p className="text-xs text-[var(--muted-text)]">
                Manage specific steps required for this goal
              </p>
            </div>
            <button
              onClick={() => {
                setTargetMilestoneId(undefined);
                setShowAddTask(true);
              }}
              className="paper-btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
            >
              + Add Task
            </button>
          </div>

          {goalDetail.tasks.length === 0 ? (
            <div className="clay-surface bg-[var(--surface-nested)] p-6 text-center text-xs text-[var(--muted-text)]">
              No tasks defined yet. Click "+ Add Task" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {goalDetail.tasks.map((task) => (
                <div
                  key={task.id}
                  className="clay-surface bg-[var(--surface-nested)] p-4 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={task.status === "COMPLETED"}
                      onChange={() => handleToggleTaskStatus(task)}
                      className="h-4 w-4 rounded accent-[var(--accent-color)] cursor-pointer"
                    />
                    <div>
                      <div
                        className={`font-bold ${
                          task.status === "COMPLETED"
                            ? "line-through text-[var(--muted-text)]"
                            : "text-[var(--text-heading)]"
                        }`}
                      >
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-[11px] text-[var(--muted-text)] mt-0.5">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="clay-badge bg-[var(--badge-bg)] px-2.5 py-0.5 text-[10px] font-black text-[var(--accent-color)]">
                      {task.priority}
                    </span>
                    <button
                      onClick={() => Api.deleteGoalTask(goalDetail.id, task.id).then(onRefresh)}
                      className="text-[10px] font-bold text-red-400 hover:underline cursor-pointer"
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

      {/* 4. DAILY ACTIONS SECTION */}
      {activeTabSection === "actions" && (
        <div className="clay-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-heading)]">Daily Actions Log</h2>
              <p className="text-xs text-[var(--muted-text)]">
                Record of work actually performed toward this goal
              </p>
            </div>
            <button
              onClick={() => setShowLogAction(true)}
              className="paper-btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
            >
              + Log Work
            </button>
          </div>

          {goalDetail.dailyActions.length === 0 ? (
            <div className="clay-surface bg-[var(--surface-nested)] p-6 text-center text-xs text-[var(--muted-text)]">
              No daily actions logged yet. Log what you actually did today to build evidence of progress!
            </div>
          ) : (
            <div className="space-y-4">
              {goalDetail.dailyActions.map((action) => (
                <div key={action.id} className="clay-surface bg-[var(--surface-nested)] p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-[var(--accent-color)]">
                        {new Date(action.occurredAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {action.durationMinutes && (
                          <span className="inline-flex items-center gap-1 ml-1.5">
                            · <Clock className="h-3 w-3 inline" /> {action.durationMinutes} mins
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-[var(--text-heading)] mt-1">{action.summary}</h4>
                    </div>
                    <button
                      onClick={() => Api.deleteDailyAction(goalDetail.id, action.id).then(onRefresh)}
                      className="text-[10px] text-red-400 font-bold hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>

                  {action.outcome && (
                    <div className="text-xs text-[var(--fg-main)] bg-black/10 dark:bg-black/30 p-2.5 rounded-lg border border-[var(--border-subtle)]">
                      <strong className="text-[var(--forest-green)] dark:text-emerald-400">Accomplishment / Result:</strong>{" "}
                      {action.outcome}
                    </div>
                  )}

                  {action.blocker && (
                    <div className="text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                      <strong>Blocker / Difficulty:</strong> {action.blocker}
                    </div>
                  )}

                  {action.nextStep && (
                    <div className="flex items-center justify-between text-xs text-sky-800 dark:text-sky-200 bg-sky-500/10 p-2.5 rounded-lg border border-sky-500/20">
                      <div>
                        <strong>Next Step:</strong> {action.nextStep}
                      </div>
                      <button
                        onClick={() => handleCreateTaskFromNextStep(action.nextStep!)}
                        className="paper-btn-secondary px-2.5 py-1 text-[10px] font-bold cursor-pointer"
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
        <div className="clay-surface p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-heading)]">Hansei & Reflections</h2>
            <p className="text-xs text-[var(--muted-text)]">
              Interpret what happened, capture learnings, and adjust your execution loop.
            </p>
          </div>

          {goalDetail.reflections.length === 0 ? (
            <div className="clay-surface bg-[var(--surface-nested)] p-6 text-center text-xs text-[var(--muted-text)]">
              No reflections recorded yet. Add a reflection when logging work or reviewing progress.
            </div>
          ) : (
            <div className="space-y-4">
              {goalDetail.reflections.map((ref) => (
                <div key={ref.id} className="clay-surface bg-[var(--surface-nested)] p-5 space-y-3">
                  <div className="text-xs font-bold text-[var(--accent-color)]">
                    Reflection on {new Date(ref.createdAt).toLocaleDateString()}
                  </div>
                  {ref.wentWell && (
                    <div className="text-xs text-emerald-300">
                      <strong>What went well?</strong> {ref.wentWell}
                    </div>
                  )}
                  {ref.difficulty && (
                    <div className="text-xs text-amber-300">
                      <strong>What was difficult?</strong> {ref.difficulty}
                    </div>
                  )}
                  {ref.learning && (
                    <div className="text-xs text-sky-300">
                      <strong>What did I learn?</strong> {ref.learning}
                    </div>
                  )}
                  {ref.nextChange && (
                    <div className="text-xs text-rose-300">
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
          <div className="clay-modal w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-black text-[var(--text-heading)]">Add Milestone / Stage</h3>
            <form onSubmit={handleCreateMilestone} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[var(--muted-text)] mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milestone 1 — Choose an organization"
                  value={msTitle}
                  onChange={(e) => setMsTitle(e.target.value)}
                  className="clay-input w-full p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--muted-text)] mb-1">Description (Optional)</label>
                <textarea
                  placeholder="What major outcome must happen in this stage?"
                  value={msDesc}
                  onChange={(e) => setMsDesc(e.target.value)}
                  className="clay-input w-full p-3 text-xs h-20"
                />
              </div>

              <div>
                <label className="block text-[var(--muted-text)] mb-1">Target Date (Optional)</label>
                <input
                  type="date"
                  value={msTargetDate}
                  onChange={(e) => setMsTargetDate(e.target.value)}
                  className="clay-input w-full p-3 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMilestone(false)}
                  className="clay-btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingMilestone}
                  className="clay-btn-primary px-5 py-2 font-extrabold"
                >
                  {loadingMilestone ? "Creating..." : "Save Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="clay-modal w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-black text-[var(--text-heading)]">Add Actionable Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[var(--muted-text)] mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read contribution guide"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="clay-input w-full p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--muted-text)] mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="clay-input w-full p-3 text-xs bg-[var(--input-bg)]"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-[var(--muted-text)] mb-1">Milestone (Optional)</label>
                <select
                  value={targetMilestoneId || ""}
                  onChange={(e) => setTargetMilestoneId(e.target.value || undefined)}
                  className="clay-input w-full p-3 text-xs bg-[var(--input-bg)]"
                >
                  <option value="">Direct Goal Task (No Milestone)</option>
                  {goalDetail.milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--muted-text)] mb-1">Estimate (Mins)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={taskEstimate}
                    onChange={(e) =>
                      setTaskEstimate(e.target.value ? parseInt(e.target.value) : "")
                    }
                    className="clay-input w-full p-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted-text)] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="clay-input w-full p-3 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="clay-btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingTask}
                  className="clay-btn-primary px-5 py-2 font-extrabold"
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
          <div className="clay-modal w-full max-w-lg p-6 space-y-5 my-8">
            <h3 className="text-lg font-black text-[var(--text-heading)]">Log Work & Action</h3>
            <form onSubmit={handleLogDailyAction} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[var(--muted-text)] mb-1">What did you work on today? *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read contribution guide and explored issue tracker"
                  value={actSummary}
                  onChange={(e) => setActSummary(e.target.value)}
                  className="clay-input w-full p-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--muted-text)] mb-1">Actual Time Spent (Mins)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={actDuration}
                    onChange={(e) =>
                      setActDuration(e.target.value ? parseInt(e.target.value) : "")
                    }
                    className="clay-input w-full p-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted-text)] mb-1">Related Task (Optional)</label>
                  <select
                    value={actTaskId}
                    onChange={(e) => setActTaskId(e.target.value)}
                    className="clay-input w-full p-3 text-xs bg-[var(--input-bg)]"
                  >
                    <option value="">None / General Goal Work</option>
                    {goalDetail.tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[var(--muted-text)] mb-1">What did you accomplish / outcome?</label>
                <input
                  type="text"
                  placeholder="e.g. Understood repo structure and found 3 issues"
                  value={actOutcome}
                  onChange={(e) => setActOutcome(e.target.value)}
                  className="clay-input w-full p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--muted-text)] mb-1">Blockers / Difficulties (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Build setup failed initially"
                  value={actBlocker}
                  onChange={(e) => setActBlocker(e.target.value)}
                  className="clay-input w-full p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--muted-text)] mb-1">What is the next step? (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Set up project locally and reproduce issue #12"
                  value={actNextStep}
                  onChange={(e) => setActNextStep(e.target.value)}
                  className="clay-input w-full p-3 text-xs"
                />
              </div>

              {/* Optional Hansei Reflection Toggle */}
              <div className="pt-2 border-t border-[var(--inset-highlight)]">
                <button
                  type="button"
                  onClick={() => setShowReflectionInputs(!showReflectionInputs)}
                  className="text-xs font-bold text-[var(--accent-color)] hover:underline flex items-center space-x-1"
                >
                  <span>{showReflectionInputs ? "▼ Hide" : "▶ Add Optional Reflection (Hansei)"}</span>
                </button>

                {showReflectionInputs && (
                  <div className="space-y-3 pt-3 pl-2 border-l-2 border-[var(--accent-color)]">
                    <div>
                      <label className="block text-[var(--muted-text)] mb-1">What went well?</label>
                      <input
                        type="text"
                        value={refWentWell}
                        onChange={(e) => setRefWentWell(e.target.value)}
                        className="clay-input w-full p-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--muted-text)] mb-1">What did you learn?</label>
                      <input
                        type="text"
                        value={refLearning}
                        onChange={(e) => setRefLearning(e.target.value)}
                        className="clay-input w-full p-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--muted-text)] mb-1">What should you do differently next time?</label>
                      <input
                        type="text"
                        value={refNextChange}
                        onChange={(e) => setRefNextChange(e.target.value)}
                        className="clay-input w-full p-2.5 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLogAction(false)}
                  className="clay-btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="clay-btn-primary px-5 py-2 font-extrabold"
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
          <div className="clay-modal w-full max-w-lg p-6 space-y-5 my-8">
            <h3 className="text-lg font-black text-[var(--text-heading)]">Edit Goal Details</h3>
            <form onSubmit={handleSaveGoalEdit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[var(--muted-text)] mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="clay-input w-full p-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--muted-text)] mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Career, Learning"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="clay-input w-full p-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--muted-text)] mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as GoalStatus)}
                    className="clay-input w-full p-3 text-xs bg-[var(--input-bg)]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="STOPPED">STOPPED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[var(--muted-text)] mb-1">Reason / Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="clay-input w-full p-3 text-xs h-20"
                />
              </div>

              <div>
                <label className="block text-[var(--muted-text)] mb-1">Success Definition / Outcome</label>
                <input
                  type="text"
                  placeholder="e.g. Submit a strong proposal and get accepted"
                  value={editSuccess}
                  onChange={(e) => setEditSuccess(e.target.value)}
                  className="clay-input w-full p-3 text-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--muted-text)] mb-1">Target Date</label>
                <input
                  type="date"
                  value={editTargetDate}
                  onChange={(e) => setEditTargetDate(e.target.value)}
                  className="clay-input w-full p-3 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--inset-highlight)]">
                <button
                  type="button"
                  onClick={handleDeleteGoal}
                  className="text-xs font-bold text-red-400 hover:underline"
                >
                  Delete Goal
                </button>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditGoal(false)}
                    className="clay-btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingEdit}
                    className="clay-btn-primary px-5 py-2 font-extrabold"
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
