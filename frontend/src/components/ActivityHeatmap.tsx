"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  getActivityMap,
  recordTodayActivity,
  resetActivityHistory,
  computeStreakStats,
  getLocalDateString,
  ActivityStats,
} from "../lib/activityStorage";
import { Flame, Zap, Calendar, Lightbulb } from "lucide-react";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface CellInfo {
  dateStr: string;
  dateObj: Date;
  count: number;
  level: number;
  formattedDate: string;
}

interface WeekInfo {
  weekIndex: number;
  days: (CellInfo | null)[];
  monthLabel?: string;
}

interface ActivityHeatmapProps {
  userId?: string;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ userId }) => {
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<ActivityStats>({
    totalActiveDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalActivities: 0,
  });
  const [hoveredCell, setHoveredCell] = useState<CellInfo | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Record today's visit automatically on mount for this specific user
    const updatedMap = recordTodayActivity(1, userId);
    setActivityMap(updatedMap);
    setStats(computeStreakStats(updatedMap));
  }, [userId]);

  const handleResetHistory = () => {
    const freshMap = resetActivityHistory(userId);
    setActivityMap(freshMap);
    setStats(computeStreakStats(freshMap));
  };

  const todayInfo = useMemo(() => {
    const today = new Date();
    const dateStr = getLocalDateString(today);
    const count = activityMap[dateStr] || 0;
    const formattedDate = today.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return { count, formattedDate };
  }, [activityMap]);

  // Generate 52 weeks of days ending at the end of the current week (Saturday)
  const { weeks, monthHeaders } = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sun, 6 = Sat

    // Calculate end date (Saturday of current week)
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - dayOfWeek));

    // Calculate start date (52 weeks ago, starting on Sunday)
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (52 * 7 - 1));

    const weeksList: WeekInfo[] = [];
    const monthLabelsList: { colIndex: number; label: string }[] = [];

    let currDate = new Date(startDate);

    for (let w = 0; w < 52; w++) {
      const daysInWeek: (CellInfo | null)[] = [];
      let monthStartingInThisWeek: string | null = null;

      for (let d = 0; d < 7; d++) {
        const dateStr = getLocalDateString(currDate);
        const count = activityMap[dateStr] || 0;

        let level = 0;
        if (count >= 4) level = 4;
        else if (count === 3) level = 3;
        else if (count === 2) level = 2;
        else if (count === 1) level = 1;

        // If the 1st of the month falls on this day, note it for this column
        if (currDate.getDate() === 1) {
          monthStartingInThisWeek = MONTH_NAMES[currDate.getMonth()];
        }

        const formattedDate = currDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        // Only include dates up to today or end of week
        daysInWeek.push({
          dateStr,
          dateObj: new Date(currDate),
          count,
          level,
          formattedDate,
        });

        currDate.setDate(currDate.getDate() + 1);
      }

      if (monthStartingInThisWeek) {
        const lastHeader = monthLabelsList[monthLabelsList.length - 1];
        if (!lastHeader || w - lastHeader.colIndex >= 2) {
          monthLabelsList.push({ colIndex: w, label: monthStartingInThisWeek });
        }
      }

      weeksList.push({
        weekIndex: w,
        days: daysInWeek,
      });
    }

    // If first label is >= 3 columns away, label week 0 with its starting month
    if (monthLabelsList.length > 0 && monthLabelsList[0].colIndex >= 3) {
      const firstWeekMonth = weeksList[0]?.days[0]?.dateObj.getMonth() ?? 0;
      monthLabelsList.unshift({ colIndex: 0, label: MONTH_NAMES[firstWeekMonth] });
    }

    return { weeks: weeksList, monthHeaders: monthLabelsList };
  }, [activityMap]);

  // Auto-scroll to show recent/today activity by default on mount/load
  useEffect(() => {
    const scrollToLatest = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    };
    scrollToLatest();
    const timer = setTimeout(scrollToLatest, 150);
    return () => clearTimeout(timer);
  }, [weeks]);

  return (
    <div className="paper-card p-3 sm:p-3.5 space-y-3 border border-[var(--border-default)]">
      {/* Top Header & Streak Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[var(--text-heading)] sm:text-lg">
            Consistency & Activity Heatmap
          </h2>
        </div>

        {/* Stats Badges — 3 even columns on mobile */}
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2.5 text-xs font-bold w-full md:w-auto">
          <div className="paper-card bg-[var(--surface-secondary)] px-2 py-1.5 sm:px-2.5 sm:py-1 text-center border border-[var(--border-default)] flex flex-col items-center justify-center">
            <div className="text-[var(--text-muted)] text-[9px] uppercase font-bold tracking-tight">Current Streak</div>
            <div className="text-xs sm:text-sm font-black text-[var(--crimson)] flex items-center justify-center space-x-1 mt-0.5">
              <Flame className="h-3 w-3 fill-crimson shrink-0" />
              <span className="truncate">{stats.currentStreak} {stats.currentStreak === 1 ? "day" : "days"}</span>
            </div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] px-2 py-1.5 sm:px-2.5 sm:py-1 text-center border border-[var(--border-default)] flex flex-col items-center justify-center">
            <div className="text-[var(--text-muted)] text-[9px] uppercase font-bold tracking-tight">Longest Streak</div>
            <div className="text-xs sm:text-sm font-black text-[var(--text-heading)] flex items-center justify-center space-x-1 mt-0.5">
              <Zap className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
              <span className="truncate">{stats.longestStreak} {stats.longestStreak === 1 ? "day" : "days"}</span>
            </div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] px-2 py-1.5 sm:px-2.5 sm:py-1 text-center border border-[var(--border-default)] flex flex-col items-center justify-center">
            <div className="text-[var(--text-muted)] text-[9px] uppercase font-bold tracking-tight">Active Days</div>
            <div className="text-xs sm:text-sm font-black text-[var(--forest-green)] flex items-center justify-center space-x-1 mt-0.5">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{stats.totalActiveDays}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative pt-0.5">
        {/* Tooltip Header / Dynamic Indicator */}
        <div className="min-h-[26px] flex items-center justify-between text-xs mb-1.5 gap-2">
          <div className="font-bold text-[var(--text-heading)] transition-all flex-1 min-w-0">
            {hoveredCell ? (
              <span className="inline-flex items-center flex-wrap gap-1.5">
                <span className="bg-[var(--pale-sage)] px-2 py-0.5 text-[11px] text-[var(--forest-green)] font-extrabold rounded">
                  {hoveredCell.count > 0 ? `${hoveredCell.count} ${hoveredCell.count === 1 ? "activity" : "activities"}` : "No activity"}
                </span>
                <span className="text-[var(--text-muted)] text-[11px] font-semibold">{hoveredCell.formattedDate}</span>
              </span>
            ) : (
              <span className="inline-flex items-center flex-wrap gap-1.5">
                <span className="bg-[var(--pale-sage)] px-2 py-0.5 text-[11px] text-[var(--forest-green)] font-extrabold rounded">
                  Today: {todayInfo.count > 0 ? `${todayInfo.count} ${todayInfo.count === 1 ? "activity" : "activities"}` : "No activity"}
                </span>
                <span className="text-[var(--text-muted)] text-[11px] font-semibold">{todayInfo.formattedDate}</span>
              </span>
            )}
          </div>

        </div>

        {/* Scrollable Heatmap Table */}
        <div
          ref={scrollRef}
          className="overflow-x-auto pb-2 custom-scrollbar rounded-md"
        >
          <div className="inline-block min-w-max pr-1">
            {/* Month Labels Header Row — full visible 3-letter labels like GitHub */}
            <div className="flex text-[10px] font-bold text-[var(--text-muted)] mb-1 pl-8 select-none h-4 relative">
              {weeks.map((w, i) => {
                const header = monthHeaders.find((m) => m.colIndex === i);
                return (
                  <div key={i} className="w-[15px] shrink-0 text-left relative">
                    {header ? (
                      <span className="absolute left-0 top-0 whitespace-nowrap overflow-visible">
                        {header.label}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Grid Body with Day Labels on Left */}
            <div className="flex">
              {/* Day Labels Column */}
              <div className="flex flex-col justify-between text-[10px] font-bold text-[var(--text-muted)] pr-2 select-none h-[98px] shrink-0">
                <span className="h-[12px] leading-[12px]"></span>
                <span className="h-[12px] leading-[12px]">Mon</span>
                <span className="h-[12px] leading-[12px]"></span>
                <span className="h-[12px] leading-[12px]">Wed</span>
                <span className="h-[12px] leading-[12px]"></span>
                <span className="h-[12px] leading-[12px]">Fri</span>
                <span className="h-[12px] leading-[12px]"></span>
              </div>

              {/* 52 Columns of 7 Days */}
              <div className="flex space-x-[3px]">
                {weeks.map((week) => (
                  <div key={week.weekIndex} className="flex flex-col space-y-[3px]">
                    {week.days.map((cell, dayIdx) => {
                      if (!cell) return <div key={dayIdx} className="w-[12px] h-[12px]" />;
                      const isSelected = hoveredCell?.dateStr === cell.dateStr;
                      return (
                        <div
                          key={cell.dateStr}
                          onClick={() => setHoveredCell(cell)}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`activity-cell activity-level-${cell.level} cursor-pointer transition-all ${
                            isSelected ? "ring-2 ring-[var(--crimson)] scale-125 z-10" : ""
                          }`}
                          title={`${cell.count > 0 ? `${cell.count} activities` : "No activity"} on ${cell.formattedDate}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar & Legend */}
        <div className="mt-3 pt-2.5 border-t border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Daily Kaizen Tip */}
          <div className="text-[var(--text-muted)] text-[11px] font-medium flex items-start gap-2 bg-[var(--surface-secondary)]/50 sm:bg-transparent p-2 sm:p-0 rounded-md sm:rounded-none">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong className="text-[var(--text-heading)]">Kaizen Tip:</strong> Visiting daily turns small habits into long-term mastery.
            </span>
          </div>

          {/* Color Legend */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] font-bold text-[var(--text-muted)] shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] sm:hidden font-semibold">Activity</span>
            <div className="flex items-center space-x-1.5">
              <span>Less</span>
              <div className="flex items-center space-x-1">
                <div className="activity-cell activity-level-0" title="No activity" />
                <div className="activity-cell activity-level-1" title="Low activity" />
                <div className="activity-cell activity-level-2" title="Medium activity" />
                <div className="activity-cell activity-level-3" title="High activity" />
                <div className="activity-cell activity-level-4" title="Maximum activity" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
