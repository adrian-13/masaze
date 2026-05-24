import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AvailabilityEditor } from "@/components/admin/availability-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dostupnosť" };

export default async function AdminAvailabilityPage() {
  await requireAdmin();
  const windows = await prisma.availability.findMany({
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    select: { id: true, weekday: true, startTime: true, endTime: true },
  });

  return (
    <div>
      <h1 className="text-2xl text-bark">Dostupnosť</h1>
      <p className="mt-1 text-sm text-stone">
        Nastavte si pracovné dni a hodiny. Z týchto okien sa automaticky vygenerujú voľné
        termíny podľa dĺžky jednotlivých masáží.
      </p>

      <div className="mt-8">
        <AvailabilityEditor windows={windows} />
      </div>
    </div>
  );
}
