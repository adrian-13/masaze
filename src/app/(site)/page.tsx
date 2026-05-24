import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatDuration, formatPrice } from "@/lib/format";

export default async function HomePage() {
  const [settings, services] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sand via-cream to-sand/50" />
        <div
          className="absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-clay/10 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-32 -left-24 -z-10 h-96 w-96 rounded-full bg-sage/10 blur-3xl"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-clay">
              {settings.businessName}
            </p>
            <h1 className="mt-5 text-4xl leading-tight text-bark sm:text-5xl md:text-6xl">
              {settings.tagline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone">
              {settings.aboutText.slice(0, 180)}
              {settings.aboutText.length > 180 ? "…" : ""}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/rezervacia"
                className="rounded-full bg-clay px-7 py-3 text-base font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark"
              >
                Rezervovať termín
              </Link>
              <Link
                href="#sluzby"
                className="rounded-full border border-sand-dark px-7 py-3 text-base font-semibold text-bark transition-colors hover:bg-sand"
              >
                Pozrieť služby
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Služby */}
      <section id="sluzby" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl text-bark sm:text-4xl">Služby a cenník</h2>
          <p className="mt-3 text-stone">
            Vyberte si masáž, ktorá vám sadne. Termín si jednoducho zarezervujete online.
          </p>
        </div>

        {services.length === 0 ? (
          <p className="mt-10 text-stone">Služby budú čoskoro doplnené.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className="flex flex-col rounded-2xl border border-sand-dark/60 bg-white/60 p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="text-xl text-bark">{service.name}</h3>
                {service.description && (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-stone">
                    {service.description}
                  </p>
                )}
                <div className="mt-5 flex items-center justify-between border-t border-sand-dark/50 pt-4">
                  <div>
                    <p className="text-lg font-semibold text-bark">
                      {formatPrice(service.priceEur)}
                    </p>
                    <p className="text-sm text-stone">
                      {formatDuration(service.durationMin)}
                    </p>
                  </div>
                  <Link
                    href={`/rezervacia?service=${service.id}`}
                    className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-sage-dark"
                  >
                    Rezervovať
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* O mne */}
      <section id="o-mne" className="scroll-mt-20 bg-sand/40 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl text-bark sm:text-4xl">{settings.aboutTitle}</h2>
            <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-stone">
              {settings.aboutText}
            </p>
          </div>
          <div className="rounded-2xl border border-sand-dark/60 bg-cream p-8">
            <h3 className="text-xl text-bark">{settings.ownerName}</h3>
            <dl className="mt-5 space-y-3 text-sm">
              {settings.phone && (
                <div className="flex justify-between gap-4">
                  <dt className="text-stone">Telefón</dt>
                  <dd className="font-medium text-bark">{settings.phone}</dd>
                </div>
              )}
              {settings.email && (
                <div className="flex justify-between gap-4">
                  <dt className="text-stone">E-mail</dt>
                  <dd className="font-medium text-bark">{settings.email}</dd>
                </div>
              )}
              {settings.address && (
                <div className="flex justify-between gap-4">
                  <dt className="text-stone">Adresa</dt>
                  <dd className="text-right font-medium text-bark">{settings.address}</dd>
                </div>
              )}
            </dl>
            <Link
              href="/rezervacia"
              className="mt-7 block rounded-full bg-clay px-6 py-3 text-center text-base font-semibold text-cream transition-colors hover:bg-clay-dark"
            >
              Rezervovať termín
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
