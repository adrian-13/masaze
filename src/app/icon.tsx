import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getTheme } from "@/lib/theme";

// Browser tab favicon. Tries to use the real brand logo from /public/logo.png;
// if that file is not deployed yet we fall back to a small letter mark in the
// theme's primary colour so the tab always has something recognisable.

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const buf = await readFile(join(process.cwd(), "public", "logo.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Icon() {
  const logoSrc = await loadLogoDataUrl();

  if (logoSrc) {
    return new ImageResponse(
      (
        // border-radius directly on <img> — Satori's overflow:hidden does not
        // reliably clip children, but the radius on the image itself does.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          width={size.width}
          height={size.height}
          style={{ objectFit: "cover", borderRadius: size.width / 2 }}
          alt=""
        />
      ),
      { ...size },
    );
  }

  // Fallback: monogram letter in the theme's primary colour on cream.
  const vars = getTheme().vars;
  const primary = vars["--color-clay"];
  const cream = vars["--color-cream"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: primary,
          color: cream,
          fontSize: 22,
          fontFamily: "serif",
          fontWeight: 600,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
