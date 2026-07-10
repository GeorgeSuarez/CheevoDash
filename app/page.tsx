import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const initialData = await getDashboardData({
    steamId: session.steamId,
    filter: "all",
    range: "30d",
  });
  return <DashboardView initialData={initialData} />;
}
