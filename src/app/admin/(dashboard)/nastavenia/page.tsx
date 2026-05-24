import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/auth";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nastavenia" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <div>
      <h1 className="text-2xl text-bark">Nastavenia</h1>
      <p className="mt-1 text-sm text-stone">
        Upravte obsah stránky a pravidlá, podľa ktorých sa generujú voľné termíny.
      </p>

      <div className="mt-8">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
