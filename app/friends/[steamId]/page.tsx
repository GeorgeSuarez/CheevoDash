import { redirect, notFound } from "next/navigation";
import { getDashboardData, getFriendsData } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";
import { FriendCompareView } from "@/components/dashboard/friend-compare-view";

export const dynamic = "force-dynamic";

export default async function FriendComparePage({
  params,
}: {
  params: Promise<{ steamId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { steamId: friendSteamId } = await params;
  if (!friendSteamId || friendSteamId === session.steamId) {
    notFound();
  }

  const [yourData, friendData, { friends }] = await Promise.all([
    getDashboardData({ steamId: session.steamId, filter: "all", range: "30d" }),
    getDashboardData({ steamId: friendSteamId, filter: "all", range: "30d" }),
    getFriendsData(session.steamId),
  ]);

  const friendInfo = friends.find((f) => f.steamId === friendSteamId);

  return (
    <FriendCompareView
      yourData={yourData}
      friendData={friendData}
      friendInfo={friendInfo}
    />
  );
}
