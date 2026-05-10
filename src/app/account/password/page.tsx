import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { changePasswordAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#064e3b_0%,#020617_35%,#020617_100%)] px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-2xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
        >
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="mt-8 flex items-start gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <KeyRound size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-300">Admin Security</p>
            <h1 className="mt-2 text-4xl font-semibold">Change password</h1>
            <p className="mt-3 text-slate-400">
              Signed in as {admin.email}. Use a strong password because this portal controls customer licences.
            </p>
          </div>
        </div>

        {params.success ? (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-emerald-100">
            <ShieldCheck size={18} /> Password updated successfully.
          </div>
        ) : null}
        {params.error === "current" ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100">
            Current password is incorrect.
          </div>
        ) : null}
        {params.error === "invalid" ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100">
            Please enter a valid password and confirm both new password fields match.
          </div>
        ) : null}

        <form action={changePasswordAction} className="mt-8 grid gap-5">
          <label className="block text-sm font-medium text-slate-200">
            Current password
            <input
              name="currentPassword"
              type="password"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-emerald-400/30 focus:ring-4"
            />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            New password
            <input
              name="newPassword"
              type="password"
              minLength={8}
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-emerald-400/30 focus:ring-4"
            />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              minLength={8}
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-emerald-400/30 focus:ring-4"
            />
          </label>
          <button className="rounded-2xl bg-emerald-400 px-5 py-4 font-semibold text-slate-950 hover:bg-emerald-300">
            Update password
          </button>
        </form>
      </section>
    </main>
  );
}
