"use client";

import React from "react";
import { Subject, Goal } from "../lib/api";
import { ActivityHeatmap } from "./ActivityHeatmap";
import {
  BookOpen,
  Target,
  Zap,
  Compass,
  Sparkles,
  Plus,
  ArrowRight,
} from "lucide-react";

interface DashboardViewProps {
  subjects: Subject[];
  goals: Goal[];
  onSelectTab: (tab: string) => void;
  onSelectSubject: (subject: Subject) => void;
  onSelectGoal: (goal: Goal) => void;
  onOpenCreateSubject: () => void;
  onOpenCreateGoal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  subjects,
  goals,
  onSelectTab,
  onSelectSubject,
  onSelectGoal,
  onOpenCreateSubject,
  onOpenCreateGoal,
}) => {
  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const completedGoals = goals.filter((g) => g.status === "COMPLETED");
  const recentSubject = subjects.length > 0 ? subjects[0] : null;

  return (
    <div className="space-y-2.5">
      {/* Welcome & Spotlight Banner */}
      <div className="paper-card p-3 sm:p-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1 paper-badge px-2 py-0.5 text-[11px] font-bold text-[var(--forest-green)]">
              <Sparkles className="h-3 w-3" />
              <span>Continuous Improvement Loop</span>
            </div>
            <h1 className="text-lg font-black text-[var(--text-heading)] sm:text-xl">
              Welcome back to Kaizu
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] max-w-xl">
              Turn intentions into consistent action, visible progress, and thoughtful reflection.
            </p>
          </div>

          {recentSubject ? (
            <div className="paper-inset p-2.5 sm:p-3 text-left min-w-[200px] bg-[var(--surface-secondary)] border border-[var(--border-default)]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--forest-green)]">
                Continue Learning
              </div>
              <div className="mt-0.5 font-bold text-[var(--text-heading)] text-xs sm:text-sm">{recentSubject.name}</div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {recentSubject.chapterCount || 0} chapters · {recentSubject.topicCount || 0} topics tracked
              </div>
              <button
                onClick={() => onSelectSubject(recentSubject)}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--crimson)] hover:underline cursor-pointer"
              >
                <span>Resume Learning</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenCreateSubject}
              className="paper-btn-primary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Start building your first Subject</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="paper-card p-2.5 sm:p-3 space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Total Subjects</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--pale-sage)] text-[var(--forest-green)]">
              <BookOpen className="h-3 w-3" />
            </span>
          </div>
          <div className="text-lg font-black text-[var(--text-heading)]">{subjects.length}</div>
          <div className="text-[10px] text-[var(--text-secondary)]">
            {subjects.reduce((acc, s) => acc + (s.chapterCount || 0), 0)} tracked chapters
          </div>
        </div>

        <div className="paper-card p-2.5 sm:p-3 space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Active Goals</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#FFEAE8] text-[var(--crimson)]">
              <Target className="h-3 w-3" />
            </span>
          </div>
          <div className="text-lg font-black text-[var(--text-heading)]">{activeGoals.length}</div>
          <div className="text-[10px] text-[var(--forest-green)] font-semibold">
            {completedGoals.length} goals achieved
          </div>
        </div>

        <div className="paper-card p-2.5 sm:p-3 space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Active Days</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              <Zap className="h-3 w-3" />
            </span>
          </div>
          <div className="text-base font-black text-[var(--forest-green)]">Consistent</div>
          <div className="text-[10px] text-[var(--text-secondary)]">Evidence-backed progress</div>
        </div>

        <div className="paper-card p-2.5 sm:p-3 space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
            <span>Core Philosophy</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--pale-sage)] text-[var(--forest-green)]">
              <Compass className="h-3 w-3" />
            </span>
          </div>
          <div className="text-sm font-black text-[var(--text-heading)]">Kaizen & Hansei</div>
          <div className="text-[10px] text-[var(--text-secondary)]">Small daily improvements</div>
        </div>
      </div>

      {/* Main Sections: Subjects & Goals */}
      <div className="grid gap-2.5 lg:grid-cols-2">
        {/* Subjects Section */}
        <div className="paper-card p-3 sm:p-3.5 space-y-2">
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
              {subjects.slice(0, 4).map((subject) => (
                <div
                  key={subject.id}
                  onClick={() => onSelectSubject(subject)}
                  className="paper-card-interactive cursor-pointer p-2.5 sm:p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[var(--text-heading)] text-xs sm:text-sm">
                      {subject.name}
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
              ))}

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
        <div className="paper-card p-3 sm:p-3.5 space-y-2">
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
                Set clear outcomes like "Master System Design" or "Launch Open Source Project".
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
              {goals.slice(0, 4).map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => onSelectGoal(goal)}
                  className="paper-card-interactive cursor-pointer p-2.5 sm:p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[var(--text-heading)] text-xs sm:text-sm">{goal.title}</div>
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
              ))}

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
