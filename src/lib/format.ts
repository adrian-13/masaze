// Slovak-language display helpers.

export const WEEKDAYS_SK = [
  "Nedeľa",
  "Pondelok",
  "Utorok",
  "Streda",
  "Štvrtok",
  "Piatok",
  "Sobota",
];

export const WEEKDAYS_SK_SHORT = ["Ne", "Po", "Ut", "St", "Št", "Pi", "So"];

// Weekday order for the UI: Monday first, Sunday last.
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const priceFormatter = new Intl.NumberFormat("sk-SK", {
  style: "currency",
  currency: "EUR",
});

export function formatPrice(eur: number): string {
  return priceFormatter.format(eur);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function dateFromISO(dateISO: string): Date {
  // Noon UTC keeps the calendar day stable across timezones.
  return new Date(`${dateISO}T12:00:00Z`);
}

export function formatDateLong(dateISO: string): string {
  return new Intl.DateTimeFormat("sk-SK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateFromISO(dateISO));
}

export function formatDateShort(dateISO: string): string {
  return new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(dateFromISO(dateISO));
}

export interface OpeningHoursGroup {
  days: string;
  hours: string;
}

// Turns availability windows into a compact, public-facing opening-hours list,
// grouping consecutive weekdays that share the same hours (Mon-first order).
// e.g. [{ days: "Pondelok – Piatok", hours: "09:00–17:00" }, { days: "Sobota – Nedeľa", hours: "Zatvorené" }]
export function formatOpeningHours(
  windows: { weekday: number; startTime: string; endTime: string }[],
): OpeningHoursGroup[] {
  const byDay = new Map<number, string[]>();
  for (const w of windows) {
    const list = byDay.get(w.weekday) ?? [];
    list.push(`${w.startTime}–${w.endTime}`);
    byDay.set(w.weekday, list);
  }
  const perDay = WEEKDAY_ORDER.map((wd) => {
    const list = (byDay.get(wd) ?? []).sort();
    return { wd, hours: list.length > 0 ? list.join(", ") : "Zatvorené" };
  });
  const groups: { days: number[]; hours: string }[] = [];
  for (const d of perDay) {
    const last = groups[groups.length - 1];
    if (last && last.hours === d.hours) last.days.push(d.wd);
    else groups.push({ days: [d.wd], hours: d.hours });
  }
  return groups.map((g) => ({
    days:
      g.days.length === 1
        ? WEEKDAYS_SK[g.days[0]]
        : `${WEEKDAYS_SK[g.days[0]]} – ${WEEKDAYS_SK[g.days[g.days.length - 1]]}`,
    hours: g.hours,
  }));
}
