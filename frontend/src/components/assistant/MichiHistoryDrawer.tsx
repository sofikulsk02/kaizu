"use client";

import React, { useState } from "react";
import { AssistantConversationSummary } from "../../lib/api";

interface MichiHistoryDrawerProps {
  conversations: AssistantConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
  onCloseHistory: () => void;
  loading?: boolean;
}

export const MichiHistoryDrawer: React.FC<MichiHistoryDrawerProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  onCloseHistory,
  loading,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      onDeleteConversation(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--surface-primary)] overflow-hidden">
      {/* Top action */}
      <div className="p-3 border-b border-[var(--border-default)] flex items-center justify-between">
        <button
          onClick={onNewChat}
          className="paper-btn-primary flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold shadow-xs w-full justify-center"
        >
          <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Start New Conversation</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center p-8 text-xs text-[var(--text-muted)] space-x-2">
            <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span>Loading history...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-1">
            <div className="text-2xl">⛩️</div>
            <p className="font-semibold text-[var(--text-heading)]">No past conversations</p>
            <p className="text-[11px]">Your previous chats with Michi will be saved here.</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            const isConfirming = confirmDeleteId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                  isActive
                    ? "bg-[var(--sidebar-active-bg)] border-[var(--forest-green)] text-[var(--sidebar-active-text)] font-bold shadow-2xs"
                    : "border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="truncate font-bold leading-tight">{conv.title}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                    {new Date(conv.updatedAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(e, conv.id)}
                  title={isConfirming ? "Click again to confirm deletion" : "Delete conversation"}
                  className={`p-1 rounded text-xs transition shrink-0 ${
                    isConfirming
                      ? "bg-red-500 text-white font-bold px-2 py-0.5 text-[10px]"
                      : "opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10"
                  }`}
                >
                  {isConfirming ? (
                    "Confirm"
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Back */}
      <div className="p-2.5 border-t border-[var(--border-default)] bg-[var(--surface-secondary)] text-center">
        <button
          onClick={onCloseHistory}
          className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-heading)] underline"
        >
          ← Return to current chat
        </button>
      </div>
    </div>
  );
};
