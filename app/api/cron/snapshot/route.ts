import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { globalGameSnapshots, trackedGames, users } from "@/lib/db/schema";
import { meanGlobalPercent, snapshotUser } from "@/lib/dashboard";
import { getGlobalAchievementPercentages } from "@/lib/steam";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allUsers = await getDb().select({ steamId: users.steamId }).from(users);
    let succeeded = 0;
    let failed = 0;
    const failedIds: string[] = [];
    for (const user of allUsers) {
      try {
        await snapshotUser(user.steamId);
        succeeded++;
      } catch (userErr) {
        failed++;
        failedIds.push(user.steamId);
        console.error(`Snapshot failed for ${user.steamId}:`, userErr);
      }
    }
    const today = new Date().toISOString().slice(0, 10);
    const trackedRows = await getDb()
      .select({ appId: trackedGames.appId })
      .from(trackedGames);
    const trackedAppIds = Array.from(
      new Set(trackedRows.map((r) => r.appId)),
    ).slice(0, 500);

    let globalSucceeded = 0;
    let globalFailed = 0;
    for (const appId of trackedAppIds) {
      try {
        const percentages = await getGlobalAchievementPercentages(appId);
        const mean = meanGlobalPercent(percentages);
        if (mean <= 0) continue;
        await getDb()
          .insert(globalGameSnapshots)
          .values({
            appId,
            date: today,
            avgCompletion: Math.round(mean * 10),
          })
          .onConflictDoNothing();
        globalSucceeded++;
      } catch (globalErr) {
        globalFailed++;
        console.error(`Global snapshot failed for ${appId}:`, globalErr);
      }
    }

    return NextResponse.json({
      ok: true,
      snapshotted: succeeded,
      failed,
      failedIds,
      globalSnapshotted: globalSucceeded,
      globalFailed,
    });
  } catch (err) {
    console.error("Snapshot cron failed:", err);
    return NextResponse.json(
      { error: "Snapshot failed" },
      { status: 500 },
    );
  }
}
