"use client";

import React from "react";
import { PanelLeftClose, PanelLeft, Plus } from "lucide-react";

interface NavbarProps {
  activeUser: { id: string; name: string; email: string };
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenQuickAdd: () => void;
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
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        {/* Unified Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
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
          className="flex cursor-pointer items-center space-x-2 sm:space-x-3 transition hover:opacity-90 min-w-0"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md bg-[var(--crimson)] text-white font-bold text-xs sm:text-sm shadow-xs shrink-0">
            改善
          </div>
          <div className="min-w-0">
            <span className="text-base sm:text-lg font-black tracking-tight text-[var(--text-heading)]">
              KAIZU
            </span>
            <span className="ml-2 hidden text-xs font-semibold text-[var(--text-muted)] sm:inline-block">
              Continuous Improvement OS
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <button
          onClick={onOpenQuickAdd}
          className="paper-btn-primary flex items-center space-x-1.5 px-3 sm:px-4 py-2 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Quick Add</span>
          <span className="sm:hidden">Add</span>
        </button>

        <button
          onClick={onToggleSettings || (() => onSelectTab("settings"))}
          title={isSettingsOpen ? "Close Settings (return to previous page)" : "Settings & Profile"}
          className={`paper-btn-secondary flex items-center space-x-2 px-2 sm:px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer active:scale-95 ${
            isSettingsOpen
              ? "border-[var(--forest-green)] bg-[var(--surface-secondary)] ring-2 ring-[var(--forest-green)]/30 text-[var(--forest-green)]"
              : "border-[var(--border-default)]"
          }`}
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
