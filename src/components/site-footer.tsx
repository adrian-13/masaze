import Link from "next/link";
import type { Settings } from "@/lib/settings";

export function SiteFooter({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer id="kontakt" className="mt-24 border-t border-sand-dark/60 bg-sand/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h3 className="font-serif text-xl text-bark">{settings.businessName}</h3>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone">
            {settings.tagline}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-stone">
            Kontakt
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-bark">
            {settings.phone && (
              <li>
                <a className="hover:text-clay" href={`tel:${settings.phone.replace(/\s+/g, "")}`}>
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a className="hover:text-clay" href={`mailto:${settings.email}`}>
                  {settings.email}
                </a>
              </li>
            )}
            {settings.address && <li className="text-stone">{settings.address}</li>}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-stone">
            Sledujte ma
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-bark">
            {settings.instagramUrl && (
              <li>
                <a className="hover:text-clay" href={settings.instagramUrl} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
            )}
            {settings.facebookUrl && (
              <li>
                <a className="hover:text-clay" href={settings.facebookUrl} target="_blank" rel="noreferrer">
                  Facebook
                </a>
              </li>
            )}
            <li>
              <Link className="hover:text-clay" href="/rezervacia">
                Online rezervácia
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-sand-dark/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-stone sm:flex-row">
          <p>
            © {year} {settings.businessName}
          </p>
          <Link href="/admin" className="hover:text-clay">
            Prihlásenie
          </Link>
        </div>
      </div>
    </footer>
  );
}
