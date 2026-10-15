"use client";

import React, { useState, useEffect } from "react";
import { Subject, Goal, Api, User } from "../lib/api";
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
  X,
} from "lucide-react";

interface DashboardViewProps {
  user?: User | null;
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
  user,
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
  const [isWritingReflection, setIsWritingReflection] = useState(false);
  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [wentWell, setWentWell] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [changeTomorrow, setChangeTomorrow] = useState("");
  const [reflectionSavedNotice, setReflectionSavedNotice] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const map = getActivityMap(user.id);
    setActivityStats(computeStreakStats(map));

    const today = getTodayReflection(user.id);
    if (today) {
      setReflection(today);
      setWentWell(today.wentWell);
      setDifficulty(today.difficulty);
      setChangeTomorrow(today.changeTomorrow);
    } else {
      setReflection(null);
      setWentWell("");
      setDifficulty("");
      setChangeTomorrow("");
    }
  }, [user?.id]);

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wentWell.trim() && !difficulty.trim() && !changeTomorrow.trim()) return;

    const saved = saveDailyReflection({
      wentWell,
      difficulty,
      changeTomorrow,
    }, user?.id);
    setReflection(saved);
    setIsWritingReflection(false);
    setIsEditingReflection(false);
    setReflectionSavedNotice(true);
    setTimeout(() => setReflectionSavedNotice(false), 3000);

    // Refresh streak & active stats immediately for this specific user
    const map = getActivityMap(user?.id);
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
    <div className="space-y-3 sm:space-y-4 pb-16 sm:pb-6">
      {/* 1. Header & Tactile Calendar Countdown (Clean, Minimal, Non-AI) */}
      <div className="paper-card p-3.5 sm:p-4 border border-[var(--border-default)] space-y-2.5 sm:space-y-3">
        {/* Welcome Back & Core Philosophy */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-[var(--text-heading)]">
                Welcome back
              </h1>
              <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)] inline-flex items-center gap-1">
                <span className="text-[var(--crimson)] font-black">改善</span> Kaizen
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--forest-green)] font-black">反省</span> Hansei
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Continuous, mindful progress through daily action.
            </p>
          </div>
        </div>

        {/* Year Countdown Card - Full-width, perfectly aligned with the Continue Learning card below */}
        <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--crimson)]/10 text-[var(--crimson)] shrink-0">
              <Calendar className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
                {currentYear} Countdown
              </div>
              <div className="flex items-baseline gap-1.5 text-xs sm:text-sm font-black text-[var(--text-heading)]">
                <span className="text-sm sm:text-base text-[var(--crimson)] leading-none">
                  {daysRemainingInYear}
                </span>
                <span className="leading-none">days left</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pl-2">
            <div className="w-16 sm:w-28 h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--crimson)] rounded-full transition-all duration-500"
                style={{ width: `${Math.round(((365 - daysRemainingInYear) / 365) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-[var(--text-muted)]">
              {Math.round(((365 - daysRemainingInYear) / 365) * 100)}%
            </span>
          </div>
        </div>

        {/* Continue Learning Quick Jump Ribbon (Single clean row, aligned directly underneath) */}
        {recentSubject ? (
          <div
            onClick={() => !loadingSubjectId && onSelectSubject(recentSubject)}
            className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] cursor-pointer transition-all active:scale-[0.99] group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--pale-sage)] text-[var(--forest-green)] shrink-0 font-bold text-xs">
                <BookOpen className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
                  Continue Learning
                </div>
                <div className="text-xs sm:text-sm font-bold text-[var(--text-heading)] truncate group-hover:text-[var(--forest-green)] transition-colors">
                  {recentSubject.name}
                  <span className="text-[11px] font-normal text-[var(--text-muted)] ml-2 hidden sm:inline">
                    {recentSubject.chapterCount || 0} chapters · {recentSubject.topicCount || 0} topics
                  </span>
                </div>
              </div>
            </div>

            {loadingSubjectId === recentSubject.id ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--crimson)] animate-pulse shrink-0 pl-2">
                <div className="h-2.5 w-2.5 rounded-full border-2 border-[var(--crimson)] border-t-transparent animate-spin" />
                <span>Opening...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold text-[var(--forest-green)] shrink-0 pl-2">
                <span>Resume</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">No learning areas created yet</span>
            <button
              onClick={onOpenCreateSubject}
              className="paper-btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Subject</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Key Metrics - 4 Clean Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="paper-card p-2.5 sm:p-3 space-y-0.5 border border-[var(--border-default)] card-lift">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Subjects</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--pale-sage)] text-[var(--forest-green)]">
              <BookOpen className="h-3 w-3" />
            </span>
          </div>
          <div className="text-lg font-black text-[var(--text-heading)]">{subjects.length}</div>
          <div className="text-[10px] text-[var(--text-muted)] truncate">
            {subjects.reduce((acc, s) => acc + (s.chapterCount || 0), 0)} tracked chapters
          </div>
        </div>

        <div className="paper-card p-2.5 sm:p-3 space-y-0.5 border border-[var(--border-default)] card-lift">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Goals</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#FFEAE8] text-[var(--crimson)]">
              <Target className="h-3 w-3" />
            </span>
          </div>
          <div className="text-lg font-black text-[var(--text-heading)]">{activeGoals.length}</div>
          <div className="text-[10px] text-[var(--forest-green)] font-semibold truncate">
            {completedGoals.length > 0 ? `${completedGoals.length} achieved` : "In progress"}
          </div>
        </div>

        <div className="paper-card p-2.5 sm:p-3 space-y-0.5 border border-[var(--border-default)] card-lift">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Streak</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              <Zap className="h-3 w-3" />
            </span>
          </div>
          <div className="text-lg font-black text-[var(--forest-green)]">
            {activityStats.currentStreak > 0 ? `${activityStats.currentStreak}d` : `${activityStats.totalActiveDays}d`}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] truncate">
            {activityStats.currentStreak > 0 ? "Daily streak" : "Active days"}
          </div>
        </div>

        <div className="paper-card p-2.5 sm:p-3 space-y-0.5 border border-[var(--border-default)] card-lift">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Weekly Tasks</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--pale-sage)] text-[var(--forest-green)]">
              <CheckCircle2 className="h-3 w-3" />
            </span>
          </div>
          <div className="text-lg font-black text-[var(--text-heading)]">
            {totalTasks > 0 ? `${totalCompletedTasks} / ${totalTasks}` : `${totalCompletedTasks} done`}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] truncate">
            {totalCompletedTasks > 0 ? `${taskProgressPct}% completed` : "Weekly tasks"}
          </div>
        </div>
      </div>

      {/* 3. Michi's Daily Focus - Clean, Single Actionable Guidance (No AI diagnostic text dumps) */}
      <div className="paper-card p-3 sm:p-3.5 border border-[var(--forest-green)]/25 bg-[var(--surface-primary)] rounded-xl card-lift">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--forest-green)] text-white font-black text-[11px] shadow-2xs">
              道
            </span>
            <h2 className="text-xs sm:text-sm font-black text-[var(--text-heading)]">
              Michi&apos;s Daily Focus
            </h2>
          </div>

          <button
            onClick={() => handleOpenMichi()}
            className="text-[11px] font-bold text-[var(--forest-green)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            title="Open Michi chat"
          >
            <MessageSquare className="h-3 w-3" />
            <span>Chat with Michi ↗</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {recentSubject ? (
              <>
                Ready for today&apos;s progress? Build momentum on <strong className="font-bold text-[var(--text-heading)]">{recentSubject.name}</strong> with a focused session.
              </>
            ) : activeGoals.length > 0 ? (
              <>
                Focus on advancing <strong className="font-bold text-[var(--text-heading)]">{activeGoals[0].title}</strong> toward its next milestone today.
              </>
            ) : (
              <>
                Start your journey by defining your first learning subject or actionable goal.
              </>
            )}
          </p>

          <div className="shrink-0 self-start sm:self-auto">
            {recentSubject ? (
              <button
                onClick={() => onSelectSubject(recentSubject)}
                className="paper-btn-secondary px-2.5 py-1 text-xs font-bold text-[var(--forest-green)] inline-flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Resume →</span>
              </button>
            ) : activeGoals.length > 0 ? (
              <button
                onClick={() => onSelectGoal(activeGoals[0])}
                className="paper-btn-secondary px-2.5 py-1 text-xs font-bold text-[var(--forest-green)] inline-flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Focus Goal →</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 4. Daily Reflection / Hansei (Progressive Disclosure) */}
      {reflection && !isEditingReflection ? (
        <div className="paper-card p-3 sm:p-3.5 border border-[var(--border-default)] rounded-xl space-y-2">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <div className="flex items-center space-x-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--pale-sage)] text-[var(--forest-green)]">
                <Lightbulb className="h-3 w-3" />
              </span>
              <h2 className="text-xs sm:text-sm font-black text-[var(--text-heading)]">
                Daily Reflection (Hansei · 反省)
              </h2>
            </div>
            <button
              onClick={() => setIsEditingReflection(true)}
              className="text-[11px] font-bold text-[var(--forest-green)] hover:underline cursor-pointer"
            >
              Edit Reflection
            </button>
          </div>

          {reflectionSavedNotice && (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5 animate-fadeIn">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>Today&apos;s Hansei reflection saved and habit recorded!</span>
            </div>
          )}

          <div className="paper-inset bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] space-y-2 text-xs">
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Recorded for today ({new Date(reflection.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
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
        </div>
      ) : isWritingReflection || isEditingReflection ? (
        <div className="paper-card p-3.5 sm:p-4 space-y-3 border border-[var(--border-default)] rounded-xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <div className="flex items-center space-x-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--pale-sage)] text-[var(--forest-green)]">
                <Lightbulb className="h-3 w-3" />
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-[var(--text-heading)]">
                  Daily Reflection (Hansei · 反省)
                </h2>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Tiny check-in connecting daily effort to continuous improvement.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsWritingReflection(false);
                setIsEditingReflection(false);
              }}
              className="text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveReflection} className="space-y-2.5">
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  What went well today?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mastered Chapter 1, focused session"
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
                  placeholder="e.g. Started late, fatigue"
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
                  placeholder="e.g. Start 30m study at 9 AM"
                  value={changeTomorrow}
                  onChange={(e) => setChangeTomorrow(e.target.value)}
                  className="paper-input w-full p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="hidden sm:flex items-center space-x-1.5 text-[10px]">
                <span className="text-[var(--text-muted)] font-medium">Quick ideas:</span>
                <button
                  type="button"
                  onClick={() => setWentWell((prev) => (prev ? `${prev}, focused deep work` : "Focused deep work"))}
                  className="px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-subtle)] cursor-pointer"
                >
                  + Deep work
                </button>
                <button
                  type="button"
                  onClick={() => setChangeTomorrow((prev) => (prev ? `${prev}, timebox 25m` : "Timebox 25m sessions"))}
                  className="px-1.5 py-0.5 rounded bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-subtle)] cursor-pointer"
                >
                  + Timebox 25m
                </button>
              </div>

              <div className="flex items-center space-x-2 ml-auto">
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
        </div>
      ) : (
        <div className="paper-card p-2.5 sm:p-3 border border-[var(--border-default)] rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--pale-sage)] text-[var(--forest-green)] shrink-0">
              <Lightbulb className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-[var(--text-heading)] truncate">
                Daily Reflection (Hansei · 反省)
              </h2>
              <p className="text-[10px] text-[var(--text-muted)] truncate">
                Take 1 minute to reflect and close today&apos;s feedback loop
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWritingReflection(true)}
            className="paper-btn-secondary px-3 py-1.5 text-xs font-bold text-[var(--forest-green)] shrink-0 cursor-pointer active:scale-95 inline-flex items-center gap-1"
          >
            <PenLine className="h-3 w-3" />
            <span>Reflect</span>
          </button>
        </div>
      )}

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
      <ActivityHeatmap userId={user?.id} />
    </div>
  );
};
