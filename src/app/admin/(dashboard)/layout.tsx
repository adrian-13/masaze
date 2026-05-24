import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-cream">
      <AdminNav businessName={settings.businessName} />
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
