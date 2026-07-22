import { redirect } from "next/navigation";
import { getAchievementsData } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";
import { AchievementsOverview } from "@/components/dashboard/achievements-overview";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getAchievementsData(session.steamId);
  return <AchievementsOverview data={data} />;
}
