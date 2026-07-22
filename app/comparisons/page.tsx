import { redirect } from "next/navigation";
import { ComparisonsView } from "@/components/dashboard/comparisons-view";
import { getDashboardData } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ComparisonsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getDashboardData({
    steamId: session.steamId,
    filter: "all",
    range: "30d",
  });

  return <ComparisonsView initialData={data} />;
}
