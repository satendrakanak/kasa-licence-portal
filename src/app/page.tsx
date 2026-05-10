import { redirect } from "next/navigation";
import { getCurrentAdmin, hasAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await hasAdminUser())) redirect("/setup");
  if (await getCurrentAdmin()) redirect("/dashboard");
  redirect("/login");
}
