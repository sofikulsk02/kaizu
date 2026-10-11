"use client";

import React, { useState } from "react";
import { Api } from "../lib/api";
import { X } from "lucide-react";
import { Portal } from "./Portal";

interface CreateSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateSubjectModal: React.FC<CreateSubjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Subject name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await Api.createSubject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create subject");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6">
        <div className="flex min-h-full items-center justify-center pt-16 sm:pt-20 pb-8">
          <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-md p-6 space-y-5 rounded-xl border border-[var(--border-default)] shadow-2xl relative my-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-heading)]">Create Subject</h2>
                <p className="text-xs text-[var(--text-muted)]">Start building your learning journey</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-secondary)] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
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
                  Subject Name <span className="text-[var(--crimson)]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems, DSA, System Design"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="paper-input w-full px-4 py-2.5 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                  Description <span className="text-[var(--text-muted)] font-normal">(Optional)</span>
                </label>
                <textarea
                  placeholder="What do you want to learn or practice in this area?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="paper-input w-full px-4 py-2.5 text-sm"
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
                  {loading ? "Creating..." : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  );
};
