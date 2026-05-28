import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { getTheme } from "@/lib/theme";

// Base URL for resolving absolute metadata URLs (OG image, etc.). Set
// NEXT_PUBLIC_SITE_URL to your domain in production; Vercel's URL is used as a
// fallback, and localhost in development.
function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

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
  const title = `${businessName} — masáže`;
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: title,
      template: `%s · ${businessName}`,
    },
    description: tagline,
    openGraph: {
      title,
      description: tagline,
      siteName: businessName,
      type: "website",
      locale: "sk_SK",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: tagline,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The seed-driven theme produces the palette, fonts and corner radii as CSS
  // variables. Setting them on <html> overrides the defaults in globals.css, so
  // the whole UI re-themes from one `DESIGN_SEED` value.
  const theme = getTheme();

  return (
    <html
      lang="sk"
      style={theme.vars as React.CSSProperties}
    >
      <body className="flex min-h-screen flex-col">
        {/* Seed-selected web fonts (hoisted to <head> by React). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={theme.fontHref} precedence="default" />
        {children}
      </body>
    </html>
  );
}
