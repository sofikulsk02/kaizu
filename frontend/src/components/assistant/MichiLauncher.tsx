"use client";

import React from "react";
import { X } from "lucide-react";

interface MichiLauncherProps {
  isOpen: boolean;
  onToggle: () => void;
  hasUnread?: boolean;
}

export const MichiLauncher: React.FC<MichiLauncherProps> = ({
  isOpen,
  onToggle,
  hasUnread,
}) => {
  return (
    <button
      onClick={onToggle}
      aria-label={isOpen ? "Close Michi AI assistant" : "Open Michi AI assistant"}
      title="Michi (道) — AI Continuous Improvement Companion"
      className={`fixed right-4 bottom-5 sm:right-6 sm:bottom-6 z-40 flex h-13 w-13 items-center justify-center rounded-full shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer ${
        isOpen
          ? "bg-[var(--surface-secondary)] text-[var(--text-heading)] border border-[var(--border-strong)] rotate-90"
          : "bg-[var(--forest-green)] text-white hover:bg-[var(--deep-forest)] hover:shadow-xl hover:-translate-y-0.5"
      }`}
    >
      {isOpen ? (
        <X className="h-5 w-5" />
      ) : (
        <div className="relative flex items-center justify-center">
          {/* Abstract Zen Path Mark (道) */}
          <span className="font-black text-sm tracking-tighter">道</span>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--crimson)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--crimson)]"></span>
            </span>
          )}
        </div>
      )}
    </button>
  );
};
