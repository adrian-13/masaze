"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BookingForm } from "@/components/booking-form";

interface ServiceOption {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceEur: number;
}

export interface BookingData {
  services: ServiceOption[];
  intro: string;
  minDate: string;
  maxDate: string;
}

interface BookingContextValue {
  open: (serviceId?: string) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking musí byť použité vnútri <BookingProvider>.");
  }
  return ctx;
}

export function BookingProvider({
  data,
  children,
}: {
  data: BookingData;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // `nonce` changes on every open so the form remounts fresh each time.
  const [state, setState] = useState<{
    open: boolean;
    serviceId?: string;
    nonce: number;
  }>({ open: false, nonce: 0 });

  const open = useCallback((serviceId?: string) => {
    setState((s) => ({ open: true, serviceId, nonce: s.nonce + 1 }));
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  // Drive the native <dialog> from state (gives focus trapping, ESC, top-layer).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (state.open && !dialog.open) dialog.showModal();
    else if (!state.open && dialog.open) dialog.close();
  }, [state.open]);

  // Lock background scroll while open.
  useEffect(() => {
    if (!state.open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [state.open]);

  return (
    <BookingContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialogRef}
        onClose={close}
        onCancel={close}
        onClick={(e) => {
          // Clicks on the backdrop register on the <dialog> element itself.
          // Disabled on mobile (the dialog fills the whole viewport — there is
          // no visible backdrop to click).
          if (e.target === dialogRef.current && window.innerWidth >= 640) close();
        }}
        className="booking-dialog m-0 h-dvh max-h-dvh w-full max-w-full rounded-none bg-cream p-0 text-bark shadow-2xl backdrop:bg-bark/50 sm:m-auto sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-1.5rem)] sm:max-w-4xl sm:rounded-3xl"
      >
        {state.open && (
          <div className="relative h-full overflow-y-auto px-5 pb-0 pt-[max(3rem,env(safe-area-inset-top))] sm:h-auto sm:max-h-[85vh] sm:px-8 sm:pb-8 sm:pt-8">
            <button
              type="button"
              onClick={close}
              aria-label="Zavrieť"
              className="absolute right-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-cream/80 text-stone backdrop-blur-sm transition-colors hover:bg-sand hover:text-bark sm:h-9 sm:w-9 sm:bg-transparent sm:backdrop-blur-none"
              style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
            <BookingForm
              key={state.nonce}
              services={data.services}
              intro={data.intro}
              initialServiceId={state.serviceId}
              minDate={data.minDate}
              maxDate={data.maxDate}
            />
          </div>
        )}
      </dialog>
    </BookingContext.Provider>
  );
}

// A "Rezervovať" trigger. Renders a real link to `href` (works without JS and
// for open-in-new-tab); when JS is active it opens the booking modal instead.
export function BookButton({
  serviceId,
  href,
  className,
  children,
  onClick,
}: {
  serviceId?: string;
  href: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const { open } = useBooking();
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return; // let modified clicks use the real link / new tab
        }
        e.preventDefault();
        onClick?.();
        open(serviceId);
      }}
    >
      {children}
    </a>
  );
}
