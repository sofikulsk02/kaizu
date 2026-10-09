"use client";

import React, { useState } from "react";
import { Api, GoalStatus } from "../lib/api";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [successDefinition, setSuccessDefinition] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<GoalStatus>("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Goal title is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await Api.createGoal({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        successDefinition: successDefinition.trim() || undefined,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        status,
      });
      setTitle("");
      setDescription("");
      setCategory("");
      setSuccessDefinition("");
      setTargetDate("");
      setStatus("ACTIVE");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-md p-6 space-y-5 rounded-xl border border-[var(--border-default)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-heading)]">Create Goal</h2>
            <p className="text-xs text-[var(--text-muted)]">What outcome do you want to achieve?</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-heading)] font-bold text-lg">
            ✕
          </button>
        </div>

        {error && (
          <div className="paper-card bg-red-500/10 p-3 text-xs font-semibold text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
              Goal Outcome / Title <span className="text-[var(--crimson)]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Get selected for GSoC 2027, Master System Design"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="paper-input w-full px-4 py-2.5 text-sm"
              autoFocus
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Category (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Career, Learning"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="paper-input w-full px-3.5 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="paper-input w-full px-3.5 py-2 text-xs bg-[var(--surface-primary)]"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="STOPPED">STOPPED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
              Reason / Description <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <textarea
              placeholder="e.g. Build open-source experience and prepare a strong application."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="paper-input w-full px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
              Success Definition <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Submit a strong proposal and get accepted"
              value={successDefinition}
              onChange={(e) => setSuccessDefinition(e.target.value)}
              className="paper-input w-full px-4 py-2.5 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Target Date (Optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="paper-input w-full px-3.5 py-2 text-xs bg-[var(--surface-primary)]"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2 border-t border-[var(--border-default)]">
            <button
              type="button"
              onClick={onClose}
              className="paper-btn-secondary px-4 py-2 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="paper-btn-primary px-5 py-2 text-xs font-bold disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
