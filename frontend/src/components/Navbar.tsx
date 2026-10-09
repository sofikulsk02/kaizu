"use client";

import React from "react";

interface NavbarProps {
  activeUser: { id: string; name: string; email: string };
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenQuickAdd: () => void;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeUser,
  isSidebarOpen,
  onToggleSidebar,
  onOpenQuickAdd,
  onSelectTab,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between px-4 sm:px-8 bg-[var(--bg-main)]/95 backdrop-blur-sm transition-colors border-b border-[var(--border-default)]">
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Unhide Sidebar Button */}
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            title="Show Navigation Sidebar"
            className="paper-btn-secondary flex h-9 w-9 items-center justify-center rounded-lg text-sm text-[var(--text-heading)] transition"
          >
            <svg
              className="h-4 w-4 stroke-[2.5]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Logo & Branding */}
        <div
          onClick={() => onSelectTab("dashboard")}
          className="flex cursor-pointer items-center space-x-3 transition hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--crimson)] text-white font-bold text-sm shadow-xs">
            改善
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-[var(--text-heading)]">
              KAIZU
            </span>
            <span className="ml-2.5 hidden text-xs font-semibold text-[var(--text-muted)] sm:inline-block">
              Continuous Improvement OS
            </span>
          </div>
        </div>
      </div>

      {/* Center Workflow Philosophy */}
      <div className="hidden lg:flex items-center space-x-2 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-4 py-1.5 rounded-full text-xs font-semibold text-[var(--text-secondary)]">
        <span className="text-[var(--text-heading)] font-extrabold">PLAN</span>
        <span className="text-[var(--text-muted)]">→</span>
        <span className="text-[var(--text-heading)] font-extrabold">DO</span>
        <span className="text-[var(--text-muted)]">→</span>
        <span className="text-[var(--text-heading)] font-extrabold">REFLECT</span>
        <span className="text-[var(--text-muted)]">→</span>
        <span className="text-[var(--text-heading)] font-extrabold">IMPROVE</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenQuickAdd}
          className="paper-btn-primary flex items-center space-x-1.5 px-4 py-2 text-xs font-bold shadow-xs"
        >
          <svg className="h-3.5 w-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Quick Add</span>
        </button>

        <button
          onClick={() => onSelectTab("settings")}
          className="paper-btn-secondary flex items-center space-x-2 px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)]"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--forest-green)] text-white font-bold text-[10px]">
            {activeUser.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline font-semibold max-w-[110px] truncate text-[var(--text-heading)]">
            {activeUser.name}
          </span>
        </button>
      </div>
    </header>
  );
};
