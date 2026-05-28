"use client";

import { useActionState } from "react";
import { saveSettings, type ActionState } from "@/app/admin/actions";
import type { Settings } from "@/lib/settings";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveSettings,
    null,
  );

  return (
    <form action={formAction} className="space-y-8">
      <Section title="Profil a obsah stránky">
        <Text name="businessName" label="Názov / značka" defaultValue={settings.businessName} />
        <Text name="ownerName" label="Meno maséra/masérky" defaultValue={settings.ownerName} />
        <Text
          name="tagline"
          label="Hlavný slogan (hero)"
          defaultValue={settings.tagline}
          full
        />
        <Text name="aboutTitle" label="Nadpis sekcie „O mne“" defaultValue={settings.aboutTitle} />
        <Text name="phone" label="Telefón" defaultValue={settings.phone} />
        <Text name="email" label="E-mail" defaultValue={settings.email} />
        <Text name="address" label="Adresa" defaultValue={settings.address} full />
        <Area name="aboutText" label="Text „O mne“" defaultValue={settings.aboutText} />
        <Area name="bookingIntro" label="Úvodný text na stránke rezervácie" defaultValue={settings.bookingIntro} />
        <Text
          name="logoImage"
          label="Logo (URL)"
          defaultValue={settings.logoImage}
          full
          hint="Odkaz na logo alebo súbor v /public (napr. /logo.png). Prázdne = bez loga, len text značky."
        />
        <Text
          name="heroImage"
          label="Obrázok v úvode (URL)"
          defaultValue={settings.heroImage}
          full
          hint="Odkaz na fotku alebo súbor v /public (napr. /hero.jpg). Prázdne = ozdobný motív."
        />
        <Text
          name="aboutImage"
          label="Fotka v sekcii „O mne“ (URL)"
          defaultValue={settings.aboutImage}
          full
          hint="Najlepšie fotka na výšku. Prázdne = bez fotky."
        />
        <Text name="instagramUrl" label="Instagram URL" defaultValue={settings.instagramUrl} />
        <Text name="facebookUrl" label="Facebook URL" defaultValue={settings.facebookUrl} />
      </Section>

      <Section title="Pravidlá rezervácií">
        <Text
          name="slotIntervalMin"
          label="Krok ponúkaných termínov (min)"
          type="number"
          defaultValue={settings.slotIntervalMin}
          hint="Napr. 30 = termíny každých 30 minút."
        />
        <Text
          name="bufferMin"
          label="Prestávka medzi masážami (min)"
          type="number"
          defaultValue={settings.bufferMin}
          hint="Čas na upratanie a prípravu."
        />
        <Text
          name="leadTimeHours"
          label="Najskôr koľko hodín vopred (hod)"
          type="number"
          defaultValue={settings.leadTimeHours}
          hint="Koľko hodín dopredu sa dá rezervovať."
        />
        <Text
          name="maxAdvanceDays"
          label="Najviac koľko dní dopredu (dni)"
          type="number"
          defaultValue={settings.maxAdvanceDays}
        />
      </Section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-clay px-7 py-2.5 text-sm font-semibold text-cream hover:bg-clay-dark disabled:opacity-50"
        >
          {pending ? "Ukladám…" : "Uložiť nastavenia"}
        </button>
        {state?.ok && <span className="text-sm text-clay">Uložené ✓</span>}
        {state?.error && <span className="text-sm text-red-700">{state.error}</span>}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-sand-dark/60 bg-white/60 p-6">
      <h2 className="text-lg text-bark">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Text({
  name,
  label,
  defaultValue,
  type = "text",
  full = false,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
  full?: boolean;
  hint?: string;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-sm font-medium text-bark">{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} className="form-input" />
      {hint && <span className="mt-1 block text-xs text-stone">{hint}</span>}
    </label>
  );
}

function Area({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="block sm:col-span-2">
      <span className="mb-1 block text-sm font-medium text-bark">{label}</span>
      <textarea name={name} rows={4} defaultValue={defaultValue} className="form-input resize-none" />
    </label>
  );
}
