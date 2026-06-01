import Link from "next/link";
import type { Settings } from "@/lib/settings";
import { Sprig } from "@/components/decorations";

const TRUST_ITEMS = [
  "Certifikovaná masérka",
  "Individuálny prístup",
  "Diskrétne prostredie",
];

// Parses a tagline string with optional *italic* markers and returns it
// as a React fragment. e.g. "Doprajte si *čas* pre seba." → render the
// "čas" word in Fraunces italic (light) as a soft serif accent.
function renderTagline(text: string): React.ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.length >= 2 && part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="font-light italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function SiteHero({ settings }: { settings: Settings }) {
  return (
    <section className="relative isolate flex min-h-[78vh] flex-col overflow-hidden lg:min-h-[88vh]">
      {/* Quiet warm background — a single tint + film grain. */}
      <div
        className="absolute -left-32 -top-24 -z-10 h-[26rem] w-[26rem] rounded-full bg-clay/10 blur-3xl"
        aria-hidden
      />
      <div className="grain absolute inset-0 -z-10 opacity-[0.05]" aria-hidden />

      {/* Large faint eucalyptus watermark behind the headline — repeats the
          small sprig motif by the image and ties the composition together. */}
      <Sprig
        className="pointer-events-none absolute -left-12 top-1/4 -z-10 h-[28rem] -rotate-12 text-sage/[0.08] lg:left-[4%] lg:top-1/3 lg:h-[34rem]"
        aria-hidden
      />

      <div className="grid flex-1 items-stretch lg:grid-cols-[5fr_7fr]">
        {/* Text column — vertically centred, left-padded to align with
            the rest of the site's max-w-6xl content. */}
        <div className="flex flex-col justify-center px-5 py-20 sm:py-24 lg:py-0 lg:pl-[max(1.25rem,calc((100vw-72rem)/2))] lg:pr-12">
          <p
            className="animate-rise flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.22em] text-clay"
            style={{ animationDelay: "120ms" }}
          >
            <span className="h-px w-8 bg-sage/60" aria-hidden />
            {settings.businessName}
          </p>

          <h1
            className="animate-rise mt-6 max-w-xl text-4xl leading-[1.08] text-bark sm:text-5xl md:text-[3.4rem]"
            style={{ animationDelay: "280ms" }}
          >
            {renderTagline(settings.tagline)}
          </h1>

          <p
            className="animate-rise mt-5 max-w-md text-lg leading-relaxed text-stone lg:mt-8"
            style={{ animationDelay: "440ms" }}
          >
            {settings.heroIntro}
          </p>

          <div
            className="animate-rise mt-10 lg:mt-14"
            style={{ animationDelay: "600ms" }}
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
        </div>

        {/* Visual column — full-bleed to the right edge, soft "doorway"
            curve only on the lg+ left side. */}
        <div className="relative min-h-[60vh] overflow-hidden bg-gradient-to-b from-sand to-clay/20 shadow-2xl lg:min-h-0 lg:rounded-l-[5rem]">
          {settings.heroImage && (
            <div
              className="animate-image-reveal absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${settings.heroImage})`,
                // Warm grade: drop a hair of saturation, gentle warmth + a
                // touch more contrast, so the photo sits inside the oat
                // palette instead of bringing a cool blue cast with it.
                filter: "saturate(0.9) contrast(1.05) sepia(0.08) brightness(1.02)",
              }}
              role="img"
              aria-label={settings.businessName}
            />
          )}
          <Sprig className="absolute right-6 top-10 h-32 -rotate-45 text-sage/70 lg:right-12 lg:top-16 lg:h-44" />
          <div className="grain absolute inset-0 opacity-[0.08]" aria-hidden />
        </div>
      </div>

      {/* Trust bar — sits at the bottom of the hero, separated by a hairline.
          Quiet uppercase sans, dotted dividers. Stacks vertically on mobile. */}
      <div className="border-t border-sand-dark/50 bg-cream/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-y-3 px-5 py-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone sm:flex-row sm:justify-center sm:gap-x-10 sm:py-5 lg:gap-x-14">
          {TRUST_ITEMS.map((item, i) => (
            <span key={item} className="inline-flex items-center gap-3">
              {i > 0 && (
                <span
                  className="hidden h-1 w-1 rounded-full bg-clay/50 sm:inline-block"
                  aria-hidden
                />
              )}
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
