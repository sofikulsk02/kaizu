"use client";

import React from "react";
import { Subject, Goal } from "../lib/api";
import { ActivityHeatmap } from "./ActivityHeatmap";

interface ActivityViewProps {
  subjects: Subject[];
  goals: Goal[];
}

export const ActivityView: React.FC<ActivityViewProps> = ({ subjects, goals }) => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-heading)] sm:text-3xl">Activity & Progress Log</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Cross-cutting evidence of your daily learning, goals, and consistency history.
        </p>
      </div>

      {/* Heatmap Grid */}
      <ActivityHeatmap />

      {/* Action Evidence List */}
      <div className="paper-card p-6 space-y-4 border border-[var(--border-default)]">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--forest-green)]">
          Recent Action Evidence
        </h2>

        {subjects.length === 0 && goals.length === 0 ? (
          <div className="paper-card bg-[var(--surface-secondary)] p-6 text-center text-xs text-[var(--text-muted)] border border-[var(--border-default)]">
            No tracked activity log items yet. Start by creating subjects or goals!
          </div>
        ) : (
          <div className="space-y-3">
            {subjects.map((sub) => (
              <div
                key={sub.id}
                className="paper-card bg-[var(--surface-secondary)] p-4 flex items-center justify-between border border-[var(--border-default)]"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl">📚</div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-heading)]">Subject Tracked: {sub.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {sub.chapterCount || 0} chapters, {sub.topicCount || 0} topics
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  {new Date(sub.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}

            {goals.map((g) => (
              <div
                key={g.id}
                className="paper-card bg-[var(--surface-secondary)] p-4 flex items-center justify-between border border-[var(--border-default)]"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl">🎯</div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-heading)]">Goal Created: {g.title}</div>
                    <div className="text-xs text-[var(--text-muted)]">Status: {g.status}</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[var(--text-muted)]">
                  {new Date(g.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
