import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { trackedGames } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const appId = body?.appId;
  if (typeof appId !== "number" || appId <= 0) {
    return NextResponse.json({ error: "Invalid appId" }, { status: 400 });
  }

  try {
    await db
      .insert(trackedGames)
      .values({ steamId: session.steamId, appId })
      .onConflictDoNothing();
    return NextResponse.json({ tracked: true, appId });
  } catch (err) {
    console.error("Failed to track game:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const appIdParam = searchParams.get("appId");
  const appId = appIdParam ? Number(appIdParam) : NaN;
  if (Number.isNaN(appId) || appId <= 0) {
    return NextResponse.json({ error: "Invalid appId" }, { status: 400 });
  }

  try {
    await db
      .delete(trackedGames)
      .where(
        and(
          eq(trackedGames.steamId, session.steamId),
          eq(trackedGames.appId, appId),
        ),
      );
    return NextResponse.json({ tracked: false, appId });
  } catch (err) {
    console.error("Failed to untrack game:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
