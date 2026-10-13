"use client";

import React, { useState, useRef } from "react";
import { Goal, Api } from "../lib/api";
import { Target, Plus, ArrowRight, Trash2, GripVertical } from "lucide-react";

interface GoalsViewProps {
  goals: Goal[];
  onSelectGoal: (goal: Goal) => void;
  onOpenCreateGoal: () => void;
  onRefresh: () => void;
  loadingGoalId?: string | null;
  onReorderGoals?: (goals: Goal[]) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  onSelectGoal,
  onOpenCreateGoal,
  onRefresh,
  loadingGoalId,
  onReorderGoals,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [localLoadingId, setLocalLoadingId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const touchDragIdRef = useRef<string | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const activeLoadingId = loadingGoalId || localLoadingId;
  const isFilterActive = statusFilter !== "ALL";

  const handleCardClick = (goal: Goal) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    if (activeLoadingId) return;
    setLocalLoadingId(goal.id);
    onSelectGoal(goal);
  };

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

  // Drag & drop handlers (HTML5 Desktop)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isFilterActive) return;
    isDraggingRef.current = true;
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (isFilterActive || !draggedId || draggedId === id) return;
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

    if (!sourceId || sourceId === targetId || isFilterActive) return;

    const sourceIndex = goals.findIndex((g) => g.id === sourceId);
    const targetIndex = goals.findIndex((g) => g.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const next = [...goals];
    const [removed] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, removed);

    if (onReorderGoals) {
      onReorderGoals(next);
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
    if (isFilterActive) return;
    touchDragIdRef.current = id;
    setDraggedId(id);
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragIdRef.current || isFilterActive) return;
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

    if (!sourceId || !targetId || sourceId === targetId || isFilterActive) return;

    const sourceIndex = goals.findIndex((g) => g.id === sourceId);
    const targetIndex = goals.findIndex((g) => g.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const next = [...goals];
    const [removed] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, removed);

    if (onReorderGoals) {
      onReorderGoals(next);
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (statusFilter === "ALL") return true;
    return g.status === statusFilter;
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[var(--text-heading)] sm:text-2xl">Goals Workspace</h1>
            {!isFilterActive && goals.length > 1 && (
              <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--surface-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)] hidden sm:inline-flex items-center gap-1">
                <GripVertical className="h-2.5 w-2.5" />
                <span>Drag cards to reorder</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Connect desired outcomes to milestones, tasks, and daily actions. Drag to reorder.
          </p>
        </div>

        <button
          onClick={onOpenCreateGoal}
          className="paper-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold shadow-xs self-start sm:self-center cursor-pointer active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Create Goal</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="paper-card p-1 flex space-x-1 overflow-x-auto border border-[var(--border-default)]">
        {["ALL", "ACTIVE", "COMPLETED", "PAUSED", "STOPPED"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 text-xs font-bold transition rounded cursor-pointer ${
              statusFilter === status
                ? "bg-[var(--forest-green)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="paper-card p-6 sm:p-8 text-center space-y-3">
          <div className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFEAE8] text-[var(--crimson)] shadow-xs">
              <Target className="h-6 w-6" strokeWidth={1.8} />
            </span>
          </div>
          <div className="text-base font-bold text-[var(--text-heading)]">No goals found.</div>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            {statusFilter !== "ALL"
              ? `No goals with status '${statusFilter}'.`
              : "Goals turn long-term outcomes into manageable plans (e.g. 'Get selected for GSoC 2027', 'Master System Design')."}
          </p>
          <button
            onClick={onOpenCreateGoal}
            className="paper-btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => {
            const isLoading = activeLoadingId === goal.id;
            const isOtherLoading = activeLoadingId !== null && !isLoading;
            const isBeingDragged = draggedId === goal.id;
            const isDropTarget = dragOverId === goal.id;

            return (
              <div
                key={goal.id}
                data-reorder-id={goal.id}
                draggable={!isFilterActive && !isLoading}
                onDragStart={(e) => handleDragStart(e, goal.id)}
                onDragOver={(e) => handleDragOver(e, goal.id)}
                onDragLeave={() => handleDragLeave(goal.id)}
                onDrop={(e) => handleDrop(e, goal.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick(goal)}
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      {goal.category && (
                        <span className="paper-badge px-2 py-0.5 text-[9px] font-bold">
                          {goal.category}
                        </span>
                      )}
                      <h2 className="text-base font-bold text-[var(--text-heading)] group-hover:text-[var(--crimson)] transition-colors truncate">
                        {goal.title}
                      </h2>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <span
                        className={`paper-badge px-2 py-0.5 text-[10px] font-bold shrink-0 ${
                          goal.status === "COMPLETED"
                            ? "bg-[#D5E3D2] text-[#122419]"
                            : goal.status === "PAUSED"
                            ? "bg-[#F5E6D3] text-[#7C4A12]"
                            : "bg-[var(--pale-sage)] text-[var(--forest-green)]"
                        }`}
                      >
                        {goal.status}
                      </span>

                      {/* Drag Grip Handle */}
                      {!isFilterActive && (
                        <div
                          title="Drag to rearrange"
                          onClick={(e) => e.stopPropagation()}
                          onTouchStart={() => handleTouchStart(goal.id)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          style={{ touchAction: "none" }}
                          className="p-1 rounded text-[var(--text-muted)] opacity-40 group-hover:opacity-100 hover:text-[var(--text-heading)] hover:bg-[var(--surface-secondary)] cursor-grab active:cursor-grabbing transition-opacity"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {goal.description && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                      {goal.description}
                    </p>
                  )}

                  {goal.targetDate && (
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Target: <span className="text-[var(--text-heading)] font-semibold">{new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Progress Summary Footer */}
                <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                  {isLoading ? (
                    <div className="inline-flex items-center gap-1.5 text-[var(--crimson)] font-bold text-xs animate-pulse">
                      <div className="h-3 w-3 rounded-full border-2 border-[var(--crimson)] border-t-transparent animate-spin" />
                      <span>Opening workspace...</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-[var(--crimson)] font-bold text-xs group-hover:underline">
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}

                  <button
                    onClick={(e) => handleDeleteGoal(e, goal)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete goal"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
