import { redirect } from "next/navigation";
import { getFriendsData } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";
import { FriendsView } from "@/components/dashboard/friends-view";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { friends, error, hiddenCount } = await getFriendsData(session.steamId);
  return <FriendsView friends={friends} error={error} hiddenCount={hiddenCount} />;
}
