"use client";

import React, { useEffect, useRef } from "react";
import { AssistantMessageItem } from "../../lib/api";

interface MichiMessageListProps {
  messages: AssistantMessageItem[];
  streamingText: string;
  isStreaming: boolean;
  onRetryLast?: () => void;
  error?: string | null;
}

export const MichiMessageList: React.FC<MichiMessageListProps> = ({
  messages,
  streamingText,
  isStreaming,
  onRetryLast,
  error,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, error]);

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  /**
   * Helper to format markdown elements nicely in lightweight React elements
   */
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");

    return lines.map((line, idx) => {
      // Heading 3 or 4
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-extrabold text-xs text-[var(--text-heading)] mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-black text-sm text-[var(--text-heading)] mt-2.5 mb-1">
            {line.replace("## ", "")}
          </h3>
        );
      }

      // Bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const itemText = line.trim().substring(2);
        return (
          <div key={idx} className="flex items-start space-x-1.5 ml-1 my-0.5">
            <span className="text-[var(--forest-green)] font-bold text-xs mt-0.5">•</span>
            <span className="text-xs leading-relaxed">{parseInlineMarkdown(itemText)}</span>
          </div>
        );
      }

      // Numbered items
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start space-x-1.5 ml-1 my-0.5">
            <span className="text-[var(--forest-green)] font-bold text-xs">{numMatch[1]}.</span>
            <span className="text-xs leading-relaxed">{parseInlineMarkdown(numMatch[2])}</span>
          </div>
        );
      }

      // Empty line spacing
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      // Regular paragraph
      return (
        <p key={idx} className="text-xs leading-relaxed my-0.5">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  const parseInlineMarkdown = (text: string) => {
    // Basic bold parsing: **bold**
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-[var(--text-heading)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1 py-0.5 bg-[var(--surface-inset)] text-[var(--crimson)] rounded text-[11px] font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
      {messages.map((msg) => {
        const isUser = msg.role === "USER";

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
          >
            {/* Header info */}
            <div className="flex items-center space-x-1.5 mb-1 px-1 text-[10px] text-[var(--text-muted)] font-semibold">
              <span>{isUser ? "You" : "Michi"}</span>
              <span>•</span>
              <span>
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Bubble */}
            <div
              className={`relative max-w-[88%] rounded-xl px-3.5 py-2.5 shadow-2xs group ${
                isUser
                  ? "bg-[var(--forest-green)] text-white font-medium rounded-tr-xs"
                  : "bg-[var(--surface-primary)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-tl-xs"
              }`}
            >
              {isUser ? (
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <>
                  <div className="text-xs space-y-0.5">{renderFormattedContent(msg.content)}</div>
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    title="Copy response"
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] bg-[var(--surface-primary)] rounded"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* Streaming Bubble */}
      {isStreaming && (
        <div className="flex flex-col items-start">
          <div className="flex items-center space-x-1.5 mb-1 px-1 text-[10px] text-[var(--text-muted)] font-semibold">
            <span>Michi</span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--forest-green)] animate-ping" />
            <span className="text-[var(--forest-green)]">Thinking & reasoning...</span>
          </div>

          <div className="max-w-[88%] rounded-xl rounded-tl-xs px-3.5 py-2.5 bg-[var(--surface-primary)] border border-[var(--border-default)] text-[var(--text-primary)] shadow-2xs">
            {streamingText ? (
              <div className="text-xs space-y-0.5">{renderFormattedContent(streamingText)}</div>
            ) : (
              <div className="flex items-center space-x-1.5 py-1 text-xs text-[var(--text-muted)]">
                <div className="h-2 w-2 rounded-full bg-[var(--forest-green)] animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-[var(--forest-green)] animate-bounce [animation-delay:0.2s]" />
                <div className="h-2 w-2 rounded-full bg-[var(--forest-green)] animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-300 space-y-2">
          <div className="flex items-start space-x-2">
            <span>⚠️</span>
            <span className="leading-snug">{error}</span>
          </div>
          {onRetryLast && (
            <button
              onClick={onRetryLast}
              className="text-[11px] font-bold text-[var(--crimson)] hover:underline inline-block"
            >
              🔄 Retry request
            </button>
          )}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
