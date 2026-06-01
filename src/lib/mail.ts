import { Resend } from "resend";
import { getSettings } from "@/lib/settings";
import { getTheme } from "@/lib/theme";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/format";

// E-mail notifications are best-effort: a failure here must never break the
// booking flow. Everything is wrapped so callers can `await` without try/catch.
//
// Sending is enabled only when both RESEND_API_KEY and MAIL_FROM are set, so
// the whole site keeps working locally without any e-mail configuration.
//
// The templates mirror the live site: colours AND fonts are pulled from the
// active design seed (so the e-mails re-skin themselves when the seed changes).
// The web fonts are embedded for clients that support them (Apple Mail, iOS)
// with a tasteful fallback for those that don't (Gmail, Outlook). Each message
// type has its own status header — a coloured band with an icon medallion — so
// "prijatá", "potvrdená" and "zrušená" are distinguished by more than a colour.

export interface BookingEmailData {
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  priceEur: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  note?: string | null;
}

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) return null;
  return new Resend(key);
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

async function send(client: Resend, args: SendArgs): Promise<void> {
  try {
    const { error } = await client.emails.send({
      from: process.env.MAIL_FROM as string,
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });
    if (error) {
      console.error("[mail] odoslanie zlyhalo:", error);
    }
  } catch (err) {
    console.error("[mail] neočakávaná chyba pri odosielaní:", err);
  }
}

// ---------------------------------------------------------------------------
// Palette — derived from the active design seed, converted to hex so it renders
// reliably everywhere (Outlook does not understand hsl()).
// ---------------------------------------------------------------------------

interface Palette {
  cream: string;
  sand: string;
  sandDark: string;
  bark: string;
  stone: string;
  clay: string;
  clayDark: string;
  clayTint: string;
  sage: string;
  sageDark: string;
  sageTint: string;
  // Fixed semantic "danger" red for cancellations — warm and muted so it reads
  // clearly negative without clashing with the seed palette.
  danger: string;
  dangerDark: string;
  dangerTint: string;
}

function parseHsl(value: string): { h: number; s: number; l: number } {
  const m = value.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/);
  if (!m) return { h: 0, s: 0, l: 50 };
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

const toHex = (varValue: string): string => {
  const { h, s, l } = parseHsl(varValue);
  return hslToHex(h, s, l);
};
// A soft, near-white wash of an accent (for tinted panels / header bands).
const tint = (varValue: string, lightness: number): string => {
  const { h, s } = parseHsl(varValue);
  return hslToHex(h, Math.min(s, 42), lightness);
};

let cachedPalette: Palette | null = null;
function palette(): Palette {
  if (cachedPalette) return cachedPalette;
  const v = getTheme().vars;
  cachedPalette = {
    cream: toHex(v["--color-cream"]),
    sand: toHex(v["--color-sand"]),
    sandDark: toHex(v["--color-sand-dark"]),
    bark: toHex(v["--color-bark"]),
    stone: toHex(v["--color-stone"]),
    clay: toHex(v["--color-clay"]),
    clayDark: toHex(v["--color-clay-dark"]),
    clayTint: tint(v["--color-clay"], 94),
    sage: toHex(v["--color-sage"]),
    sageDark: toHex(v["--color-sage-dark"]),
    sageTint: tint(v["--color-sage"], 94),
    danger: hslToHex(6, 55, 52),
    dangerDark: hslToHex(6, 48, 40),
    dangerTint: hslToHex(8, 55, 95),
  };
  return cachedPalette;
}

// ---------------------------------------------------------------------------
// Fonts — the site's own pairing, embedded for capable clients with a fallback
// in the right category (serif vs sans) for the rest.
// ---------------------------------------------------------------------------

const SANS_DISPLAY = new Set(["Tenor Sans"]);

interface Fonts {
  href: string;
  display: string;
  body: string;
}

let cachedFonts: Fonts | null = null;
function fonts(): Fonts {
  if (cachedFonts) return cachedFonts;
  const t = getTheme();
  const displayFallback = SANS_DISPLAY.has(t.fonts.display)
    ? "'Helvetica Neue',Helvetica,Arial,sans-serif"
    : "Georgia,'Times New Roman',serif";
  const bodyFallback = "'Helvetica Neue',Helvetica,Arial,sans-serif";
  cachedFonts = {
    href: t.fontHref,
    display: `'${t.fonts.display}',${displayFallback}`,
    body: `'${t.fonts.body}',${bodyFallback}`,
  };
  return cachedFonts;
}

// ---------------------------------------------------------------------------
// Small HTML helpers
// ---------------------------------------------------------------------------

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || "";
}

function siteUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "");
  return raw ? raw.replace(/\/+$/, "") : null;
}

function paragraph(html: string): string {
  const p = palette();
  const f = fonts();
  return `<p style="margin:0 0 18px;font-family:${f.body};font-size:15px;line-height:1.65;color:${p.stone};">${html}</p>`;
}

function sectionLabel(text: string): string {
  const p = palette();
  const f = fonts();
  // letter-spacing 2.5px at 11px ≈ 0.22em, same tracking the site uses for
  // every kicker (hero, cenník, footer column heads, admin nav, etc.).
  return `<p style="margin:24px 0 8px;font-family:${f.body};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${p.clay};font-weight:600;">${esc(text)}</p>`;
}

// A receipt-style key/value table. `value` is raw HTML (escape before passing).
function kvTable(rows: { label: string; value: string }[]): string {
  const p = palette();
  const f = fonts();
  const body = rows
    .map(
      (r, i) => `
      <tr>
        <td style="padding:11px 18px;font-family:${f.body};font-size:13px;color:${p.stone};${i ? `border-top:1px solid ${p.sandDark};` : ""}">${esc(r.label)}</td>
        <td style="padding:11px 18px;font-family:${f.body};font-size:14px;font-weight:600;color:${p.bark};text-align:right;${i ? `border-top:1px solid ${p.sandDark};` : ""}">${r.value}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0;background:${p.cream};border:1px solid ${p.sandDark};border-radius:16px;border-collapse:separate;">${body}</table>`;
}

function detailTable(b: BookingEmailData, accent: string): string {
  return kvTable([
    { label: "Služba", value: esc(b.serviceName) },
    { label: "Dátum", value: esc(formatDateLong(b.date)) },
    { label: "Čas", value: esc(`${b.startTime} – ${b.endTime}`) },
    { label: "Trvanie", value: esc(formatDuration(b.durationMin)) },
    {
      label: "Cena",
      value: `<span style="font-size:16px;color:${accent};">${esc(formatPrice(b.priceEur))}</span>`,
    },
  ]);
}

function notePanel(note: string): string {
  const p = palette();
  const f = fonts();
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 2px;background:${p.clayTint};border-radius:16px;">
    <tr><td style="padding:16px 18px;font-family:${f.body};">
      <span style="display:block;margin-bottom:4px;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${p.clay};font-weight:600;">Poznámka od klienta</span>
      <span style="font-size:14px;line-height:1.6;color:${p.bark};">${esc(note)}</span>
    </td></tr>
  </table>`;
}

function button(href: string, label: string, bg: string): string {
  const f = fonts();
  // 16px radius matches the rounded-2xl shape the rest of the site now uses
  // for primary CTAs. Both the td bg and the inner <a> carry the radius so
  // every mail client renders the rectangle the same way.
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;"><tr>
    <td align="center" bgcolor="${bg}" style="border-radius:16px;">
      <a href="${esc(href)}" style="display:inline-block;padding:14px 32px;font-family:${f.body};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:16px;">${esc(label)}</a>
    </td>
  </tr></table>`;
}

// The full e-mail: cream page, brand kicker, a white card whose top is a tinted
// status band (icon medallion + status label), then the message body, then a
// quiet footer. `glyph` is the medallion content (a check, a cross, a monogram…).
function shell(opts: {
  businessName: string;
  preheader: string;
  accent: string; // medallion ring + glyph + price
  accentDark: string; // status label text
  accentTint: string; // header band background
  glyph: string;
  statusLabel: string;
  body: string;
}): string {
  const p = palette();
  const f = fonts();
  return `<!doctype html>
<html lang="sk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${esc(opts.statusLabel)}</title>
    <style>
      @import url('${f.href}');
      @media (max-width:600px){
        .ph-body{padding:24px 20px !important;}
        .ph-head{padding:28px 18px 24px !important;}
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${p.cream};-webkit-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${p.cream};font-size:1px;line-height:1px;">${esc(opts.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${p.cream};">
      <tr>
        <td align="center" style="padding:34px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;">
            <tr>
              <td align="center" style="padding-bottom:16px;font-family:${f.body};font-size:12px;letter-spacing:2.6px;text-transform:uppercase;color:${p.clay};font-weight:600;">${esc(opts.businessName)}</td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid ${p.sandDark};border-radius:20px;overflow:hidden;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="ph-head" align="center" style="background:${opts.accentTint};padding:34px 24px 28px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
                        <td align="center" valign="middle" width="66" height="66" style="width:66px;height:66px;background:#ffffff;border:2px solid ${opts.accent};border-radius:33px;font-family:${f.display};font-size:30px;line-height:66px;color:${opts.accent};">${opts.glyph}</td>
                      </tr></table>
                      <div style="margin-top:16px;font-family:${f.display};font-size:23px;line-height:1.25;color:${opts.accentDark};">${esc(opts.statusLabel)}</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="ph-body" style="padding:30px 32px 32px;">
                      ${opts.body}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 8px 0;font-family:${f.body};font-size:12px;line-height:1.7;color:${p.stone};">
                <div style="width:36px;height:1px;line-height:1px;font-size:0;background:${p.sandDark};margin:0 auto 14px;">&nbsp;</div>
                ${esc(opts.businessName)}<br />
                <span style="color:${p.sandDark};">Tento e-mail bol odoslaný automaticky.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

// Sent when a customer submits a booking request: notify the owner and
// acknowledge to the customer that the request was received.
export async function sendBookingRequested(booking: BookingEmailData): Promise<void> {
  const client = getClient();
  if (!client) return;

  const p = palette();
  const settings = await getSettings();
  const businessName = settings.businessName;
  const ownerEmail = process.env.OWNER_EMAIL || settings.email;
  const adminUrl = siteUrl() ? `${siteUrl()}/admin` : null;
  const monogram = esc(businessName.trim().charAt(0).toUpperCase() || "•");

  const tasks: Promise<void>[] = [];

  // 1) Owner notification.
  if (ownerEmail) {
    const telHref = booking.customerPhone.replace(/[^+\d]/g, "");
    const contact = kvTable([
      { label: "Meno", value: esc(booking.customerName) },
      {
        label: "Telefón",
        value: `<a href="tel:${esc(telHref)}" style="color:${p.clay};text-decoration:none;font-weight:600;">${esc(booking.customerPhone)}</a>`,
      },
      {
        label: "E-mail",
        value: `<a href="mailto:${esc(booking.customerEmail)}" style="color:${p.clay};text-decoration:none;font-weight:600;">${esc(booking.customerEmail)}</a>`,
      },
    ]);
    const body = [
      paragraph("Máte novú žiadosť o rezerváciu. Skontrolujte detaily a potvrďte alebo zrušte ju v administrácii."),
      sectionLabel("Detail rezervácie"),
      detailTable(booking, p.clayDark),
      sectionLabel("Kontakt na klienta"),
      contact,
      booking.note ? notePanel(booking.note) : "",
      adminUrl ? button(adminUrl, "Spravovať v administrácii", p.clay) : "",
    ].join("");
    tasks.push(
      send(client, {
        to: ownerEmail,
        subject: `Nová rezervácia — ${booking.customerName}, ${formatDateLong(booking.date)}`,
        html: shell({
          businessName,
          preheader: `${booking.customerName} · ${formatDateLong(booking.date)} · ${booking.startTime}`,
          accent: p.clay,
          accentDark: p.clayDark,
          accentTint: p.clayTint,
          glyph: monogram,
          statusLabel: "Nová žiadosť o rezerváciu",
          body,
        }),
        replyTo: booking.customerEmail,
      }),
    );
  }

  // 2) Customer acknowledgement.
  const fn = firstName(booking.customerName);
  const ackBody = [
    paragraph(
      `Dobrý deň${fn ? `, ${esc(fn)}` : ""}, ďakujeme za vašu žiadosť o rezerváciu. Je <strong>nezáväzná</strong> — čoskoro sa vám ozvem a termín si spoločne dohodneme.`,
    ),
    sectionLabel("Detail rezervácie"),
    detailTable(booking, p.bark),
  ].join("");
  tasks.push(
    send(client, {
      to: booking.customerEmail,
      subject: `Prijali sme vašu žiadosť — ${businessName}`,
      html: shell({
        businessName,
        preheader: "Vašu žiadosť sme prijali, čoskoro sa vám ozveme.",
        accent: p.stone,
        accentDark: p.bark,
        accentTint: p.sand,
        glyph: "✓",
        statusLabel: "Žiadosť prijatá",
        body: ackBody,
      }),
      replyTo: ownerEmail || undefined,
    }),
  );

  await Promise.all(tasks);
}

// Sent to the customer when the owner confirms the booking.
export async function sendBookingConfirmed(booking: BookingEmailData): Promise<void> {
  const client = getClient();
  if (!client) return;

  const p = palette();
  const settings = await getSettings();
  const businessName = settings.businessName;
  const ownerEmail = process.env.OWNER_EMAIL || settings.email;
  const contactLine = [settings.address, settings.phone].filter(Boolean).map(esc).join("  ·  ");
  const fn = firstName(booking.customerName);

  const body = [
    paragraph(
      `Dobrý deň${fn ? `, ${esc(fn)}` : ""}, váš termín je <strong>potvrdený</strong>. Tešíme sa na vás.`,
    ),
    sectionLabel("Detail rezervácie"),
    detailTable(booking, p.sageDark),
    contactLine ? paragraph(`<span style="color:${p.stone};">${contactLine}</span>`) : "",
  ].join("");

  await send(client, {
    to: booking.customerEmail,
    subject: `Termín potvrdený — ${formatDateLong(booking.date)}, ${booking.startTime}`,
    html: shell({
      businessName,
      preheader: `Termín ${formatDateLong(booking.date)} o ${booking.startTime} je potvrdený.`,
      accent: p.sage,
      accentDark: p.sageDark,
      accentTint: p.sageTint,
      glyph: "✓",
      statusLabel: "Rezervácia potvrdená",
      body,
    }),
    replyTo: ownerEmail || undefined,
  });
}

// Sent to the customer when the owner cancels the booking.
export async function sendBookingCancelled(booking: BookingEmailData): Promise<void> {
  const client = getClient();
  if (!client) return;

  const p = palette();
  const settings = await getSettings();
  const businessName = settings.businessName;
  const ownerEmail = process.env.OWNER_EMAIL || settings.email;
  const fn = firstName(booking.customerName);

  const contactHtml = ownerEmail
    ? ` na <a href="mailto:${esc(ownerEmail)}" style="color:${p.clay};text-decoration:none;font-weight:600;">${esc(ownerEmail)}</a>`
    : "";
  const body = [
    paragraph(
      `Dobrý deň${fn ? `, ${esc(fn)}` : ""}, mrzí nás to, ale tento termín bol <strong>zrušený</strong>. V prípade otázok alebo nového termínu nás neváhajte kontaktovať${contactHtml}.`,
    ),
    sectionLabel("Zrušený termín"),
    detailTable(booking, p.dangerDark),
  ].join("");

  await send(client, {
    to: booking.customerEmail,
    subject: `Rezervácia zrušená — ${formatDateLong(booking.date)}`,
    html: shell({
      businessName,
      preheader: `Termín ${formatDateLong(booking.date)} bol zrušený.`,
      accent: p.danger,
      accentDark: p.dangerDark,
      accentTint: p.dangerTint,
      glyph: "✕",
      statusLabel: "Rezervácia zrušená",
      body,
    }),
    replyTo: ownerEmail || undefined,
  });
}
