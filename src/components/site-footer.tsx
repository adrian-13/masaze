import Link from "next/link";
import type { Settings } from "@/lib/settings";
import type { OpeningHoursGroup } from "@/lib/format";

export function SiteFooter({
  settings,
  openingHours,
}: {
  settings: Settings;
  openingHours: OpeningHoursGroup[];
}) {
  const year = new Date().getFullYear();
  const hasSocials = Boolean(settings.instagramUrl || settings.facebookUrl);

  return (
    <footer id="kontakt" className="border-t border-sand-dark/40 bg-sand/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {/* Brand */}
        <div>
          <h3 className="font-serif text-xl text-bark">{settings.businessName}</h3>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone">
            {settings.tagline}
          </p>
          {hasSocials && (
            <div className="mt-5 flex gap-2.5">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="grid h-9 w-9 place-items-center rounded-full border border-sand-dark/70 text-stone transition-colors hover:border-clay hover:text-clay"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="grid h-9 w-9 place-items-center rounded-full border border-sand-dark/70 text-stone transition-colors hover:border-clay hover:text-clay"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 9h2.5l.5-3H14V4.6c0-.8.3-1.3 1.4-1.3H17V.6C16.6.5 15.6.4 14.5.4 12.2.4 11 1.7 11 4.1V6H8.5v3H11v9h3V9Z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Kontakt */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone">
            Kontakt
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm text-bark">
            {settings.phone && (
              <li>
                <a className="transition-colors hover:text-clay" href={`tel:${settings.phone.replace(/\s+/g, "")}`}>
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a className="transition-colors hover:text-clay" href={`mailto:${settings.email}`}>
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && <li className="text-stone">{settings.address}</li>}
          </ul>
        </div>

        {/* Otváracie hodiny */}
        {openingHours.length > 0 && (
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone">
              Otváracie hodiny
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {openingHours.map((g) => (
                <li key={g.days} className="flex justify-between gap-4">
                  <span className="text-stone">{g.days}</span>
                  <span className="font-medium text-bark">{g.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="border-t border-sand-dark/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-5 text-xs text-stone sm:flex-row">
          <p>
            © {year} {settings.businessName}
          </p>
          <p className="text-center">
            Stránku vytvoril{" "}
            <a
              href="https://www.itpd.sk"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-bark transition-colors hover:text-clay"
            >
              Adrián Javorček
            </a>
          </p>
          <Link href="/admin" className="transition-colors hover:text-clay">
            Prihlásenie
          </Link>
        </div>
      </div>
    </footer>
  );
}
