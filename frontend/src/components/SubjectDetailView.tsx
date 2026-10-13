"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Clock,
  Pencil,
  Trash2,
  Play,
  BookOpen,
  Zap,
  Flame,
  CheckCircle2,
  CircleDot,
  Circle,
  Sparkles,
  Plus,
  FileText,
  Target,
  ExternalLink,
  X,
  Calendar,
  Layers,
  History,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
} from "lucide-react";
import { Subject, Chapter, Topic, StudySession, TopicStatus, Api } from "../lib/api";

interface SubjectDetailViewProps {
  subject: Subject;
  onBack: () => void;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<
  TopicStatus,
  {
    label: string;
    badgeClass: string;
    textColor: string;
    Icon: React.ComponentType<{ className?: string }>;
    dotColor: string;
  }
> = {
  NOT_STARTED: {
    label: "Not Started",
    badgeClass: "bg-[var(--surface-inset)] text-[var(--text-muted)] border border-[var(--border-subtle)]",
    textColor: "text-[var(--text-muted)]",
    Icon: Circle,
    dotColor: "bg-gray-400",
  },
  LEARNING: {
    label: "Learning",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30",
    textColor: "text-blue-600 dark:text-blue-400",
    Icon: CircleDot,
    dotColor: "bg-blue-500",
  },
  STUDIED: {
    label: "Studied",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
    textColor: "text-emerald-600 dark:text-emerald-400",
    Icon: CheckCircle2,
    dotColor: "bg-emerald-500",
  },
  NEEDS_REVISION: {
    label: "Needs Revision",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
    textColor: "text-amber-600 dark:text-amber-400",
    Icon: Flame,
    dotColor: "bg-amber-500",
  },
  UNDERSTOOD: {
    label: "Mastered",
    badgeClass: "bg-[var(--pale-sage)] text-[var(--forest-green)] border border-[var(--sage)]/50",
    textColor: "text-[var(--forest-green)]",
    Icon: Sparkles,
    dotColor: "bg-[var(--forest-green)]",
  },
};

function formatMinutes(mins: number): string {
  if (!mins || mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({
  subject,
  onBack,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<"structure" | "sessions" | "revision">("structure");

  // Chapter & Topic management state
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDesc, setNewChapterDesc] = useState("");
  const [activeChapterForTopic, setActiveChapterForTopic] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState("");

  // Edit Subject state
  const [editingSubject, setEditingSubject] = useState(false);
  const [editSubjectName, setEditSubjectName] = useState(subject.name);
  const [editSubjectDesc, setEditSubjectDesc] = useState(subject.description || "");

  // Modal State: Log Study Session
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionSummary, setSessionSummary] = useState("");
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionTopicId, setSessionTopicId] = useState<string>("");
  const [sessionConfidence, setSessionConfidence] = useState<number>(4);
  const [sessionOutcome, setSessionOutcome] = useState("");
  const [sessionNextStep, setSessionNextStep] = useState("");

  // Modal State: Edit Topic Details
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicStatus, setTopicStatus] = useState<TopicStatus>("NOT_STARTED");
  const [topicConfidence, setTopicConfidence] = useState<number>(3);
  const [topicNotes, setTopicNotes] = useState("");
  const [topicResources, setTopicResources] = useState("");
  const [topicNextStep, setTopicNextStep] = useState("");
  const [topicRevisionDate, setTopicRevisionDate] = useState("");

  // Collapsed chapters state
  const [collapsedChapterIds, setCollapsedChapterIds] = useState<Set<string>>(new Set());

  const toggleChapterCollapse = (chapterId: string) => {
    setCollapsedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const handleOpenAddTopic = (chapterId: string) => {
    setActiveChapterForTopic(chapterId);
    setCollapsedChapterIds((prev) => {
      if (prev.has(chapterId)) {
        const next = new Set(prev);
        next.delete(chapterId);
        return next;
      }
      return prev;
    });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chapters = subject.chapters || [];
  const studySessions = subject.studySessions || [];
  const metrics = subject.metrics || {
    totalTimeStudiedMinutes: 0,
    activeDaysCount: 0,
    topicsTrackedCount: 0,
    topicsStudiedCount: 0,
    topicsNeedingRevisionCount: 0,
  };
  const continueLearning = subject.continueLearning;

  // Flatten all topics across chapters
  const allTopics: (Topic & { chapterTitle?: string })[] = [];
  chapters.forEach((c) => {
    (c.topics || []).forEach((t) => {
      allTopics.push({ ...t, chapterTitle: c.title });
    });
  });

  const topicsNeedingRevision = allTopics.filter(
    (t) => t.status === "NEEDS_REVISION" || (t.confidence !== null && t.confidence <= 2)
  );

  const completedTopicsCount = allTopics.filter(
    (t) => t.status === "STUDIED" || t.status === "UNDERSTOOD"
  ).length;

  const totalTopicsCount = allTopics.length;
  const overallMasteryPct =
    totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  // --- Handlers ---
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await Api.createChapter(subject.id, {
        title: newChapterTitle.trim(),
        description: newChapterDesc.trim() || undefined,
      });
      setNewChapterTitle("");
      setNewChapterDesc("");
      setShowAddChapter(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to create chapter");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (chapterId: string) => {
    if (!newTopicTitle.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await Api.createTopic(chapterId, { title: newTopicTitle.trim() });
      setNewTopicTitle("");
      setActiveChapterForTopic(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to create topic");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubjectName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await Api.updateSubject(subject.id, {
        name: editSubjectName.trim(),
        description: editSubjectDesc.trim() || undefined,
      });
      setEditingSubject(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to update subject");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (
      !confirm(
        `Are you sure you want to delete Subject "${subject.name}"? This will delete all chapters, topics, and study sessions.`
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      await Api.deleteSubject(subject.id);
      onBack();
    } catch (err: any) {
      setError(err.message || "Failed to delete subject");
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (!confirm(`Delete chapter "${chapter.title}" and all its topics?`)) return;
    try {
      await Api.deleteChapter(chapter.id);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete chapter");
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      await Api.deleteTopic(topicId);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete topic");
    }
  };

  const handleLogStudySession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionSummary.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const selectedTopic = allTopics.find((t) => t.id === sessionTopicId);
      await Api.createStudySession(subject.id, {
        summary: sessionSummary.trim(),
        durationMinutes: Number(sessionDuration),
        confidence: sessionConfidence,
        outcome: sessionOutcome.trim() || undefined,
        nextStep: sessionNextStep.trim() || undefined,
        topicId: sessionTopicId || undefined,
        chapterId: selectedTopic ? selectedTopic.chapterId : undefined,
      });
      setShowSessionModal(false);
      setSessionSummary("");
      setSessionOutcome("");
      setSessionNextStep("");
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to log study session");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Delete this recorded study session?")) return;
    try {
      await Api.deleteStudySession(subject.id, sessionId);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete study session");
    }
  };

  const openEditTopicModal = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicStatus(topic.status || "NOT_STARTED");
    setTopicConfidence(topic.confidence || 3);
    setTopicNotes(topic.notes || "");
    setTopicResources(topic.resources || "");
    setTopicNextStep(topic.nextStep || "");
    setTopicRevisionDate(topic.revisionDate ? topic.revisionDate.split("T")[0] : "");
  };

  const handleSaveTopicDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    setLoading(true);
    setError(null);
    try {
      await Api.updateTopic(editingTopic.id, {
        status: topicStatus,
        confidence: topicConfidence,
        notes: topicNotes.trim() || null,
        resources: topicResources.trim() || null,
        nextStep: topicNextStep.trim() || null,
        revisionDate: topicRevisionDate ? new Date(topicRevisionDate).toISOString() : null,
      });
      setEditingTopic(null);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to update topic details");
    } finally {
      setLoading(false);
    }
  };

  const startQuickSessionForTopic = (topic: Topic) => {
    setSessionTopicId(topic.id);
    setSessionSummary(`Studied ${topic.title}`);
    setShowSessionModal(true);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Header Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-2">
        {/* Back Button with Tactile Hover */}
        <button
          onClick={onBack}
          className="paper-btn-secondary px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold flex items-center space-x-1.5 group shadow-2xs cursor-pointer active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          <span className="hidden sm:inline">Back to Subjects</span>
          <span className="sm:hidden">Back</span>
        </button>

        {/* Action Group */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <button
            onClick={() => setShowSessionModal(true)}
            className="paper-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log Study Session</span>
            <span className="sm:hidden">Log Session</span>
          </button>

          <button
            onClick={() => setEditingSubject(!editingSubject)}
            className="paper-btn-secondary px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer active:scale-95"
            title="Edit Subject"
          >
            <Pencil className="h-3 w-3" />
            <span className="hidden sm:inline">{editingSubject ? "Cancel" : "Edit"}</span>
          </button>

          <button
            onClick={handleDeleteSubject}
            className="paper-btn-danger px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer active:scale-95"
            title="Delete Subject"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs font-semibold text-red-400 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </span>
          <button onClick={() => setError(null)} className="font-bold hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Subject Hero Header & Analytics */}
      <div className="paper-card p-3 sm:p-4 space-y-2.5 sm:space-y-3 border border-[var(--border-default)]">
        {editingSubject ? (
          <form onSubmit={handleUpdateSubject} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Subject Name *
              </label>
              <input
                type="text"
                value={editSubjectName}
                onChange={(e) => setEditSubjectName(e.target.value)}
                className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Description
              </label>
              <textarea
                value={editSubjectDesc}
                onChange={(e) => setEditSubjectDesc(e.target.value)}
                rows={2}
                className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSubject(false)}
                className="paper-btn-secondary px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="paper-btn-primary px-5 py-2 text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2.5">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-heading)] leading-tight">
                {subject.name}
              </h1>
              {subject.description && (
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                  {subject.description}
                </p>
              )}
            </div>

            {/* Seamless Overall Mastery Progress Bar */}
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex-1 h-2 bg-[var(--surface-secondary)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                <div
                  className="h-full bg-[var(--forest-green)] transition-all duration-500 rounded-full"
                  style={{ width: `${overallMasteryPct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[var(--forest-green)] shrink-0">
                {overallMasteryPct}% Mastered
              </span>
            </div>

            {/* Compact Glanceable Metrics Row (replaces 4 bulky rectangle boxes) */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)]/50 text-center">
              <div className="py-0.5">
                <div className="text-xs sm:text-sm font-black text-[var(--text-heading)]">
                  {formatMinutes(metrics.totalTimeStudiedMinutes)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-bold">Studied</div>
              </div>
              <div className="py-0.5">
                <div className="text-xs sm:text-sm font-black text-[var(--forest-green)]">
                  {metrics.topicsTrackedCount}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-bold">Topics</div>
              </div>
              <div className="py-0.5">
                <div className="text-xs sm:text-sm font-black text-[var(--forest-green)]">
                  {metrics.activeDaysCount}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-bold">Days</div>
              </div>
              <div className="py-0.5">
                <div className="text-xs sm:text-sm font-black text-[#C2410C]">
                  {metrics.topicsNeedingRevisionCount}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-bold">Revise</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Resume Learning Banner - Only shown when there is an active recent topic */}
      {continueLearning?.lastTopicTitle && (
        <div className="paper-card bg-[var(--surface-secondary)] p-2.5 sm:p-3 border border-[var(--border-subtle)] rounded-xl flex items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-[var(--forest-green)] animate-pulse shrink-0" />
            <span className="text-xs text-[var(--text-muted)] font-bold shrink-0 hidden sm:inline">
              Resume:
            </span>
            <span className="text-xs sm:text-sm font-bold text-[var(--text-heading)] truncate">
              {continueLearning.lastTopicTitle}
            </span>
            {continueLearning.nextStep && (
              <span className="text-xs text-[var(--crimson)] font-medium truncate hidden md:inline">
                · Next: {continueLearning.nextStep}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              if (continueLearning?.lastTopicId) {
                setSessionTopicId(continueLearning.lastTopicId);
                setSessionSummary(`Studied ${continueLearning.lastTopicTitle}`);
              }
              setShowSessionModal(true);
            }}
            className="paper-btn-primary px-3 py-1 sm:px-4 sm:py-1.5 text-xs font-bold shadow-xs flex items-center space-x-1.5 shrink-0 cursor-pointer active:scale-95"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Resume</span>
          </button>
        </div>
      )}

      {/* Workspace Tabs - Streamlined labels */}
      <div className="flex border-b border-[var(--border-default)] space-x-1 sm:space-x-6 text-xs sm:text-sm font-bold text-[var(--text-muted)] overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("structure")}
          className={`pb-2.5 pt-1 px-3 sm:px-2 transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === "structure"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-black"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Topics</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] sm:text-[11px] font-bold ${
              activeTab === "structure"
                ? "bg-[var(--forest-green)] text-white"
                : "bg-[var(--surface-secondary)] text-[var(--text-muted)]"
            }`}
          >
            {allTopics.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={`pb-2.5 pt-1 px-3 sm:px-2 transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === "sessions"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-black"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Sessions</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] sm:text-[11px] font-bold ${
              activeTab === "sessions"
                ? "bg-[var(--forest-green)] text-white"
                : "bg-[var(--surface-secondary)] text-[var(--text-muted)]"
            }`}
          >
            {studySessions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("revision")}
          className={`pb-2.5 pt-1 px-3 sm:px-2 transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === "revision"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-black"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          <Flame className="h-3.5 w-3.5 text-[#C2410C]" />
          <span>Revision</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] sm:text-[11px] font-bold ${
              topicsNeedingRevision.length > 0
                ? "bg-amber-600 text-white"
                : "bg-[var(--surface-secondary)] text-[var(--text-muted)]"
            }`}
          >
            {topicsNeedingRevision.length}
          </span>
        </button>
      </div>

      {/* ==========================================
          TAB 1: STRUCTURE & TOPICS
          ========================================== */}
      {activeTab === "structure" && (
        <div className="space-y-3 sm:space-y-4">
          {/* Section Toolbar (Clean, no text clutter) */}
          <div className="flex items-center justify-between gap-2 pb-1">
            <span className="text-xs font-bold text-[var(--text-muted)]">
              {chapters.length} {chapters.length === 1 ? "Chapter" : "Chapters"}
            </span>
            <div className="flex items-center space-x-2 shrink-0">
              {chapters.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const allCollapsed = chapters.every((c) => collapsedChapterIds.has(c.id));
                    if (allCollapsed) {
                      setCollapsedChapterIds(new Set());
                    } else {
                      setCollapsedChapterIds(new Set(chapters.map((c) => c.id)));
                    }
                  }}
                  className="paper-btn-secondary px-2.5 py-1 text-xs font-bold flex items-center space-x-1 cursor-pointer active:scale-95"
                  title={
                    chapters.every((c) => collapsedChapterIds.has(c.id))
                      ? "Expand all chapters"
                      : "Collapse all chapters"
                  }
                >
                  <ChevronsUpDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <span>
                    {chapters.every((c) => collapsedChapterIds.has(c.id))
                      ? "Expand All"
                      : "Collapse All"}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowAddChapter(true)}
                className="paper-btn-primary px-3 py-1 text-xs font-bold flex items-center space-x-1 shadow-xs shrink-0 cursor-pointer active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Chapter</span>
              </button>
            </div>
          </div>

          {/* Add Chapter Form Modal/Accordion */}
          {showAddChapter && (
            <form
              onSubmit={handleCreateChapter}
              className="paper-card bg-[var(--surface-secondary)] p-4 sm:p-6 space-y-3.5 border-2 border-[var(--forest-green)]/40 rounded-xl shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--forest-green)] flex items-center space-x-2">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Create New Chapter</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddChapter(false)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer flex items-center space-x-1"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Close</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="Chapter Title (e.g. Chapter 1: Transport Layer Protocols)"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="paper-input w-full px-4 py-2.5 text-sm font-semibold"
                autoFocus
                required
              />

              <input
                type="text"
                placeholder="Brief Overview / Description (Optional)"
                value={newChapterDesc}
                onChange={(e) => setNewChapterDesc(e.target.value)}
                className="paper-input w-full px-4 py-2.5 text-sm"
              />

              <div className="flex justify-end space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChapter(false)}
                  className="paper-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newChapterTitle.trim()}
                  className="paper-btn-primary px-5 py-2 text-xs font-bold"
                >
                  Save Chapter
                </button>
              </div>
            </form>
          )}

          {/* Empty State */}
          {chapters.length === 0 && !showAddChapter ? (
            <div className="paper-card bg-[var(--surface-secondary)] p-8 sm:p-10 text-center space-y-3 border border-[var(--border-default)] rounded-xl">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-[var(--pale-sage)] flex items-center justify-center text-[var(--forest-green)]">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>
              <div className="font-bold text-[var(--text-heading)] text-base sm:text-lg">
                Start building your syllabus naturally.
              </div>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                Kaizu allows your syllabus to evolve as you learn. Create your first chapter to add
                topics, notes, and confidence levels.
              </p>
              <button
                onClick={() => setShowAddChapter(true)}
                className="paper-btn-primary px-6 py-2.5 text-xs font-bold mt-2 flex items-center space-x-1.5 mx-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create First Chapter</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-3.5">
              {chapters.map((chapter, cIndex) => {
                const chapterTopics = chapter.topics || [];
                const isCollapsed = collapsedChapterIds.has(chapter.id);
                const masteredCount = chapterTopics.filter(
                  (t) => t.status === "STUDIED" || t.status === "UNDERSTOOD"
                ).length;

                return (
                  <div
                    key={chapter.id}
                    className="paper-card p-3 sm:p-4 space-y-2.5 border border-[var(--border-default)] rounded-xl shadow-2xs hover:border-[var(--border-strong)] transition-all"
                  >
                    {/* Chapter Header Card - Clickable to toggle collapse */}
                    <div
                      onClick={() => toggleChapterCollapse(chapter.id)}
                      className={`flex items-center justify-between gap-2 cursor-pointer select-none rounded-lg group transition-colors ${
                        !isCollapsed ? "pb-2.5 border-b border-[var(--border-subtle)]" : ""
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {/* Collapse / Expand Chevron Icon */}
                        <div
                          className="text-[var(--text-muted)] group-hover:text-[var(--forest-green)] transition-colors p-0.5 shrink-0"
                          title={isCollapsed ? "Expand chapter" : "Collapse chapter"}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>

                        {/* Chapter Number Badge */}
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[var(--forest-green)] text-white font-black text-xs shrink-0 shadow-2xs">
                          {String(cIndex + 1).padStart(2, "0")}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h3 className="font-extrabold text-[var(--text-heading)] text-sm sm:text-base truncate group-hover:text-[var(--forest-green)] transition-colors">
                              {chapter.title}
                            </h3>
                            <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded shrink-0">
                              {chapterTopics.length} {chapterTopics.length === 1 ? "topic" : "topics"}
                            </span>
                            {isCollapsed && chapterTopics.length > 0 && (
                              <span className="text-[10px] font-semibold text-[var(--forest-green)] bg-[var(--forest-green)]/10 px-1.5 py-0.5 rounded shrink-0">
                                {masteredCount}/{chapterTopics.length} mastered
                              </span>
                            )}
                          </div>
                          {chapter.description && (
                            <p className="text-[11px] text-[var(--text-muted)] truncate hidden sm:block">
                              {chapter.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Chapter Action Buttons */}
                      <div
                        className="flex items-center space-x-1.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleOpenAddTopic(chapter.id)}
                          className="btn-pill-action px-2 sm:px-2.5 py-1 text-xs font-bold space-x-1 cursor-pointer active:scale-95"
                        >
                          <Plus className="h-3 w-3" />
                          <span className="hidden sm:inline">Add Topic</span>
                          <span className="sm:hidden">Topic</span>
                        </button>

                        <button
                          onClick={() => handleDeleteChapter(chapter)}
                          title="Delete Chapter"
                          className="btn-icon-subtle text-xs cursor-pointer active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Topics List Container - Hidden when collapsed */}
                    {!isCollapsed && (
                      <div className="space-y-2 pt-0.5">
                      {chapterTopics.length > 0 ? (
                        chapterTopics.map((topic) => {
                          const statusInfo = STATUS_CONFIG[topic.status || "NOT_STARTED"];

                          return (
                            <div
                              key={topic.id}
                              onClick={() => openEditTopicModal(topic)}
                              className="paper-card bg-[var(--surface-primary)] p-3 sm:p-3.5 rounded-xl border border-[var(--border-default)] hover:border-[var(--forest-green)] transition-all card-lift space-y-2 shadow-2xs cursor-pointer group active:scale-[0.99]"
                            >
                              {/* Row 1: Organic Status (left) & Mastery Dots + Circular Quick Study (right) */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="inline-flex items-center space-x-1.5 text-xs font-semibold">
                                  <span className={`h-2 w-2 rounded-full ${statusInfo.dotColor} shrink-0`} />
                                  <span className={statusInfo.textColor}>{statusInfo.label}</span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Clean Borderless Mastery Indicator */}
                                  <div
                                    className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]"
                                    title={`Mastery: Level ${topic.confidence || 1} of 5`}
                                  >
                                    <span className="text-[11px] font-bold">L{topic.confidence || 1}</span>
                                    <div className="flex items-center gap-0.5">
                                      {[1, 2, 3, 4, 5].map((lvl) => (
                                        <span
                                          key={lvl}
                                          className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                            lvl <= (topic.confidence || 1)
                                              ? "bg-[var(--forest-green)]"
                                              : "bg-[var(--border-strong)]/25"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  {/* Sleek Circular Play Action (breaks rectangular monotony) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startQuickSessionForTopic(topic);
                                    }}
                                    className="h-7 w-7 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--forest-green)] text-[var(--forest-green)] hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs shrink-0"
                                    title="Start study session for this topic"
                                  >
                                    <Play className="h-3 w-3 fill-current ml-0.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Row 2: Topic Title */}
                              <div>
                                <h4 className="font-extrabold text-[var(--text-heading)] text-sm sm:text-base leading-snug break-words group-hover:text-[var(--forest-green)] transition-colors">
                                  {topic.title}
                                </h4>
                              </div>

                              {/* Row 3: Seamless Typography Notes & Next Steps (No bulky rectangle box) */}
                              {(topic.notes || topic.resources || topic.nextStep) && (
                                <div className="pt-1.5 border-t border-[var(--border-subtle)]/40 space-y-1 text-xs">
                                  {topic.notes && (
                                    <div className="flex items-start space-x-1.5 text-[var(--text-secondary)]">
                                      <FileText className="h-3 w-3 text-[var(--text-muted)] mt-0.5 shrink-0" />
                                      <span className="leading-relaxed break-words">{topic.notes}</span>
                                    </div>
                                  )}

                                  {topic.nextStep && (
                                    <div className="flex items-start space-x-1.5 text-[var(--crimson)] font-medium">
                                      <Target className="h-3 w-3 mt-0.5 shrink-0" />
                                      <span className="leading-relaxed break-words">{topic.nextStep}</span>
                                    </div>
                                  )}

                                  {topic.resources && (
                                    <div className="flex items-start space-x-1.5 text-[var(--forest-green)] font-medium">
                                      <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
                                      <span className="truncate">{topic.resources}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-[var(--text-muted)] italic py-2 px-3 bg-[var(--surface-secondary)]/50 rounded-lg border border-dashed border-[var(--border-default)]">
                          No topics added to this chapter yet. Click "+ Add Topic" above to begin.
                        </div>
                      )}

                      {/* Add Topic Inline Accordion Form */}
                      {activeChapterForTopic === chapter.id && (
                        <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--forest-green)]/40 space-y-2.5">
                          <div className="text-xs font-bold text-[var(--forest-green)] flex items-center space-x-1.5">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add New Topic to {chapter.title}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder="e.g. TCP Handshake & Congestion Control"
                              value={newTopicTitle}
                              onChange={(e) => setNewTopicTitle(e.target.value)}
                              className="paper-input flex-1 px-3.5 py-2 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleCreateTopic(chapter.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleCreateTopic(chapter.id)}
                              disabled={loading || !newTopicTitle.trim()}
                              className="paper-btn-primary px-4 py-2 text-xs font-bold shadow-xs"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setActiveChapterForTopic(null)}
                              className="paper-btn-secondary px-3 py-2 text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 2: STUDY SESSIONS LOG
          ========================================== */}
      {activeTab === "sessions" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-base sm:text-xl font-black text-[var(--text-heading)]">
                Study Sessions
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
                Tangible proof of learning time and focused sessions in {subject.name}.
              </p>
            </div>
            <button
              onClick={() => setShowSessionModal(true)}
              className="paper-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold flex items-center space-x-1 shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Session</span>
            </button>
          </div>

          {studySessions.length === 0 ? (
            <div className="paper-card bg-[var(--surface-secondary)] p-10 text-center space-y-3 border border-[var(--border-default)] rounded-xl">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-[var(--pale-sage)] flex items-center justify-center text-[var(--forest-green)]">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <div className="font-bold text-[var(--text-heading)] text-lg">
                No study sessions recorded yet.
              </div>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                Track how much time you spend on each concept. Log your first session to build your
                habit streak!
              </p>
              <button
                onClick={() => setShowSessionModal(true)}
                className="paper-btn-primary px-5 py-2.5 text-xs font-bold mt-2 flex items-center space-x-1.5 mx-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Log First Session</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {studySessions.map((session) => (
                <div
                  key={session.id}
                  className="paper-card p-3 sm:p-4 space-y-2 border border-[var(--border-default)] rounded-xl card-lift"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-[var(--forest-green)] bg-[var(--pale-sage)] px-2.5 py-0.5 rounded flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatMinutes(session.durationMinutes)}</span>
                        </span>
                        <span className="text-xs text-[var(--text-muted)] flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(session.occurredAt)}</span>
                        </span>
                        {session.topic && (
                          <span className="bg-[var(--surface-secondary)] text-[var(--text-heading)] border border-[var(--border-default)] px-2 py-0.5 rounded text-[11px] font-bold">
                            {session.topic.title}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-heading)] mt-1.5">
                        {session.summary}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      {session.confidence && (
                        <div
                          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]"
                          title={`Confidence: L${session.confidence}/5`}
                        >
                          <span className="text-[11px] font-bold">L{session.confidence}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span
                                key={s}
                                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                  s <= session.confidence!
                                    ? "bg-[var(--forest-green)]"
                                    : "bg-[var(--border-strong)]/25"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="btn-icon-subtle text-xs"
                        title="Delete Session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {(session.outcome || session.nextStep) && (
                    <div className="paper-inset bg-[var(--surface-secondary)] p-3 rounded-lg text-xs space-y-1 text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                      {session.outcome && (
                        <div>
                          <strong className="text-[var(--text-heading)]">Outcome:</strong>{" "}
                          {session.outcome}
                        </div>
                      )}
                      {session.nextStep && (
                        <div>
                          <strong className="text-[var(--forest-green)]">Next Action:</strong>{" "}
                          {session.nextStep}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          TAB 3: UNDERSTANDING & REVISION FOCUS
          ========================================== */}
      {activeTab === "revision" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="pb-2 border-b border-[var(--border-subtle)]">
            <h2 className="text-base sm:text-xl font-black text-[var(--text-heading)]">
              Understanding & Revision Focus
            </h2>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
              Topics flagged for review or rated with lower confidence. Revisit these to build true
              mastery.
            </p>
          </div>

          {topicsNeedingRevision.length === 0 ? (
            <div className="paper-card bg-[var(--surface-secondary)] p-10 text-center space-y-3 border border-[var(--border-default)] rounded-xl">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
              <div className="font-bold text-[var(--text-heading)] text-lg">
                No topics marked for revision right now!
              </div>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                When studying, flag tricky topics as "Needs Revision" to review them here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topicsNeedingRevision.map((topic) => (
                <div
                  key={topic.id}
                  className="paper-card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border border-[var(--border-default)] rounded-xl card-lift"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1">
                        <Flame className="h-3 w-3" />
                        <span>Needs Revision</span>
                      </span>
                      {topic.chapterTitle && (
                        <span className="text-xs text-[var(--text-muted)]">
                          in {topic.chapterTitle}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-[var(--text-heading)]">
                      {topic.title}
                    </h4>
                    {topic.notes && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                        {topic.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => startQuickSessionForTopic(topic)}
                      className="btn-study px-4 py-2 text-xs font-bold space-x-1"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Study Now</span>
                    </button>
                    <button
                      onClick={() => openEditTopicModal(topic)}
                      className="btn-edit px-3 py-2 text-xs font-bold space-x-1"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Update</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          MODAL: LOG STUDY SESSION
          ========================================== */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-xl p-6 sm:p-7 space-y-5 rounded-2xl border border-[var(--border-strong)] shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text-heading)]">
                  Log a Study Session
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Record focused time and accomplishments for {subject.name}
                </p>
              </div>
              <button
                onClick={() => setShowSessionModal(false)}
                className="btn-icon-subtle text-sm font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLogStudySession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  What did you study? *
                </label>
                <input
                  type="text"
                  placeholder="e.g. TCP 3-way handshake and SYN flood attacks"
                  value={sessionSummary}
                  onChange={(e) => setSessionSummary(e.target.value)}
                  required
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                  autoFocus
                />
              </div>

              {/* Topic Selector */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Link to Topic (Optional)
                </label>
                <select
                  value={sessionTopicId}
                  onChange={(e) => setSessionTopicId(e.target.value)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm bg-[var(--surface-primary)] font-medium"
                >
                  <option value="">-- General Subject Study (No specific topic) --</option>
                  {allTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.chapterTitle ? `${t.chapterTitle} > ` : ""}
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time spent preset buttons */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Time Spent: {formatMinutes(sessionDuration)}
                </label>
                <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-2">
                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSessionDuration(mins)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        sessionDuration === mins
                          ? "bg-[var(--forest-green)] text-white shadow-xs font-black scale-105"
                          : "bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-default)]"
                      }`}
                    >
                      {formatMinutes(mins)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence Rating */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Understanding Level
                  </label>
                  <span className="text-xs font-bold text-[var(--forest-green)]">
                    Level {sessionConfidence} of 5
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { val: 1, label: "Novice" },
                    { val: 2, label: "Familiar" },
                    { val: 3, label: "Fair" },
                    { val: 4, label: "Good" },
                    { val: 5, label: "Mastered" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setSessionConfidence(item.val)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        sessionConfidence === item.val
                          ? "bg-[var(--forest-green)] text-white shadow-2xs scale-102"
                          : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-heading)] border border-[var(--border-subtle)]"
                      }`}
                    >
                      <span className="font-extrabold text-sm leading-none">{item.val}</span>
                      <div className="flex gap-0.5">
                        {[...Array(item.val)].map((_, i) => (
                          <span
                            key={i}
                            className={`h-1 w-1 rounded-full ${
                              sessionConfidence === item.val ? "bg-white" : "bg-[var(--forest-green)]"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[9px] font-medium leading-tight opacity-90 truncate max-w-full">
                        {item.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  What did you actually accomplish? (Optional)
                </label>
                <textarea
                  placeholder="e.g. Read RFC 793, drew connection diagrams, implemented socket listener."
                  value={sessionOutcome}
                  onChange={(e) => setSessionOutcome(e.target.value)}
                  rows={2}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Next Intended Step (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Practice 3 congestion control problems tomorrow"
                  value={sessionNextStep}
                  onChange={(e) => setSessionNextStep(e.target.value)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="paper-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="paper-btn-primary px-6 py-2 text-xs font-bold shadow-xs"
                >
                  Save Study Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: EDIT TOPIC DETAILS & MASTERY
          ========================================== */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-lg p-6 sm:p-7 space-y-5 rounded-2xl border border-[var(--border-strong)] shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text-heading)]">
                  {editingTopic.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Topic Mastery, Notes & Learning Resources
                </p>
              </div>
              <button
                onClick={() => setEditingTopic(null)}
                className="btn-icon-subtle text-sm font-bold"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopicDetails} className="space-y-4">
              {/* Status Picker */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Learning Status
                </label>
                <select
                  value={topicStatus}
                  onChange={(e) => setTopicStatus(e.target.value as TopicStatus)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm bg-[var(--surface-primary)] font-bold"
                >
                  <option value="NOT_STARTED">○ Not Started</option>
                  <option value="LEARNING">◉ Learning</option>
                  <option value="STUDIED">✓ Studied (Read / Covered)</option>
                  <option value="NEEDS_REVISION">▲ Needs Revision</option>
                  <option value="UNDERSTOOD">★ Mastered & Understood</option>
                </select>
              </div>

              {/* Mastery Level */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Mastery Level
                  </label>
                  <span className="text-xs font-bold text-[var(--forest-green)]">
                    Level {topicConfidence} of 5 · {
                      topicConfidence === 1 ? "Novice" :
                      topicConfidence === 2 ? "Familiar" :
                      topicConfidence === 3 ? "Proficient" :
                      topicConfidence === 4 ? "Advanced" : "Mastered"
                    }
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTopicConfidence(val)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        topicConfidence === val
                          ? "bg-[var(--forest-green)] text-white shadow-2xs scale-102"
                          : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-heading)] border border-[var(--border-subtle)]"
                      }`}
                    >
                      <span className="font-extrabold text-sm leading-none">{val}</span>
                      <div className="flex gap-0.5">
                        {[...Array(val)].map((_, i) => (
                          <span
                            key={i}
                            className={`h-1 w-1 rounded-full ${
                              topicConfidence === val ? "bg-white" : "bg-[var(--forest-green)]"
                            }`}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Personal Notes
                </label>
                <textarea
                  placeholder="Explain concepts in your own words..."
                  value={topicNotes}
                  onChange={(e) => setTopicNotes(e.target.value)}
                  rows={3}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Resources & Links
                </label>
                <input
                  type="text"
                  placeholder="Documentation links, books, videos..."
                  value={topicResources}
                  onChange={(e) => setTopicResources(e.target.value)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Next Intended Action
                </label>
                <input
                  type="text"
                  placeholder="e.g. Revisit SYN cookies section"
                  value={topicNextStep}
                  onChange={(e) => setTopicNextStep(e.target.value)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Planned Revision Date
                </label>
                <input
                  type="date"
                  value={topicRevisionDate}
                  onChange={(e) => setTopicRevisionDate(e.target.value)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm bg-[var(--surface-primary)]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => {
                    const id = editingTopic.id;
                    setEditingTopic(null);
                    handleDeleteTopic(id);
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Topic</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingTopic(null)}
                    className="paper-btn-secondary px-3.5 py-2 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="paper-btn-primary px-5 py-2 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
