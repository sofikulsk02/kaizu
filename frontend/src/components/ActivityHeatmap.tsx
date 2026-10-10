"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  getActivityMap,
  recordTodayActivity,
  resetActivityHistory,
  computeStreakStats,
  getLocalDateString,
  ActivityStats,
} from "../lib/activityStorage";
import { Flame, Zap, Calendar, Activity, Lightbulb } from "lucide-react";

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

export const ActivityHeatmap: React.FC = () => {
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<ActivityStats>({
    totalActiveDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalActivities: 0,
  });
  const [hoveredCell, setHoveredCell] = useState<CellInfo | null>(null);

  useEffect(() => {
    // Record today's visit automatically on mount
    const updatedMap = recordTodayActivity(1);
    setActivityMap(updatedMap);
    setStats(computeStreakStats(updatedMap));
  }, []);

  const handleResetHistory = () => {
    const freshMap = resetActivityHistory();
    setActivityMap(freshMap);
    setStats(computeStreakStats(freshMap));
  };

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
    let lastMonthSeen = -1;

    let currDate = new Date(startDate);

    for (let w = 0; w < 52; w++) {
      const daysInWeek: (CellInfo | null)[] = [];
      let weekMonthLabel = "";

      for (let d = 0; d < 7; d++) {
        const dateStr = getLocalDateString(currDate);
        const count = activityMap[dateStr] || 0;

        let level = 0;
        if (count >= 4) level = 4;
        else if (count === 3) level = 3;
        else if (count === 2) level = 2;
        else if (count === 1) level = 1;

        const m = currDate.getMonth();
        if (m !== lastMonthSeen) {
          weekMonthLabel = MONTH_NAMES[m];
          lastMonthSeen = m;
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

      if (weekMonthLabel) {
        monthLabelsList.push({ colIndex: w, label: weekMonthLabel });
      }

      weeksList.push({
        weekIndex: w,
        days: daysInWeek,
      });
    }

    return { weeks: weeksList, monthHeaders: monthLabelsList };
  }, [activityMap]);

  return (
    <div className="paper-card p-6 sm:p-7 space-y-6 border border-[var(--border-default)]">
      {/* Top Header & Streak Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-[var(--pale-sage)] px-3 py-1 text-xs font-bold text-[var(--forest-green)] rounded">
              <Activity className="h-3.5 w-3.5" />
              <span>Daily Kaizen Activity</span>
            </div>
          <h2 className="mt-2 text-xl font-black text-[var(--text-heading)] sm:text-2xl">
            Consistency & Activity Heatmap
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Opening Kaizu daily logs your habit loop. Visual record of your daily progress.
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <div className="paper-card bg-[var(--surface-secondary)] px-4 py-2 text-center border border-[var(--border-default)]">
            <div className="text-[var(--text-muted)] text-[10px] uppercase font-bold">Current Streak</div>
            <div className="text-lg font-black text-[var(--crimson)] flex items-center justify-center space-x-1.5">
              <Flame className="h-4 w-4 fill-crimson" />
              <span>{stats.currentStreak} {stats.currentStreak === 1 ? "day" : "days"}</span>
            </div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] px-4 py-2 text-center border border-[var(--border-default)]">
            <div className="text-[var(--text-muted)] text-[10px] uppercase font-bold">Longest Streak</div>
            <div className="text-lg font-black text-[var(--text-heading)] flex items-center justify-center space-x-1.5">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
              <span>{stats.longestStreak} {stats.longestStreak === 1 ? "day" : "days"}</span>
            </div>
          </div>

          <div className="paper-card bg-[var(--surface-secondary)] px-4 py-2 text-center border border-[var(--border-default)]">
            <div className="text-[var(--text-muted)] text-[10px] uppercase font-bold">Active Days</div>
            <div className="text-lg font-black text-[var(--forest-green)] flex items-center justify-center space-x-1.5">
              <Calendar className="h-4 w-4" />
              <span>{stats.totalActiveDays}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative">
        {/* Tooltip Header / Dynamic Indicator */}
        <div className="h-6 flex items-center justify-between text-xs mb-2">
          <div className="font-bold text-[var(--text-heading)] transition-all">
            {hoveredCell ? (
              <span className="inline-flex items-center space-x-2">
                <span className="bg-[var(--pale-sage)] px-2.5 py-0.5 text-xs text-[var(--forest-green)] font-extrabold rounded">
                  {hoveredCell.count > 0 ? `${hoveredCell.count} ${hoveredCell.count === 1 ? "activity" : "activities"}` : "No activity"}
                </span>
                <span className="text-[var(--text-muted)]">on {hoveredCell.formattedDate}</span>
              </span>
            ) : (
              <span className="text-[var(--text-muted)] italic">Hover over any day to see details</span>
            )}
          </div>
        </div>

        {/* Scrollable Heatmap Table */}
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="inline-block min-w-max">
            {/* Month Labels Header Row */}
            <div className="flex text-[10px] font-bold text-[var(--text-muted)] mb-1 pl-8">
              {weeks.map((w, i) => {
                const header = monthHeaders.find((m) => m.colIndex === i);
                return (
                  <div key={i} className="w-[14px] text-left">
                    {header ? <span>{header.label}</span> : null}
                  </div>
                );
              })}
            </div>

            {/* Grid Body with Day Labels on Left */}
            <div className="flex">
              {/* Day Labels Column */}
              <div className="flex flex-col justify-between text-[10px] font-bold text-[var(--text-muted)] pr-2 select-none h-[98px]">
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
                      return (
                        <div
                          key={cell.dateStr}
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`activity-cell activity-level-${cell.level}`}
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
        <div className="mt-4 pt-3 border-t border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between text-xs gap-3">
          <div className="text-[var(--text-muted)] text-xs font-medium inline-flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span><strong className="text-[var(--text-heading)]">Daily Kaizen Tip:</strong> Visiting the site every day turns small daily steps into long-term mastery.</span>
          </div>

          {/* Color Legend */}
          <div className="flex items-center space-x-2 text-[11px] font-bold text-[var(--text-muted)]">
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
  );
};
