import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ServiceCreateForm, ServiceRow } from "@/components/admin/service-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Služby" };

export default async function AdminServicesPage() {
  await requireAdmin();
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl text-bark">Služby</h1>
      <p className="mt-1 text-sm text-stone">
        Spravujte ponuku masáží, ich dĺžku a ceny. Neaktívne služby sa na stránke nezobrazujú.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <ServiceCreateForm />
        </div>
        {services.map((service) => (
          <ServiceRow key={service.id} service={service} />
        ))}
      </div>
    </div>
  );
}
