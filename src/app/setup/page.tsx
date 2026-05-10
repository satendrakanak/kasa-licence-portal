import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { setupAdminAction } from "@/app/actions";
import { getCurrentAdmin, hasAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await getCurrentAdmin()) redirect("/dashboard");
  if (await hasAdminUser()) redirect("/login");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#14532d_0%,#020617_36%,#020617_100%)] px-6 py-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-emerald-950/30">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/30 px-4 py-2 text-xs font-bold uppercase tracking-[0.35em] text-emerald-300">
            <ShieldCheck size={16} /> Secure Setup
          </p>
          <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-white">
            Create the licence command center.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
            This portal will manage products, buyers, license keys, activations,
            expiry windows, and audit trails for Kasa Enterprise and future products.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            {["Multiple products", "Activation limits", "Buyer records", "API verification"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                {item}
              </div>
            ))}
          </div>
        </div>

        <form action={setupAdminAction} className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">First Admin</p>
          <h2 className="mt-3 text-3xl font-semibold">Set up your account</h2>
          <div className="mt-8 space-y-5">
            <label className="block text-sm font-medium text-slate-200">
              Name
              <input name="name" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-emerald-400/30 focus:ring-4" />
            </label>
            <label className="block text-sm font-medium text-slate-200">
              Email
              <input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-emerald-400/30 focus:ring-4" />
            </label>
            <label className="block text-sm font-medium text-slate-200">
              Password
              <input name="password" type="password" minLength={8} required className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none ring-emerald-400/30 focus:ring-4" />
            </label>
          </div>
          <button className="mt-8 w-full rounded-2xl bg-emerald-400 px-5 py-4 font-semibold text-slate-950 transition hover:bg-emerald-300">
            Create portal
          </button>
        </form>
      </section>
    </main>
  );
}
