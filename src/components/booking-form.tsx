"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/format";
import { Calendar } from "@/components/calendar";

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
  const [monthAvail, setMonthAvail] = useState<Set<string>>(new Set());
  const [monthLoading, setMonthLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessSummary | null>(null);

  const requestId = useRef(0);
  const monthReqId = useRef(0);
  const selectedService = services.find((s) => s.id === serviceId);

  // Refs for each step section so we can smoothly scroll the user to the
  // currently-active step when they advance or go back. `scroll-mt-*` on each
  // section keeps the heading clear of the sticky site header.
  const step1Ref = useRef<HTMLElement>(null);
  const step2Ref = useRef<HTMLElement>(null);
  const step3Ref = useRef<HTMLElement>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const prevStep = useRef(step);

  // On phones, the slot picker stacks below the calendar — picking a day
  // would otherwise leave the times below the fold. Smoothly bring them
  // into view. No-op on sm+ (slots are already next to the calendar).
  function scrollToSlotsOnMobile() {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 640px)").matches) return;
    setTimeout(() => {
      const target = slotsRef.current;
      if (!target) return;
      const HEADER_OFFSET = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReduced ? "auto" : "smooth",
      });
    }, 60);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    // On initial page mount, always start at the top — the user has just
    // navigated here from elsewhere and expects to see the heading.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.scrollTo({ top: 0 });
      prevStep.current = step;
      return;
    }
    if (prevStep.current === step) return;
    prevStep.current = step;
    // Wait one paint so the new section is fully laid out before we scroll.
    // Use window.scrollTo with a manually computed offset (more reliable than
    // scrollIntoView, which silently no-ops in some headless browsers).
    // ~80px offset leaves room for the sticky site header above the heading.
    const t = setTimeout(() => {
      const target =
        step === 2 ? step2Ref.current : step === 3 ? step3Ref.current : step1Ref.current;
      if (!target) return;
      const HEADER_OFFSET = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReduced ? "auto" : "smooth",
      });
    }, 60);
    return () => clearTimeout(t);
  }, [step]);

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

  // Fetch which days of a month are bookable, to drive the calendar.
  async function loadMonth(svcId: string, year: number, month: number) {
    if (!svcId) return;
    const id = ++monthReqId.current;
    setMonthLoading(true);
    try {
      const res = await fetch(
        `/api/availability?serviceId=${svcId}&year=${year}&month=${month}`,
      );
      const data: { availableDates?: string[] } = await res.json();
      if (id !== monthReqId.current) return;
      setMonthAvail(new Set(data.availableDates ?? []));
    } catch {
      if (id === monthReqId.current) setMonthAvail(new Set());
    } finally {
      if (id === monthReqId.current) setMonthLoading(false);
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
      <div className="animate-rise rounded-2xl border border-sage/40 bg-sage/10 p-8 text-center">
        <div
          className="animate-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage text-cream"
          style={{ animationDelay: "120ms" }}
        >
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
        <section ref={step1Ref} className="animate-rise mt-8 scroll-mt-20">
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
                      setMonthAvail(new Set());
                      setStep(2);
                    }}
                    className={`rounded-2xl border p-5 text-left transition-all ${
                      active
                        ? "border-clay bg-clay/5 ring-1 ring-clay"
                        : "border-sand-dark/60 bg-cream hover:border-clay/60 hover:bg-clay/[0.03]"
                    }`}
                  >
                    <span className="block text-lg text-bark">{service.name}</span>
                    {service.description && (
                      <span className="mt-1.5 block text-sm leading-relaxed text-stone">
                        {service.description}
                      </span>
                    )}
                    <span className="mt-4 flex items-baseline gap-2">
                      <span className="font-serif text-xl text-bark">
                        {formatPrice(service.priceEur)}
                      </span>
                      <span className="text-sm text-stone">
                        · {formatDuration(service.durationMin)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Step 2 — date & time.
       * No `animate-rise` here: that animation leaves a `transform` on the
       * <section>, which becomes a containing block for the sticky action bar
       * and breaks viewport-pinning on mobile. */}
      {step === 2 && selectedService && (
        <section ref={step2Ref} className="mt-8 scroll-mt-20">
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

          <div className="mt-7 grid gap-8 sm:grid-cols-[28rem_1fr] sm:gap-10">
            <Calendar
              selected={date || null}
              minDate={minDate}
              maxDate={maxDate}
              selectableDates={monthAvail}
              loading={monthLoading}
              onMonthChange={(year, month) => loadMonth(serviceId, year, month)}
              onSelect={(d) => {
                setDate(d);
                loadSlots(serviceId, d);
                scrollToSlotsOnMobile();
              }}
            />

            <div ref={slotsRef} className="sm:min-h-[16rem]">
              {!date ? (
                <p className="text-sm leading-relaxed text-stone">
                  Vyberte deň v kalendári a zobrazia sa voľné časy.
                </p>
              ) : (
                <>
                  <p className="text-sm font-medium text-bark">{formatDateLong(date)}</p>
                  {slotsLoading ? (
                    <p className="mt-4 text-sm text-stone">Načítavam voľné termíny…</p>
                  ) : slots && slots.length > 0 ? (
                    <div key={date} className="animate-rise mt-4 grid grid-cols-3 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setStartTime(slot)}
                          className={`rounded-full border px-2 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clay/40 ${
                            startTime === slot
                              ? "border-clay bg-clay text-cream"
                              : "border-sand-dark bg-cream text-bark hover:border-clay"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl bg-sand/60 px-4 py-3 text-sm text-stone">
                      {REASON_MESSAGES[slotsReason ?? "full"] ??
                        "V tento deň nie sú voľné termíny."}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-5 mt-8 flex gap-3 border-t border-sand-dark/60 bg-cream/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
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
              className="flex-1 rounded-full bg-clay px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              Pokračovať
            </button>
          </div>
        </section>
      )}

      {/* Step 3 — contact details */}
      {step === 3 && selectedService && (
        <section ref={step3Ref} className="mt-8 scroll-mt-20">
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

            <div className="sticky bottom-0 z-10 -mx-5 mt-4 flex gap-3 border-t border-sand-dark/60 bg-cream/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm sm:static sm:col-span-2 sm:mx-0 sm:mt-2 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
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
                className="flex-1 rounded-full bg-clay px-7 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-clay-dark disabled:opacity-50 sm:flex-none"
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
    <ol className="flex items-center gap-2 text-sm sm:gap-3">
      {labels.map((label, i) => {
        const index = i + 1;
        const active = step === index;
        const done = step > index;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done || active
                    ? "bg-clay text-cream"
                    : "border border-sand-dark bg-cream text-stone"
                }`}
              >
                {done ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  index
                )}
              </span>
              <span
                className={`hidden sm:inline ${active || done ? "font-medium text-bark" : "text-stone"}`}
              >
                {label}
              </span>
            </span>
            {index < labels.length && (
              <span
                className={`h-px w-5 sm:w-10 ${done ? "bg-clay/50" : "bg-sand-dark"}`}
                aria-hidden
              />
            )}
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
