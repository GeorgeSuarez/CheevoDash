import { redirect } from "next/navigation";
import { InsightsView } from "@/components/dashboard/insights-view";
import { getDashboardData } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getDashboardData({
    steamId: session.steamId,
    filter: "all",
    range: "30d",
  });

  return <InsightsView initialData={data} />;
}
