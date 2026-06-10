import { APP_URL, type MailMessage } from "@/lib/mail";

// Brand palette (inline styles — email clients ignore <style>/external CSS).
const C = { ink: "#1e3a2c", text: "#48594f", muted: "#869389", line: "#e2efe6", primary: "#33ab6c", accent: "#f5872e", bg: "#f1f9f3", soft: "#e4f5ea" };

function layout(heading: string, body: string, cta?: { label: string; href: string }) {
  return `
  <div style="background:${C.bg};padding:28px 0;font-family:Inter,Arial,Helvetica,sans-serif;color:${C.text}">
    <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid ${C.line};border-radius:16px;overflow:hidden">
      <div style="padding:20px 28px;border-bottom:1px solid ${C.line};font-weight:800;font-size:18px;color:${C.ink}">
        Mining<span style="color:${C.accent}">Gear</span>
      </div>
      <div style="padding:26px 28px">
        <h1 style="margin:0 0 14px;font-size:20px;color:${C.ink}">${heading}</h1>
        ${body}
        ${cta ? `<div style="margin:24px 0 6px"><a href="${cta.href}" style="display:inline-block;background:${C.primary};color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px">${cta.label}</a></div>` : ""}
      </div>
      <div style="padding:16px 28px;border-top:1px solid ${C.line};color:${C.muted};font-size:12px">
        MiningGear — B2B marketplace for used Bitcoin mining hardware &amp; sites.
      </div>
    </div>
  </div>`;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:7px 0;color:${C.muted};font-size:13px;width:42%">${label}</td><td style="padding:7px 0;color:${C.ink};font-weight:600;font-size:13px">${value}</td></tr>`;
}

type DealInfo = {
  sellerEmail: string;
  sellerName: string;
  buyerCompany: string;
  buyerEmail: string;
  listingTitle: string;
  listingId: string;
  intentQty: number;
  targetPrice: number;
  deliverTo: string;
  message: string;
};

export function dealRequestSellerEmail(d: DealInfo): MailMessage {
  const price = d.targetPrice > 0 ? `$${d.targetPrice.toLocaleString()}` : "Price on ask";
  const body = `
    <p style="margin:0 0 14px">Hi ${d.sellerName || "there"}, you have a new deal request on your listing:</p>
    <p style="margin:0 0 12px;font-weight:600;color:${C.ink}">${d.listingTitle}</p>
    <table style="width:100%;border-collapse:collapse;margin:6px 0 4px">
      ${row("From", `${d.buyerCompany} (${d.buyerEmail})`)}
      ${row("Quantity", String(d.intentQty))}
      ${row("Target price", price)}
      ${row("Deliver to", d.deliverTo || "—")}
      ${d.message ? row("Message", d.message) : ""}
    </table>`;
  return {
    to: d.sellerEmail,
    subject: `New deal request: ${d.listingTitle}`,
    html: layout("You have a new deal request", body, { label: "Open in dashboard", href: `${APP_URL}/dashboard?tab=requests` }),
    text: `New deal request on "${d.listingTitle}" from ${d.buyerCompany} (${d.buyerEmail}). Qty ${d.intentQty}, target ${price}, deliver to ${d.deliverTo || "—"}. ${d.message}`.trim(),
  };
}

export function dealRequestBuyerEmail(d: DealInfo): MailMessage {
  const body = `
    <p style="margin:0 0 14px">Thanks ${d.buyerCompany || "there"} — your deal request has been sent to the seller. We'll notify you when they respond.</p>
    <p style="margin:0 0 6px;font-weight:600;color:${C.ink}">${d.listingTitle}</p>
    <p style="margin:0;color:${C.muted};font-size:13px">Qty ${d.intentQty} · ${d.targetPrice > 0 ? `$${d.targetPrice.toLocaleString()}` : "Price on ask"} · ${d.deliverTo || "—"}</p>`;
  return {
    to: d.buyerEmail,
    subject: `Deal request sent: ${d.listingTitle}`,
    html: layout("Your deal request was sent", body, { label: "Track this request", href: `${APP_URL}/dashboard?tab=requests` }),
    text: `Your deal request for "${d.listingTitle}" was sent to the seller.`,
  };
}
