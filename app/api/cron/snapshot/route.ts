import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { snapshotUser } from "@/lib/dashboard";

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

    return NextResponse.json({
      ok: true,
      snapshotted: succeeded,
      failed,
      failedIds,
    });
  } catch (err) {
    console.error("Snapshot cron failed:", err);
    return NextResponse.json(
      { error: "Snapshot failed" },
      { status: 500 },
    );
  }
}
