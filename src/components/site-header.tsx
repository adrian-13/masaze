"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/#sluzby", label: "Služby" },
  { href: "/#o-mne", label: "O mne" },
  { href: "/#kontakt", label: "Kontakt" },
];

export function SiteHeader({
  businessName,
  logoImage,
}: {
  businessName: string;
  logoImage?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand-dark/60 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-serif text-xl text-bark transition-colors hover:text-clay sm:gap-3"
          onClick={() => setOpen(false)}
        >
          {logoImage && (
            <span
              className="block h-10 w-10 shrink-0 rounded-full bg-cover bg-center bg-no-repeat shadow-sm ring-1 ring-clay/20 sm:h-11 sm:w-11"
              style={{ backgroundImage: `url(${logoImage})` }}
              aria-hidden
            />
          )}
          <span>{businessName}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone transition-colors hover:text-bark"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/rezervacia"
            className="rounded-full bg-clay px-5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-clay-dark"
          >
            Rezervovať
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-bark md:hidden"
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

      {open && (
        <nav className="border-t border-sand-dark/60 bg-cream px-5 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-base font-medium text-stone hover:bg-sand hover:text-bark"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/rezervacia"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full bg-clay px-5 py-2.5 text-center text-base font-semibold text-cream hover:bg-clay-dark"
            >
              Rezervovať
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
