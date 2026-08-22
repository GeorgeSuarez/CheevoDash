import { NextResponse } from "next/server";
import { getPreferences, savePreferences } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { DASHBOARD_FILTERS } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const prefs = await getPreferences(session.steamId);
  return NextResponse.json(prefs);
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const requested = DASHBOARD_FILTERS.find((key) => key === body?.defaultFilter);
  if (!requested && body?.defaultFilter != null) {
    return NextResponse.json(
      { error: `Invalid defaultFilter: ${String(body.defaultFilter)}` },
      { status: 400 },
    );
  }

  const prefs = await savePreferences(
    session.steamId,
    requested ? { defaultFilter: requested } : {},
  );
  return NextResponse.json(prefs);
}
