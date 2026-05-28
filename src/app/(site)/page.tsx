import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatDuration, formatPrice } from "@/lib/format";
import { SiteHero } from "@/components/site-hero";
import { LeafMark, Sprig } from "@/components/decorations";

const STEPS = [
  {
    title: "Vyberte si masáž",
    text: "Prezrite si ponuku a vyberte tú, ktorá vám najviac sadne.",
  },
  {
    title: "Zarezervujte termín",
    text: "Online si zvolíte voľný deň a čas. Zaberie to len minútu.",
  },
  {
    title: "Príďte a uvoľnite sa",
    text: "O zvyšok sa postarám ja. Vy si doprajete chvíľu pokoja.",
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

      {/* Ako to funguje — bez nadpisu, vzdušné */}
      <section className="reveal mx-auto max-w-5xl px-5 py-20 sm:py-24">
        <ol className="relative grid gap-y-12 sm:grid-cols-3">
          <span
            aria-hidden
            className="dotted-path absolute left-[16.66%] right-[16.66%] top-[17px] hidden h-1 text-clay/20 sm:block"
          />
          {STEPS.map((step) => (
            <li
              key={step.title}
              className="relative flex flex-col items-center px-4 text-center"
            >
              <span className="inline-flex bg-cream px-3">
                <LeafMark className="h-9 w-9 text-sage" />
              </span>
              <h3 className="mt-5 text-xl text-bark">{step.title}</h3>
              <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-stone">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Služby — elegantný cenník (zoznam, nie karty) */}
      <section id="sluzby" className="reveal mx-auto max-w-5xl scroll-mt-20 px-5 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
            <span className="h-px w-8 bg-clay/50" aria-hidden />
            Ponuka
          </p>
          <h2 className="mt-4 text-3xl text-bark sm:text-4xl">Služby a cenník</h2>
          <p className="mt-3 text-stone">
            Vyberte si masáž, ktorá vám sadne. Termín si jednoducho zarezervujete online.
          </p>
        </div>

        {services.length === 0 ? (
          <p className="mt-10 text-stone">Služby budú čoskoro doplnené.</p>
        ) : (
          <ul className="mt-12 border-b border-sand-dark/50">
            {services.map((service) => (
              <li
                key={service.id}
                className="group flex flex-col gap-6 border-t border-sand-dark/50 py-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:py-7"
              >
                <div className="sm:max-w-md">
                  <h3 className="text-xl text-bark transition-colors group-hover:text-clay">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="mt-2 text-sm leading-relaxed text-stone">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="flex w-full shrink-0 items-center justify-between gap-6 sm:w-auto sm:justify-start">
                  <div className="leading-tight sm:text-right">
                    <p className="font-serif text-2xl text-bark">
                      {formatPrice(service.priceEur)}
                    </p>
                    <p className="mt-0.5 text-sm text-stone">
                      {formatDuration(service.durationMin)}
                    </p>
                  </div>
                  <Link
                    href={`/rezervacia?service=${service.id}`}
                    className="rounded-full border border-clay px-5 py-2 text-sm font-semibold text-clay transition-colors hover:bg-clay hover:text-cream"
                  >
                    Rezervovať
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* O mne */}
      <section id="o-mne" className="reveal scroll-mt-20 bg-sand/40 py-20 sm:py-24">
        <div
          className={`mx-auto grid gap-x-14 gap-y-10 px-5 lg:items-center ${
            settings.aboutImage ? "max-w-5xl lg:grid-cols-[0.8fr_1fr]" : "max-w-2xl"
          }`}
        >
          {settings.aboutImage && (
            <div
              className="aspect-[4/5] overflow-hidden rounded-t-full rounded-b-3xl border border-sand-dark/60 bg-sand bg-cover bg-center shadow-[0_24px_50px_-30px_rgba(0,0,0,0.35)]"
              style={{ backgroundImage: `url(${settings.aboutImage})` }}
              role="img"
              aria-label={`Masáž — ${settings.businessName}`}
            />
          )}
          {/* Príbeh */}
          <div>
            <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
              <span className="h-px w-8 bg-clay/50" aria-hidden />
              {settings.aboutTitle}
            </p>
            <h2 className="mt-5 text-3xl text-bark sm:text-4xl">{settings.ownerName}</h2>
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-stone">
              {settings.aboutText}
            </p>

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="group mt-8 inline-flex items-center gap-4 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clay/10 text-clay transition-colors group-hover:bg-clay group-hover:text-cream">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z" strokeLinejoin="round" />
                    <circle cx="12" cy="11" r="2" />
                  </svg>
                </span>
                <span>
                  <span className="block font-medium text-bark">{settings.address}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-clay">
                    Otvoriť v Google Mapách
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Ohlasy klientov — sociálny dôkaz pred záverečnou výzvou */}
      {testimonials.length > 0 && (
        <section className="reveal mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="flex items-center justify-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-clay">
              <span className="h-px w-8 bg-clay/50" aria-hidden />
              Referencie
              <span className="h-px w-8 bg-clay/50" aria-hidden />
            </p>
            <h2 className="mt-4 text-3xl text-bark sm:text-4xl">Ohlasy klientov</h2>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.id} className="flex flex-col items-center px-2 text-center">
                <span className="font-serif text-6xl leading-[0.5] text-clay/25" aria-hidden>
                  &ldquo;
                </span>
                <blockquote className="mt-4 leading-relaxed text-bark">
                  {t.text}
                </blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-clay">
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
