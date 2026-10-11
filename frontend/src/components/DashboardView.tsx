"use client";

import React, { useState, useEffect } from "react";
import { Subject, Goal, Api } from "../lib/api";
import { ActivityHeatmap } from "./ActivityHeatmap";
import {
  getActivityMap,
  computeStreakStats,
  getTodayReflection,
  saveDailyReflection,
  DailyReflection,
} from "../lib/activityStorage";
import {
  BookOpen,
  Target,
  Zap,
  Sparkles,
  Plus,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  PenLine,
  Check,
  MessageSquare,
  Calendar,
} from "lucide-react";

interface DashboardViewProps {
  subjects: Subject[];
  goals: Goal[];
  onSelectTab: (tab: string) => void;
  onSelectSubject: (subject: Subject) => void;
  onSelectGoal: (goal: Goal) => void;
  onOpenCreateSubject: () => void;
  onOpenCreateGoal: () => void;
  loadingSubjectId?: string | null;
  loadingGoalId?: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  subjects,
  goals,
  onSelectTab,
  onSelectSubject,
  onSelectGoal,
  onOpenCreateSubject,
  onOpenCreateGoal,
  loadingSubjectId,
  loadingGoalId,
}) => {
  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");
  const recentSubject = subjects.length > 0 ? subjects[0] : null;

  // Task & Weekly Progress computation
  const totalCompletedTasks = goals.reduce((acc, g) => acc + (g.completedTasksCount || 0), 0);
  const totalTasks = goals.reduce((acc, g) => acc + (g.totalTasksCount || 0), 0);
  const taskProgressPct = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;

  // Days remaining in the current year computation
  const now = new Date();
  const currentYear = now.getFullYear();
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
  const diffTime = endOfYear.getTime() - now.getTime();
  const daysRemainingInYear = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0;
  const totalDaysInYear = isLeapYear ? 366 : 365;
  const daysPassed = totalDaysInYear - daysRemainingInYear;
  const yearProgressPct = Math.min(100, Math.max(0, Math.round((daysPassed / totalDaysInYear) * 100)));

  // Streak & Active Days Stats
  const [activityStats, setActivityStats] = useState({
    totalActiveDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalActivities: 0,
  });

  // Daily Reflection (Hansei) state
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [wentWell, setWentWell] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [changeTomorrow, setChangeTomorrow] = useState("");
  const [reflectionSavedNotice, setReflectionSavedNotice] = useState(false);

  useEffect(() => {
    const map = getActivityMap();
    setActivityStats(computeStreakStats(map));

    const today = getTodayReflection();
    if (today) {
      setReflection(today);
      setWentWell(today.wentWell);
      setDifficulty(today.difficulty);
      setChangeTomorrow(today.changeTomorrow);
    }
  }, []);

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wentWell.trim() && !difficulty.trim() && !changeTomorrow.trim()) return;

    const saved = saveDailyReflection({
      wentWell,
      difficulty,
      changeTomorrow,
    });
    setReflection(saved);
    setIsEditingReflection(false);
    setReflectionSavedNotice(true);
    setTimeout(() => setReflectionSavedNotice(false), 3000);

    // Refresh streak & active stats immediately
    const map = getActivityMap();
    setActivityStats(computeStreakStats(map));

    // Also link to first active goal if available in the backend
    if (activeGoals.length > 0) {
      try {
        await Api.createDailyAction(activeGoals[0].id, {
          summary: "Daily Reflection (Hansei)",
          reflection: {
            wentWell: wentWell.trim() || undefined,
            difficulty: difficulty.trim() || undefined,
            nextChange: changeTomorrow.trim() || undefined,
          },
        });
      } catch (err) {
        // Local record is already safely saved in activityStorage
      }
    }
  };

  const handleOpenMichi = (prompt?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-michi", { detail: { prompt } }));
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Welcome & Spotlight Banner with Kaizen & Hansei Motto + Year Countdown Pod */}
      <div className="paper-card p-3 sm:p-4 border border-[var(--border-default)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Left: Welcome & Motto */}
          <div className="space-y-1.5 lg:max-w-xs xl:max-w-sm shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="paper-badge px-2 py-0.5 text-[11px] font-bold text-[var(--forest-green)]">
                Continuous Improvement Loop
              </span>
              {/* Motto relocated here so primary metric cards can show real actionable metrics */}
              <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded border border-[var(--border-subtle)] inline-flex items-center gap-1">
                <span className="text-[var(--crimson)] font-black">改善</span> Kaizen &nbsp;·&nbsp;
                <span className="text-[var(--forest-green)] font-black">反省</span> Hansei
              </span>
            </div>
            <h1 className="text-lg font-black text-[var(--text-heading)] sm:text-xl">
              Welcome back to Kaizu
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Turn intentions into consistent action, visible progress, and thoughtful reflection.
            </p>
          </div>

          {/* Center: Dedicated Year Countdown Pod utilizing the empty space */}
          <div className="paper-inset p-3 bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded-xl flex flex-col justify-between flex-1 min-w-[220px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--forest-green)] flex items-center gap-1">
              
                <span>{currentYear} Annual Momentum</span>
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                Make every day count
              </span>
            </div>

            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-[var(--crimson)] leading-none">
                {daysRemainingInYear}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[var(--text-heading)] leading-none">
                days remaining this year
              </span>
            </div>

            <div className="h-2 w-full bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-full overflow-hidden shadow-inner mt-0.5">
              <div
                className="h-full bg-gradient-to-r from-[var(--forest-green)] via-amber-500 to-[var(--crimson)] rounded-full transition-all duration-500"
                style={{ width: `${yearProgressPct}%` }}
              />
            </div>
          </div>

          {/* Right: Continue Learning or First Subject */}
          {recentSubject ? (
            <div className="paper-inset p-3 text-left min-w-[200px] lg:w-[220px] bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded-xl shrink-0 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--forest-green)]">
                  Continue Learning
                </div>
                <div className="mt-0.5 font-bold text-[var(--text-heading)] text-xs sm:text-sm truncate">
                  {recentSubject.name}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {recentSubject.chapterCount || 0} chapters · {recentSubject.topicCount || 0} topics
                </div>
              </div>
              {loadingSubjectId === recentSubject.id ? (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[var(--crimson)] animate-pulse">
                  <div className="h-2.5 w-2.5 rounded-full border-2 border-[var(--crimson)] border-t-transparent animate-spin" />
                  <span>Opening workspace...</span>
                </div>
              ) : (
                <button
                  onClick={() => onSelectSubject(recentSubject)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--crimson)] hover:underline cursor-pointer"
                >
                  <span>Resume Learning</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenCreateSubject}
              className="paper-btn-primary inline-flex items-center gap-1 px-3 py-2 text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all self-center lg:self-auto shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Start building your first Subject</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Summary Cards — Philosophy card replaced with Tasks & Weekly Progress Metric */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="paper-card p-2.5 sm:p-3 space-y-0.5 border border-[var(--border-default)] card-lift">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Total Subjects</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--pale-sage)] text-[var(--forest-green)]">
              <BookOpen className="h-3 w-3" />
            </span>
          </div>
          <div className="text-lg font-black text-[var(--text-heading)]">{subjects.length}</div>
          <div className="text-[10px] text-[var(--text-secondary)] truncate">
            {subjects.reduce((acc, s) => acc + (s.chapterCount || 0), 0)} tracked chapters
          </div>
        </div>

        <div className="paper-card p-2.5 sm:p-3 space-y-0.5 border border-[var(--border-default)] card-lift">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Active Goals</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#FFEAE8] text-[var(--crimson)]">
              <Target className="h-3 w-3" />
            </span>
          </div>
          <div className="text-lg font-black text-[var(--text-heading)]">{activeGoals.length}</div>
          <div className="text-[10px] text-[var(--forest-green)] font-semibold truncate">
            {completedGoals.length} goals achieved
          </div>
        </div>

        <div className="paper-card p-2.5 sm:p-3 space-y-0.5 border border-[var(--border-default)] card-lift">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Active Days</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              <Zap className="h-3 w-3" />
            </span>
          </div>
          <div className="text-lg font-black text-[var(--forest-green)]">
            {activityStats.currentStreak > 0 ? `${activityStats.currentStreak}d streak` : `${activityStats.totalActiveDays} days`}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] truncate">
            {activityStats.totalActiveDays} total active day{activityStats.totalActiveDays === 1 ? "" : "s"}
          </div>
        </div>

        {/* REPLACED PHILOSOPHY CARD: Tasks Completed / Weekly Progress */}
        <div className="paper-card p-2.5 sm:p-3 space-y-0.5 border border-[var(--border-default)] card-lift">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Weekly Progress</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--pale-sage)] text-[var(--forest-green)]">
              <CheckCircle2 className="h-3 w-3" />
            </span>
          </div>
          <div className="text-lg font-black text-[var(--text-heading)]">
            {totalTasks > 0 ? `${totalCompletedTasks} / ${totalTasks}` : `${totalCompletedTasks} done`}
          </div>
          <div className="text-[10px] text-[var(--forest-green)] font-semibold truncate">
            {totalTasks > 0 ? `${taskProgressPct}% task execution` : "Actionable tasks completed"}
          </div>
        </div>
      </div>

      {/* 4. Michi's Daily Suggestion & Workflow Insight */}
      <div className="paper-card p-3.5 sm:p-4 space-y-3 bg-[var(--surface-primary)] border border-[var(--forest-green)]/30 rounded-xl card-lift">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--forest-green)] text-white font-black text-xs shadow-2xs">
              道
            </span>
            <div className="flex items-center space-x-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-black text-[var(--text-heading)]">
                Michi&apos;s Daily Insight
              </h2>
              <span className="paper-badge px-2 py-0.5 text-[9px] font-bold text-[var(--forest-green)]">
                Grounded in your activity
              </span>
            </div>
          </div>

          <button
            onClick={() => handleOpenMichi()}
            className="paper-btn-secondary px-2.5 py-1 text-[11px] font-bold flex items-center space-x-1 cursor-pointer self-start sm:self-auto active:scale-95"
            title="Open Michi chat companion"
          >
            <MessageSquare className="h-3 w-3 text-[var(--forest-green)]" />
            <span>Open Michi Chat ↗</span>
          </button>
        </div>

        <div className="grid gap-2.5 md:grid-cols-2">
          {/* Section 1: Grounded Facts */}
          <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 sm:p-3 rounded-lg border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
              <span>Observed Facts (Activity)</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {activityStats.currentStreak > 0
                ? `You have maintained an active habit streak of ${activityStats.currentStreak} day${activityStats.currentStreak === 1 ? "" : "s"} across ${activityStats.totalActiveDays} total recorded day${activityStats.totalActiveDays === 1 ? "" : "s"}.`
                : "Your daily continuous improvement journey is active today."}
              {recentSubject
                ? ` Most active area is "${recentSubject.name}" (${recentSubject.chapterCount || 0} chapters).`
                : ` You are tracking ${subjects.length} learning area${subjects.length === 1 ? "" : "s"}.`}
              {activeGoals.length > 0
                ? ` ${activeGoals.length} goal${activeGoals.length === 1 ? "" : "s"} in progress with ${totalCompletedTasks} task${totalCompletedTasks === 1 ? "" : "s"} completed.`
                : ""}
            </p>
          </div>

          {/* Section 2: Michi's Actionable Suggestions */}
          <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 sm:p-3 rounded-lg border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--forest-green)]">
              <Sparkles className="h-3 w-3" />
              <span>Michi&apos;s Suggested Next Steps</span>
            </div>
            <ul className="text-xs text-[var(--text-secondary)] space-y-1.5">
              {recentSubject && (
                <li className="flex items-start justify-between gap-2">
                  <span>
                    Continue momentum on <strong className="text-[var(--text-heading)]">{recentSubject.name}</strong> with a focused 25m session.
                  </span>
                  <button
                    onClick={() => onSelectSubject(recentSubject)}
                    className="text-[10px] font-bold text-[var(--crimson)] hover:underline shrink-0 cursor-pointer"
                  >
                    Resume →
                  </button>
                </li>
              )}
              {activeGoals.length > 0 && (
                <li className="flex items-start justify-between gap-2">
                  <span>
                    Advance goal <strong className="text-[var(--text-heading)]">{activeGoals[0].title}</strong> by working on its next milestone task.
                  </span>
                  {loadingGoalId === activeGoals[0].id ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--crimson)] animate-pulse shrink-0">
                      <div className="h-2 w-2 rounded-full border-2 border-[var(--crimson)] border-t-transparent animate-spin" />
                      <span>Opening...</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => !loadingGoalId && onSelectGoal(activeGoals[0])}
                      className="text-[10px] font-bold text-[var(--forest-green)] hover:underline shrink-0 cursor-pointer"
                    >
                      Focus →
                    </button>
                  )}
                </li>
              )}
              {!reflection && (
                <li className="flex items-start justify-between gap-2 text-[var(--text-muted)]">
                  <span>Take 60 seconds below to capture today&apos;s Hansei reflection and close the feedback loop.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Daily Reflection / Hansei (Tiny End-of-Day Micro-Prompt) */}
      <div className="paper-card p-3.5 sm:p-4 space-y-3 border border-[var(--border-default)] rounded-xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--pale-sage)] text-[var(--forest-green)]">
              <Lightbulb className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-[var(--text-heading)]">
                Daily Reflection (Hansei · 反省)
              </h2>
              <p className="text-[10px] text-[var(--text-muted)]">
                Tiny end-of-day check-in — connecting daily effort to continuous improvement.
              </p>
            </div>
          </div>

          {reflection && !isEditingReflection && (
            <button
              onClick={() => setIsEditingReflection(true)}
              className="text-[11px] font-bold text-[var(--forest-green)] hover:underline cursor-pointer"
            >
              Edit Reflection
            </button>
          )}
        </div>

        {reflectionSavedNotice && (
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5 animate-fadeIn">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span>Today&apos;s Hansei reflection saved and habit recorded!</span>
          </div>
        )}

        {reflection && !isEditingReflection ? (
          <div className="paper-inset bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] space-y-2 text-xs">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Recorded for today ({new Date(reflection.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-400 text-[11px] block">🌿 What went well:</span>
                <p className="text-[var(--text-secondary)] leading-relaxed">{reflection.wentWell || "—"}</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-amber-400 text-[11px] block">🚧 What got in the way:</span>
                <p className="text-[var(--text-secondary)] leading-relaxed">{reflection.difficulty || "—"}</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-sky-400 text-[11px] block">🎯 What to improve tomorrow:</span>
                <p className="text-[var(--text-secondary)] leading-relaxed">{reflection.changeTomorrow || "—"}</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveReflection} className="space-y-2.5">
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  What went well today?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mastered Chapter 1, stayed focused"
                  value={wentWell}
                  onChange={(e) => setWentWell(e.target.value)}
                  className="paper-input w-full p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                  What got in the way?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Started late, afternoon fatigue"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="paper-input w-full p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1">
                  What should change tomorrow?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Start 30m study session at 9 AM"
                  value={changeTomorrow}
                  onChange={(e) => setChangeTomorrow(e.target.value)}
                  className="paper-input w-full p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {/* Quick Prompt Chips */}
              <div className="hidden sm:flex items-center space-x-1.5 text-[10px]">
                <span className="text-[var(--text-muted)] font-medium">Quick ideas:</span>
                <button
                  type="button"
                  onClick={() => setWentWell((prev) => prev ? `${prev}, focused deep work` : "Focused deep work")}
                  className="px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-subtle)] cursor-pointer"
                >
                  + Deep work
                </button>
                <button
                  type="button"
                  onClick={() => setChangeTomorrow((prev) => prev ? `${prev}, timebox 25m` : "Timebox 25m sessions")}
                  className="px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-subtle)] cursor-pointer"
                >
                  + Timebox 25m
                </button>
              </div>

              <div className="flex items-center space-x-2 ml-auto">
                {isEditingReflection && (
                  <button
                    type="button"
                    onClick={() => setIsEditingReflection(false)}
                    className="paper-btn-secondary px-3 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!wentWell.trim() && !difficulty.trim() && !changeTomorrow.trim()}
                  className="paper-btn-primary px-3.5 py-1.5 text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1 active:scale-95 disabled:opacity-50"
                >
                  <PenLine className="h-3 w-3" />
                  <span>{reflection ? "Update Reflection" : "Save Reflection"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Main Sections: Subjects & Goals */}
      <div className="grid gap-2.5 lg:grid-cols-2">
        {/* Subjects Section */}
        <div className="paper-card p-3 sm:p-3.5 space-y-2 border border-[var(--border-default)]">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">Learning Areas (Subjects)</h2>
              <p className="text-[10px] text-[var(--text-muted)]">Start empty, add structure as needed</p>
            </div>
            <button
              onClick={onOpenCreateSubject}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--crimson)] hover:underline cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>New Subject</span>
            </button>
          </div>

          {subjects.length === 0 ? (
            <div className="paper-inset p-4 text-center space-y-2 bg-[var(--surface-secondary)]">
              <div className="flex justify-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--pale-sage)] text-[var(--forest-green)] shadow-xs">
                  <BookOpen className="h-4 w-4" strokeWidth={1.8} />
                </span>
              </div>
              <div className="font-bold text-xs text-[var(--text-heading)]">Nothing here yet.</div>
              <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                Start building your learning journey without needing a fixed syllabus.
              </p>
              <button
                onClick={onOpenCreateSubject}
                className="paper-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Create Subject</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {subjects.slice(0, 4).map((subject) => {
                const isLoading = loadingSubjectId === subject.id;
                return (
                  <div
                    key={subject.id}
                    onClick={() => !loadingSubjectId && onSelectSubject(subject)}
                    className={`paper-card-interactive cursor-pointer p-2.5 sm:p-3 flex items-center justify-between relative overflow-hidden transition-all ${
                      isLoading
                        ? "border-[var(--forest-green)] ring-2 ring-[var(--forest-green)]/40 bg-[var(--surface-hover)] shadow-sm"
                        : loadingSubjectId
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                  >
                    {isLoading && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--surface-inset)] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[var(--forest-green)] via-[var(--crimson)] to-[var(--forest-green)] wave-shimmer-anim w-full" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-[var(--text-heading)] text-xs sm:text-sm flex items-center gap-1.5">
                        {isLoading && (
                          <div className="h-2.5 w-2.5 rounded-full border-2 border-[var(--crimson)] border-t-transparent animate-spin shrink-0" />
                        )}
                        <span>{subject.name}</span>
                        {isLoading && (
                          <span className="text-[10px] text-[var(--crimson)] font-normal">Opening...</span>
                        )}
                      </div>
                      {subject.description && (
                        <div className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                          {subject.description}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-[var(--text-muted)]">
                      <div className="font-bold text-[var(--forest-green)]">
                        {subject.chapterCount || 0} chapters
                      </div>
                      <div className="text-[10px]">{subject.topicCount || 0} topics</div>
                    </div>
                  </div>
                );
              })}

              {subjects.length > 4 && (
                <button
                  onClick={() => onSelectTab("subjects")}
                  className="inline-flex items-center justify-center gap-1 w-full text-center text-[11px] font-bold text-[var(--forest-green)] hover:underline pt-0.5 cursor-pointer"
                >
                  <span>View all {subjects.length} subjects</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Goals Section */}
        <div className="paper-card p-3 sm:p-3.5 space-y-2 border border-[var(--border-default)]">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">Active Goals</h2>
              <p className="text-[10px] text-[var(--text-muted)]">Desired outcomes and directions</p>
            </div>
            <button
              onClick={onOpenCreateGoal}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--crimson)] hover:underline cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              <span>New Goal</span>
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="paper-inset p-4 text-center space-y-2 bg-[var(--surface-secondary)]">
              <div className="flex justify-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFEAE8] text-[var(--crimson)] shadow-xs">
                  <Target className="h-4 w-4" strokeWidth={1.8} />
                </span>
              </div>
              <div className="font-bold text-xs text-[var(--text-heading)]">No active goals yet.</div>
              <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
                Set clear outcomes like &quot;Master System Design&quot; or &quot;Launch Open Source Project&quot;.
              </p>
              <button
                onClick={onOpenCreateGoal}
                className="paper-btn-secondary inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Create Goal</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {goals.slice(0, 4).map((goal) => {
                const isLoading = loadingGoalId === goal.id;
                return (
                  <div
                    key={goal.id}
                    onClick={() => !loadingGoalId && onSelectGoal(goal)}
                    className={`paper-card-interactive cursor-pointer p-2.5 sm:p-3 flex items-center justify-between relative overflow-hidden transition-all ${
                      isLoading
                        ? "border-[var(--forest-green)] ring-2 ring-[var(--forest-green)]/40 bg-[var(--surface-hover)] shadow-sm"
                        : loadingGoalId
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                  >
                    {isLoading && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--surface-inset)] overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[var(--forest-green)] via-[var(--crimson)] to-[var(--forest-green)] wave-shimmer-anim w-full" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-[var(--text-heading)] text-xs sm:text-sm flex items-center gap-1.5">
                        {isLoading && (
                          <div className="h-2.5 w-2.5 rounded-full border-2 border-[var(--crimson)] border-t-transparent animate-spin shrink-0" />
                        )}
                        <span>{goal.title}</span>
                        {isLoading && (
                          <span className="text-[10px] text-[var(--crimson)] font-normal">Opening...</span>
                        )}
                      </div>
                      {goal.description && (
                        <div className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">{goal.description}</div>
                      )}
                    </div>
                    <span
                      className={`paper-badge px-2 py-0.5 text-[10px] font-bold ${
                        goal.status === "COMPLETED"
                          ? "bg-[#D5E3D2] text-[#122419]"
                          : goal.status === "PAUSED"
                          ? "bg-[#F5E6D3] text-[#7C4A12]"
                          : "bg-[var(--pale-sage)] text-[var(--forest-green)]"
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>
                );
              })}

              {goals.length > 4 && (
                <button
                  onClick={() => onSelectTab("goals")}
                  className="inline-flex items-center justify-center gap-1 w-full text-center text-xs font-bold text-[var(--forest-green)] hover:underline pt-1 cursor-pointer"
                >
                  <span>View all {goals.length} goals</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Activity Heatmap Grid */}
      <ActivityHeatmap />
    </div>
  );
};
