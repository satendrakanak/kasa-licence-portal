import { Mail, MessageSquare, Phone, UserRound } from "lucide-react";
import { assignLeadAction, updateLeadStatusAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function humanize(value: string) {
  return value.replaceAll("-", " ");
}

export default async function LeadsDashboardPage() {
  await requireAdmin();

  const [leads, admins, totals] = await Promise.all([
    prisma.lead.findMany({
      include: { assignedTo: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.adminUser.findMany({
      orderBy: { name: "asc" },
    }),
    Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.count({ where: { status: "QUALIFIED" } }),
      prisma.lead.count({ where: { status: "WON" } }),
    ]),
  ]);

  const [allLeads, newLeads, qualifiedLeads, wonLeads] = totals;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
          Lead workspace
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Buyer enquiries and demo requests
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Review incoming leads, assign owners, and keep sales status updated
          from the shared licensing workspace.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["All leads", allLeads, "Every marketing query captured"],
          ["New", newLeads, "Needs first response or assignment"],
          ["Qualified", qualifiedLeads, "Ready for a serious demo conversation"],
          ["Won", wonLeads, "Converted or ready to close"],
        ].map(([label, value, helper]) => (
          <div key={String(label)} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-4 text-4xl font-semibold">{value}</p>
            <p className="mt-4 text-sm text-slate-500">{helper}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6"
            >
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold">{lead.name}</h2>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                      {lead.status}
                    </span>
                    {lead.emailedAt ? (
                      <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                        Email sent
                      </span>
                    ) : null}
                    <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs capitalize text-sky-200">
                      {lead.leadType}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                    <div className="inline-flex items-center gap-2">
                      <Mail size={16} className="text-emerald-300" />
                      {lead.email}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Phone size={16} className="text-emerald-300" />
                      {lead.phone || "Phone not shared"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <UserRound size={16} className="text-emerald-300" />
                      {lead.assignedTo?.name || "Unassigned"}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <MessageSquare size={16} className="text-emerald-300" />
                      {lead.institute || "Institute not shared"}
                    </div>
                  </div>

                  <p className="mt-5 rounded-3xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300">
                    {lead.message}
                  </p>

                  <div className="mt-4 grid gap-3 text-xs text-slate-400 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <span className="block font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Button
                      </span>
                      <span className="mt-1 block text-slate-200">
                        {lead.ctaLabel || "Not captured"}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <span className="block font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Source
                      </span>
                      <span className="mt-1 block capitalize text-slate-200">
                        {humanize(lead.source)}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 md:col-span-2">
                      <span className="block font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Page URL
                      </span>
                      <span className="mt-1 block break-all text-slate-200">
                        {lead.pageUrl || "Not captured"}
                      </span>
                    </div>
                    {lead.demoUrl ? (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 md:col-span-2">
                        <span className="block font-semibold uppercase tracking-[0.18em] text-emerald-300">
                          Demo access
                        </span>
                        <a
                          href={lead.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block break-all text-emerald-100 underline-offset-4 hover:underline"
                        >
                          {lead.demoUrl}
                        </a>
                        <span className="mt-1 block text-emerald-200/70">
                          Expires {lead.demoExpiresAt ? formatDate(lead.demoExpiresAt) : "after temporary access window"}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 text-xs text-slate-500">
                    Submitted {formatDate(lead.createdAt)} via {lead.source}
                  </div>
                </div>

                <div className="grid gap-4 xl:w-[320px]">
                  <form
                    action={updateLeadStatusAction}
                    className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                  >
                    <input type="hidden" name="leadId" value={lead.id} />
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                      Update status
                    </p>
                    <select
                      name="status"
                      defaultValue={lead.status}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none"
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="WON">Won</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <button className="mt-3 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300">
                      Save status
                    </button>
                  </form>

                  <form
                    action={assignLeadAction}
                    className="rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                  >
                    <input type="hidden" name="leadId" value={lead.id} />
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                      Assign owner
                    </p>
                    <select
                      name="assignedToId"
                      defaultValue={lead.assignedToId ?? ""}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none"
                    >
                      <option value="">Unassigned</option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name}
                        </option>
                      ))}
                    </select>
                    <button className="mt-3 w-full rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10">
                      Save assignment
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
      </section>
    </div>
  );
}
