import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPreferences } from "@/lib/settings";
import { SettingsView } from "@/components/dashboard/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const prefs = await getPreferences(session.steamId);
  return <SettingsView initialPrefs={prefs} />;
}
