type LeadAlert = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  packageName?: string | null;
  category?: string | null;
  priceInr?: number | null;
  projectDetails?: string | null;
  sourceUrl?: string | null;
  sourceComponent?: string | null;
};

function formatAlert(lead: LeadAlert) {
  const packageLine = [lead.packageName, lead.category, lead.priceInr != null ? `₹${lead.priceInr}` : null]
    .filter(Boolean)
    .join(" · ");

  return [
    "New inquiry received",
    `Name: ${lead.name}`,
    lead.company ? `Company: ${lead.company}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    packageLine ? `Package: ${packageLine}` : null,
    lead.sourceUrl ? `Source: ${lead.sourceUrl}` : null,
    lead.sourceComponent ? `Component: ${lead.sourceComponent}` : null,
    lead.projectDetails ? `Details: ${lead.projectDetails}` : null,
    `Lead ID: ${lead.id}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function postJson(url: string, body: unknown) {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const LeadNotificationService = {
  async notifyNewLead(lead: LeadAlert) {
    const text = formatAlert(lead);
    const webhookUrl = process.env.LEAD_WEBHOOK_URL;
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    try {
      if (webhookUrl) {
        const isDiscord = webhookUrl.includes("discord.com") || webhookUrl.includes("discordapp.com");
        const isSlack = webhookUrl.includes("hooks.slack.com");
        if (isDiscord) {
          await postJson(webhookUrl, { content: text });
        } else if (isSlack) {
          await postJson(webhookUrl, { text });
        } else {
          await postJson(webhookUrl, { text, lead });
        }
      }

      if (telegramToken && telegramChatId) {
        await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text,
          }),
        });
      }
    } catch (error) {
      console.error("Lead notification failed", error);
    }
  },
};
