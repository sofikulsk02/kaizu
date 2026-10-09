"use client";

import React from "react";

interface SidebarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  counts: { subjects: number; goals: number };
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggleSidebar,
  activeTab,
  onSelectTab,
  counts,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "subjects", label: "Subjects", icon: "📚", count: counts.subjects },
    { id: "goals", label: "Goals", icon: "🎯", count: counts.goals },
    { id: "projects", label: "Projects", icon: "🛠️" },
    { id: "activity", label: "Activity", icon: "⚡" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    // Auto-close sidebar on mobile after selecting a tab
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      onToggleSidebar();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px] md:hidden transition-opacity"
          onClick={onToggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed left-0 top-16 bottom-0 z-20 overflow-y-auto transition-all duration-300 ease-in-out border-r border-[var(--border-default)] bg-[var(--sidebar-bg)] ${
          isOpen
            ? "w-60 p-4 sm:p-5 opacity-100 translate-x-0"
            : "w-60 p-4 sm:p-5 -translate-x-full md:w-0 md:p-0 md:translate-x-0 md:opacity-0 md:overflow-hidden md:pointer-events-none md:border-r-0"
        }`}
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--sidebar-text)] opacity-80">
            Workspace
          </span>
          <button
            onClick={onToggleSidebar}
            title="Hide Sidebar"
            className="flex h-7 w-7 items-center justify-center rounded text-xs text-[var(--sidebar-text)] hover:text-[var(--sidebar-active-text)] hover:bg-[var(--sidebar-active-bg)]/40 transition-colors"
          >
            <svg
              className="h-3.5 w-3.5 stroke-[2.5]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-semibold transition whitespace-nowrap ${
                  isActive
                    ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-bold shadow-xs"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active-bg)]/30 hover:text-[var(--sidebar-active-text)]"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${
                      isActive
                        ? "bg-[var(--crimson)] text-white"
                        : "bg-[var(--border-default)]/40 text-[var(--sidebar-text)]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
