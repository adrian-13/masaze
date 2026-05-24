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
