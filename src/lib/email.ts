type EmailPayload = {
  to: string[];
  subject: string;
  html: string;
  text: string;
};

function getLeadEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.LEADS_FROM_EMAIL,
    notify: process.env.LEADS_NOTIFICATION_EMAIL,
  };
}

export function hasLeadEmailConfig() {
  const config = getLeadEmailConfig();
  return Boolean(config.apiKey && config.from && config.notify);
}

export function hasEmailConfig() {
  const config = getLeadEmailConfig();
  return Boolean(config.apiKey && config.from);
}

export async function sendEmail(payload: EmailPayload) {
  const config = getLeadEmailConfig();
  if (!config.apiKey || !config.from) {
    throw new Error("Lead email configuration is incomplete.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Email request failed: ${details}`);
  }
}

export function getLeadNotificationAddress() {
  return process.env.LEADS_NOTIFICATION_EMAIL ?? null;
}
