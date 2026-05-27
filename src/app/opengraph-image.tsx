import { ImageResponse } from "next/og";
import { getTheme } from "@/lib/theme";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Online rezervácia masáží";

// Social share preview. Uses the active theme colours + the business name and
// tagline from settings, so the link preview matches the brand.
export default async function OpengraphImage() {
  let businessName = DEFAULT_SETTINGS.businessName;
  let tagline = DEFAULT_SETTINGS.tagline;
  try {
    const settings = await getSettings();
    businessName = settings.businessName;
    tagline = settings.tagline;
  } catch {
    // Database not reachable (e.g. during build): fall back to defaults.
  }

  const v = getTheme().vars;
  const clay = v["--color-clay"];
  const cream = v["--color-cream"];
  const sage = v["--color-sage"];
  const bark = v["--color-bark"];
  const stone = v["--color-stone"];

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px 100px",
          background: cream,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -130,
            right: -120,
            width: 440,
            height: 440,
            borderRadius: 9999,
            background: clay,
            opacity: 0.12,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -120,
            width: 400,
            height: 400,
            borderRadius: 9999,
            background: sage,
            opacity: 0.12,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 72, height: 4, background: clay, borderRadius: 4, display: "flex" }} />
          <div
            style={{
              marginLeft: 22,
              fontSize: 30,
              letterSpacing: 8,
              textTransform: "uppercase",
              fontWeight: 700,
              color: clay,
            }}
          >
            {businessName}
          </div>
        </div>

        <div style={{ fontSize: 72, lineHeight: 1.1, marginTop: 38, maxWidth: 980, color: bark }}>
          {tagline}
        </div>

        <div style={{ fontSize: 32, marginTop: 40, color: stone }}>
          Online rezervácia masáží
        </div>
      </div>
    ),
    { ...size },
  );
}
