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
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 sm:pt-10">
      <h1 className="text-3xl text-bark sm:text-4xl">Online rezervácia</h1>
      <p className="mt-3 text-stone">
        Rezervácia je nezáväzná žiadosť — termín vám potvrdím osobne.
      </p>

      <div className="mt-8">
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
