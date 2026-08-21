import { redirect } from "next/navigation";
import { GamesView } from "@/components/dashboard/games-view";
import { getGamesData } from "@/lib/dashboard";
import { getPreferences } from "@/lib/settings";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [data, prefs] = await Promise.all([
    getGamesData({
      steamId: session.steamId,
    }),
    getPreferences(session.steamId),
  ]);

  return (
    <GamesView
      games={data.games}
      user={data.user}
      defaultSort={prefs.defaultSort}
    />
  );
}
