import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingProvider } from "@/components/booking-modal";
import { bookingRulesFrom, getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { formatOpeningHours } from "@/lib/format";
import { addDaysISO, todayISO } from "@/lib/time";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, services, availability] = await Promise.all([
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
    prisma.availability.findMany({
      where: { active: true },
      select: { weekday: true, startTime: true, endTime: true },
    }),
  ]);

  const rules = bookingRulesFrom(settings);
  const today = todayISO();
  const maxDate = addDaysISO(today, rules.maxAdvanceDays);
  const openingHours = availability.length > 0 ? formatOpeningHours(availability) : [];

  return (
    <BookingProvider
      data={{
        services,
        intro: settings.bookingIntro,
        minDate: today,
        maxDate,
      }}
    >
      <div className="flex min-h-full flex-col">
        <SiteHeader businessName={settings.businessName} />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} openingHours={openingHours} />
      </div>
    </BookingProvider>
  );
}
