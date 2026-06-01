"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";

const LINKS = [
  { href: "/admin", label: "Objednávky" },
  { href: "/admin/sluzby", label: "Služby" },
  { href: "/admin/dostupnost", label: "Dostupnosť" },
  { href: "/admin/blokovane", label: "Blokované dni" },
  { href: "/admin/referencie", label: "Ohlasy" },
  { href: "/admin/nastavenia", label: "Nastavenia" },
];

export function AdminNav({ businessName }: { businessName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-sand-dark/40 bg-cream/85 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <Link
            href="/admin"
            className="font-serif text-lg text-bark transition-colors hover:text-clay sm:text-xl"
          >
            {businessName}
            <span className="ml-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-clay">
              admin
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone transition-colors hover:text-bark"
              target="_blank"
            >
              Zobraziť stránku
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl border border-sand-dark/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-bark transition-colors hover:bg-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
              >
                Odhlásiť
              </button>
            </form>
          </div>
        </div>

        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors ${
                  active
                    ? "border-clay text-bark"
                    : "border-transparent text-stone hover:text-bark"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
