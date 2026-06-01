"use client";

import { useActionState } from "react";
import { login, type ActionState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    login,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-bark">
          Heslo
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="form-input"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-clay px-6 py-3 text-sm font-semibold leading-none text-cream shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-clay-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 disabled:opacity-50"
      >
        {pending ? "Prihlasujem…" : "Prihlásiť sa"}
      </button>
    </form>
  );
}
