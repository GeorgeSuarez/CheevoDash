import { NextResponse } from "next/server";
import { getPreferences, savePreferences } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import type { GameFilter, DateRange } from "@/lib/types";

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

  const body = (await request.json()) as {
    defaultFilter?: GameFilter;
    defaultRange?: DateRange;
  };

  const prefs = await savePreferences(session.steamId, body);
  return NextResponse.json(prefs);
}
