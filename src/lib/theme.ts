// Seed-driven design system.
//
// A single seed string (env `DESIGN_SEED`) deterministically produces the whole
// look of the site: a coherent light colour palette, a font pairing, and a
// shape personality (corner radii). The same seed always yields the same theme,
// so every deployment can have its own unique-but-tasteful design just by
// changing one value — no code edits.
//
// All values are mapped onto the existing semantic tokens used across the app:
//   cream     → page background        sand      → surface / cards
//   sand-dark → borders                clay      → primary accent
//   clay-dark → primary hover          sage      → secondary accent
//   sage-dark → secondary hover        bark      → text / headings
//   stone     → muted text

// ---------------------------------------------------------------------------
// Deterministic PRNG (FNV-1a hash → mulberry32). No external dependencies.
// ---------------------------------------------------------------------------

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Rng {
  private next: () => number;
  constructor(seed: string) {
    this.next = mulberry32(hashSeed(seed));
  }
  float(): number {
    return this.next();
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// ---------------------------------------------------------------------------
// Palette archetypes. Each defines hue/saturation envelopes; the seed jitters
// within them so even one family produces many distinct-yet-harmonious looks.
// Lightness per role is fixed, which keeps text/background contrast reliable.
// ---------------------------------------------------------------------------

// The secondary accent is derived from the primary at runtime (analogous hue),
// so the two accents always belong to the same colour story — no clashing
// contrast pairs. Archetypes therefore only define the neutral base + primary.
interface Archetype {
  name: string;
  neutralHue: number;
  neutralSat: [number, number];
  primaryHue: [number, number];
  primarySat: [number, number];
}

const ARCHETYPES: readonly Archetype[] = [
  {
    name: "Clay & Olive",
    neutralHue: 32,
    neutralSat: [16, 26],
    primaryHue: [14, 28],
    primarySat: [34, 48],
  },
  {
    name: "Sage Botanical",
    neutralHue: 76,
    neutralSat: [10, 18],
    primaryHue: [118, 146],
    primarySat: [18, 30],
  },
  {
    name: "Lavender Calm",
    neutralHue: 285,
    neutralSat: [8, 16],
    primaryHue: [260, 286],
    primarySat: [20, 32],
  },
  {
    name: "Dusty Rose",
    neutralHue: 350,
    neutralSat: [10, 18],
    primaryHue: [340, 358],
    primarySat: [26, 40],
  },
  {
    name: "Nordic Slate",
    neutralHue: 214,
    neutralSat: [8, 16],
    primaryHue: [202, 224],
    primarySat: [22, 34],
  },
  {
    name: "Honey Amber",
    neutralHue: 44,
    neutralSat: [18, 28],
    primaryHue: [32, 46],
    primarySat: [38, 54],
  },
  {
    name: "Eucalyptus Spa",
    neutralHue: 158,
    neutralSat: [8, 16],
    primaryHue: [162, 186],
    primarySat: [20, 32],
  },
  {
    name: "Plum Mauve",
    neutralHue: 322,
    neutralSat: [8, 16],
    primaryHue: [318, 340],
    primarySat: [24, 38],
  },
] as const;

// ---------------------------------------------------------------------------
// Font pairings. Distinctive display + clean body, all on Google Fonts.
// `weights` lists only weights the family actually ships to avoid 404s.
// ---------------------------------------------------------------------------

interface FontSpec {
  family: string;
  weights: string;
}
interface Pairing {
  display: FontSpec;
  body: FontSpec;
}

const PAIRINGS: readonly Pairing[] = [
  {
    display: { family: "Fraunces", weights: "400;500;600" },
    body: { family: "Mulish", weights: "400;500;600;700" },
  },
  {
    display: { family: "Cormorant Garamond", weights: "400;500;600" },
    body: { family: "Mulish", weights: "400;500;600;700" },
  },
  {
    display: { family: "Playfair Display", weights: "400;500;600" },
    body: { family: "Karla", weights: "400;500;600;700" },
  },
  {
    display: { family: "Spectral", weights: "400;500;600" },
    body: { family: "Work Sans", weights: "400;500;600" },
  },
  {
    display: { family: "Marcellus", weights: "400" },
    body: { family: "Jost", weights: "400;500;600" },
  },
  {
    display: { family: "Bodoni Moda", weights: "400;500;600" },
    body: { family: "Mulish", weights: "400;500;600;700" },
  },
  {
    display: { family: "Tenor Sans", weights: "400" },
    body: { family: "Jost", weights: "400;500;600" },
  },
  {
    display: { family: "DM Serif Display", weights: "400" },
    body: { family: "DM Sans", weights: "400;500;600;700" },
  },
  {
    display: { family: "Libre Baskerville", weights: "400;700" },
    body: { family: "Karla", weights: "400;500;600;700" },
  },
  {
    display: { family: "Italiana", weights: "400" },
    body: { family: "Work Sans", weights: "400;500;600" },
  },
] as const;

// ---------------------------------------------------------------------------
// Shape personalities (corner radii, in rem). Override Tailwind radius tokens.
// ---------------------------------------------------------------------------

interface ShapeScale {
  name: string;
  lg: number;
  xl: number;
  "2xl": number;
  "3xl": number;
}

const SHAPES: readonly ShapeScale[] = [
  { name: "Crisp", lg: 0.3, xl: 0.4, "2xl": 0.55, "3xl": 0.8 },
  { name: "Balanced", lg: 0.5, xl: 0.75, "2xl": 1, "3xl": 1.5 },
  { name: "Soft", lg: 0.7, xl: 1, "2xl": 1.4, "3xl": 2 },
  { name: "Pillowy", lg: 0.9, xl: 1.3, "2xl": 1.8, "3xl": 2.6 },
] as const;

// ---------------------------------------------------------------------------
// Theme assembly
// ---------------------------------------------------------------------------

export interface Theme {
  seed: string;
  archetype: string;
  shape: string;
  fonts: { display: string; body: string };
  fontHref: string;
  vars: Record<string, string>;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
}

function fontHref(pairing: Pairing): string {
  const fam = (f: FontSpec) =>
    `family=${f.family.replace(/ /g, "+")}:wght@${f.weights}`;
  return `https://fonts.googleapis.com/css2?${fam(pairing.display)}&${fam(
    pairing.body,
  )}&display=swap`;
}

export const DEFAULT_SEED = "masaze";

export function generateTheme(seed: string): Theme {
  const rng = new Rng(seed || DEFAULT_SEED);

  const arch = rng.pick(ARCHETYPES);
  const pairing = rng.pick(PAIRINGS);
  const shape = rng.pick(SHAPES);

  // Neutrals share a single hue for a cohesive base.
  const nHue = arch.neutralHue + rng.range(-6, 6);
  const nSat = rng.range(arch.neutralSat[0], arch.neutralSat[1]);

  // Accents.
  const pHue = rng.range(arch.primaryHue[0], arch.primaryHue[1]);
  const pSat = rng.range(arch.primarySat[0], arch.primarySat[1]);
  const pL = rng.range(47, 55);

  // Secondary: a muted botanical sage-green — the natural wellness companion to
  // the primary. Adds tonal variety (rose + green) instead of a single-hue
  // palette, and reads perfectly on leaves / sprigs.
  const sHue = rng.range(120, 152);
  const sSat = rng.range(16, 26);
  const sL = rng.range(42, 48);

  const vars: Record<string, string> = {
    // Neutrals (fixed lightness keeps contrast reliable across seeds).
    "--color-cream": hsl(nHue, nSat * 0.85, 96),
    "--color-sand": hsl(nHue, nSat, 90),
    "--color-sand-dark": hsl(nHue, nSat, 80),
    "--color-bark": hsl(nHue, Math.min(nSat + 6, 24), 20),
    "--color-stone": hsl(nHue, Math.min(nSat, 18), 44),
    // Primary accent.
    "--color-clay": hsl(pHue, pSat, pL),
    "--color-clay-dark": hsl(pHue, Math.min(pSat + 4, 60), pL - 12),
    // Secondary accent.
    "--color-sage": hsl(sHue, sSat, sL),
    "--color-sage-dark": hsl(sHue, Math.min(sSat + 4, 50), sL - 11),
    // Fonts.
    "--font-display": `'${pairing.display.family}'`,
    "--font-body": `'${pairing.body.family}'`,
    // Shapes.
    "--radius-lg": `${shape.lg}rem`,
    "--radius-xl": `${shape.xl}rem`,
    "--radius-2xl": `${shape["2xl"]}rem`,
    "--radius-3xl": `${shape["3xl"]}rem`,
  };

  return {
    seed: seed || DEFAULT_SEED,
    archetype: arch.name,
    shape: shape.name,
    fonts: { display: pairing.display.family, body: pairing.body.family },
    fontHref: fontHref(pairing),
    vars,
  };
}

// "Teplé ticho" — the hand-tuned warm-natural-wellness preset that ships
// with the site. Aesop / Susanne Kaufmann territory: oat + linen
// backgrounds, espresso text, dusty clay-rose primary, muted eucalyptus
// sage accent, Fraunces (light/regular serif) + Hanken Grotesk (humanist
// sans). Generated themes via `generateTheme(seed)` still work for the
// preview script — but the live site renders this fixed palette.
const WARM_SILENCE_THEME: Theme = {
  seed: "warm-silence",
  archetype: "Warm Silence",
  shape: "Balanced",
  fonts: { display: "Fraunces", body: "Hanken Grotesk" },
  fontHref:
    "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Hanken+Grotesk:wght@400;500;600;700&display=swap",
  vars: {
    // Neutrals — warm oat / linen base.
    "--color-cream": "hsl(36 25% 93%)",
    "--color-sand": "hsl(34 22% 86%)",
    "--color-sand-dark": "hsl(32 18% 75%)",
    "--color-bark": "hsl(22 25% 18%)",
    "--color-stone": "hsl(25 14% 42%)",
    // Primary — dusty clay rose, lighter / dustier than the previous mauve.
    "--color-clay": "hsl(8 30% 55%)",
    "--color-clay-dark": "hsl(8 36% 42%)",
    // Secondary — muted eucalyptus sage, used very sparingly.
    "--color-sage": "hsl(130 14% 50%)",
    "--color-sage-dark": "hsl(130 17% 36%)",
    // Fonts.
    "--font-display": "'Fraunces'",
    "--font-body": "'Hanken Grotesk'",
    // Shape — Balanced (existing scale).
    "--radius-lg": "0.5rem",
    "--radius-xl": "0.75rem",
    "--radius-2xl": "1rem",
    "--radius-3xl": "1.5rem",
  },
};

export function getTheme(): Theme {
  return WARM_SILENCE_THEME;
}
