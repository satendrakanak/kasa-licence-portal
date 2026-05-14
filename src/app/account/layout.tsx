import type { ReactNode } from "react";
import { PortalLayout } from "@/components/portal/portal-layout";
import { requireAdmin } from "@/lib/auth";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();

  return <PortalLayout adminName={admin.name}>{children}</PortalLayout>;
}
