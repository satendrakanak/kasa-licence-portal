import { LogOut } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions";

type DashboardHeaderProps = {
  adminName: string;
};

export function DashboardHeader({ adminName }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
            Kasa Licence Portal
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Product licensing workspace
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
            {adminName}
          </div>
          <Link
            href="/dashboard/leads"
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            Leads
          </Link>
          <Link
            href="/dashboard/modules"
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            Module management
          </Link>
          <Link
            href="/account/password"
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            Change password
          </Link>
          <form action={logoutAction}>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
              <LogOut size={16} /> Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
