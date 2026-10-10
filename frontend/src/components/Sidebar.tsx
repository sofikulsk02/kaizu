"use client";

import React from "react";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  FolderKanban,
  Activity,
  Settings,
} from "lucide-react";

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
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "subjects", label: "Subjects", Icon: BookOpen, count: counts.subjects },
    { id: "goals", label: "Goals", Icon: Target, count: counts.goals },
    { id: "projects", label: "Projects", Icon: FolderKanban },
    { id: "activity", label: "Activity", Icon: Activity },
    { id: "settings", label: "Settings", Icon: Settings },
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
        className={`fixed left-0 top-14 sm:top-16 bottom-0 z-20 overflow-y-auto transition-all duration-300 ease-in-out border-r border-[var(--border-default)] bg-[var(--sidebar-bg)] ${
          isOpen
            ? "w-60 p-4 sm:p-5 opacity-100 translate-x-0"
            : "w-60 p-4 sm:p-5 -translate-x-full md:w-0 md:p-0 md:translate-x-0 md:opacity-0 md:overflow-hidden md:pointer-events-none md:border-r-0"
        }`}
      >
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--sidebar-text)] opacity-70">
            Workspace
          </span>
        </div>

        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const ItemIcon = item.Icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-all duration-150 whitespace-nowrap cursor-pointer select-none active:scale-[0.98] ${
                  isActive
                    ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-bold shadow-xs"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-active-bg)]/35 hover:text-[var(--sidebar-active-text)] font-medium"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors shrink-0 ${
                      isActive
                        ? "bg-[var(--crimson)]/15 text-[var(--crimson)]"
                        : "text-[var(--sidebar-text)] opacity-80 group-hover:opacity-100 group-hover:text-[var(--sidebar-active-text)] group-hover:bg-[var(--sidebar-active-bg)]/50"
                    }`}
                  >
                    <ItemIcon
                      className="h-4 w-4"
                      strokeWidth={isActive ? 2.2 : 1.9}
                    />
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-full transition-colors shrink-0 ${
                      isActive
                        ? "bg-[var(--crimson)] text-white shadow-xs"
                        : "bg-[var(--sidebar-badge-bg)] text-[var(--sidebar-badge-text)] shadow-2xs border border-white/10"
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
