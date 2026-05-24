"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";

const LINKS = [
  { href: "/admin", label: "Objednávky" },
  { href: "/admin/sluzby", label: "Služby" },
  { href: "/admin/dostupnost", label: "Dostupnosť" },
  { href: "/admin/blokovane", label: "Blokované dni" },
  { href: "/admin/nastavenia", label: "Nastavenia" },
];

export function AdminNav({ businessName }: { businessName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-sand-dark/60 bg-white/60">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <Link href="/admin" className="font-serif text-lg text-bark">
            {businessName}
            <span className="ml-2 text-sm font-sans text-stone">· admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-stone hover:text-bark" target="_blank">
              Zobraziť stránku ↗
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-sand-dark px-4 py-1.5 text-sm font-medium text-bark hover:bg-sand"
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
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
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
