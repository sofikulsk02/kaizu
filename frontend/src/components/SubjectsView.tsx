"use client";

import React, { useState, useRef } from "react";
import { Subject } from "../lib/api";
import { BookOpen, Plus, Search, ArrowRight, Layers, GripVertical } from "lucide-react";

interface SubjectsViewProps {
  subjects: Subject[];
  onSelectSubject: (subject: Subject) => void;
  onOpenCreateSubject: () => void;
  loadingSubjectId?: string | null;
  onReorderSubjects?: (subjects: Subject[]) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  onSelectSubject,
  onOpenCreateSubject,
  loadingSubjectId,
  onReorderSubjects,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [localLoadingId, setLocalLoadingId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const touchDragIdRef = useRef<string | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const activeLoadingId = loadingSubjectId || localLoadingId;
  const isSearchActive = !!searchTerm.trim();

  const handleCardClick = (subject: Subject) => {
    // Prevent click if user just dragged
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    if (activeLoadingId) return;
    setLocalLoadingId(subject.id);
    onSelectSubject(subject);
  };

  // Drag & drop handlers (HTML5 Desktop)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isSearchActive) return;
    isDraggingRef.current = true;
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (isSearchActive || !draggedId || draggedId === id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (id: string) => {
    if (dragOverId === id) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggedId;
    setDraggedId(null);
    setDragOverId(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);

    if (!sourceId || sourceId === targetId || isSearchActive) return;

    const sourceIndex = subjects.findIndex((s) => s.id === sourceId);
    const targetIndex = subjects.findIndex((s) => s.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const next = [...subjects];
    const [removed] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, removed);

    if (onReorderSubjects) {
      onReorderSubjects(next);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  // Touch Drag Handlers (Mobile)
  const handleTouchStart = (id: string) => {
    if (isSearchActive) return;
    touchDragIdRef.current = id;
    setDraggedId(id);
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragIdRef.current || isSearchActive) return;
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const cardEl = targetEl?.closest("[data-reorder-id]");
    if (cardEl) {
      const overId = cardEl.getAttribute("data-reorder-id");
      if (overId && overId !== touchDragIdRef.current) {
        setDragOverId(overId);
      }
    }
  };

  const handleTouchEnd = () => {
    const sourceId = touchDragIdRef.current;
    const targetId = dragOverId;
    touchDragIdRef.current = null;
    setDraggedId(null);
    setDragOverId(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);

    if (!sourceId || !targetId || sourceId === targetId || isSearchActive) return;

    const sourceIndex = subjects.findIndex((s) => s.id === sourceId);
    const targetIndex = subjects.findIndex((s) => s.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const next = [...subjects];
    const [removed] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, removed);

    if (onReorderSubjects) {
      onReorderSubjects(next);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2.5 sm:gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[var(--text-heading)] sm:text-2xl truncate">Subjects</h1>
            {!isSearchActive && subjects.length > 1 && (
              <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)] hidden sm:inline-flex items-center gap-1">
                <GripVertical className="h-2.5 w-2.5" />
                <span>Drag cards to reorder</span>
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onOpenCreateSubject}
          className="paper-btn-primary inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold shrink-0 cursor-pointer active:scale-95 transition-all shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Create Subject</span>
        </button>
      </div>

      {/* Paper Search Bar with Icon */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="text"
          placeholder="Search subjects by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="paper-input w-full pl-10 pr-4 py-2 text-sm placeholder-[var(--text-muted)]"
        />
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="paper-card p-6 sm:p-8 text-center space-y-3">
          <div className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--pale-sage)] text-[var(--forest-green)] shadow-xs">
              <BookOpen className="h-6 w-6" strokeWidth={1.8} />
            </span>
          </div>
          <div className="text-base font-bold text-[var(--text-heading)]">
            {searchTerm ? "No matching subjects found" : "Nothing here yet."}
          </div>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            {searchTerm
              ? `No subjects match "${searchTerm}". Try another search query.`
              : "Create a subject to begin tracking your learning areas, chapters, and topics."}
          </p>
          {!searchTerm && (
            <button
              onClick={onOpenCreateSubject}
              className="paper-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Subject</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => {
            const isLoading = activeLoadingId === subject.id;
            const isOtherLoading = activeLoadingId !== null && !isLoading;
            const isBeingDragged = draggedId === subject.id;
            const isDropTarget = dragOverId === subject.id;

            return (
              <div
                key={subject.id}
                data-reorder-id={subject.id}
                draggable={!isSearchActive && !isLoading}
                onDragStart={(e) => handleDragStart(e, subject.id)}
                onDragOver={(e) => handleDragOver(e, subject.id)}
                onDragLeave={() => handleDragLeave(subject.id)}
                onDrop={(e) => handleDrop(e, subject.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick(subject)}
                className={`group paper-card-interactive p-3 sm:p-3.5 flex flex-col justify-between space-y-2.5 border transition-all relative overflow-hidden select-none ${
                  isBeingDragged
                    ? "opacity-35 scale-95 border-dashed border-[var(--forest-green)] bg-[var(--pale-sage)]/20 shadow-none cursor-grabbing"
                    : isDropTarget
                    ? "border-[var(--forest-green)] ring-2 ring-[var(--forest-green)]/60 bg-[var(--pale-sage)]/30 scale-[1.02] shadow-md"
                    : isLoading
                    ? "border-[var(--forest-green)] ring-2 ring-[var(--forest-green)]/40 bg-[var(--surface-hover)] shadow-md scale-[1.01]"
                    : isOtherLoading
                    ? "opacity-50 pointer-events-none border-[var(--border-default)]"
                    : "border-[var(--border-default)] hover:border-[var(--forest-green)] cursor-grab active:cursor-grabbing"
                }`}
              >
                {/* Top Shimmer Loading Line when this card is opening */}
                {isLoading && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--surface-inset)] overflow-hidden z-10">
                    <div className="h-full bg-gradient-to-r from-[var(--forest-green)] via-[var(--crimson)] to-[var(--forest-green)] wave-shimmer-anim w-full" />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--forest-green)] text-white font-bold text-base shadow-xs shrink-0">
                        {subject.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="paper-badge inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold">
                        <Layers className="h-3 w-3 opacity-70" />
                        <span>{subject.chapterCount || 0} chapters</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-[var(--text-heading)] group-hover:text-[var(--crimson)] transition-colors">
                      {subject.name}
                    </h2>
                    {subject.description ? (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-2">{subject.description}</p>
                    ) : (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)] italic">No description provided</p>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="font-semibold text-[11px]">{subject.topicCount || 0} topics tracked</span>
                  {isLoading ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-xs text-[var(--crimson)] animate-pulse">
                      <div className="h-3 w-3 rounded-full border-2 border-[var(--crimson)] border-t-transparent animate-spin" />
                      <span>Opening workspace...</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-[var(--text-heading)] bg-[var(--surface-secondary)] border border-[var(--border-default)] shadow-2xs group-hover:border-[var(--forest-green)] group-hover:text-[var(--forest-green)] group-hover:bg-[var(--surface-hover)] group-hover:shadow-xs active:scale-95 transition-all cursor-pointer">
                      <span>View</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
