import { NextResponse } from "next/server";
import { getFriendsComparison } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
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

  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), 10) : 5;
  if (Number.isNaN(limit) || limit <= 0) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  try {
    const friends = await getFriendsComparison(
      session.steamId,
      appId,
      limit,
    );
    return NextResponse.json({ friends });
  } catch (err) {
    console.error("Failed to fetch friends comparison:", err);
    return NextResponse.json(
      { error: "Failed to fetch friends data" },
      { status: 500 },
    );
  }
}
