"use client";

import React, { useState, useRef, useEffect } from "react";

interface MichiComposerProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxChars?: number;
}

export const MichiComposer: React.FC<MichiComposerProps> = ({
  onSendMessage,
  disabled,
  placeholder = "Ask Michi about your goals, habits, or learning...",
  maxChars = 2000,
}) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto grow textarea up to 120px
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  const charsLeft = maxChars - text.length;

  return (
    <div className="border-t border-[var(--border-default)] bg-[var(--surface-primary)] p-3 shrink-0">
      <div className="relative flex items-end gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-secondary)] p-2 focus-within:border-[var(--forest-green)] focus-within:ring-1 focus-within:ring-[var(--forest-green)] transition">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxChars}
          rows={1}
          className="max-h-32 flex-1 resize-none bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none leading-relaxed py-1"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          title="Send message (Enter)"
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-white transition shrink-0 ${
            text.trim() && !disabled
              ? "bg-[var(--forest-green)] hover:bg-[var(--deep-forest)] shadow-xs scale-100"
              : "bg-[var(--border-strong)] text-[var(--text-disabled)] cursor-not-allowed opacity-50"
          }`}
        >
          <svg className="h-3.5 w-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-[var(--text-muted)]">
        <span className="hidden sm:inline">Enter to send • Shift+Enter for newline</span>
        <span className="sm:hidden">Press send</span>
        {text.length > maxChars * 0.75 && (
          <span className={charsLeft < 100 ? "text-[var(--crimson)] font-bold" : ""}>
            {charsLeft} chars left
          </span>
        )}
      </div>
    </div>
  );
};
