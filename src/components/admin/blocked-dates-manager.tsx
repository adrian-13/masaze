"use client";

import { useState, useTransition } from "react";
import { addBlockedRange, deleteBlockedRange } from "@/app/admin/actions";
import { Calendar } from "@/components/calendar";
import { formatDateLong, formatDateShort } from "@/lib/format";
import { addDaysISO } from "@/lib/time";

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

function daysInclusive(a: string, b: string): number {
  const toUTC = (s: string) =>
    Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000) + 1;
}

export function BlockedDatesManager({
  dates,
  minDate,
}: {
  dates: BlockedDate[];
  minDate: string;
}) {
  const [pending, startTransition] = useTransition();
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const blockedSet = new Set(dates.map((d) => d.date));

  // Calendar clicks: first sets the start, second sets the end; a third starts over.
  function onSelectDay(date: string) {
    setError(null);
    if (!start || (start && end)) {
      setStart(date);
      setEnd(null);
    } else {
      setEnd(date);
    }
  }

  // Live preview end follows the hovered day until the end is locked in.
  const displayEnd = end ?? (start && !end ? hover : null);

  function clearSelection() {
    setStart(null);
    setEnd(null);
    setHover(null);
    setError(null);
  }

  function blockSelection() {
    if (!start) return;
    const other = end ?? start;
    const lo = other < start ? other : start;
    const hi = other < start ? start : other;
    const r = reason.trim();
    startTransition(async () => {
      const fd = new FormData();
      fd.set("startDate", lo);
      fd.set("endDate", hi);
      fd.set("reason", r);
      const res = await addBlockedRange(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setStart(null);
      setEnd(null);
      setHover(null);
      setReason("");
    });
  }

  function unblockRange(rs: string, re: string, count: number) {
    if (count > 1) {
      const label = `${formatDateShort(rs)} – ${formatDateShort(re)} (${count} dní)`;
      if (!window.confirm(`Naozaj odblokovať celé obdobie ${label}?`)) return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("startDate", rs);
      fd.set("endDate", re);
      await deleteBlockedRange(fd);
    });
  }

  // Group consecutive blocked days that share a reason into periods.
  const sorted = [...dates].sort((a, b) => a.date.localeCompare(b.date));
  const groups: BlockedDate[][] = [];
  for (const d of sorted) {
    const cur = groups[groups.length - 1];
    const prev = cur?.[cur.length - 1];
    if (prev && addDaysISO(prev.date, 1) === d.date && (prev.reason ?? "") === (d.reason ?? "")) {
      cur.push(d);
    } else {
      groups.push([d]);
    }
  }

  // Summary of the current calendar selection.
  let summary = "Kliknite na začiatok obdobia v kalendári.";
  if (start && (end || displayEnd)) {
    const other = (end ?? displayEnd)!;
    const lo = other < start ? other : start;
    const hi = other < start ? start : other;
    summary = `${formatDateShort(lo)} – ${formatDateShort(hi)} · ${daysInclusive(lo, hi)} dní`;
  } else if (start) {
    summary = `${formatDateLong(start)} — kliknite na koniec, alebo zablokujte len tento deň.`;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-14">
      <div>
        <div className="rounded-2xl border border-sand-dark/60 bg-white/60 p-5">
          <Calendar
            minDate={minDate}
            maxDate={addDaysISO(minDate, 730)}
            markedDates={blockedSet}
            selected={start}
            rangeEnd={displayEnd}
            onSelect={onSelectDay}
            onDayHover={setHover}
            loading={pending}
          />
        </div>
        <p className="mt-3 max-w-sm text-sm text-stone">
          Vyberte obdobie kliknutím na <strong className="font-medium text-bark">začiatok</strong> a
          potom <strong className="font-medium text-bark">koniec</strong> (alebo dvakrát ten istý deň
          pre jeden deň). Už blokované dni sú zvýraznené.
        </p>
      </div>

      <div className="space-y-8">
        {/* Selection → block */}
        <div className="rounded-2xl border border-sand-dark/60 bg-white/60 p-5">
          <h2 className="text-lg text-bark">Zablokovať obdobie</h2>
          <p className="mt-1 text-sm text-stone">{summary}</p>
          <label className="mt-4 block max-w-xs">
            <span className="mb-1 block text-sm font-medium text-bark">Dôvod (nepovinné)</span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="dovolenka"
              className="form-input"
            />
          </label>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={blockSelection}
              disabled={!start || pending}
              className="rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Blokujem…" : "Zablokovať"}
            </button>
            {start && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-sm text-stone transition-colors hover:text-bark"
              >
                Zrušiť výber
              </button>
            )}
          </div>
        </div>

        {/* Blocked periods */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone">
            Blokované dni
          </h2>
          {groups.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-sand-dark/70 px-5 py-8 text-center text-stone">
              Žiadne blokované dni.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-sand-dark/50 border-y border-sand-dark/50">
              {groups.map((group) => {
                const rs = group[0].date;
                const re = group[group.length - 1].date;
                const single = rs === re;
                const reasonText = group[0].reason;
                return (
                  <li key={rs} className="flex items-center justify-between gap-3 py-3.5">
                    <span className="text-bark">
                      {single
                        ? formatDateLong(rs)
                        : `${formatDateShort(rs)} – ${formatDateShort(re)}`}
                      {!single && (
                        <span className="ml-2 text-sm text-stone">({group.length} dní)</span>
                      )}
                      {reasonText && (
                        <span className="ml-2 text-sm text-stone">· {reasonText}</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => unblockRange(rs, re, group.length)}
                      disabled={pending}
                      className="shrink-0 text-sm text-stone transition-colors hover:text-red-700 disabled:opacity-50"
                    >
                      Odblokovať
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
