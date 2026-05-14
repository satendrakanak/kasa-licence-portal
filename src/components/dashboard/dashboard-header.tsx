"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions";

export function DashboardHeader() {
  const pathname = usePathname();
  const linkClass = (href: string) => {
    const active = href === "/dashboard" ? pathname === href : pathname?.startsWith(href);
    return [
      "rounded-xl border px-3 py-2 text-sm transition",
      active
        ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
        : "border-white/10 text-slate-200 hover:bg-white/10",
    ].join(" ");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/dashboard" className="w-fit">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
            KASA Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Admin control workspace
          </h1>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard"
            className={linkClass("/dashboard")}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/leads"
            className={linkClass("/dashboard/leads")}
          >
            Leads
          </Link>
          <Link
            href="/dashboard/licenses"
            className={linkClass("/dashboard/licenses")}
          >
            Licenses
          </Link>
          <Link
            href="/dashboard/modules"
            className={linkClass("/dashboard/modules")}
          >
            Module management
          </Link>
          <Link
            href="/account/password"
            className={linkClass("/account/password")}
          >
            Change password
          </Link>
          <form action={logoutAction}>
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
              <LogOut size={16} /> Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
