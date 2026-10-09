"use client";

import React, { useState } from "react";
import { Api, Goal } from "../lib/api";

interface QuickCaptureModalProps {
  isOpen: boolean;
  goals: Goal[];
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  goals,
  onClose,
  onSuccess,
}) => {
  const [input, setInput] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [parsedFeedback, setParsedFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setParsedFeedback(null);

    try {
      const res = await Api.quickCapture(input.trim(), selectedGoalId || undefined);
      setParsedFeedback(
        `Logged: "${res.summary}" ${res.durationMinutes ? `(⏱️ ${res.durationMinutes} mins)` : ""}`
      );
      setInput("");
      setTimeout(() => {
        onSuccess();
        onClose();
        setParsedFeedback(null);
      }, 1000);
    } catch (err: any) {
      alert(err.message || "Failed to process quick capture");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-lg p-6 space-y-5 rounded-xl border border-[var(--border-default)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-heading)]">⚡ Frictionless Quick Capture</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Type naturally e.g. "Studied Computer Networks for 45 mins" or "Read GSoC guide"
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-heading)] font-bold text-lg">
            ✕
          </button>
        </div>

        {parsedFeedback && (
          <div className="paper-card bg-[var(--pale-sage)] p-3 text-xs font-bold text-[var(--forest-green)] border border-[var(--sage)]">
            ✓ {parsedFeedback}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div>
            <label className="block text-[var(--text-heading)] mb-1.5">Natural Language Entry *</label>
            <input
              type="text"
              required
              placeholder="e.g. Practiced System Design for 1 hour"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="paper-input w-full p-3.5 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[var(--text-muted)] mb-1">Link to Goal (Optional)</label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="paper-input w-full p-3 text-xs bg-[var(--surface-primary)]"
            >
              <option value="">Auto-detect or Primary Goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
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
              className="paper-btn-primary px-6 py-2 text-xs font-bold"
            >
              {loading ? "Capturing..." : "Log Effort"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
