import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { Sprig } from "@/components/decorations";

const FEATURES = ["Online rezervácia", "Individuálny prístup", "Diskrétne prostredie"];

export function SiteHero({ settings }: { settings: Settings }) {
  return (
    <section className="relative overflow-hidden">
        {/* Layered, theme-aware background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sand via-cream to-sand/40" />
        <div
          className="absolute -right-32 -top-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-clay/15 blur-3xl"
          aria-hidden
        />
        <div className="grain absolute inset-0 -z-10 opacity-[0.06]" aria-hidden />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Text column */}
          <div>
            <p
              className="animate-rise flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-clay"
              style={{ animationDelay: "60ms" }}
            >
              <span className="h-px w-8 bg-clay/50" aria-hidden />
              {settings.businessName}
            </p>

            <h1
              className="animate-rise mt-6 text-4xl leading-[1.08] text-bark sm:text-5xl md:text-[3.4rem]"
              style={{ animationDelay: "130ms" }}
            >
              {settings.tagline}
            </h1>

            <p
              className="animate-rise mt-5 max-w-xl text-lg leading-relaxed text-stone lg:mt-8"
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
                className="inline-block rounded-full bg-clay px-7 py-3 text-base font-semibold text-cream shadow-sm transition-colors hover:bg-clay-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
              >
                Rezervovať termín
              </Link>
              <div className="mt-4">
                <Link
                  href="#sluzby"
                  className="group inline-flex items-center gap-1.5 text-sm font-medium text-clay transition-colors hover:text-clay-dark"
                >
                  alebo si najprv pozrite služby
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

          {/* Visual column */}
          <div
            className="animate-rise relative mx-auto w-full max-w-sm lg:max-w-none"
            style={{ animationDelay: "180ms" }}
          >
            {/* Arch frame */}
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-3xl border border-sand-dark/60 bg-gradient-to-b from-sand to-clay/20 shadow-2xl">
              <Sprig className="absolute left-1/2 top-12 h-3/4 -translate-x-1/2 text-sage/25" />
              <div className="grain absolute inset-0 opacity-[0.08]" aria-hidden />
              {settings.heroImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${settings.heroImage})` }}
                  role="img"
                  aria-label={settings.businessName}
                />
              )}
            </div>

            {/* Botanical sprig poking out behind the arch */}
            <Sprig className="absolute -right-4 -top-8 h-44 -rotate-45 text-sage/70 sm:-right-8" />

          </div>
        </div>

        {/* Soft organic curve melting the hero into the content below */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full text-cream sm:h-16"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,100 V48 C 360,104 820,6 1440,50 V100 Z" />
        </svg>
    </section>
  );
}

