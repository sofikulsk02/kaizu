"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Api,
  AssistantConversationSummary,
  AssistantMessageItem,
  AssistantUsage,
} from "../../lib/api";
import { MichiLauncher } from "./MichiLauncher";
import { MichiHeader } from "./MichiHeader";
import { MichiStarterPrompts } from "./MichiStarterPrompts";
import { MichiMessageList } from "./MichiMessageList";
import { MichiComposer } from "./MichiComposer";
import { MichiHistoryDrawer } from "./MichiHistoryDrawer";

interface MichiAssistantProps {
  pageContext?: {
    type?: "dashboard" | "subject" | "goal" | "project" | "activity" | "settings";
    recordId?: string;
    recordName?: string;
  };
}

export const MichiAssistant: React.FC<MichiAssistantProps> = ({ pageContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessageItem[]>([]);
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([]);

  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<AssistantUsage | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch conversations list & usage when assistant opens or conversation changes
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const [convRes, usageRes] = await Promise.all([
        Api.getAssistantConversations(),
        Api.getAssistantUsage().catch(() => null),
      ]);
      if (convRes && Array.isArray(convRes)) {
        setConversations(convRes);
      }
      if (usageRes) {
        setUsage(usageRes);
      }
    } catch (err) {
      console.warn("Could not fetch assistant conversations:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, fetchConversations]);

  useEffect(() => {
    const handleOpenMichi = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-michi", handleOpenMichi);
    return () => window.removeEventListener("open-michi", handleOpenMichi);
  }, []);

  // Load selected conversation messages
  const handleSelectConversation = async (convId: string) => {
    try {
      setError(null);
      setIsStreaming(false);
      setStreamingText("");
      const res = await Api.getAssistantConversation(convId);
      if (res) {
        setActiveConversationId(res.id);
        setConversationTitle(res.title);
        setMessages(res.messages || []);
        setIsHistoryOpen(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load conversation history.");
    }
  };

  // Start a new conversation
  const handleNewChat = () => {
    setActiveConversationId(null);
    setConversationTitle(null);
    setMessages([]);
    setStreamingText("");
    setIsStreaming(false);
    setError(null);
    setIsHistoryOpen(false);
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: string) => {
    try {
      await Api.deleteAssistantConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewChat();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete conversation");
    }
  };

  // Send message handler with streaming
  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    setIsStreaming(true);
    setStreamingText("");

    // Optimistically add user message to list
    const tempUserMessage: AssistantMessageItem = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId || "pending",
      role: "USER",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    // Send stream request
    await Api.streamAssistantChat(
      {
        message: trimmed,
        conversationId: activeConversationId || undefined,
        pageContext,
      },
      (chunk) => {
        setStreamingText((prev) => prev + chunk);
      },
      (doneData) => {
        setIsStreaming(false);
        setStreamingText("");

        const newAssistantMsg: AssistantMessageItem = {
          id: `resp-${Date.now()}`,
          conversationId: doneData.conversationId,
          role: "ASSISTANT",
          content: doneData.fullResponse,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newAssistantMsg]);
        setActiveConversationId(doneData.conversationId);

        // Update conversations list in background
        fetchConversations();
      },
      (streamErr) => {
        setIsStreaming(false);
        setError(streamErr.message || "Failed to stream response from Michi.");
      }
    );
  };

  const handleRetryLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "USER");
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Human-readable context label for header
  const getContextLabel = () => {
    if (!pageContext) return undefined;
    if (pageContext.recordName) return pageContext.recordName;
    if (pageContext.type) {
      return pageContext.type.charAt(0).toUpperCase() + pageContext.type.slice(1);
    }
    return undefined;
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <MichiLauncher
        isOpen={isOpen}
        onToggle={() => setIsOpen((prev) => !prev)}
      />

      {/* Drawer Overlay (Desktop & Mobile) */}
      {isOpen && (
        <div
          className={`fixed z-40 transition-all duration-300 ease-in-out flex flex-col overflow-hidden bg-[var(--surface-primary)] border border-[var(--border-default)] shadow-2xl ${
            // Mobile full screen
            "inset-0 sm:inset-auto sm:right-6 sm:bottom-22 sm:w-[400px] sm:h-[620px] sm:max-h-[calc(100vh-120px)] sm:rounded-2xl"
          }`}
        >
          {/* Header Bar */}
          <MichiHeader
            onClose={() => setIsOpen(false)}
            onNewChat={handleNewChat}
            onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
            isHistoryOpen={isHistoryOpen}
            pageContextTitle={getContextLabel()}
            conversationTitle={conversationTitle || undefined}
            usageInfo={
              usage
                ? { used: usage.dailyRequestsUsed, limit: usage.dailyLimit }
                : undefined
            }
          />

          {/* Body Content */}
          {isHistoryOpen ? (
            <MichiHistoryDrawer
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              onNewChat={handleNewChat}
              onCloseHistory={() => setIsHistoryOpen(false)}
              loading={loadingHistory}
            />
          ) : (
            <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-main)]/40">
              {messages.length === 0 && !isStreaming ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <MichiStarterPrompts
                    pageType={pageContext?.type}
                    recordName={pageContext?.recordName}
                    onSelectPrompt={handleSendMessage}
                  />
                </div>
              ) : (
                <MichiMessageList
                  messages={messages}
                  streamingText={streamingText}
                  isStreaming={isStreaming}
                  error={error}
                  onRetryLast={handleRetryLast}
                />
              )}

              {/* Input Composer */}
              <MichiComposer
                onSendMessage={handleSendMessage}
                disabled={isStreaming}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};
