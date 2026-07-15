import type { AchievementDataPoint, DateRange } from "./types";

const RANGE_DAYS: Record<DateRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

const POINT_COUNT: Record<DateRange, number> = {
  "7d": 4,
  "30d": 11,
  "90d": 13,
  "1y": 12,
};

export function formatLabel(date: Date, range: DateRange): string {
  if (range === "1y") {
    return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function bucketDates(range: DateRange, today: Date): Date[] {
  const days = RANGE_DAYS[range];
  const pointCount = POINT_COUNT[range];
  const dates: Date[] = [];
  for (let i = 0; i < pointCount; i++) {
    const t = pointCount === 1 ? 1 : i / (pointCount - 1);
    const dayOffset = Math.round(-days + days * t);
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    dates.push(date);
  }
  return dates;
}

export function reconstructSeries(
  allUnlocktimes: number[],
  totalAchievements: number,
  communityAvg: number,
  range: DateRange,
  today: Date,
): AchievementDataPoint[] {
  const pointCount = POINT_COUNT[range];
  const sorted = [...allUnlocktimes].sort((a, b) => a - b);
  const dates = bucketDates(range, today);
  const points: AchievementDataPoint[] = [];

  for (let i = 0; i < pointCount; i++) {
    const date = dates[i];
    const bucketMs = date.getTime();
    const unlockedByNow = sorted.filter((ut) => ut * 1000 <= bucketMs).length;
    const youPercent =
      totalAchievements === 0
        ? 0
        : Math.round((unlockedByNow / totalAchievements) * 1000) / 10;

    points.push({
      date: formatLabel(date, range),
      you: Number.isNaN(youPercent) ? 0 : youPercent,
      community: Number.isNaN(communityAvg) ? 0 : communityAvg,
    });
  }

  return points;
}

export interface CommunitySnapshotRow {
  date: string;
  avgCompletion: number;
}

export function buildCommunitySeries(
  rows: CommunitySnapshotRow[],
  range: DateRange,
  today: Date,
): AchievementDataPoint[] | null {
  if (rows.length < 2) return null;
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const dates = bucketDates(range, today);
  const points: AchievementDataPoint[] = [];

  for (const date of dates) {
    const iso = date.toISOString().slice(0, 10);
    let value: number | null = null;
    for (const row of sorted) {
      if (row.date <= iso) value = row.avgCompletion / 10;
      else break;
    }
    if (value === null) value = sorted[0].avgCompletion / 10;
    points.push({
      date: formatLabel(date, range),
      you: 0,
      community: Number.isNaN(value) ? 0 : value,
    });
  }

  return points;
}
