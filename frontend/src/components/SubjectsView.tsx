"use client";

import React, { useState } from "react";
import { Subject } from "../lib/api";

interface SubjectsViewProps {
  subjects: Subject[];
  onSelectSubject: (subject: Subject) => void;
  onOpenCreateSubject: () => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  onSelectSubject,
  onOpenCreateSubject,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-heading)] sm:text-3xl">Subjects</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Areas of learning or practice. Start empty, grow naturally as needed.
          </p>
        </div>

        <button
          onClick={onOpenCreateSubject}
          className="paper-btn-primary px-5 py-2.5 text-xs font-bold self-start sm:self-center"
        >
          + Create Subject
        </button>
      </div>

      {/* Paper Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search subjects by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="paper-input w-full px-4 py-3 text-sm placeholder-[var(--text-muted)]"
        />
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="paper-card p-12 text-center space-y-4">
          <div className="text-4xl">📚</div>
          <div className="text-lg font-bold text-[var(--text-heading)]">
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
              className="paper-btn-primary px-5 py-2.5 text-xs font-bold"
            >
              + Create First Subject
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => onSelectSubject(subject)}
              className="paper-card-interactive cursor-pointer p-6 flex flex-col justify-between space-y-4 border border-[var(--border-default)]"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--forest-green)] text-white font-bold text-lg">
                    {subject.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="paper-badge px-3 py-1 text-xs font-bold">
                    {subject.chapterCount || 0} chapters
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-[var(--text-heading)] hover:text-[var(--crimson)] transition-colors">
                    {subject.name}
                  </h2>
                  {subject.description ? (
                    <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">{subject.description}</p>
                  ) : (
                    <p className="mt-1 text-xs text-[var(--text-muted)] italic">No description provided</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="font-semibold">{subject.topicCount || 0} topics tracked</span>
                <span className="font-bold text-[var(--forest-green)]">View →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
