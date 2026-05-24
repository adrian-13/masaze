"use client";

import { useRef, useState } from "react";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/format";

interface ServiceOption {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceEur: number;
}

interface BookingFormProps {
  services: ServiceOption[];
  intro: string;
  initialServiceId?: string;
  minDate: string;
  maxDate: string;
}

interface SuccessSummary {
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
}

const REASON_MESSAGES: Record<string, string> = {
  closed: "V tento deň nepracujem. Vyberte si, prosím, iný deň.",
  blocked: "Tento deň je nedostupný (dovolenka / sviatok).",
  full: "V tento deň sú už všetky termíny obsadené.",
  past: "Tento dátum už nie je možné rezervovať.",
  "too-far": "Tento dátum je príliš ďaleko. Vyberte si, prosím, skorší termín.",
  invalid: "Neplatný dátum.",
};

export function BookingForm({
  services,
  intro,
  initialServiceId,
  minDate,
  maxDate,
}: BookingFormProps) {
  const preselected =
    initialServiceId && services.some((s) => s.id === initialServiceId)
      ? initialServiceId
      : "";
  const [step, setStep] = useState(preselected ? 2 : 1);
  const [serviceId, setServiceId] = useState(preselected);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsReason, setSlotsReason] = useState<string | undefined>();
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [startTime, setStartTime] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessSummary | null>(null);

  const requestId = useRef(0);
  const selectedService = services.find((s) => s.id === serviceId);

  // Fetch available slots for a service + date. Called from the date picker so
  // we avoid an effect (and the cascading-render it would cause).
  async function loadSlots(svcId: string, dateValue: string) {
    if (!svcId || !dateValue) {
      setSlots(null);
      setSlotsReason(undefined);
      return;
    }
    const id = ++requestId.current;
    setSlotsLoading(true);
    setStartTime("");
    setSlots(null);
    try {
      const res = await fetch(`/api/slots?date=${dateValue}&serviceId=${svcId}`);
      const data: { slots?: string[]; reason?: string } = await res.json();
      if (id !== requestId.current) return;
      setSlots(data.slots ?? []);
      setSlotsReason(data.reason);
    } catch {
      if (id === requestId.current) {
        setSlots([]);
        setSlotsReason("invalid");
      }
    } finally {
      if (id === requestId.current) setSlotsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          date,
          startTime,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          note,
          company,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Niečo sa pokazilo. Skúste to znova.");
        return;
      }
      setSuccess(data.booking);
    } catch {
      setSubmitError("Nepodarilo sa odoslať rezerváciu. Skontrolujte pripojenie.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-sage/40 bg-sage/10 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage text-cream">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-5 text-2xl text-bark">Žiadosť o rezerváciu odoslaná</h2>
        <p className="mt-3 text-stone">
          Ďakujem! Ozvem sa vám s potvrdením termínu.
        </p>
        <div className="mx-auto mt-6 max-w-sm rounded-xl bg-cream p-5 text-left text-sm">
          <p className="font-semibold text-bark">{success.serviceName}</p>
          <p className="mt-1 text-stone">{formatDateLong(success.date)}</p>
          <p className="text-stone">
            {success.startTime} – {success.endTime}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Stepper step={step} />

      {/* Step 1 — service */}
      {step === 1 && (
        <section className="mt-8">
          <h2 className="text-2xl text-bark">1. Vyberte si masáž</h2>
          <p className="mt-2 text-stone">{intro}</p>
          {services.length === 0 ? (
            <p className="mt-6 text-stone">Momentálne nie sú dostupné žiadne služby.</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {services.map((service) => {
                const active = service.id === serviceId;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setServiceId(service.id);
                      setDate("");
                      setSlots(null);
                      setSlotsReason(undefined);
                      setStartTime("");
                      setStep(2);
                    }}
                    className={`rounded-2xl border p-5 text-left transition-colors ${
                      active
                        ? "border-clay bg-clay/5"
                        : "border-sand-dark/60 bg-white/60 hover:border-clay/60"
                    }`}
                  >
                    <span className="block text-lg text-bark">{service.name}</span>
                    {service.description && (
                      <span className="mt-1 block text-sm leading-relaxed text-stone">
                        {service.description}
                      </span>
                    )}
                    <span className="mt-3 flex items-center gap-3 text-sm font-medium text-bark">
                      <span>{formatPrice(service.priceEur)}</span>
                      <span className="text-stone">·</span>
                      <span className="text-stone">{formatDuration(service.durationMin)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Step 2 — date & time */}
      {step === 2 && selectedService && (
        <section className="mt-8">
          <h2 className="text-2xl text-bark">2. Vyberte deň a čas</h2>
          <div className="mt-4 rounded-xl bg-sand/50 px-4 py-3 text-sm text-bark">
            <span className="font-medium">{selectedService.name}</span>
            <span className="text-stone">
              {" "}
              · {formatDuration(selectedService.durationMin)} ·{" "}
              {formatPrice(selectedService.priceEur)}
            </span>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="ml-3 font-medium text-clay hover:underline"
            >
              Zmeniť
            </button>
          </div>

          <div className="mt-6 max-w-xs">
            <label className="block text-sm font-medium text-bark" htmlFor="date">
              Dátum
            </label>
            <input
              id="date"
              type="date"
              min={minDate}
              max={maxDate}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                loadSlots(serviceId, e.target.value);
              }}
              className="mt-2 w-full rounded-lg border border-sand-dark bg-white px-3 py-2.5 text-bark focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/30"
            />
          </div>

          {date && (
            <div className="mt-6">
              <p className="text-sm font-medium text-bark">{formatDateLong(date)}</p>
              {slotsLoading ? (
                <p className="mt-3 text-sm text-stone">Načítavam voľné termíny…</p>
              ) : slots && slots.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setStartTime(slot)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        startTime === slot
                          ? "border-clay bg-clay text-cream"
                          : "border-sand-dark bg-white text-bark hover:border-clay"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-lg bg-sand/60 px-4 py-3 text-sm text-stone">
                  {REASON_MESSAGES[slotsReason ?? "full"] ??
                    "V tento deň nie sú voľné termíny."}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-full border border-sand-dark px-6 py-2.5 text-sm font-semibold text-bark hover:bg-sand"
            >
              Späť
            </button>
            <button
              type="button"
              disabled={!startTime}
              onClick={() => setStep(3)}
              className="rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Pokračovať
            </button>
          </div>
        </section>
      )}

      {/* Step 3 — contact details */}
      {step === 3 && selectedService && (
        <section className="mt-8">
          <h2 className="text-2xl text-bark">3. Vaše údaje</h2>

          <div className="mt-4 rounded-xl bg-sand/50 px-4 py-3 text-sm text-bark">
            <span className="font-medium">{selectedService.name}</span>
            <span className="text-stone">
              {" "}
              · {formatDateLong(date)} · {startTime}
            </span>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="ml-3 font-medium text-clay hover:underline"
            >
              Zmeniť
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Meno a priezvisko" className="sm:col-span-2">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                autoComplete="name"
              />
            </Field>
            <Field label="E-mail">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                autoComplete="email"
              />
            </Field>
            <Field label="Telefón">
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                autoComplete="tel"
              />
            </Field>
            <Field label="Poznámka (nepovinné)" className="sm:col-span-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="form-input resize-none"
              />
            </Field>

            {/* Honeypot */}
            <div className="hidden" aria-hidden>
              <label>
                Firma
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </label>
            </div>

            {submitError && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
                {submitError}
              </p>
            )}

            <div className="mt-2 flex gap-3 sm:col-span-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-full border border-sand-dark px-6 py-2.5 text-sm font-semibold text-bark hover:bg-sand"
              >
                Späť
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-clay px-7 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-clay-dark disabled:opacity-50"
              >
                {submitting ? "Odosielam…" : "Odoslať rezerváciu"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Masáž", "Termín", "Údaje"];
  return (
    <ol className="flex items-center gap-2 text-sm">
      {labels.map((label, i) => {
        const index = i + 1;
        const active = step === index;
        const done = step > index;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                active
                  ? "bg-clay text-cream"
                  : done
                    ? "bg-sage text-cream"
                    : "bg-sand text-stone"
              }`}
            >
              {index}
            </span>
            <span className={active ? "font-medium text-bark" : "text-stone"}>
              {label}
            </span>
            {index < labels.length && <span className="mx-1 text-sand-dark">—</span>}
          </li>
        );
      })}
    </ol>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-bark">{label}</span>
      {children}
    </label>
  );
}
