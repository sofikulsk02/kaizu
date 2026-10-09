"use client";

import React, { useState } from "react";
import { Subject, Chapter, Topic, StudySession, TopicStatus, Api } from "../lib/api";

interface SubjectDetailViewProps {
  subject: Subject;
  onBack: () => void;
  onRefresh: () => void;
}

const STATUS_CONFIG: Record<TopicStatus, { label: string; badgeClass: string; icon: string }> = {
  NOT_STARTED: { label: "Not Started", badgeClass: "bg-[var(--surface-secondary)] text-[var(--text-muted)]", icon: "○" },
  LEARNING: { label: "Learning", badgeClass: "bg-[#E1EBF5] text-[#1E40AF]", icon: "◉" },
  STUDIED: { label: "Studied", badgeClass: "bg-[#E1F2E6] text-[#166534]", icon: "✓" },
  NEEDS_REVISION: { label: "Needs Revision", badgeClass: "bg-[#FDF2E9] text-[#C2410C]", icon: "⚡" },
  UNDERSTOOD: { label: "Understood", badgeClass: "bg-[#D5E3D2] text-[#122419]", icon: "★" },
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
    if (!confirm(`Are you sure you want to delete Subject "${subject.name}"? This will delete all chapters, topics, and study sessions.`)) {
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
    if (!confirm(`Delete chapter "${chapter.title}" and its topics?`)) return;
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

  // Study Session Submission
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

  // Open Topic Modal
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
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="clay-btn-secondary px-4 py-2 text-xs font-bold flex items-center space-x-2"
        >
          <span>← Back to Subjects</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSessionModal(true)}
            className="clay-btn-primary px-4 py-2 text-xs font-bold flex items-center space-x-1.5"
          >
            <span>⏱ Log Study Session</span>
          </button>
          <button
            onClick={() => setEditingSubject(!editingSubject)}
            className="clay-btn-secondary px-4 py-2 text-xs font-bold"
          >
            {editingSubject ? "Cancel Edit" : "Edit Subject"}
          </button>
          <button
            onClick={handleDeleteSubject}
            className="clay-btn-danger px-4 py-2 text-xs font-bold"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="clay-surface bg-red-500/10 p-4 text-xs font-semibold text-red-300">
          {error}
        </div>
      )}

      {/* Subject Header Information */}
      <div className="paper-card p-6 space-y-4 border border-[var(--border-default)]">
        {editingSubject ? (
          <form onSubmit={handleUpdateSubject} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)]">Subject Name *</label>
              <input
                type="text"
                value={editSubjectName}
                onChange={(e) => setEditSubjectName(e.target.value)}
                className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)]">Description</label>
              <textarea
                value={editSubjectDesc}
                onChange={(e) => setEditSubjectDesc(e.target.value)}
                rows={2}
                className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-3xl font-black text-[var(--text-heading)]">{subject.name}</h1>
                {subject.description && (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{subject.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Learning Analytics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="paper-card bg-[var(--surface-secondary)] p-3.5 border border-[var(--border-default)]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Time Studied</div>
            <div className="text-xl font-black text-[var(--text-heading)] mt-1">{formatMinutes(metrics.totalTimeStudiedMinutes)}</div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] p-3.5 border border-[var(--border-default)]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Topics Tracked</div>
            <div className="text-xl font-black text-[var(--forest-green)] mt-1">{metrics.topicsTrackedCount}</div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] p-3.5 border border-[var(--border-default)]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Days</div>
            <div className="text-xl font-black text-[var(--forest-green)] mt-1">{metrics.activeDaysCount}</div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] p-3.5 border border-[var(--border-default)]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Needs Revision</div>
            <div className="text-xl font-black text-[#C2410C] mt-1">{metrics.topicsNeedingRevisionCount}</div>
          </div>
        </div>
      </div>

      {/* Continue Learning Hero Card */}
      <div className="paper-card bg-[var(--surface-secondary)] p-6 border border-[var(--border-default)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--forest-green)] flex items-center space-x-2">
              <span className="text-sm">▶</span>
              <span>Continue Learning</span>
            </div>
            {continueLearning && continueLearning.lastTopicTitle ? (
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)] mt-1">{continueLearning.lastTopicTitle}</h3>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  Last studied: <span className="text-[var(--text-heading)] font-semibold">{formatDate(continueLearning.lastStudiedAt)}</span>
                  {continueLearning.lastDurationMinutes ? ` · ${continueLearning.lastDurationMinutes} min session` : ""}
                </div>
                {continueLearning.nextStep && (
                  <div className="mt-2 text-xs text-[var(--forest-green)] bg-[var(--pale-sage)] px-3 py-1.5 rounded inline-block font-semibold">
                    Next Action: {continueLearning.nextStep}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-base font-bold text-[var(--text-heading)] mt-1">Ready to start studying {subject.name}?</h3>
                <p className="text-xs text-[var(--text-muted)]">Log your first study session to track your time and progress.</p>
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
            className="paper-btn-primary px-6 py-2.5 text-xs font-bold shadow-xs flex items-center justify-center space-x-2 self-start md:self-center shrink-0"
          >
            <span>Resume Learning →</span>
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex border-b border-[var(--border-default)] space-x-6 text-sm font-bold text-[var(--text-muted)]">
        <button
          onClick={() => setActiveTab("structure")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "structure"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-extrabold"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          Structure & Topics ({allTopics.length})
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "sessions"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-extrabold"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          Study Sessions ({studySessions.length})
        </button>
        <button
          onClick={() => setActiveTab("revision")}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === "revision"
              ? "border-[var(--forest-green)] text-[var(--text-heading)] font-extrabold"
              : "border-transparent hover:text-[var(--text-heading)]"
          }`}
        >
          Understanding & Revision ({topicsNeedingRevision.length})
        </button>
      </div>

      {/* TAB 1: STRUCTURE & TOPICS */}
      {activeTab === "structure" && (
        <div className="paper-card p-6 space-y-6 border border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-heading)]">Learning Structure</h2>
              <p className="text-xs text-[var(--text-muted)]">Chapters, topics, mastery levels, notes, and resources</p>
            </div>
            <button
              onClick={() => setShowAddChapter(true)}
              className="paper-btn-primary px-4 py-2 text-xs font-bold"
            >
              + Add Chapter
            </button>
          </div>

          {/* Add Chapter Inline Form */}
          {showAddChapter && (
            <form onSubmit={handleCreateChapter} className="paper-card bg-[var(--surface-secondary)] p-5 space-y-3 border border-[var(--border-default)]">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--forest-green)]">New Chapter</h3>
              <input
                type="text"
                placeholder="Chapter Title (e.g. Transport Layer, Memory Allocation)"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="paper-input w-full px-4 py-2.5 text-sm"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (Optional)"
                value={newChapterDesc}
                onChange={(e) => setNewChapterDesc(e.target.value)}
                className="paper-input w-full px-4 py-2.5 text-sm"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddChapter(false)}
                  className="paper-btn-secondary px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="paper-btn-primary px-5 py-2 text-xs font-bold"
                >
                  Create Chapter
                </button>
              </div>
            </form>
          )}

          {/* Empty State */}
          {chapters.length === 0 && !showAddChapter ? (
            <div className="paper-card bg-[var(--surface-secondary)] p-8 text-center space-y-3 border border-[var(--border-default)]">
              <div className="text-3xl">🌱</div>
              <div className="font-bold text-[var(--text-heading)] text-lg">Start building your syllabus naturally.</div>
              <p className="text-xs text-[var(--text-muted)]">
                You don't need to define every chapter upfront. Create chapters as your learning expands!
              </p>
              <button
                onClick={() => setShowAddChapter(true)}
                className="paper-btn-primary px-5 py-2.5 text-xs font-bold"
              >
                + Add Chapter
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="paper-card p-5 space-y-4 border border-[var(--border-default)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[var(--text-heading)] text-base">{chapter.title}</h3>
                      {chapter.description && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{chapter.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActiveChapterForTopic(chapter.id)}
                        className="text-xs font-bold text-[var(--forest-green)] hover:underline"
                      >
                        + Add Topic
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter)}
                        className="text-xs font-semibold text-[var(--text-muted)] hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Topics List */}
                  <div className="pl-3 border-l-2 border-[var(--border-default)] space-y-3">
                    {chapter.topics && chapter.topics.length > 0 ? (
                      chapter.topics.map((topic) => {
                        const statusInfo = STATUS_CONFIG[topic.status || "NOT_STARTED"];
                        return (
                          <div
                            key={topic.id}
                            className="paper-card bg-[var(--surface-secondary)] p-4 text-xs space-y-2 border border-[var(--border-default)] hover:border-[var(--forest-green)] transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center space-x-3">
                                <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${statusInfo.badgeClass}`}>
                                  {statusInfo.icon} {statusInfo.label}
                                </span>
                                <span className="font-bold text-[var(--text-heading)] text-sm">{topic.title}</span>
                              </div>

                              <div className="flex items-center space-x-2 self-end sm:self-center">
                                {/* Confidence stars */}
                                {topic.confidence && (
                                  <span className="text-amber-600 font-bold text-xs mr-1" title={`Confidence: ${topic.confidence}/5`}>
                                    {"★".repeat(topic.confidence)}{"☆".repeat(5 - topic.confidence)}
                                  </span>
                                )}

                                <button
                                  onClick={() => startQuickSessionForTopic(topic)}
                                  className="paper-btn-secondary px-3 py-1 text-[11px] font-bold text-[var(--forest-green)]"
                                  title="Study this topic now"
                                >
                                  Study →
                                </button>
                                <button
                                  onClick={() => openEditTopicModal(topic)}
                                  className="paper-btn-secondary px-3 py-1 text-[11px] font-bold"
                                >
                                  Details / Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTopic(topic.id)}
                                  className="text-[var(--text-muted)] hover:text-red-600 font-bold px-2"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {/* Additional Details Snippet */}
                            {(topic.notes || topic.resources || topic.nextStep) && (
                              <div className="bg-[var(--surface-primary)] p-3 rounded text-[11px] space-y-1 text-[var(--text-muted)] border border-[var(--border-default)]">
                                {topic.notes && (
                                  <div>
                                    <strong className="text-[var(--text-heading)]">Notes:</strong> {topic.notes}
                                  </div>
                                )}
                                {topic.resources && (
                                  <div>
                                    <strong className="text-[var(--forest-green)]">Resources:</strong> {topic.resources}
                                  </div>
                                )}
                                {topic.nextStep && (
                                  <div>
                                    <strong className="text-[var(--crimson)]">Next Step:</strong> {topic.nextStep}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-[var(--text-muted)] italic py-1">No topics added to this chapter yet.</div>
                    )}

                    {/* Add Topic Inline Form */}
                    {activeChapterForTopic === chapter.id && (
                      <div className="flex items-center space-x-2 pt-2">
                        <input
                          type="text"
                          placeholder="Topic title (e.g. TCP Connection Establishment)"
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
                          className="paper-btn-primary px-4 py-2 text-xs font-bold"
                        >
                          Add Topic
                        </button>
                        <button
                          onClick={() => setActiveChapterForTopic(null)}
                          className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDY SESSIONS LOG */}
      {activeTab === "sessions" && (
        <div className="paper-card p-6 space-y-6 border border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-heading)]">Study Sessions</h2>
              <p className="text-xs text-[var(--text-muted)]">Proof of actual work done in {subject.name}</p>
            </div>
            <button
              onClick={() => setShowSessionModal(true)}
              className="paper-btn-primary px-4 py-2 text-xs font-bold"
            >
              + Log Study Session
            </button>
          </div>

          {studySessions.length === 0 ? (
            <div className="paper-card bg-[var(--surface-secondary)] p-8 text-center space-y-3 border border-[var(--border-default)]">
              <div className="text-3xl">⏱</div>
              <div className="font-bold text-[var(--text-heading)] text-lg">No study sessions recorded yet.</div>
              <p className="text-xs text-[var(--text-muted)]">
                Log what you studied and how long you spent to build your learning history.
              </p>
              <button
                onClick={() => setShowSessionModal(true)}
                className="paper-btn-primary px-5 py-2.5 text-xs font-bold"
              >
                + Log First Session
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {studySessions.map((session) => (
                <div
                  key={session.id}
                  className="paper-card p-5 space-y-3 border border-[var(--border-default)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-[var(--forest-green)]">
                          {formatMinutes(session.durationMinutes)}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">· {formatDate(session.occurredAt)}</span>
                        {session.topic && (
                          <span className="bg-[var(--pale-sage)] text-[var(--forest-green)] px-2 py-0.5 rounded text-[11px] font-bold">
                            {session.topic.title}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-heading)] mt-1">{session.summary}</h4>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      {session.confidence && (
                        <div className="text-amber-600 font-bold text-xs" title={`Confidence: ${session.confidence}/5`}>
                          {"★".repeat(session.confidence)}
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-[var(--text-muted)] hover:text-red-600 text-xs font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {(session.outcome || session.nextStep) && (
                    <div className="bg-[var(--surface-secondary)] p-3 rounded text-xs space-y-1 text-[var(--text-muted)] border border-[var(--border-default)]">
                      {session.outcome && (
                        <div>
                          <strong className="text-[var(--text-heading)]">Outcome:</strong> {session.outcome}
                        </div>
                      )}
                      {session.nextStep && (
                        <div>
                          <strong className="text-[var(--forest-green)]">Next Action:</strong> {session.nextStep}
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

      {/* TAB 3: UNDERSTANDING & REVISION */}
      {activeTab === "revision" && (
        <div className="paper-card p-6 space-y-6 border border-[var(--border-default)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-heading)]">Understanding & Revision Focus</h2>
            <p className="text-xs text-[var(--text-muted)]">
              Topics flagged for review or rated with lower confidence. Revisit these to build true mastery.
            </p>
          </div>

          {topicsNeedingRevision.length === 0 ? (
            <div className="paper-card bg-[var(--surface-secondary)] p-8 text-center space-y-3 border border-[var(--border-default)]">
              <div className="text-3xl">🎉</div>
              <div className="font-bold text-[var(--text-heading)] text-lg">No topics marked for revision right now!</div>
              <p className="text-xs text-[var(--text-muted)]">
                You can flag any topic as "Needs Revision" when studying if you feel unsure about key concepts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topicsNeedingRevision.map((topic) => (
                <div
                  key={topic.id}
                  className="paper-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[var(--border-default)]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-[#FDF2E9] text-[#C2410C] px-2.5 py-0.5 rounded text-[11px] font-bold">
                        Needs Revision
                      </span>
                      {topic.chapterTitle && (
                        <span className="text-xs text-[var(--text-muted)]">in {topic.chapterTitle}</span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-[var(--text-heading)]">{topic.title}</h4>
                    {topic.notes && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{topic.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => startQuickSessionForTopic(topic)}
                      className="paper-btn-primary px-4 py-2 text-xs font-bold"
                    >
                      Study Topic Now →
                    </button>
                    <button
                      onClick={() => openEditTopicModal(topic)}
                      className="paper-btn-secondary px-3 py-2 text-xs font-bold"
                    >
                      Update Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: LOG STUDY SESSION */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-xl p-6 space-y-5 rounded-xl border border-[var(--border-default)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text-heading)]">Log a Study Session</h3>
                <p className="text-xs text-[var(--text-muted)]">Record time and progress for {subject.name}</p>
              </div>
              <button
                onClick={() => setShowSessionModal(false)}
                className="text-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogStudySession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">What did you study? *</label>
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
                <label className="block text-xs font-bold text-[var(--text-muted)]">Link to Topic (Optional)</label>
                <select
                  value={sessionTopicId}
                  onChange={(e) => setSessionTopicId(e.target.value)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm bg-[var(--surface-primary)]"
                >
                  <option value="">-- General Subject Study (No specific topic) --</option>
                  {allTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.chapterTitle ? `${t.chapterTitle} > ` : ""}{t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time spent preset buttons */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Time spent</label>
                <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-2">
                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSessionDuration(mins)}
                      className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${
                        sessionDuration === mins
                          ? "bg-[var(--forest-green)] text-white font-extrabold"
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
                <label className="block text-xs font-bold text-[var(--text-muted)]">How did it go? (Understanding level)</label>
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
                      className={`p-2 text-center rounded text-xs font-bold transition-colors ${
                        sessionConfidence === item.val
                          ? "bg-[var(--pale-sage)] text-[var(--forest-green)] border border-[var(--sage)]"
                          : "bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-default)]"
                      }`}
                    >
                      <div>{"★".repeat(item.val)}</div>
                      <div className="text-[10px] mt-0.5">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">What did you actually accomplish? (Optional)</label>
                <textarea
                  placeholder="e.g. Read RFC 793, drew connection diagram, implemented socket listener."
                  value={sessionOutcome}
                  onChange={(e) => setSessionOutcome(e.target.value)}
                  rows={2}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">What's your intended next step? (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Solve 3 congestion control practice problems"
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
                  className="paper-btn-primary px-6 py-2 text-xs font-bold"
                >
                  Save Study Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TOPIC DETAILS & MASTERY */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="paper-modal bg-[var(--surface-primary)] w-full max-w-lg p-6 space-y-5 rounded-xl border border-[var(--border-default)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div>
                <h3 className="text-lg font-black text-[var(--text-heading)]">{editingTopic.title}</h3>
                <p className="text-xs text-[var(--text-muted)]">Topic Mastery & Learning Resources</p>
              </div>
              <button
                onClick={() => setEditingTopic(null)}
                className="text-lg text-[var(--text-muted)] hover:text-[var(--text-heading)] font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTopicDetails} className="space-y-4">
              {/* Status Picker */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Learning Status</label>
                <select
                  value={topicStatus}
                  onChange={(e) => setTopicStatus(e.target.value as TopicStatus)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm bg-[var(--surface-primary)]"
                >
                  <option value="NOT_STARTED">○ Not Started</option>
                  <option value="LEARNING">◉ Learning</option>
                  <option value="STUDIED">✓ Studied (Read / Covered)</option>
                  <option value="NEEDS_REVISION">⚡ Needs Revision</option>
                  <option value="UNDERSTOOD">★ Understood & Mastered</option>
                </select>
              </div>

              {/* Confidence Rating */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Confidence Level (1-5)</label>
                <div className="flex items-center space-x-2 mt-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTopicConfidence(val)}
                      className={`flex-1 py-2 text-center rounded text-xs font-bold transition-colors ${
                        topicConfidence === val
                          ? "bg-[var(--pale-sage)] text-[var(--forest-green)] border border-[var(--sage)]"
                          : "bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-default)]"
                      }`}
                    >
                      {"★".repeat(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Personal Notes</label>
                <textarea
                  placeholder="Explain concepts in your own words..."
                  value={topicNotes}
                  onChange={(e) => setTopicNotes(e.target.value)}
                  rows={3}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Resources & Links</label>
                <input
                  type="text"
                  placeholder="Books, URLs, documentation links..."
                  value={topicResources}
                  onChange={(e) => setTopicResources(e.target.value)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Next Intended Action</label>
                <input
                  type="text"
                  placeholder="e.g. Revisit SYN cookies section"
                  value={topicNextStep}
                  onChange={(e) => setTopicNextStep(e.target.value)}
                  className="paper-input mt-1.5 w-full px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)]">Planned Revision Date</label>
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
                  className="paper-btn-primary px-6 py-2 text-xs font-bold"
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

