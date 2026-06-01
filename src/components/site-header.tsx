"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/#sluzby", label: "Služby" },
  { href: "/#o-mne", label: "O mne" },
  { href: "/#kontakt", label: "Kontakt" },
];

export function SiteHeader({ businessName }: { businessName: string }) {
  const [open, setOpen] = useState(false);

  // Lock background scroll while the fullscreen menu is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // ESC closes the menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="header-on-scroll sticky top-0 z-40 border-b border-sand-dark/40 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        {/* Wordmark — quiet serif, no icon. Carries the whole brand on its own
            (Aesop / Susanne Kaufmann register). */}
        <Link
          href="/"
          className="font-serif text-xl text-bark transition-colors hover:text-clay sm:text-2xl"
          onClick={() => setOpen(false)}
        >
          {businessName}
        </Link>

        {/* Desktop nav — sans capitals, generous letter-spacing. The CTA is a
            small outline button so the primary action lives in the hero, not
            up here. */}
        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone transition-colors hover:text-bark"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/rezervacia"
            className="inline-flex items-center justify-center rounded-full border border-clay px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-clay transition-colors hover:bg-clay hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
          >
            Rezervovať
          </Link>
        </nav>

        <button
          type="button"
          aria-label={open ? "Zavrieť menu" : "Otvoriť menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="relative z-50 flex h-10 w-10 items-center justify-center rounded-lg text-bark md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Fullscreen mobile menu — editorial overlay rather than a dropdown.
          Large serif nav items, staggered entrance, a dedicated Rezervovať
          CTA at the bottom, safe-area insets respected. */}
      {open && (
        <div
          className="animate-rise fixed inset-0 z-40 flex flex-col bg-cream md:hidden"
          style={{ animationDuration: "0.35s" }}
        >
          {/* Match the header's height so the X icon (in the header above)
              appears to "sit on" the overlay. */}
          <div
            className="h-[73px] shrink-0 border-b border-sand-dark/30"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
            aria-hidden
          />

          <nav className="flex flex-1 flex-col items-start justify-center gap-9 px-8 sm:px-12">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="animate-rise font-serif text-4xl leading-none text-bark transition-colors hover:text-clay sm:text-5xl"
                style={{ animationDelay: `${i * 90 + 100}ms` }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div
            className="border-t border-sand-dark/30 px-5 pt-6"
            style={{
              paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
            }}
          >
            <Link
              href="/rezervacia"
              onClick={() => setOpen(false)}
              className="animate-rise inline-flex w-full items-center justify-center rounded-2xl bg-clay px-7 py-4 text-base font-semibold leading-none text-cream shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-clay-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
              style={{ animationDelay: "380ms" }}
            >
              Rezervovať termín
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
