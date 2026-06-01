import { prisma } from "@/lib/prisma";

// All site content and booking rules live in the Setting key/value table so the
// masseuse can edit them from the admin panel without touching code.

export const DEFAULT_SETTINGS = {
  // Business profile / page content
  businessName: "Masáže Patrícia",
  ownerName: "Patrícia",
  tagline: "Uvoľnite napätie. Obnovte energiu. Doprajte si *čas pre seba*.",
  heroIntro:
    "Profesionálne masáže v príjemnom a diskrétnom prostredí. Ako vyštudovaná a certifikovaná masérka sa zameriavam na individuálny prístup a starostlivosť, ktorá pomáha telu regenerovať a mysli nájsť rovnováhu.",
  aboutTitle: "O mne",
  aboutText:
    "Volám sa Patrícia a venujem sa masážam ako vyštudovaná a certifikovaná masérka. Verím, že kvalitná masáž dokáže uvoľniť nielen telo, ale aj myseľ. Ku každému klientovi pristupujem individuálne a s rešpektom k jeho potrebám.",
  phone: "+421 904 270 869",
  email: "kontakt@masazepatricia.sk",
  address: "Diviaky nad Nitricou 201",
  instagramUrl: "",
  facebookUrl: "",
  // URL of the brand logo. Empty = fallback to a plain text wordmark. Can be
  // an absolute URL or a file in /public. Ships expecting public/logo.png.
  logoImage: "/logo.png",
  // URL of the hero photo, shown inside the arch. Empty = a themed illustrated
  // placeholder. Can be an absolute URL or a file in /public. Ships with a
  // replaceable stock photo (public/hero.jpg).
  heroImage: "/hero.jpg",
  // Optional photo for the "O mne" section (portrait works best). Empty = no
  // photo shown. Ships with a replaceable stock photo (public/about.jpg).
  aboutImage: "/about.jpg",
  bookingIntro:
    "Vyberte si masáž, deň a voľný čas. Po odoslaní sa vám čoskoro ozvem.",

  // Booking rules (stored as strings, parsed to numbers where needed)
  slotIntervalMin: "30",
  bufferMin: "15",
  leadTimeHours: "12",
  maxAdvanceDays: "60",
};

export type SettingsKey = keyof typeof DEFAULT_SETTINGS;
export type Settings = Record<SettingsKey, string>;

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const result = { ...DEFAULT_SETTINGS } as Settings;
  for (const key of Object.keys(DEFAULT_SETTINGS) as SettingsKey[]) {
    const value = map.get(key);
    if (value !== undefined) result[key] = value;
  }
  return result;
}

export interface BookingRules {
  slotIntervalMin: number;
  bufferMin: number;
  leadTimeHours: number;
  maxAdvanceDays: number;
}

export function bookingRulesFrom(settings: Settings): BookingRules {
  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    slotIntervalMin: num(settings.slotIntervalMin, 30) || 30,
    bufferMin: num(settings.bufferMin, 0),
    leadTimeHours: num(settings.leadTimeHours, 0),
    maxAdvanceDays: num(settings.maxAdvanceDays, 60) || 60,
  };
}

export async function updateSettings(partial: Partial<Settings>): Promise<void> {
  const entries = Object.entries(partial).filter(([key]) =>
    Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key),
  );
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: value ?? "" },
        update: { value: value ?? "" },
      }),
    ),
  );
}
