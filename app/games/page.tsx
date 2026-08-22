import { redirect } from "next/navigation";
import { GamesView } from "@/components/dashboard/games-view";
import { getLibrarySnapshot } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { games, user } = await getLibrarySnapshot(session.steamId);

  return (
    <GamesView games={games} user={user} />
  );
}
