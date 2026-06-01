import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { formatOpeningHours } from "@/lib/format";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, availability] = await Promise.all([
    getSettings(),
    prisma.availability.findMany({
      where: { active: true },
      select: { weekday: true, startTime: true, endTime: true },
    }),
  ]);

  const openingHours = availability.length > 0 ? formatOpeningHours(availability) : [];

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader businessName={settings.businessName} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} openingHours={openingHours} />
    </div>
  );
}
