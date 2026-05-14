import { LicenseStatus } from "@prisma/client";
import { hasEmailConfig, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

function daysUntil(date: Date) {
  const ms = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function renewalEmailHtml(input: {
  buyerName: string | null;
  productName: string;
  edition: string;
  expiresAt: Date;
  renewalUrl: string | null;
}) {
  const daysLeft = daysUntil(input.expiresAt);
  const cta = input.renewalUrl
    ? `<p style="margin:24px 0"><a href="${input.renewalUrl}" style="background:#059669;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">Renew license</a></p>`
    : "";

  return `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="margin:0 0 12px">Your KASA license expires soon</h2>
      <p>Hi ${input.buyerName || "there"},</p>
      <p>Your ${input.productName} ${input.edition} license will expire in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.</p>
      <p>Please renew before ${input.expiresAt.toDateString()} to avoid interruption in your KASA installation.</p>
      ${cta}
      <p>If you have already renewed, you can ignore this email.</p>
      <p>Team KASA</p>
    </div>
  `;
}

export async function sendExpiryNotifications() {
  if (!hasEmailConfig()) {
    return {
      sent: 0,
      skipped: true,
      message: "Email configuration is incomplete.",
    };
  }

  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + 15);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const licenses = await prisma.license.findMany({
    where: {
      status: LicenseStatus.ACTIVE,
      expiresAt: {
        gt: now,
        lte: windowEnd,
      },
      OR: [
        { expiryNoticeLastSentAt: null },
        { expiryNoticeLastSentAt: { lt: todayStart } },
      ],
    },
    include: {
      product: true,
    },
    take: 200,
  });

  let sent = 0;

  for (const license of licenses) {
    if (!license.expiresAt) continue;

    const daysLeft = daysUntil(license.expiresAt);
    await sendEmail({
      to: [license.buyerEmail],
      subject: `KASA license expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
      html: renewalEmailHtml({
        buyerName: license.buyerName,
        productName: license.product.name,
        edition: license.edition,
        expiresAt: license.expiresAt,
        renewalUrl: license.renewalUrl,
      }),
      text: [
        `Your ${license.product.name} ${license.edition} license expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        `Expiry date: ${license.expiresAt.toISOString()}`,
        license.renewalUrl ? `Renew here: ${license.renewalUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    await prisma.license.update({
      where: { id: license.id },
      data: {
        expiryNoticeLastSentAt: new Date(),
        expiryNoticeCount: {
          increment: 1,
        },
      },
    });

    sent += 1;
  }

  return {
    sent,
    skipped: false,
  };
}
