"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createService,
  updateService,
  deleteService,
  type ActionState,
} from "@/app/admin/actions";

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceEur: number;
  active: boolean;
  sortOrder: number;
}

export function ServiceCreateForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createService,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the inputs after a service is successfully added (form stays open so
  // several services can be added in a row).
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-clay/30 bg-clay/5 px-5 py-4 text-base font-semibold text-clay transition-colors hover:border-clay hover:bg-clay hover:text-cream"
      >
        <span className="text-xl leading-none">+</span> Pridať novú službu
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-sand-dark/60 bg-white/60 p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg text-bark">Pridať službu</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-stone transition-colors hover:text-bark"
        >
          Zrušiť
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2 block">
          <span className="mb-1 block text-sm font-medium text-bark">Názov</span>
          <input name="name" required className="form-input" />
        </label>
        <label className="sm:col-span-2 block">
          <span className="mb-1 block text-sm font-medium text-bark">Popis</span>
          <textarea name="description" rows={2} className="form-input resize-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-bark">Dĺžka (min)</span>
          <input name="durationMin" type="number" min={5} step={5} required className="form-input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-bark">Cena (€)</span>
          <input name="priceEur" type="number" min={0} step="0.5" required className="form-input" />
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
        className="mt-4 rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-cream hover:bg-clay-dark disabled:opacity-50"
      >
        {pending ? "Pridávam…" : "Pridať službu"}
      </button>
    </form>
  );
}

export function ServiceRow({ service }: { service: Service }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateService,
    null,
  );

  return (
    <article
      className={`relative rounded-2xl border border-sand-dark/60 bg-white/60 p-5 ${
        service.active ? "" : "opacity-70 transition-opacity focus-within:opacity-100"
      }`}
    >
      {!service.active && (
        <span className="absolute right-4 top-4 rounded-full bg-stone/15 px-2.5 py-0.5 text-xs font-medium text-stone">
          Neaktívna
        </span>
      )}
      <form action={formAction}>
        <input type="hidden" name="id" value={service.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 block">
            <span className="mb-1 block text-sm font-medium text-bark">Názov</span>
            <input name="name" defaultValue={service.name} required className="form-input" />
          </label>
          <label className="sm:col-span-2 block">
            <span className="mb-1 block text-sm font-medium text-bark">Popis</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={service.description ?? ""}
              className="form-input resize-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-bark">Dĺžka (min)</span>
            <input
              name="durationMin"
              type="number"
              min={5}
              step={5}
              defaultValue={service.durationMin}
              required
              className="form-input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-bark">Cena (€)</span>
            <input
              name="priceEur"
              type="number"
              min={0}
              step="0.5"
              defaultValue={service.priceEur}
              required
              className="form-input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-bark">Poradie</span>
            <input
              name="sortOrder"
              type="number"
              defaultValue={service.sortOrder}
              className="form-input"
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-2">
            <input
              name="active"
              type="checkbox"
              defaultChecked={service.active}
              className="h-4 w-4 accent-clay"
            />
            <span className="text-sm font-medium text-bark">Aktívna (zobraziť na stránke)</span>
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-sand-dark/50 pt-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-clay px-5 py-2 text-sm font-semibold text-cream hover:bg-clay-dark disabled:opacity-50"
          >
            {pending ? "Ukladám…" : "Uložiť"}
          </button>
          {state?.ok && <span className="text-sm text-clay">Uložené ✓</span>}
          {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
        </div>
      </form>

      <form action={deleteService} className="mt-2">
        <input type="hidden" name="id" value={service.id} />
        <button
          type="submit"
          onClick={(e) => {
            if (!confirm(`Naozaj vymazať službu „${service.name}"?`)) {
              e.preventDefault();
            }
          }}
          className="text-sm text-stone transition-colors hover:text-red-700"
        >
          Vymazať službu
        </button>
      </form>
    </article>
  );
}
