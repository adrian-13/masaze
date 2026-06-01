import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatDuration, formatPrice } from "@/lib/format";
import { SiteHero } from "@/components/site-hero";
import { LeafMark, Sprig } from "@/components/decorations";

const STEPS = [
  {
    title: "Vyberte si masáž",
    text: "Prezrite si ponuku a vyberte si masáž, ktorá najlepšie vyhovuje vašim potrebám.",
  },
  {
    title: "Rezervujte si termín",
    text: "Vyberte si voľný deň a čas prostredníctvom online rezervácie.",
  },
  {
    title: "Doprajte si oddych",
    text: "Príďte si oddýchnuť a načerpať novú energiu. O vaše pohodlie sa postarám ja.",
  },
];

export default async function HomePage() {
  const [settings, services] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const mapsUrl = settings.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
    : null;

  // Resilient: the testimonials table may not be migrated yet on some
  // environments — never break the homepage over it.
  let testimonials: { id: string; author: string; text: string }[] = [];
  try {
    testimonials = await prisma.testimonial.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, author: true, text: true },
    });
  } catch {
    testimonials = [];
  }

  return (
    <>
      <SiteHero settings={settings} />

      {/* Ako to funguje — left-aligned, inline "01 — Title" pattern */}
      <section className="reveal mx-auto max-w-5xl px-5 py-24 sm:py-28">
        <div className="max-w-2xl">
          <h2 className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-clay">
            <span className="h-px w-8 bg-sage/60" aria-hidden />
            Vaša cesta k uvoľneniu
          </h2>
          <p className="mt-4 max-w-md text-stone">
            Len tri jednoduché kroky vás delia od chvíle pokoja a regenerácie.
          </p>
        </div>

        <ol className="mt-14 grid gap-y-12 sm:grid-cols-3 sm:gap-x-12">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col items-start">
              <h3 className="text-xl text-bark">
                <span className="mr-2.5 font-serif font-light italic text-clay/55">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mr-2.5 text-clay/35" aria-hidden>
                  —
                </span>
                {step.title}
              </h3>
              <p className="mt-3 max-w-[20rem] text-sm leading-relaxed text-stone">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Služby — editoriálny cenník: celý riadok je Link s textovým CTA */}
      <section id="sluzby" className="reveal mx-auto max-w-5xl scroll-mt-20 px-5 py-24 sm:py-28">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-clay">
            <span className="h-px w-8 bg-sage/60" aria-hidden />
            Ponuka
          </p>
          <h2 className="mt-5 text-3xl text-bark sm:text-4xl">Služby a cenník</h2>
          <p className="mt-4 max-w-md text-stone">
            Vyberte si masáž, ktorá vám sadne. Termín si jednoducho zarezervujete online.
          </p>
        </div>

        {services.length === 0 ? (
          <p className="mt-12 text-stone">Služby budú čoskoro doplnené.</p>
        ) : (
          <ul className="mt-14 border-b border-sand-dark/50">
            {services.map((service) => (
              <li key={service.id} className="border-t border-sand-dark/50">
                <Link
                  href={`/rezervacia?service=${service.id}`}
                  className="group flex flex-col gap-5 py-9 transition-colors hover:bg-sand/40 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:py-10 -mx-2 px-2 sm:-mx-3 sm:px-3"
                >
                  <div className="sm:max-w-md">
                    <h3 className="text-2xl text-bark transition-colors group-hover:text-clay">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="mt-2 text-sm leading-relaxed text-stone">
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div className="flex w-full shrink-0 items-center justify-between gap-8 sm:w-auto sm:justify-start">
                    <div className="leading-tight sm:text-right">
                      <p className="font-serif text-xl text-bark">
                        {formatPrice(service.priceEur)}
                      </p>
                      <p className="mt-0.5 text-xs uppercase tracking-[0.15em] text-stone">
                        {formatDuration(service.durationMin)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-clay transition-colors group-hover:text-clay-dark">
                      Rezervovať
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden
                        className="transition-transform group-hover:translate-x-0.5"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* O mne */}
      <section id="o-mne" className="reveal scroll-mt-20 bg-sand/40 py-24 sm:py-28">
        <div
          className={`mx-auto grid gap-x-14 gap-y-10 px-5 lg:items-center ${
            settings.aboutImage ? "max-w-5xl lg:grid-cols-[0.8fr_1fr]" : "max-w-2xl"
          }`}
        >
          {settings.aboutImage && (
            <div
              className="aspect-[4/5] overflow-hidden rounded-t-full rounded-b-3xl bg-sand bg-cover bg-center shadow-2xl"
              style={{ backgroundImage: `url(${settings.aboutImage})` }}
              role="img"
              aria-label={`Masáž — ${settings.businessName}`}
            />
          )}
          {/* Príbeh */}
          <div>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-clay">
              <span className="h-px w-8 bg-sage/60" aria-hidden />
              {settings.aboutTitle}
            </p>
            <h2 className="mt-5 text-3xl text-bark sm:text-4xl">{settings.ownerName}</h2>
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-stone">
              {settings.aboutText}
            </p>

            {mapsUrl && (
              <div className="mt-10">
                <p className="text-sm font-medium text-bark">{settings.address}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-clay transition-colors hover:text-clay-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
                >
                  Otvoriť v Google Mapách
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ohlasy klientov — sociálny dôkaz pred záverečnou výzvou */}
      {testimonials.length > 0 && (
        <section className="reveal mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:py-28">
          <div className="max-w-2xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-clay">
              <span className="h-px w-8 bg-sage/60" aria-hidden />
              Referencie
            </p>
            <h2 className="mt-5 text-3xl text-bark sm:text-4xl">Ohlasy klientov</h2>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="flex flex-col items-start">
                <blockquote className="text-base leading-relaxed text-bark sm:text-lg">
                  {`„${t.text}"`}
                </blockquote>
                <figcaption className="mt-5 text-sm font-medium text-stone">
                  — {t.author}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Záverečná výzva */}
      <section className="reveal relative overflow-hidden bg-bark">
        <div
          className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-clay/25 blur-3xl"
          aria-hidden
        />
        <div className="grain absolute inset-0 opacity-[0.08]" aria-hidden />
        <Sprig className="absolute -bottom-12 right-2 h-72 rotate-[16deg] text-cream/10 sm:right-16" />
        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:py-24">
          <LeafMark className="mx-auto h-9 w-9 text-clay" />
          <h2 className="mt-5 text-3xl text-cream sm:text-4xl">
            Doprajte si chvíľu pre seba
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-cream/70">
            Rezervácia trvá minútu a je nezáväzná. Ozvem sa vám čoskoro.
          </p>
          <Link
            href="/rezervacia"
            className="mt-9 inline-block rounded-full bg-cream px-8 py-3 text-base font-semibold text-bark shadow-sm transition-colors hover:bg-sand"
          >
            Rezervovať termín
          </Link>
        </div>
      </section>
    </>
  );
}
