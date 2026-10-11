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
  Star,
  FileText,
  Target,
  ExternalLink,
  X,
  Calendar,
  Layers,
  History,
  AlertTriangle,
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
    Icon: React.ComponentType<{ className?: string }>;
    dotColor: string;
  }
> = {
  NOT_STARTED: {
    label: "Not Started",
    badgeClass: "bg-[var(--surface-inset)] text-[var(--text-muted)] border border-[var(--border-subtle)]",
    Icon: Circle,
    dotColor: "bg-gray-400",
  },
  LEARNING: {
    label: "Learning",
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30",
    Icon: CircleDot,
    dotColor: "bg-blue-500",
  },
  STUDIED: {
    label: "Studied",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
    Icon: CheckCircle2,
    dotColor: "bg-emerald-500",
  },
  NEEDS_REVISION: {
    label: "Needs Revision",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
    Icon: Flame,
    dotColor: "bg-amber-500",
  },
  UNDERSTOOD: {
    label: "Mastered",
    badgeClass: "bg-[var(--pale-sage)] text-[var(--forest-green)] border border-[var(--sage)]/50",
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
          <div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 paper-badge px-2.5 py-0.5 text-[11px] font-bold">
                <BookOpen className="h-3 w-3 text-[var(--forest-green)]" />
                <span>Learning Area</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-[var(--text-heading)] leading-tight">
                {subject.name}
              </h1>
              {subject.description ? (
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                  {subject.description}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic">
                  Add chapters and study topics below to map out your mastery path.
                </p>
              )}
            </div>

            {/* Seamless Overall Mastery Progress Bar */}
            <div className="mt-2.5 p-2 sm:p-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] flex items-center justify-between gap-2.5">
              <div className="flex items-center min-w-0">
                <span className="text-xs font-bold text-[var(--text-heading)] truncate">Overall Mastery</span>
              </div>
              <div className="flex items-center space-x-2.5 shrink-0">
                <div className="w-24 sm:w-36 h-2 bg-[var(--border-default)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--forest-green)] transition-all duration-500 rounded-full"
                    style={{ width: `${overallMasteryPct}%` }}
                  />
                </div>
                <span className="text-xs font-black text-[var(--forest-green)] min-w-[32px] text-right">
                  {overallMasteryPct}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4 Analytics Metrics Cards with Balanced Proportions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-1">
          <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-3 border border-[var(--border-default)] card-lift">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Time Studied</span>
              <Clock className="h-3.5 w-3.5 text-[var(--forest-green)]" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-[var(--text-heading)] mt-1">
              {formatMinutes(metrics.totalTimeStudiedMinutes)}
            </div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-3 border border-[var(--border-default)] card-lift">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Topics Tracked</span>
              <BookOpen className="h-3.5 w-3.5 text-[var(--forest-green)]" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-[var(--forest-green)] mt-1">
              {metrics.topicsTrackedCount}
            </div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-3 border border-[var(--border-default)] card-lift">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Active Days</span>
              <Zap className="h-3.5 w-3.5 text-[var(--forest-green)]" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-[var(--forest-green)] mt-1">
              {metrics.activeDaysCount}
            </div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] p-2 sm:p-3 border border-[var(--border-default)] card-lift">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Needs Revision</span>
              <Flame className="h-3.5 w-3.5 text-[#C2410C]" />
            </div>
            <div className="text-lg sm:text-2xl font-black text-[#C2410C] mt-1">
              {metrics.topicsNeedingRevisionCount}
            </div>
          </div>
        </div>
      </div>

      {/* Continue Learning Spotlight Hero Card */}
      <div className="paper-card bg-[var(--surface-secondary)] p-3 sm:p-4 border border-[var(--border-default)] card-lift">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--forest-green)] flex items-center space-x-1.5">
              <span className="flex h-2 w-2 rounded-full bg-[var(--forest-green)] animate-pulse" />
              <span>Next Recommended Action</span>
            </div>
            {continueLearning && continueLearning.lastTopicTitle ? (
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-heading)]">
                  {continueLearning.lastTopicTitle}
                </h3>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  Last session:{" "}
                  <span className="text-[var(--text-heading)] font-semibold">
                    {formatDate(continueLearning.lastStudiedAt)}
                  </span>
                  {continueLearning.lastDurationMinutes
                    ? ` · ${continueLearning.lastDurationMinutes} mins`
                    : ""}
                </div>
                {continueLearning.nextStep && (
                  <div className="mt-2 text-xs text-[var(--forest-green)] bg-[var(--pale-sage)] border border-[var(--sage)]/40 px-2.5 py-1 rounded-md inline-flex items-center space-x-1.5 font-bold">
                    <Target className="h-3.5 w-3.5 text-[var(--crimson)]" />
                    <span>Next: {continueLearning.nextStep}</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-heading)]">
                  Ready to study {subject.name}?
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Pick a topic below or log your first study session to start your momentum loop.
                </p>
              </div>
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
            className="paper-btn-primary px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold shadow-xs flex items-center justify-center space-x-2 shrink-0 cursor-pointer active:scale-95"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Resume Learning</span>
          </button>
        </div>
      </div>

      {/* Workspace Tabs with Responsive Titles */}
      <div className="flex border-b border-[var(--border-default)] space-x-1 sm:space-x-6 text-xs sm:text-sm font-bold text-[var(--text-muted)] overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab("structure")}
          className={`pb-2.5 pt-1 px-2.5 sm:px-2 transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === "structure"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-black"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="sm:hidden">Structure</span>
          <span className="hidden sm:inline">Learning Structure</span>
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
          className={`pb-2.5 pt-1 px-2.5 sm:px-2 transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === "sessions"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-black"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="sm:hidden">Sessions</span>
          <span className="hidden sm:inline">Study Sessions</span>
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
          className={`pb-2.5 pt-1 px-2.5 sm:px-2 transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === "revision"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-black"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#C2410C]" />
          <span className="sm:hidden">Revision</span>
          <span className="hidden sm:inline">Understanding & Revision</span>
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
          TAB 1: STRUCTURE & TOPICS (REDESIGNED)
          ========================================== */}
      {activeTab === "structure" && (
        <div className="space-y-3 sm:space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-base sm:text-xl font-black text-[var(--text-heading)]">
                Learning Structure
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
                Organize your study into chapters, topics, mastery ratings, and next actions.
              </p>
            </div>
            <button
              onClick={() => setShowAddChapter(true)}
              className="paper-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold flex items-center space-x-1 shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Chapter</span>
            </button>
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

                return (
                  <div
                    key={chapter.id}
                    className="paper-card p-3 sm:p-4 space-y-2.5 border border-[var(--border-default)] rounded-xl shadow-2xs hover:border-[var(--border-strong)] transition-all"
                  >
                    {/* Chapter Header Card */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-subtle)]">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {/* Chapter Number Badge */}
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[var(--forest-green)] text-white font-black text-xs shrink-0 shadow-2xs">
                          {String(cIndex + 1).padStart(2, "0")}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <h3 className="font-extrabold text-[var(--text-heading)] text-sm sm:text-base truncate">
                              {chapter.title}
                            </h3>
                            <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded shrink-0">
                              {chapterTopics.length} {chapterTopics.length === 1 ? "topic" : "topics"}
                            </span>
                          </div>
                          {chapter.description && (
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              {chapter.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Chapter Action Buttons */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          onClick={() => setActiveChapterForTopic(chapter.id)}
                          className="btn-pill-action px-2.5 py-1 text-xs font-bold space-x-1 cursor-pointer active:scale-95"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Topic</span>
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

                    {/* Topics List Container */}
                    <div className="space-y-2">
                      {chapterTopics.length > 0 ? (
                        chapterTopics.map((topic) => {
                          const statusInfo = STATUS_CONFIG[topic.status || "NOT_STARTED"];
                          const StatusIcon = statusInfo.Icon;

                          return (
                            <div
                              key={topic.id}
                              className="paper-card bg-[var(--surface-primary)] p-2.5 sm:p-3 rounded-lg border border-[var(--border-default)] hover:border-[var(--forest-green)] transition-all card-lift space-y-2 shadow-2xs"
                            >
                              {/* Row 1: Status Pill (left) & 5-Star Confidence (right) */}
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold inline-flex items-center space-x-1 shrink-0 ${statusInfo.badgeClass}`}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  <span>{statusInfo.label}</span>
                                </span>

                                <div
                                  className="flex items-center space-x-0.5 shrink-0"
                                  title={`Confidence Rating: ${topic.confidence || 0} of 5`}
                                >
                                  {[1, 2, 3, 4, 5].map((starIdx) => (
                                    <Star
                                      key={starIdx}
                                      className={`h-3 w-3 ${
                                        starIdx <= (topic.confidence || 0)
                                          ? "fill-amber-400 text-amber-500"
                                          : "text-[var(--border-strong)] opacity-35"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Row 2: Topic Title */}
                              <div>
                                <h4 className="font-extrabold text-[var(--text-heading)] text-sm sm:text-base leading-snug break-words">
                                  {topic.title}
                                </h4>
                              </div>

                              {/* Row 3: Structured Notes & Next Steps Inset */}
                              {(topic.notes || topic.resources || topic.nextStep) && (
                                <div className="paper-inset bg-[var(--surface-secondary)] p-2.5 rounded-lg text-xs space-y-1 border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                                  {topic.notes && (
                                    <div className="flex items-start space-x-1.5">
                                      <span className="font-bold text-[var(--text-heading)] shrink-0 flex items-center space-x-1">
                                        <FileText className="h-3 w-3 text-[var(--text-muted)] mt-0.5" />
                                        <span>Notes:</span>
                                      </span>
                                      <span className="leading-relaxed break-words">{topic.notes}</span>
                                    </div>
                                  )}

                                  {topic.nextStep && (
                                    <div className="flex items-start space-x-1.5">
                                      <span className="font-bold text-[var(--crimson)] shrink-0 flex items-center space-x-1">
                                        <Target className="h-3 w-3 text-[var(--crimson)] mt-0.5" />
                                        <span>Next:</span>
                                      </span>
                                      <span className="font-medium text-[var(--text-heading)] break-words">
                                        {topic.nextStep}
                                      </span>
                                    </div>
                                  )}

                                  {topic.resources && (
                                    <div className="flex items-start space-x-1.5">
                                      <span className="font-bold text-[var(--forest-green)] shrink-0 flex items-center space-x-1">
                                        <ExternalLink className="h-3 w-3 text-[var(--forest-green)] mt-0.5" />
                                        <span>Resources:</span>
                                      </span>
                                      <span className="truncate">{topic.resources}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Row 4: Action Buttons (Study, Details, Delete) */}
                              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]/60">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => startQuickSessionForTopic(topic)}
                                    className="btn-study px-3 py-1.5 text-xs font-bold space-x-1 cursor-pointer active:scale-95"
                                    title="Log a study session for this topic"
                                  >
                                    <Play className="h-3 w-3 fill-current" />
                                    <span>Study</span>
                                  </button>

                                  <button
                                    onClick={() => openEditTopicModal(topic)}
                                    className="btn-edit px-2.5 py-1.5 text-xs font-bold space-x-1 cursor-pointer active:scale-95"
                                    title="Edit details, notes, and mastery"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    <span>Details</span>
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleDeleteTopic(topic.id)}
                                  title="Delete Topic"
                                  className="btn-icon-subtle text-xs p-1.5 cursor-pointer active:scale-95"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
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
                          className="flex items-center space-x-0.5"
                          title={`Confidence: ${session.confidence}/5`}
                        >
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3 w-3 ${
                                s <= session.confidence!
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-[var(--border-strong)] opacity-35"
                              }`}
                            />
                          ))}
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
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Understanding Level
                </label>
                <div className="grid grid-cols-5 gap-2 mt-1.5">
                  {[
                    { val: 1, label: "Revisit" },
                    { val: 2, label: "Struggling" },
                    { val: 3, label: "Fair" },
                    { val: 4, label: "Good" },
                    { val: 5, label: "Mastered" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setSessionConfidence(item.val)}
                      className={`p-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        sessionConfidence === item.val
                          ? "bg-[var(--pale-sage)] text-[var(--forest-green)] border-2 border-[var(--forest-green)] shadow-2xs scale-102"
                          : "bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-default)]"
                      }`}
                    >
                      <div className="flex justify-center space-x-0.5">
                        {[...Array(item.val)].map((_, i) => (
                          <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-500" />
                        ))}
                      </div>
                      <div className="text-[10px] mt-1">{item.label}</div>
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

              {/* Confidence Rating */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Confidence Level: {topicConfidence} of 5
                </label>
                <div className="flex items-center space-x-2 mt-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTopicConfidence(val)}
                      className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer flex justify-center items-center ${
                        topicConfidence === val
                          ? "bg-[var(--pale-sage)] text-[var(--forest-green)] border-2 border-[var(--forest-green)] shadow-2xs scale-102"
                          : "bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-default)]"
                      }`}
                    >
                      <div className="flex space-x-0.5">
                        {[...Array(val)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-500" />
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

              <div className="flex justify-end space-x-3 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="paper-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="paper-btn-primary px-6 py-2 text-xs font-bold shadow-xs"
                >
                  Save Mastery Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
