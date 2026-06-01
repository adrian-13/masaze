import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { Sprig } from "@/components/decorations";

const FEATURES = [
  "Jednoduchá online rezervácia",
  "Individuálny prístup ku každému klientovi",
  "Diskrétne a komfortné prostredie",
];

export function SiteHero({ settings }: { settings: Settings }) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Quiet warm background (single tint, no competing blurs) */}
      <div
        className="absolute -left-32 -top-24 -z-10 h-[26rem] w-[26rem] rounded-full bg-clay/10 blur-3xl"
        aria-hidden
      />
      <div className="grain absolute inset-0 -z-10 opacity-[0.05]" aria-hidden />

      <div className="grid min-h-[78vh] items-stretch lg:min-h-[88vh] lg:grid-cols-[5fr_7fr]">
        {/* Text column — vertically centred, left-padded to align with
            a hypothetical max-w-6xl container so the type baseline matches
            the rest of the site. */}
        <div className="flex flex-col justify-center px-5 py-20 sm:py-24 lg:py-0 lg:pl-[max(1.25rem,calc((100vw-72rem)/2))] lg:pr-12">
          <p
            className="animate-rise flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-clay"
            style={{ animationDelay: "60ms" }}
          >
            <span className="h-px w-8 bg-sage/60" aria-hidden />
            {settings.businessName}
          </p>

          <h1
            className="animate-rise mt-6 max-w-xl text-4xl leading-[1.08] text-bark sm:text-5xl md:text-[3.4rem]"
            style={{ animationDelay: "130ms" }}
          >
            {settings.tagline}
          </h1>

          <p
            className="animate-rise mt-5 max-w-md text-lg leading-relaxed text-stone lg:mt-8"
            style={{ animationDelay: "210ms" }}
          >
            {settings.heroIntro}
          </p>

          <div
            className="animate-rise mt-10 lg:mt-14"
            style={{ animationDelay: "290ms" }}
          >
            <Link
              href="/rezervacia"
              className="inline-flex items-center justify-center rounded-full bg-clay px-7 py-4 text-base font-semibold leading-none text-cream shadow-sm transition-colors hover:bg-clay-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
            >
              Rezervujte si termín online
            </Link>
            <div className="mt-4">
              <Link
                href="#sluzby"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-clay transition-colors hover:text-clay-dark"
              >
                alebo si prezrite dostupné služby
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
              </Link>
            </div>
          </div>

          <ul
            className="animate-rise mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm text-bark"
            style={{ animationDelay: "360ms" }}
          >
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-clay/60" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual column — full-bleed to the right edge of the viewport.
            On lg+ it carries the rounded "doorway" curve only on its left
            side; on mobile it sits below the text as a soft-cornered band. */}
        <div
          className="animate-rise relative min-h-[60vh] overflow-hidden bg-gradient-to-b from-sand to-clay/20 shadow-2xl lg:min-h-[88vh] lg:rounded-l-[5rem]"
          style={{ animationDelay: "180ms" }}
        >
          {settings.heroImage && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${settings.heroImage})` }}
              role="img"
              aria-label={settings.businessName}
            />
          )}
          {/* One sharp eucalyptus sprig anchored at the top-right of the
              image — repeats the botanical motif from the kicker's sage rule. */}
          <Sprig className="absolute right-6 top-10 h-32 -rotate-45 text-sage/70 lg:right-12 lg:top-16 lg:h-44" />
          <div className="grain absolute inset-0 opacity-[0.08]" aria-hidden />
        </div>
      </div>
    </section>
  );
}
