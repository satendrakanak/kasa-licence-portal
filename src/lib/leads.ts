import { prisma } from "@/lib/prisma";
import { getLeadNotificationAddress, hasLeadEmailConfig, sendEmail } from "@/lib/email";

type LeadInput = {
  name: string;
  email: string;
  institute?: string;
  phone?: string;
  message: string;
  source?: string;
};

export async function getDefaultLeadAssignee() {
  return prisma.adminUser.findFirst({
    orderBy: { createdAt: "asc" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function nl2br(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

function humanizeLeadSource(source: string) {
  const sourceMap: Record<string, string> = {
    "hero-demo-modal": "Hero demo modal",
    "header-signup-modal": "Header sign-up modal",
    "page-query-form": "Bottom query form",
    "kasa-marketing-site": "Marketing site form",
    debug: "Debug submit",
  };

  return sourceMap[source] ?? source.replaceAll("-", " ");
}

function emailShell(content: string) {
  return `
    <div style="margin:0;padding:32px 16px;background:#020617;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
      <div style="max-width:640px;margin:0 auto;overflow:hidden;border:1px solid rgba(255,255,255,0.08);border-radius:28px;background:linear-gradient(180deg,#0b1731 0%,#081224 100%);box-shadow:0 24px 80px rgba(0,0,0,0.35);">
        <div style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08);background:linear-gradient(135deg,rgba(88,201,138,0.18),rgba(11,23,49,0));">
          <div style="display:inline-block;padding:8px 14px;border:1px solid rgba(88,201,138,0.28);border-radius:999px;background:rgba(88,201,138,0.1);font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8ee7a6;">
            KASA
          </div>
        </div>
        <div style="padding:32px 28px;">
          ${content}
        </div>
      </div>
    </div>
  `;
}

function customerLeadEmailHtml(lead: {
  name: string;
}) {
  return emailShell(`
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8ee7a6;">
      Query received
    </p>
    <h1 style="margin:0 0 14px;font-size:32px;line-height:1.2;color:#ffffff;">
      Thanks for reaching out, ${escapeHtml(lead.name)}.
    </h1>
    <p style="margin:0 0 22px;font-size:16px;line-height:1.8;color:#cbd5e1;">
      We have received your KASA query. Our team will review your requirement and get back to you with the right next step.
    </p>
    <div style="margin:0 0 24px;padding:18px 20px;border-radius:20px;background:linear-gradient(135deg,rgba(88,201,138,0.14),rgba(255,255,255,0.04));">
      <p style="margin:0;font-size:15px;line-height:1.8;color:#dbeafe;">
        Expect a response from <strong style="color:#ffffff;">hello@getkasa.in</strong> after our team reviews your query.
      </p>
    </div>
    <p style="margin:0;font-size:14px;line-height:1.8;color:#94a3b8;">
      KASA helps academies run websites, LMS delivery, live classes, and operations in one clean system.
    </p>
  `);
}

function internalLeadEmailHtml(lead: {
  name: string;
  email: string;
  institute: string | null;
  phone: string | null;
  source: string;
  message: string;
  assignedToName: string;
}) {
  return emailShell(`
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#8ee7a6;">
      New inbound lead
    </p>
    <h1 style="margin:0 0 14px;font-size:30px;line-height:1.2;color:#ffffff;">
      ${escapeHtml(lead.name)} submitted a new query.
    </h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.8;color:#cbd5e1;">
      A new lead has been captured from the KASA marketing site and is ready for follow-up.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:separate;border-spacing:0 10px;">
      ${[
        ["Email", lead.email],
        ["Institute", lead.institute ?? "Not provided"],
        ["Phone", lead.phone ?? "Not provided"],
        ["Assigned to", lead.assignedToName],
        ["Source", humanizeLeadSource(lead.source)],
      ]
        .map(
          ([label, value]) => `
            <tr>
              <td style="padding:16px 18px;border:1px solid rgba(255,255,255,0.08);border-radius:18px;background:rgba(255,255,255,0.04);">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">
                  ${escapeHtml(label)}
                </p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:#f8fafc;">
                  ${escapeHtml(value)}
                </p>
              </td>
            </tr>
          `,
        )
        .join("")}
    </table>
    <div style="margin-top:4px;padding:20px;border:1px solid rgba(255,255,255,0.08);border-radius:20px;background:rgba(255,255,255,0.04);">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#94a3b8;">
        Lead message
      </p>
      <p style="margin:0;font-size:15px;line-height:1.8;color:#f8fafc;">
        ${nl2br(lead.message)}
      </p>
    </div>
  `);
}

export async function createInboundLead(input: LeadInput) {
  const assignedTo = await getDefaultLeadAssignee();
  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      institute: input.institute || null,
      phone: input.phone || null,
      message: input.message,
      source: input.source || "marketing-site",
      assignedToId: assignedTo?.id ?? null,
    },
    include: {
      assignedTo: true,
    },
  });

  let emailedAt: Date | null = null;
  if (hasLeadEmailConfig()) {
    const internalRecipients = [
      getLeadNotificationAddress(),
      assignedTo?.email ?? null,
    ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

    if (internalRecipients.length > 0) {
      await sendEmail({
        to: internalRecipients,
        subject: `New KASA lead: ${lead.name}`,
        html: internalLeadEmailHtml({
          name: lead.name,
          email: lead.email,
          institute: lead.institute,
          phone: lead.phone,
          source: lead.source,
          message: lead.message,
          assignedToName: lead.assignedTo?.name ?? "Unassigned",
        }),
        text: [
          "New lead submitted from the KASA website",
          `Name: ${lead.name}`,
          `Email: ${lead.email}`,
          `Institute: ${lead.institute ?? "Not provided"}`,
          `Phone: ${lead.phone ?? "Not provided"}`,
          `Assigned to: ${lead.assignedTo?.name ?? "Unassigned"}`,
          `Source: ${lead.source}`,
          `Message: ${lead.message}`,
        ].join("\n"),
      });
    }

    await sendEmail({
      to: [lead.email],
      subject: "We received your KASA query",
      html: customerLeadEmailHtml({
        name: lead.name,
      }),
      text: [
        "Thanks for reaching out to KASA.",
        "We received your query and our team will review it shortly.",
        "Our team will get back to you from hello@getkasa.in.",
      ].join("\n"),
    });

    emailedAt = new Date();
  }

  if (emailedAt) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { emailedAt },
    });
  }

  return lead;
}
