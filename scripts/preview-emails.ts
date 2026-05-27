// Dev helper: renders the booking e-mails to a single HTML page so we can eyeball
// the templates without sending anything. Run: `npm run mail:preview`.
// Writes email-preview.html in the project root (gitignored) — open it in a browser.
import { config } from "dotenv";
config();

process.env.RESEND_API_KEY = "re_preview_dummy";
process.env.MAIL_FROM = "Náhľad <preview@example.com>";
process.env.DESIGN_SEED = process.env.DESIGN_SEED || "masaze";

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const captured: { subject: string; html: string; to: string }[] = [];

// Intercept the Resend API call and capture the payload instead of sending.
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
  const url = String(input);
  if (url.includes("api.resend.com") && init?.body) {
    const payload = JSON.parse(String(init.body));
    captured.push({ subject: payload.subject, html: payload.html, to: payload.to });
    return new Response(JSON.stringify({ id: "preview" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return realFetch(input, init);
}) as typeof fetch;

async function main() {
  const mail = await import("../src/lib/mail");
  const booking = {
    serviceName: "Klasická masáž chrbta a šije",
    date: "2026-06-03",
    startTime: "10:00",
    endTime: "11:00",
    durationMin: 60,
    priceEur: 35,
    customerName: "Jana Veselá",
    customerEmail: "jana@example.com",
    customerPhone: "+421 901 234 567",
    note: "Bolieva ma najmä ľavé rameno, prosím viac sa zamerať naň.",
  };

  await mail.sendBookingRequested(booking); // owner + customer ack
  await mail.sendBookingConfirmed(booking); // customer confirmation
  await mail.sendBookingCancelled(booking); // customer cancellation

  const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const cards = captured
    .map(
      (c) => `
      <section style="margin:0 auto 40px;max-width:620px;">
        <p style="margin:0 0 8px;font:600 13px system-ui;color:#555;">
          → ${c.to} &nbsp;·&nbsp; <strong>${c.subject}</strong>
        </p>
        <iframe srcdoc="${escAttr(c.html)}" style="width:100%;height:760px;border:1px solid #ccc;border-radius:12px;background:#fff;"></iframe>
      </section>`,
    )
    .join("");

  const page = `<!doctype html><html lang="sk"><head><meta charset="utf-8"><title>Náhľad e-mailov</title></head>
    <body style="margin:0;padding:32px 16px;background:#e9e4dc;font-family:system-ui;">
      <h1 style="text-align:center;font:600 20px system-ui;color:#333;">Náhľad e-mailových šablón (${captured.length})</h1>
      ${cards}
    </body></html>`;

  const out = join(process.cwd(), "email-preview.html");
  writeFileSync(out, page, "utf8");
  console.log(`Zachytených e-mailov: ${captured.length}`);
  for (const c of captured) console.log(`  • ${c.subject}  →  ${c.to}`);
  console.log(`Náhľad zapísaný: ${out}`);
  console.log("Otvor súbor email-preview.html v prehliadači.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
