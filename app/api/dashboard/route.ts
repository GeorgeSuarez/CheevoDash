import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";
import type { GameFilter } from "@/lib/types";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filterParam = searchParams.get("filter") ?? "all";

  const filter = filterParam as GameFilter;

  const validFilters: GameFilter[] = ["all", "owned", "tracked"];

  if (!validFilters.includes(filter)) {
    return NextResponse.json(
      { error: `Invalid filter: ${filterParam}` },
      { status: 400 },
    );
  }

  const data = await getDashboardData({
    steamId: session.steamId,
    filter,
  });
  return NextResponse.json(data);
}
