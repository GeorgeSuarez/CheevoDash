import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";
import type { DateRange, GameFilter } from "@/lib/types";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filterParam = searchParams.get("filter") ?? "all";
  const rangeParam = searchParams.get("range") ?? "30d";

  const filter = filterParam as GameFilter;
  const range = rangeParam as DateRange;

  const validFilters: GameFilter[] = ["all", "owned", "tracked"];
  const validRanges: DateRange[] = ["7d", "30d", "90d", "1y"];

  if (!validFilters.includes(filter)) {
    return NextResponse.json(
      { error: `Invalid filter: ${filterParam}` },
      { status: 400 },
    );
  }
  if (!validRanges.includes(range)) {
    return NextResponse.json(
      { error: `Invalid range: ${rangeParam}` },
      { status: 400 },
    );
  }

  const data = await getDashboardData({
    steamId: session.steamId,
    filter,
    range,
  });
  return NextResponse.json(data);
}
