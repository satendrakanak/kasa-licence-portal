import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

type PortalLayoutProps = {
  children: ReactNode;
};

export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <DashboardHeader />
      <div className="mx-auto max-w-[1500px] space-y-5 px-5 py-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
