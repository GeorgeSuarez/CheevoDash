import { NextResponse } from "next/server";
import { and, asc, eq, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { globalGameSnapshots } from "@/lib/db/schema";
import { buildCommunitySeries } from "@/lib/series";
import type { DateRange } from "@/lib/types";

const RANGE_DAYS: Record<DateRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};
const VALID_RANGES: DateRange[] = ["7d", "30d", "90d", "1y"];

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const appIdParam = searchParams.get("appId");
  const appId = appIdParam ? Number(appIdParam) : NaN;
  if (!Number.isFinite(appId) || appId <= 0) {
    return NextResponse.json({ error: "Invalid appId" }, { status: 400 });
  }

  const rangeParam = searchParams.get("range") ?? "30d";
  if (!VALID_RANGES.includes(rangeParam as DateRange)) {
    return NextResponse.json(
      { error: `Invalid range: ${rangeParam}` },
      { status: 400 },
    );
  }
  const range = rangeParam as DateRange;

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - RANGE_DAYS[range]);
  const startISO = startDate.toISOString().slice(0, 10);

  try {
    const rows = await getDb()
      .select({
        date: globalGameSnapshots.date,
        avgCompletion: globalGameSnapshots.avgCompletion,
      })
      .from(globalGameSnapshots)
      .where(
        and(
          eq(globalGameSnapshots.appId, appId),
          gte(globalGameSnapshots.date, startISO),
        ),
      )
      .orderBy(asc(globalGameSnapshots.date));

    if (rows.length < 2) {
      return NextResponse.json({ points: null });
    }

    const points = buildCommunitySeries(rows, range, today);
    return NextResponse.json({ points });
  } catch (err) {
    console.error("Failed to fetch community trend:", err);
    return NextResponse.json(
      { error: "Failed to fetch community trend" },
      { status: 500 },
    );
  }
}
