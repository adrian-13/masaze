import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prihlásenie",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAuthenticated()) {
    redirect("/admin");
  }
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Link href="/" className="font-serif text-2xl text-bark">
            {settings.businessName}
          </Link>
          <p className="mt-1 text-sm text-stone">Administrácia</p>
        </div>
        <div className="mt-8 rounded-2xl border border-sand-dark/60 bg-white/60 p-7">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-stone">
          <Link href="/" className="hover:text-clay">
            ← Späť na stránku
          </Link>
        </p>
      </div>
    </div>
  );
}
