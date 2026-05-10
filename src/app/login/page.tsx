import { KeyRound } from "lucide-react";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions";
import { getCurrentAdmin, hasAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasAdminUser())) redirect("/setup");
  if (await getCurrentAdmin()) redirect("/dashboard");
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#064e3b_0%,#020617_35%,#020617_100%)] px-6">
      <form action={loginAction} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-2xl">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <KeyRound size={28} />
        </div>
        <h1 className="mt-6 text-center text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-center text-slate-400">Sign in to manage products and licenses.</p>
        {params.error ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Invalid email or password.
          </div>
        ) : null}
        <div className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-slate-200">
            Email
            <input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-emerald-400/30 focus:ring-4" />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Password
            <input name="password" type="password" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-emerald-400/30 focus:ring-4" />
          </label>
        </div>
        <button className="mt-8 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-semibold text-slate-950 transition hover:bg-emerald-300">
          Sign in
        </button>
      </form>
    </main>
  );
}
