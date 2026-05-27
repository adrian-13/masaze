"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  type ActionState,
} from "@/app/admin/actions";

interface Testimonial {
  id: string;
  author: string;
  text: string;
  active: boolean;
  sortOrder: number;
}

export function TestimonialCreateForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createTestimonial,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

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
        <span className="text-xl leading-none">+</span> Pridať ohlas
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
        <h2 className="text-lg text-bark">Pridať ohlas</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-stone transition-colors hover:text-bark"
        >
          Zrušiť
        </button>
      </div>
      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-bark">Meno klienta</span>
        <input name="author" required placeholder="napr. Jana K." className="form-input" />
      </label>
      <label className="mt-3 block">
        <span className="mb-1 block text-sm font-medium text-bark">Text ohlasu</span>
        <textarea name="text" rows={3} required className="form-input resize-none" />
      </label>
      {state?.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-clay-dark disabled:opacity-50"
      >
        {pending ? "Pridávam…" : "Pridať ohlas"}
      </button>
    </form>
  );
}

export function TestimonialRow({ testimonial }: { testimonial: Testimonial }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateTestimonial,
    null,
  );

  return (
    <article
      className={`relative rounded-2xl border border-sand-dark/60 bg-white/60 p-5 ${
        testimonial.active ? "" : "opacity-70 transition-opacity focus-within:opacity-100"
      }`}
    >
      {!testimonial.active && (
        <span className="absolute right-4 top-4 rounded-full bg-stone/15 px-2.5 py-0.5 text-xs font-medium text-stone">
          Neaktívny
        </span>
      )}
      <form action={formAction}>
        <input type="hidden" name="id" value={testimonial.id} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-bark">Meno klienta</span>
          <input name="author" defaultValue={testimonial.author} required className="form-input" />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium text-bark">Text ohlasu</span>
          <textarea
            name="text"
            rows={3}
            defaultValue={testimonial.text}
            required
            className="form-input resize-none"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="block w-28">
            <span className="mb-1 block text-sm font-medium text-bark">Poradie</span>
            <input
              name="sortOrder"
              type="number"
              defaultValue={testimonial.sortOrder}
              className="form-input"
            />
          </label>
          <label className="flex items-center gap-2 pb-2.5">
            <input
              name="active"
              type="checkbox"
              defaultChecked={testimonial.active}
              className="h-4 w-4 accent-clay"
            />
            <span className="text-sm font-medium text-bark">Zobraziť na stránke</span>
          </label>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-sand-dark/50 pt-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-clay px-5 py-2 text-sm font-semibold text-cream transition-colors hover:bg-clay-dark disabled:opacity-50"
          >
            {pending ? "Ukladám…" : "Uložiť"}
          </button>
          {state?.ok && <span className="text-sm text-clay">Uložené ✓</span>}
          {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
        </div>
      </form>

      <form action={deleteTestimonial} className="mt-2">
        <input type="hidden" name="id" value={testimonial.id} />
        <button
          type="submit"
          onClick={(e) => {
            if (!confirm(`Naozaj vymazať ohlas od „${testimonial.author}"?`)) {
              e.preventDefault();
            }
          }}
          className="text-sm text-stone transition-colors hover:text-red-700"
        >
          Vymazať ohlas
        </button>
      </form>
    </article>
  );
}
