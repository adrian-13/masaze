"use client";

import { useActionState } from "react";
import { addBlockedDate, deleteBlockedDate, type ActionState } from "@/app/admin/actions";
import { formatDateLong } from "@/lib/format";

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

export function BlockedDatesManager({
  dates,
  minDate,
}: {
  dates: BlockedDate[];
  minDate: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addBlockedDate,
    null,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form
        action={formAction}
        className="rounded-2xl border border-sand-dark/60 bg-white/60 p-5 lg:col-span-1"
      >
        <h2 className="text-lg text-bark">Zablokovať deň</h2>
        <p className="mt-1 text-sm text-stone">
          V tieto dni nebude možné rezervovať (dovolenka, sviatok…).
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-bark">Dátum</span>
          <input name="date" type="date" min={minDate} required className="form-input" />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-bark">Dôvod (nepovinné)</span>
          <input name="reason" className="form-input" placeholder="napr. dovolenka" />
        </label>
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
          {pending ? "Pridávam…" : "Zablokovať deň"}
        </button>
      </form>

      <div className="lg:col-span-2">
        {dates.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-sand-dark/70 px-5 py-8 text-center text-stone">
            Žiadne blokované dni.
          </p>
        ) : (
          <ul className="space-y-2">
            {dates.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-sand-dark/60 bg-white/60 px-5 py-3"
              >
                <span className="text-bark">
                  {formatDateLong(d.date)}
                  {d.reason && <span className="ml-2 text-sm text-stone">· {d.reason}</span>}
                </span>
                <form action={deleteBlockedDate}>
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="text-sm text-stone hover:text-red-700">
                    Odblokovať
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
