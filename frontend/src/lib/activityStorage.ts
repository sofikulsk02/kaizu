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

const STORAGE_KEY = "kaizu_activity_records";

export function getActivityMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    // Starting completely fresh from today!
    const todayStr = getLocalDateString();
    const initialMap = { [todayStr]: 1 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMap));
    return initialMap;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const todayStr = getLocalDateString();
    const initialMap = { [todayStr]: 1 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMap));
    return initialMap;
  }
}

export function recordTodayActivity(incrementBy: number = 1): Record<string, number> {
  if (typeof window === "undefined") return {};

  const map = getActivityMap();
  const todayStr = getLocalDateString();
  const currentCount = map[todayStr] || 0;
  
  map[todayStr] = currentCount + incrementBy;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  return map;
}

export function resetActivityHistory(): Record<string, number> {
  if (typeof window === "undefined") return {};

  const todayStr = getLocalDateString();
  const freshMap = { [todayStr]: 1 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(freshMap));
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

const REFLECTIONS_KEY = "kaizu_daily_reflections";

export function getTodayReflection(): DailyReflection | null {
  if (typeof window === "undefined") return null;
  const todayStr = getLocalDateString();
  try {
    const raw = localStorage.getItem(REFLECTIONS_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, DailyReflection>;
    return all[todayStr] || null;
  } catch {
    return null;
  }
}

export function saveDailyReflection(reflection: {
  wentWell: string;
  difficulty: string;
  changeTomorrow: string;
}): DailyReflection {
  const todayStr = getLocalDateString();
  const entry: DailyReflection = {
    date: todayStr,
    wentWell: reflection.wentWell.trim(),
    difficulty: reflection.difficulty.trim(),
    changeTomorrow: reflection.changeTomorrow.trim(),
    savedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(REFLECTIONS_KEY);
      const all: Record<string, DailyReflection> = raw ? JSON.parse(raw) : {};
      all[todayStr] = entry;
      localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(all));
    } catch (e) {}

    // Record activity on the heatmap
    recordTodayActivity(1);
  }

  return entry;
}
