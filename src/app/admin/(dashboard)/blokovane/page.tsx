import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { todayISO } from "@/lib/time";
import { BlockedDatesManager } from "@/components/admin/blocked-dates-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blokované dni" };

export default async function AdminBlockedDatesPage() {
  await requireAdmin();
  const today = todayISO();
  const dates = await prisma.blockedDate.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
    select: { id: true, date: true, reason: true },
  });

  return (
    <div>
      <h1 className="text-2xl text-bark">Blokované dni</h1>
      <p className="mt-1 text-sm text-stone">
        Jednorazovo zablokujte konkrétne dni, kedy nepracujete.
      </p>

      <div className="mt-8">
        <BlockedDatesManager dates={dates} minDate={today} />
      </div>
    </div>
  );
}
