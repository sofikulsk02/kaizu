"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Thought, Api } from "../lib/api";
import {
  Pin,
  PinOff,
  Plus,
  Search,
  X,
  Trash2,
  Edit3,
  Clock,
  Feather,
  AlertCircle,
  Check,
  Sparkles,
} from "lucide-react";
import { Portal } from "./Portal";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "";
  }
}

export const ThoughtsView: React.FC = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quick Composer / Editor state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingThought, setEditingThought] = useState<Thought | null>(null);
  const [editorTitle, setEditorTitle] = useState<string>("");
  const [editorContent, setEditorContent] = useState<string>("");
  const [editorIsPinned, setEditorIsPinned] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deletingThought, setDeletingThought] = useState<Thought | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Content textarea ref for auto-focus
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Fetch thoughts from API with graceful error handling
  const fetchThoughts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await Api.getThoughts();
      setThoughts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.warn("Could not fetch thoughts:", err);
      setError(err.message || "Failed to load thoughts");
      // Fallback: check local storage cache if available
      try {
        const cached = localStorage.getItem("kaizu_cached_thoughts");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) setThoughts(parsed);
        }
      } catch (e) {}
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThoughts();
  }, [fetchThoughts]);

  // Persist to local cache on change
  useEffect(() => {
    if (Array.isArray(thoughts) && thoughts.length > 0) {
      try {
        localStorage.setItem("kaizu_cached_thoughts", JSON.stringify(thoughts));
      } catch (e) {}
    }
  }, [thoughts]);

  // Open editor for creating a new thought
  const handleOpenCreate = () => {
    setEditingThought(null);
    setEditorTitle("");
    setEditorContent("");
    setEditorIsPinned(false);
    setEditorError(null);
    setIsEditorOpen(true);
    setTimeout(() => {
      contentTextareaRef.current?.focus();
    }, 100);
  };

  // Open editor for modifying an existing thought
  const handleOpenEdit = (thought: Thought) => {
    setEditingThought(thought);
    setEditorTitle(thought.title || "");
    setEditorContent(thought.content);
    setEditorIsPinned(thought.isPinned);
    setEditorError(null);
    setIsEditorOpen(true);
    setTimeout(() => {
      contentTextareaRef.current?.focus();
    }, 100);
  };

  // Close editor
  const handleCloseEditor = () => {
    if (isSaving) return;
    setIsEditorOpen(false);
    setEditingThought(null);
    setEditorTitle("");
    setEditorContent("");
    setEditorIsPinned(false);
    setEditorError(null);
  };

  // Save thought (Create or Update)
  const handleSaveThought = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedContent = editorContent.trim();
    if (!trimmedContent) {
      setEditorError("Please write something. Thought content cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);
      setEditorError(null);

      if (editingThought) {
        // Update existing thought
        const updated = await Api.updateThought(editingThought.id, {
          title: editorTitle.trim() || null,
          content: trimmedContent,
          isPinned: editorIsPinned,
        });

        setThoughts((prev) => {
          const next = (prev || []).map((t) => (t.id === updated.id ? updated : t));
          return next.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
        });
      } else {
        // Create new thought
        const created = await Api.createThought({
          title: editorTitle.trim() || null,
          content: trimmedContent,
          isPinned: editorIsPinned,
        });

        setThoughts((prev) => {
          const next = [created, ...(prev || [])];
          return next.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
        });
      }

      setIsEditorOpen(false);
      setEditingThought(null);
      setEditorTitle("");
      setEditorContent("");
    } catch (err: any) {
      console.error("Failed to save thought:", err);
      setEditorError(err.message || "Failed to save thought. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle pin on a thought
  const handleTogglePin = async (e: React.MouseEvent, thought: Thought) => {
    e.stopPropagation();
    const newPinned = !thought.isPinned;

    // Optimistic UI update
    setThoughts((prev) =>
      (prev || [])
        .map((t) => (t.id === thought.id ? { ...t, isPinned: newPinned } : t))
        .sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
    );

    try {
      await Api.updateThought(thought.id, { isPinned: newPinned });
    } catch (err: any) {
      console.error("Failed to toggle pin:", err);
      fetchThoughts();
    }
  };

  // Open delete confirmation
  const handlePromptDelete = (e: React.MouseEvent, thought: Thought) => {
    e.stopPropagation();
    setDeletingThought(thought);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingThought) return;

    try {
      setIsDeleting(true);
      await Api.deleteThought(deletingThought.id);
      setThoughts((prev) => (prev || []).filter((t) => t.id !== deletingThought.id));
      setDeletingThought(null);
    } catch (err: any) {
      console.error("Failed to delete thought:", err);
      alert(err.message || "Failed to delete thought");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered thoughts based on search
  const filteredThoughts = useMemo(() => {
    const list = Array.isArray(thoughts) ? thoughts : [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((thought) => {
      const matchTitle = thought.title ? thought.title.toLowerCase().includes(q) : false;
      const matchContent = thought.content ? thought.content.toLowerCase().includes(q) : false;
      return matchTitle || matchContent;
    });
  }, [thoughts, searchQuery]);

  // Split into pinned and unpinned lists
  const pinnedThoughts = useMemo(() => {
    return filteredThoughts.filter((t) => t.isPinned);
  }, [filteredThoughts]);

  const recentThoughts = useMemo(() => {
    return filteredThoughts.filter((t) => !t.isPinned);
  }, [filteredThoughts]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* 1. Header Section - Aligned in single row on mobile & desktop */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3 sm:pb-4">
        <div className="min-w-0">
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-[var(--text-heading)] truncate">
              Thoughts
            </h1>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full bg-[var(--pale-sage)] text-[var(--deep-forest)] border border-[var(--border-default)]/50 shrink-0">
              {(thoughts || []).length}
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-[var(--text-muted)] font-medium truncate">
            Things worth remembering.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center shrink-0">
          <button
            onClick={handleOpenCreate}
            id="new-thought-btn"
            className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[var(--forest-green)] hover:opacity-90 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer select-none shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 shrink-0 stroke-[2.5]" />
            <span>New thought</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Writing Composer (Inline Card) - Hidden on mobile view when collapsed */}
      <div className={`${!isEditorOpen ? "hidden sm:block" : "block"} rounded-xl bg-[var(--surface-primary)] border border-[var(--border-default)] p-3 sm:p-4 shadow-xs transition-all hover:border-[var(--forest-green)]/40`}>
        {!isEditorOpen || editingThought ? (
          // Collapsed Prompt Button
          <div
            onClick={handleOpenCreate}
            className="flex items-center justify-between text-sm text-[var(--text-muted)] cursor-pointer py-1 px-2 select-none hover:text-[var(--text-primary)]"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--pale-sage)] text-[var(--forest-green)] shrink-0">
                <Feather className="w-4 h-4" />
              </span>
              <span className="truncate font-medium text-xs sm:text-sm">
                Capture a principle, reminder, observation, or idea...
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[var(--surface-secondary)] text-[var(--forest-green)] hover:bg-[var(--surface-hover)]">
              Write
            </span>
          </div>
        ) : (
          // Expanded Inline Editor
          <form onSubmit={handleSaveThought} className="space-y-3 pt-1">
            {editorError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editorError}</span>
              </div>
            )}

            {/* Optional Title */}
            <div>
              <input
                type="text"
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                placeholder="Title (optional)"
                maxLength={255}
                disabled={isSaving}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)]/60 border border-[var(--border-default)] text-sm font-bold text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--forest-green)]"
              />
            </div>

            {/* Main Content Area */}
            <div>
              <textarea
                ref={contentTextareaRef}
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder="What matters right now? Write freely — principles, observations, or thoughts you want to revisit..."
                rows={4}
                required
                maxLength={20000}
                disabled={isSaving}
                className="w-full p-3 rounded-lg bg-[var(--bg-main)]/60 border border-[var(--border-default)] text-sm leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--forest-green)] resize-y"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setEditorIsPinned(!editorIsPinned)}
                disabled={isSaving}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer select-none ${
                  editorIsPinned
                    ? "bg-[var(--pale-sage)] border-[var(--forest-green)] text-[var(--forest-green)]"
                    : "bg-[var(--surface-primary)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Pin className={`w-3.5 h-3.5 ${editorIsPinned ? "fill-current" : ""}`} />
                <span>{editorIsPinned ? "Pinned to top" : "Pin to top"}</span>
              </button>

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={handleCloseEditor}
                  disabled={isSaving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !editorContent.trim()}
                  className="inline-flex items-center px-4 py-1.5 rounded-lg bg-[var(--forest-green)] hover:opacity-90 active:scale-95 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isSaving ? "Saving..." : "Save Thought"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* 3. Search Bar - Hidden on mobile view */}
      {((thoughts && thoughts.length > 0) || searchQuery) && (
        <div className="hidden sm:block relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search thoughts by title or content..."
            className="w-full pl-9 pr-9 py-2 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--forest-green)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 4. Error Notice */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchThoughts}
            className="font-bold underline hover:no-underline ml-3 cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. Loading Skeleton */}
      {isLoading && (!thoughts || thoughts.length === 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-default)] p-4 space-y-2.5"
            >
              <div className="h-4 bg-[var(--border-default)]/60 rounded w-1/2" />
              <div className="space-y-1.5 pt-1">
                <div className="h-3 bg-[var(--border-default)]/40 rounded w-full" />
                <div className="h-3 bg-[var(--border-default)]/40 rounded w-5/6" />
                <div className="h-3 bg-[var(--border-default)]/40 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Empty State: No thoughts at all */}
      {!isLoading && (!thoughts || thoughts.length === 0) && (
        <div className="py-14 sm:py-20 text-center rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-default)] px-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--pale-sage)] flex items-center justify-center text-[var(--forest-green)] mb-3.5">
            <Feather className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[var(--text-heading)]">
            A quiet space for what matters.
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
            Capture personal principles, reminders, observations, and ideas you want to remember.
            Free from deadlines, streaks, or pressure.
          </p>
          <div className="mt-5">
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--forest-green)] hover:opacity-90 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              Write your first thought
            </button>
          </div>
        </div>
      )}

      {/* 7. Empty Search State */}
      {!isLoading && thoughts && thoughts.length > 0 && filteredThoughts.length === 0 && (
        <div className="py-10 text-center rounded-xl bg-[var(--surface-primary)] border border-[var(--border-default)] px-4">
          <Search className="w-6 h-6 text-[var(--text-muted)] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[var(--text-heading)]">
            No thoughts match &quot;{searchQuery}&quot;
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Try searching for other words or clear the search.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-3 text-xs font-semibold text-[var(--forest-green)] hover:underline cursor-pointer"
          >
            Clear search
          </button>
        </div>
      )}

      {/* 8. Thoughts Cards Grid */}
      {filteredThoughts.length > 0 && (
        <div className="space-y-6">
          {/* Pinned Thoughts Section */}
          {pinnedThoughts.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center space-x-1.5 px-1">
                <Pin className="w-3.5 h-3.5 text-[var(--forest-green)] fill-current" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Pinned ({pinnedThoughts.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {pinnedThoughts.map((thought) => (
                  <ThoughtCard
                    key={thought.id}
                    thought={thought}
                    onEdit={() => handleOpenEdit(thought)}
                    onTogglePin={(e) => handleTogglePin(e, thought)}
                    onDelete={(e) => handlePromptDelete(e, thought)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent / Unpinned Section */}
          {recentThoughts.length > 0 && (
            <div className="space-y-2.5">
              {pinnedThoughts.length > 0 && (
                <div className="flex items-center space-x-1.5 px-1 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Recent Thoughts
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {recentThoughts.map((thought) => (
                  <ThoughtCard
                    key={thought.id}
                    thought={thought}
                    onEdit={() => handleOpenEdit(thought)}
                    onTogglePin={(e) => handleTogglePin(e, thought)}
                    onDelete={(e) => handlePromptDelete(e, thought)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. Modal Editor (used when editing existing thought or clicking + New Thought when desired) */}
      {isEditorOpen && editingThought && (
        <Portal>
          <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-20 pb-8 bg-black/50 backdrop-blur-xs transition-all">
            <div
              className="w-full max-w-lg rounded-2xl bg-[var(--surface-dialog)] border border-[var(--border-default)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto animate-in fade-in zoom-in-95 duration-150"
              role="dialog"
              aria-modal="true"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] bg-[var(--surface-primary)]">
                <div className="flex items-center space-x-2">
                  <Feather className="w-4 h-4 text-[var(--forest-green)]" />
                  <span className="text-sm font-bold text-[var(--text-heading)]">
                    Edit Thought
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCloseEditor}
                  disabled={isSaving}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-default)]/30 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveThought} className="p-5 flex-1 overflow-y-auto space-y-4">
                {editorError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editorError}</span>
                  </div>
                )}

                {/* Optional Title Input */}
                <div>
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    placeholder="Title (optional)"
                    maxLength={255}
                    disabled={isSaving}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-default)] text-base font-bold text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--forest-green)]"
                  />
                </div>

                {/* Content Textarea */}
                <div>
                  <textarea
                    ref={contentTextareaRef}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder="Write your thought..."
                    rows={8}
                    required
                    maxLength={20000}
                    disabled={isSaving}
                    className="w-full p-3.5 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-default)] text-sm leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--forest-green)] resize-none"
                  />
                  <div className="flex justify-between items-center mt-1 px-1 text-[11px] text-[var(--text-muted)]">
                    <span>{editorContent.length} / 20,000 characters</span>
                  </div>
                </div>

                {/* Pin Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setEditorIsPinned(!editorIsPinned)}
                    disabled={isSaving}
                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer select-none ${
                      editorIsPinned
                        ? "bg-[var(--pale-sage)] border-[var(--forest-green)] text-[var(--forest-green)]"
                        : "bg-[var(--surface-primary)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${editorIsPinned ? "fill-current" : ""}`} />
                    <span>{editorIsPinned ? "Pinned to top" : "Pin to top"}</span>
                  </button>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={handleCloseEditor}
                    disabled={isSaving}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--border-default)]/30 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !editorContent.trim()}
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--forest-green)] hover:opacity-90 active:scale-95 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {isSaving ? "Updating..." : "Update Thought"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* 10. Delete Confirmation Dialog */}
      {deletingThought && (
        <Portal>
          <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div
              className="w-full max-w-sm rounded-2xl bg-[var(--surface-dialog)] border border-[var(--border-default)] p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
              role="alertdialog"
              aria-modal="true"
            >
              <div className="flex items-center space-x-2.5 text-[var(--crimson)]">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-[var(--text-heading)]">Delete Thought?</h3>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                Are you sure you want to delete this thought? This action cannot be undone.
              </p>
              {deletingThought.title && (
                <div className="p-2.5 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] italic truncate">
                  &ldquo;{deletingThought.title}&rdquo;
                </div>
              )}
              <div className="flex items-center justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingThought(null)}
                  disabled={isDeleting}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--border-default)]/30 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--crimson)] hover:bg-[var(--crimson-hover)] active:scale-95 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

interface ThoughtCardProps {
  thought: Thought;
  onEdit: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ThoughtCard: React.FC<ThoughtCardProps> = ({
  thought,
  onEdit,
  onTogglePin,
  onDelete,
}) => {
  return (
    <div
      onClick={onEdit}
      className={`group relative flex flex-col justify-between rounded-xl bg-[var(--surface-primary)] border transition-all duration-200 p-4 sm:p-4.5 cursor-pointer shadow-xs hover:shadow-sm ${
        thought.isPinned
          ? "border-[var(--forest-green)]/45 bg-[var(--surface-primary)]"
          : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
      }`}
    >
      {/* Top Header: Title & Action Icons */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          {thought.title ? (
            <h3 className="text-sm sm:text-base font-bold text-[var(--text-heading)] leading-snug break-words line-clamp-2">
              {thought.title}
            </h3>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] opacity-70">
              Thought
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 shrink-0 -mr-1">
          {/* Pin toggle button */}
          <button
            type="button"
            onClick={onTogglePin}
            title={thought.isPinned ? "Unpin thought" : "Pin thought to top"}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              thought.isPinned
                ? "text-[var(--forest-green)] bg-[var(--pale-sage)] hover:bg-[var(--pale-sage)]/80"
                : "text-[var(--text-muted)] opacity-60 hover:opacity-100 hover:bg-[var(--border-default)]/40"
            }`}
          >
            {thought.isPinned ? (
              <Pin className="w-3.5 h-3.5 fill-current" />
            ) : (
              <PinOff className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={onDelete}
            title="Delete thought"
            className="p-1.5 rounded-md text-[var(--text-muted)] opacity-60 hover:opacity-100 hover:text-[var(--crimson)] hover:bg-[var(--crimson)]/10 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body Content Preview */}
      <div className="flex-1 my-1">
        <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words line-clamp-6 font-normal">
          {thought.content}
        </p>
      </div>

      {/* Card Footer: Timestamp */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-[var(--text-muted)] opacity-70 shrink-0" />
          <span>{formatRelativeTime(thought.updatedAt)}</span>
        </div>
        <span className="opacity-0 group-hover:opacity-100 text-[var(--forest-green)] font-semibold transition-opacity text-xs flex items-center">
          Edit
        </span>
      </div>
    </div>
  );
};
