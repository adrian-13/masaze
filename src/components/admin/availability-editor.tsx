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
    <div className="grid gap-6 lg:grid-cols-3">
      <form
        action={formAction}
        className="rounded-2xl border border-sand-dark/60 bg-white/60 p-5 lg:col-span-1"
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
            <input name="startTime" type="time" defaultValue="09:00" required className="form-input" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-bark">Do</span>
            <input name="endTime" type="time" defaultValue="17:00" required className="form-input" />
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
          className="mt-4 w-full rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-cream hover:bg-clay-dark disabled:opacity-50"
        >
          {pending ? "Pridávam…" : "Pridať"}
        </button>
      </form>

      <div className="space-y-3 lg:col-span-2">
        {WEEKDAY_ORDER.map((wd) => {
          const list = (byDay.get(wd) ?? []).sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          );
          return (
            <div
              key={wd}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-sand-dark/60 bg-white/60 px-5 py-4"
            >
              <span className="w-24 font-medium text-bark">{WEEKDAYS_SK[wd]}</span>
              {list.length === 0 ? (
                <span className="text-sm text-stone">Zatvorené</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {list.map((w) => (
                    <span
                      key={w.id}
                      className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-sm text-bark"
                    >
                      {w.startTime}–{w.endTime}
                      <form action={deleteAvailability} className="inline">
                        <input type="hidden" name="id" value={w.id} />
                        <button
                          type="submit"
                          aria-label="Odstrániť"
                          className="text-stone hover:text-red-700"
                        >
                          ✕
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
