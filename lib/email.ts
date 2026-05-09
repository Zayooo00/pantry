type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export type EmailSendResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not_configured" | "send_failed"; message: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function appUrl(): string {
  const url = process.env.APP_URL?.replace(/\/$/, "");
  if (url) {
    return url;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "APP_URL is not set. Email links would point at localhost — refusing to send.",
    );
  }
  return "http://localhost:3000";
}

export async function sendEmail(args: SendArgs): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Email is not configured (RESEND_API_KEY / EMAIL_FROM missing).",
    };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        ok: false,
        reason: "send_failed",
        message: `Resend ${res.status}: ${body.slice(0, 200)}`,
      };
    }
    const json = (await res.json()) as { id?: string };
    return { ok: true, id: json.id ?? "" };
  } catch (err) {
    return {
      ok: false,
      reason: "send_failed",
      message: err instanceof Error ? err.message : "Unknown email error.",
    };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function emailLayout({
  preheader,
  body,
}: {
  preheader: string;
  body: string;
}): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Pantry</title>
  </head>
  <body style="margin:0;padding:0;background:#f7f3ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1814;">
    <span style="display:none;font-size:1px;color:#f7f3ea;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ea;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbfaf6;border:1px solid #e3dfd2;border-radius:12px;padding:32px;">
            <tr>
              <td style="font-family:Georgia,serif;font-size:22px;letter-spacing:-0.02em;font-weight:300;color:#1a1814;padding-bottom:24px;border-bottom:1px solid #e3dfd2;">
                Pantry <span style="font-family:monospace;font-size:10px;letter-spacing:0.18em;color:#7c7669;text-transform:uppercase;">&middot; EST. KITCHEN</span>
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;font-size:15px;line-height:1.55;color:#3a342d;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;border-top:1px dashed #e3dfd2;font-family:monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#7c7669;">
                Pantry &middot; A quiet inventory, kept honest.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
