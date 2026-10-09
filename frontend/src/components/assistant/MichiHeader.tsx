"use client";

import React from "react";

interface MichiHeaderProps {
  onClose: () => void;
  onNewChat: () => void;
  onToggleHistory: () => void;
  isHistoryOpen: boolean;
  pageContextTitle?: string;
  conversationTitle?: string;
  usageInfo?: { used: number; limit: number };
}

export const MichiHeader: React.FC<MichiHeaderProps> = ({
  onClose,
  onNewChat,
  onToggleHistory,
  isHistoryOpen,
  pageContextTitle,
  conversationTitle,
  usageInfo,
}) => {
  return (
    <div className="flex flex-col border-b border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 shrink-0 select-none">
      <div className="flex items-center justify-between">
        {/* Left: Avatar & Title */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--forest-green)] text-white text-xs font-black shadow-xs shrink-0">
            道
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xs text-[var(--text-heading)]">Michi</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[var(--pale-sage)] text-[var(--forest-green)] font-bold rounded">
                AI Companion
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[170px] sm:max-w-[200px]">
              {conversationTitle || "Continuous Improvement Guide"}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1">
          {/* History Button */}
          <button
            onClick={onToggleHistory}
            title={isHistoryOpen ? "Back to chat" : "View conversation history"}
            className={`flex h-7 w-7 items-center justify-center rounded text-xs transition ${
              isHistoryOpen
                ? "bg-[var(--forest-green)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-heading)]"
            }`}
          >
            <svg className="h-4 w-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            title="Start new conversation"
            className="flex h-7 w-7 items-center justify-center rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-heading)] transition"
          >
            <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Close/Minimize */}
          <button
            onClick={onClose}
            title="Close drawer"
            className="flex h-7 w-7 items-center justify-center rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-heading)] transition"
          >
            <svg className="h-4 w-4 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subheader: Page Context Chip & Free-tier Usage Status */}
      {(pageContextTitle || usageInfo) && (
        <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1.5 border-t border-[var(--border-subtle)]">
          {pageContextTitle ? (
            <div className="flex items-center space-x-1 truncate max-w-[210px]">
              <span className="text-[var(--forest-green)] font-semibold">📍 Context:</span>
              <span className="font-medium truncate text-[var(--text-secondary)]">{pageContextTitle}</span>
            </div>
          ) : (
            <span className="text-[var(--text-muted)] italic">Grounding in your Kaizu profile</span>
          )}

          {usageInfo && (
            <span className="shrink-0 font-medium text-[var(--text-muted)]">
              {usageInfo.limit - usageInfo.used} requests left today
            </span>
          )}
        </div>
      )}
    </div>
  );
};
