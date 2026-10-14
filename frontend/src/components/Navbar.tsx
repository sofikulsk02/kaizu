"use client";

import React from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";

interface NavbarProps {
  activeUser: { id: string; name: string; email: string };
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenQuickAdd?: () => void;
  onSelectTab: (tab: string) => void;
  onToggleSettings?: () => void;
  isSettingsOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeUser,
  isSidebarOpen,
  onToggleSidebar,
  onOpenQuickAdd,
  onSelectTab,
  onToggleSettings,
  isSettingsOpen = false,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-8 bg-[var(--bg-main)]/95 backdrop-blur-sm transition-colors border-b border-[var(--border-default)]">
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
        {/* Unified Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          aria-label={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm text-[var(--text-heading)] transition shrink-0 paper-btn-secondary cursor-pointer active:scale-95"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </button>

        {/* Logo & Branding */}
        <div
          onClick={() => onSelectTab("dashboard")}
          className="flex cursor-pointer items-center space-x-2.5 sm:space-x-3 transition hover:opacity-90 min-w-0"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--crimson)] text-white font-bold text-xs sm:text-sm shadow-xs shrink-0 select-none">
            改善
          </div>
          <div className="flex items-center min-w-0">
            <span className="text-base sm:text-lg font-black tracking-tight text-[var(--text-heading)] leading-none">
              KAIZU
            </span>
            <span className="ml-2.5 hidden text-xs font-semibold text-[var(--text-muted)] sm:inline-block leading-none">
              A little better, every day.
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls - Single circular profile avatar */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <button
          onClick={onToggleSettings || (() => onSelectTab("settings"))}
          title={isSettingsOpen ? "Close Settings (return to previous page)" : `${activeUser.name} - Settings & Profile`}
          aria-label="Settings and Profile"
          className="group flex items-center space-x-2.5 cursor-pointer focus:outline-none"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forest-green)] text-white font-bold text-sm shadow-xs shrink-0 select-none transition-all active:scale-95 ${
              isSettingsOpen
                ? "ring-2 ring-[var(--forest-green)] ring-offset-2 ring-offset-[var(--bg-main)] scale-105"
                : "group-hover:ring-2 group-hover:ring-[var(--forest-green)]/50 group-hover:ring-offset-2 group-hover:ring-offset-[var(--bg-main)]"
            }`}
          >
            {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : "U"}
          </div>
          <span className="hidden sm:inline font-semibold text-xs max-w-[120px] truncate text-[var(--text-heading)] group-hover:text-[var(--forest-green)] transition-colors select-none">
            {activeUser.name}
          </span>
        </button>
      </div>
    </header>
  );
};
