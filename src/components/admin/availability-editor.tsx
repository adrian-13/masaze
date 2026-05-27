"use client";

import { useActionState } from "react";
import { addAvailability, deleteAvailability, type ActionState } from "@/app/admin/actions";
import { WEEKDAYS_SK, WEEKDAY_ORDER } from "@/lib/format";

interface Window {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

// Selectable times every 30 min from 06:00 to 22:00 — replaces the native
// time picker for a consistent, themed look.
const TIME_OPTIONS = (() => {
  const out: string[] = [];
  for (let m = 6 * 60; m <= 22 * 60; m += 30) {
    out.push(
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
    );
  }
  return out;
})();

export function AvailabilityEditor({ windows }: { windows: Window[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addAvailability,
    null,
  );

  const byDay = new Map<number, Window[]>();
  for (const w of windows) {
    const list = byDay.get(w.weekday) ?? [];
    list.push(w);
    byDay.set(w.weekday, list);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[20rem_1fr] lg:gap-12">
      <form
        action={formAction}
        className="self-start rounded-2xl border border-sand-dark/60 bg-white/60 p-5"
      >
        <h2 className="text-lg text-bark">Pridať pracovný čas</h2>
        <p className="mt-1 text-sm text-stone">
          Pridajte deň a časové okno, kedy prijímate klientov.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-bark">Deň</span>
          <select name="weekday" defaultValue={1} className="form-input">
            {WEEKDAY_ORDER.map((wd) => (
              <option key={wd} value={wd}>
                {WEEKDAYS_SK[wd]}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-bark">Od</span>
            <select name="startTime" defaultValue="09:00" required className="form-input">
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-bark">Do</span>
            <select name="endTime" defaultValue="17:00" required className="form-input">
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        {state?.error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-clay-dark disabled:opacity-50"
        >
          {pending ? "Pridávam…" : "Pridať pracovný čas"}
        </button>
      </form>

      <div className="divide-y divide-sand-dark/50 overflow-hidden rounded-2xl border border-sand-dark/60 bg-white/50">
        {WEEKDAY_ORDER.map((wd) => {
          const list = (byDay.get(wd) ?? []).sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          );
          const closed = list.length === 0;
          return (
            <div
              key={wd}
              className={`flex flex-wrap items-center gap-3 px-5 py-4 ${
                closed ? "opacity-70" : ""
              }`}
            >
              <span className="w-24 font-medium text-bark">{WEEKDAYS_SK[wd]}</span>
              {closed ? (
                <span className="text-sm italic text-stone/80">Zatvorené</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {list.map((w) => (
                    <span
                      key={w.id}
                      className="inline-flex items-center gap-2 rounded-full bg-clay/10 py-1 pl-3 pr-1.5 text-sm font-medium text-clay-dark"
                    >
                      {w.startTime}–{w.endTime}
                      <form action={deleteAvailability} className="inline-flex">
                        <input type="hidden" name="id" value={w.id} />
                        <button
                          type="submit"
                          aria-label="Odstrániť"
                          className="grid h-5 w-5 place-items-center rounded-full text-clay/70 transition-colors hover:bg-clay/20 hover:text-clay-dark"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                          </svg>
                        </button>
                      </form>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
