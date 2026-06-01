import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { bookingRulesFrom, getSettings } from "@/lib/settings";
import { addDaysISO, todayISO } from "@/lib/time";
import { BookingForm } from "@/components/booking-form";

export const metadata: Metadata = {
  title: "Rezervácia",
};

export default async function ReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const [settings, services] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        durationMin: true,
        priceEur: true,
      },
    }),
  ]);

  const rules = bookingRulesFrom(settings);
  const today = todayISO();
  const maxDate = addDaysISO(today, rules.maxAdvanceDays);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:pt-16">
      <div className="max-w-2xl">
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-clay">
          <span className="h-px w-8 bg-sage/60" aria-hidden />
          Rezervácia
        </p>
        <h1 className="mt-5 text-3xl text-bark sm:text-4xl">Online rezervácia</h1>
        <p className="mt-4 max-w-md text-stone">
          Rezervácia je nezáväzná žiadosť — ozvem sa vám čoskoro.
        </p>
      </div>

      <div className="mt-12">
        <BookingForm
          services={services}
          intro={settings.bookingIntro}
          initialServiceId={service}
          minDate={today}
          maxDate={maxDate}
        />
      </div>
    </div>
  );
}
