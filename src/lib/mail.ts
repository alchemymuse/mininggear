// Mail abstraction. With RESEND_API_KEY set, sends via Resend's REST API
// (no SDK needed). Without it, logs to the console so dev works out of the box.

export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export const APP_URL = process.env.APP_URL || "http://localhost:3000";

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function sendMail(msg: MailMessage): Promise<{ ok: boolean; dev?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "MiningGear <onboarding@resend.dev>";

  if (!apiKey) {
    // Dev transport: print the email instead of sending.
    console.log("\n────────── ✉️  [dev email] ──────────");
    console.log("To:     ", msg.to);
    console.log("Subject:", msg.subject);
    console.log(msg.text || stripHtml(msg.html));
    console.log("──────────────────────────────────────\n");
    return { ok: true, dev: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
    });
    if (!res.ok) {
      console.error("[mail] Resend error:", await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[mail] send failed:", e);
    return { ok: false };
  }
}
