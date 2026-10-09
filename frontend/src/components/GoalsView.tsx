"use client";

import React, { useState } from "react";
import { Goal, GoalStatus, Api } from "../lib/api";

interface GoalsViewProps {
  goals: Goal[];
  onSelectGoal: (goal: Goal) => void;
  onOpenCreateGoal: () => void;
  onRefresh: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onSelectGoal,
  onOpenCreateGoal,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredGoals = goals.filter((g) => {
    if (statusFilter === "ALL") return true;
    return g.status === statusFilter;
  });

  const handleDeleteGoal = async (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete goal "${goal.title}"?`)) return;
    try {
      await Api.deleteGoal(goal.id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete goal");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-heading)] sm:text-3xl">Goals Workspace</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Connect desired outcomes to milestones, tasks, daily actions, and evidence-backed progress.
          </p>
        </div>

        <button
          onClick={onOpenCreateGoal}
          className="paper-btn-primary px-5 py-2.5 text-xs font-bold shadow-xs self-start sm:self-center"
        >
          + Create Goal
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="paper-card p-1.5 flex space-x-1.5 overflow-x-auto border border-[var(--border-default)]">
        {["ALL", "ACTIVE", "COMPLETED", "PAUSED", "STOPPED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 text-xs font-bold transition rounded ${
              statusFilter === status
                ? "bg-[var(--forest-green)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="paper-card p-12 text-center space-y-4">
          <div className="text-4xl">🎯</div>
          <div className="text-lg font-bold text-[var(--text-heading)]">No goals found.</div>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            {statusFilter !== "ALL"
              ? `No goals with status '${statusFilter}'.`
              : "Goals turn long-term outcomes into manageable plans (e.g. 'Get selected for GSoC 2027', 'Master System Design')."}
          </p>
          <button
            onClick={onOpenCreateGoal}
            className="paper-btn-primary px-5 py-2.5 text-xs font-bold"
          >
            + Create Goal
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => onSelectGoal(goal)}
              className="paper-card-interactive cursor-pointer p-6 flex flex-col justify-between space-y-4 border border-[var(--border-default)]"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    {goal.category && (
                      <span className="paper-badge px-2.5 py-0.5 text-[10px] font-bold">
                        {goal.category}
                      </span>
                    )}
                    <h2 className="text-lg font-bold text-[var(--text-heading)] hover:text-[var(--crimson)] transition-colors">
                      {goal.title}
                    </h2>
                  </div>
                  <span
                    className={`paper-badge px-2.5 py-0.5 text-[10px] font-bold ${
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

                {goal.description && (
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                    {goal.description}
                  </p>
                )}

                {goal.targetDate && (
                  <div className="text-xs text-[var(--text-muted)]">
                    Target: <span className="text-[var(--text-heading)] font-semibold">{new Date(goal.targetDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Progress Summary Footer */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <div className="text-[var(--crimson)] font-bold flex items-center space-x-1">
                  <span>Open Goal Workspace →</span>
                </div>

                <button
                  onClick={(e) => handleDeleteGoal(e, goal)}
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
