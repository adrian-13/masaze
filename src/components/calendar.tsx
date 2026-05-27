"use client";

import { useEffect, useRef, useState } from "react";

const WEEKDAYS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];
const MONTHS = [
  "Január", "Február", "Marec", "Apríl", "Máj", "Jún",
  "Júl", "August", "September", "Október", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const monthKey = (y: number, m: number) => y * 12 + (m - 1);

// 0 = Monday … 6 = Sunday (grid is Monday-first).
function weekdayMondayFirst(y: number, m: number, d: number): number {
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}
function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

interface CalendarProps {
  /** Highlighted selection (single date), "YYYY-MM-DD". */
  selected?: string | null;
  /** Earliest selectable/navigable date. Days before are disabled. */
  minDate?: string;
  /** Latest selectable/navigable date. Days after are disabled. */
  maxDate?: string;
  /** If set, only these dates are selectable; others in range are shown muted. */
  selectableDates?: ReadonlySet<string>;
  /** Dates to mark visually (e.g. blocked days in admin). */
  markedDates?: ReadonlySet<string>;
  /** Called with the clicked date when it is selectable. */
  onSelect: (dateISO: string) => void;
  /** Called whenever the visible month changes (month is 1-based). */
  onMonthChange?: (year: number, month: number) => void;
  /** End of a selected range (`selected` is the start); highlights the span. */
  rangeEnd?: string | null;
  /** Hovered day, for live range preview while picking. */
  onDayHover?: (dateISO: string | null) => void;
  /** Dim the grid while data loads. */
  loading?: boolean;
}

export function Calendar({
  selected,
  minDate,
  maxDate,
  selectableDates,
  markedDates,
  onSelect,
  onMonthChange,
  rangeEnd,
  onDayHover,
  loading = false,
}: CalendarProps) {
  const [view, setView] = useState(() => {
    const base = selected || minDate || isoOf(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      new Date().getDate(),
    );
    const [y, m] = base.split("-").map(Number);
    return { year: y, month: m };
  });

  // Notify the parent about the visible month. The callback is kept in a ref so
  // the notifying effect only re-runs when the month actually changes (not on
  // every parent re-render, which would loop).
  const onMonthChangeRef = useRef(onMonthChange);
  useEffect(() => {
    onMonthChangeRef.current = onMonthChange;
  }, [onMonthChange]);
  useEffect(() => {
    onMonthChangeRef.current?.(view.year, view.month);
  }, [view.year, view.month]);

  const curKey = monthKey(view.year, view.month);
  const minKey = minDate
    ? monthKey(Number(minDate.slice(0, 4)), Number(minDate.slice(5, 7)))
    : -Infinity;
  const maxKey = maxDate
    ? monthKey(Number(maxDate.slice(0, 4)), Number(maxDate.slice(5, 7)))
    : Infinity;
  const canPrev = curKey > minKey;
  const canNext = curKey < maxKey;

  function shift(delta: number) {
    const next = curKey + delta;
    setView({ year: Math.floor(next / 12), month: (next % 12) + 1 });
  }

  const dim = daysInMonth(view.year, view.month);
  const lead = weekdayMondayFirst(view.year, view.month, 1);
  const todayISO = isoOf(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate(),
  );

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ];

  // Selected range endpoints (selected = start, rangeEnd = end). Either order is
  // accepted; normalise to lo..hi. With no rangeEnd, lo === hi === selected.
  const rangeLo =
    selected && rangeEnd ? (rangeEnd < selected ? rangeEnd : selected) : selected ?? null;
  const rangeHi =
    selected && rangeEnd ? (rangeEnd < selected ? selected : rangeEnd) : selected ?? null;

  return (
    <div className="mx-auto w-[24rem] max-w-full">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canPrev}
          aria-label="Predchádzajúci mesiac"
          className="grid h-9 w-9 place-items-center rounded-full text-bark transition-colors hover:bg-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="font-serif text-xl text-bark">
          {MONTHS[view.month - 1]} {view.year}
        </span>
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={!canNext}
          aria-label="Nasledujúci mesiac"
          className="grid h-9 w-9 place-items-center rounded-full text-bark transition-colors hover:bg-sand focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-medium uppercase tracking-wide text-stone">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1">{w}</span>
        ))}
      </div>

      <div className="relative mt-1">
      <div
        onMouseLeave={() => onDayHover?.(null)}
        className={`grid grid-cols-7 gap-1.5 transition-opacity ${
          loading ? "pointer-events-none opacity-30" : ""
        }`}
      >
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const dateISO = isoOf(view.year, view.month, day);
          const before = minDate ? dateISO < minDate : false;
          const after = maxDate ? dateISO > maxDate : false;
          const inRange = !before && !after;
          const selectable =
            inRange && (selectableDates ? selectableDates.has(dateISO) : true);
          const isMarked = markedDates?.has(dateISO);
          const isToday = dateISO === todayISO;
          const isEndpoint = dateISO === rangeLo || dateISO === rangeHi;
          const inSelection =
            !!rangeLo && !!rangeHi && dateISO >= rangeLo && dateISO <= rangeHi;
          // In booking mode, days listed in selectableDates are the bookable
          // ones — give them a soft fill so they clearly stand out from the rest.
          const explicitlyAvailable = !!selectableDates && selectable;

          let cls = "text-stone/30"; // out of range / unavailable
          if (selectable) {
            if (isEndpoint) {
              cls = "bg-clay text-cream font-semibold";
            } else if (inSelection) {
              cls = "bg-clay/20 text-clay-dark";
            } else if (isMarked) {
              cls = "bg-clay/15 text-clay-dark font-medium ring-1 ring-clay/30 hover:bg-clay/25";
            } else if (explicitlyAvailable) {
              cls = "bg-clay/10 font-medium text-bark hover:bg-clay/25";
            } else {
              cls = "text-bark hover:bg-sand";
            }
          }

          return (
            <button
              key={dateISO}
              type="button"
              disabled={!selectable}
              onClick={() => selectable && onSelect(dateISO)}
              onMouseEnter={() => selectable && onDayHover?.(dateISO)}
              className={`relative aspect-square rounded-full text-base transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/50 ${cls} ${
                !selectable && !isEndpoint ? "cursor-default" : ""
              }`}
            >
              {day}
              {isToday && !isEndpoint && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-clay/60" />
              )}
            </button>
          );
        })}
      </div>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-center gap-2 rounded-full border border-sand-dark/60 bg-cream/95 px-4 py-2 text-sm font-medium text-stone shadow-sm">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-clay/30 border-t-clay"
                aria-hidden
              />
              Načítavam voľné dni…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
