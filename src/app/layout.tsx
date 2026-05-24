import type { Metadata } from "next";
import { Fraunces, Mulish } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings";

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const body = Mulish({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  let businessName = "Masáže";
  let tagline = "Profesionálne masáže";
  try {
    const settings = await getSettings();
    businessName = settings.businessName;
    tagline = settings.tagline;
  } catch {
    // Database not reachable (e.g. during build): fall back to defaults.
  }
  return {
    title: {
      default: `${businessName} — masáže`,
      template: `%s · ${businessName}`,
    },
    description: tagline,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
