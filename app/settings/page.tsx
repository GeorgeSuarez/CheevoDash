import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPreferences } from "@/lib/settings";
import { getGamesData } from "@/lib/dashboard";
import { SettingsView } from "@/components/dashboard/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const [prefs, gamesData] = await Promise.all([
    getPreferences(session.steamId),
    getGamesData({ steamId: session.steamId }),
  ]);

  return (
    <SettingsView
      initialPrefs={prefs}
      games={gamesData.games.map((g) => ({ appId: g.appId, name: g.name }))}
    />
  );
}
