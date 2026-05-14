import type { ReactNode } from "react";
import { PortalLayout } from "@/components/portal/portal-layout";
import { requireAdmin } from "@/lib/auth";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return <PortalLayout>{children}</PortalLayout>;
}
