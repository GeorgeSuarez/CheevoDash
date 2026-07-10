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
    for (const user of allUsers) {
      await snapshotUser(user.steamId);
    }
    return NextResponse.json({
      ok: true,
      snapshotted: allUsers.length,
    });
  } catch (err) {
    console.error("Snapshot cron failed:", err);
    return NextResponse.json(
      { error: "Snapshot failed" },
      { status: 500 },
    );
  }
}
