"use client";

import React, { useState } from "react";
import { Subject } from "../lib/api";
import { BookOpen, Plus, Search, ArrowRight, Layers } from "lucide-react";

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[var(--text-heading)] sm:text-2xl">Subjects</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Areas of learning or practice. Start empty, grow naturally as needed.
          </p>
        </div>

        <button
          onClick={onOpenCreateSubject}
          className="paper-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold self-start sm:self-center cursor-pointer active:scale-95 transition-all shadow-xs"
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
        <div className="paper-card p-8 text-center space-y-3">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              onClick={() => onSelectSubject(subject)}
              className="group paper-card-interactive cursor-pointer p-3.5 sm:p-4 flex flex-col justify-between space-y-3 border border-[var(--border-default)] transition-all hover:border-[var(--forest-green)]"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--forest-green)] text-white font-bold text-base shadow-xs">
                    {subject.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="paper-badge inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold">
                    <Layers className="h-3 w-3 opacity-70" />
                    <span>{subject.chapterCount || 0} chapters</span>
                  </span>
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
                <span className="inline-flex items-center gap-1 font-bold text-xs text-[var(--forest-green)] group-hover:text-[var(--crimson)] transition-colors">
                  <span>View</span>
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
