import { redirect, notFound } from "next/navigation";
import { getGameAchievements } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";
import { AchievementList } from "@/components/dashboard/achievement-list";

export const dynamic = "force-dynamic";

export default async function GameAchievementsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { appId: appIdStr } = await params;
  const appId = Number(appIdStr);

  if (!Number.isFinite(appId) || appId <= 0) {
    notFound();
  }

  const data = await getGameAchievements(session.steamId, appId);
  return <AchievementList data={data} />;
}
