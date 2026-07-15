import { redirect } from "next/navigation";
import { GamesView } from "@/components/dashboard/games-view";
import { getDashboardData } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getDashboardData({
    steamId: session.steamId,
    filter: "all",
    range: "30d",
  });

  return (
    <GamesView
      games={data.games}
      user={data.user}
    />
  );
}
