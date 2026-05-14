import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ newKey?: string }>;
}) {
  const params = await searchParams;
  if (params.newKey) {
    redirect("/dashboard");
  }

  const data = await getDashboardData();

  return <DashboardShell data={data} />;
}
