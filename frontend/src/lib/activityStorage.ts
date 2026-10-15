import { getActiveUserId } from "./api";

export interface ActivityStats {
  totalActiveDays: number;
  currentStreak: number;
  longestStreak: number;
  totalActivities: number;
}

export function getLocalDateString(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getActivityStorageKey(userId?: string | null): string {
  const uid = userId || (typeof window !== "undefined" ? getActiveUserId() : null);
  return uid ? `kaizu_activity_records_${uid}` : "kaizu_activity_records_guest";
}

export function getReflectionsStorageKey(userId?: string | null): string {
  const uid = userId || (typeof window !== "undefined" ? getActiveUserId() : null);
  return uid ? `kaizu_daily_reflections_${uid}` : "kaizu_daily_reflections_guest";
}

export function getActivityMap(userId?: string | null): Record<string, number> {
  if (typeof window === "undefined") return {};

  const key = getActivityStorageKey(userId);
  const raw = localStorage.getItem(key);

  if (!raw) {
    // Check if this specific user was assigned as the owner of legacy 5-day records
    const legacyOwner = localStorage.getItem("kaizu_legacy_activity_owner");
    const uid = userId || getActiveUserId();

    if (legacyOwner && uid === legacyOwner) {
      const legacyRaw = localStorage.getItem("kaizu_activity_records");
      if (legacyRaw) {
        try {
          const parsed = JSON.parse(legacyRaw);
          localStorage.setItem(key, JSON.stringify(parsed));
          return parsed;
        } catch {}
      }
    }

    // New/different accounts always start with a clean fresh slate for today
    const todayStr = getLocalDateString();
    const initialMap = { [todayStr]: 1 };
    localStorage.setItem(key, JSON.stringify(initialMap));
    return initialMap;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const todayStr = getLocalDateString();
    const initialMap = { [todayStr]: 1 };
    localStorage.setItem(key, JSON.stringify(initialMap));
    return initialMap;
  }
}

export function recordTodayActivity(incrementBy: number = 1, userId?: string | null): Record<string, number> {
  if (typeof window === "undefined") return {};

  const key = getActivityStorageKey(userId);
  const map = getActivityMap(userId);
  const todayStr = getLocalDateString();
  const currentCount = map[todayStr] || 0;

  map[todayStr] = currentCount + incrementBy;
  localStorage.setItem(key, JSON.stringify(map));
  return map;
}

export function resetActivityHistory(userId?: string | null): Record<string, number> {
  if (typeof window === "undefined") return {};

  const key = getActivityStorageKey(userId);
  const todayStr = getLocalDateString();
  const freshMap = { [todayStr]: 1 };
  localStorage.setItem(key, JSON.stringify(freshMap));
  return freshMap;
}

export function computeStreakStats(map: Record<string, number>): ActivityStats {
  const dates = Object.keys(map).sort();
  let totalActiveDays = 0;
  let totalActivities = 0;

  for (const d of dates) {
    if (map[d] > 0) {
      totalActiveDays++;
      totalActivities += map[d];
    }
  }

  // Compute Current Streak
  const today = new Date();
  const todayStr = getLocalDateString(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let currentStreak = 0;
  let checkDate = new Date(today);

  // If today is active, start counting from today.
  // If today is not active yet, check if yesterday was active.
  if (map[todayStr] && map[todayStr] > 0) {
    checkDate = new Date(today);
  } else if (map[yesterdayStr] && map[yesterdayStr] > 0) {
    checkDate = new Date(yesterday);
  } else {
    checkDate = null as any;
  }

  if (checkDate) {
    while (true) {
      const dStr = getLocalDateString(checkDate);
      if (map[dStr] && map[dStr] > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Compute Longest Streak
  let longestStreak = 0;
  let tempStreak = 0;

  if (dates.length > 0) {
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);

    // Iterate day by day from first date to last date
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dStr = getLocalDateString(d);
      if (map[dStr] && map[dStr] > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }
  }

  return {
    totalActiveDays,
    currentStreak,
    longestStreak,
    totalActivities,
  };
}

export interface DailyReflection {
  date: string;
  wentWell: string;
  difficulty: string;
  changeTomorrow: string;
  savedAt: string;
}

export function getTodayReflection(userId?: string | null): DailyReflection | null {
  if (typeof window === "undefined") return null;
  const todayStr = getLocalDateString();
  const key = getReflectionsStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, DailyReflection>;
    return all[todayStr] || null;
  } catch {
    return null;
  }
}

export function saveDailyReflection(
  reflection: {
    wentWell: string;
    difficulty: string;
    changeTomorrow: string;
  },
  userId?: string | null
): DailyReflection {
  const todayStr = getLocalDateString();
  const key = getReflectionsStorageKey(userId);
  const entry: DailyReflection = {
    date: todayStr,
    wentWell: reflection.wentWell.trim(),
    difficulty: reflection.difficulty.trim(),
    changeTomorrow: reflection.changeTomorrow.trim(),
    savedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(key);
      const all: Record<string, DailyReflection> = raw ? JSON.parse(raw) : {};
      all[todayStr] = entry;
      localStorage.setItem(key, JSON.stringify(all));
    } catch (e) {}

    // Record activity on the heatmap for this specific account
    recordTodayActivity(1, userId);
  }

  return entry;
}
