import { writeFile } from "node:fs/promises";
import path from "node:path";
import { generateTheme, type Theme } from "../src/lib/theme";

// Generates a visual gallery of design seeds so you can browse unique looks and
// pick one. Output: theme-preview.html (open it in a browser).
//
//   npm run design:preview                 # default set of seeds
//   npm run design:preview klara relax 7   # your own seeds

const DEFAULT_SEEDS = [
  "masaze",
  "klara",
  "relax",
  "harmonia",
  "wellness",
  "pokoj",
  "ticho",
  "kvet",
  "more",
  "kamen",
  "levandula",
  "santal",
  "studio-7",
  "aroma",
  "balans",
  "2024",
];

const seeds = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SEEDS;
const themes = seeds.map(generateTheme);

function swatches(theme: Theme): string {
  const keys = [
    "--color-cream",
    "--color-sand",
    "--color-sand-dark",
    "--color-clay",
    "--color-sage",
    "--color-bark",
    "--color-stone",
  ];
  return keys
    .map(
      (k) =>
        `<span class="sw" title="${k}: ${theme.vars[k]}" style="background:${theme.vars[k]}"></span>`,
    )
    .join("");
}

function card(theme: Theme): string {
  const style = Object.entries(theme.vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return `<article class="card" style="${style}">
    <div class="hero">
      <p class="kicker">Masáže Patrícia</p>
      <h1>Chvíľa pokoja a&nbsp;regenerácie</h1>
    </div>
    <div class="body">
      <div class="surface">
        <h3>Relaxačná masáž</h3>
        <p class="muted">Jemná celotelová masáž zameraná na hlboké uvoľnenie.</p>
        <div class="row">
          <strong>45,00 €</strong>
          <button class="btn-primary">Rezervovať</button>
        </div>
      </div>
      <div class="btns">
        <button class="btn-primary">Primárne</button>
        <button class="btn-secondary">Sekundárne</button>
      </div>
      <div class="sws">${swatches(theme)}</div>
    </div>
    <footer class="meta">
      <code>${theme.seed}</code>
      <span>${theme.archetype} · ${theme.shape}</span>
      <span>${theme.fonts.display} + ${theme.fonts.body}</span>
    </footer>
  </article>`;
}

const fontLinks = Array.from(new Set(themes.map((t) => t.fontHref)))
  .map((href) => `<link rel="stylesheet" href="${href}">`)
  .join("\n");

const html = `<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Náhľad dizajnov — seedy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLinks}
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #1c1916; color: #e8e2d9; font-family: ui-sans-serif, system-ui, sans-serif; padding: 32px; }
  .page-head { max-width: 1200px; margin: 0 auto 28px; }
  .page-head h1 { font-size: 22px; margin: 0 0 6px; }
  .page-head p { margin: 0; color: #a89f92; font-size: 14px; }
  .grid { max-width: 1200px; margin: 0 auto; display: grid; gap: 22px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
  .card { background: var(--color-cream); color: var(--color-bark); border-radius: var(--radius-3xl); overflow: hidden; box-shadow: 0 14px 40px rgba(0,0,0,.35); font-family: var(--font-body); }
  .hero { padding: 28px 24px 24px; background: linear-gradient(135deg, var(--color-sand), var(--color-cream)); }
  .kicker { margin: 0 0 8px; font-size: 11px; letter-spacing: .22em; text-transform: uppercase; font-weight: 700; color: var(--color-clay); }
  .hero h1 { margin: 0; font-family: var(--font-display); font-weight: 500; font-size: 27px; line-height: 1.15; color: var(--color-bark); }
  .body { padding: 22px 24px 8px; }
  .surface { background: var(--color-sand); border: 1px solid var(--color-sand-dark); border-radius: var(--radius-2xl); padding: 18px; }
  .surface h3 { margin: 0 0 6px; font-family: var(--font-display); font-weight: 500; font-size: 18px; color: var(--color-bark); }
  .muted { margin: 0 0 14px; font-size: 13px; line-height: 1.5; color: var(--color-stone); }
  .row { display: flex; align-items: center; justify-content: space-between; }
  .row strong { font-size: 18px; }
  .btns { display: flex; gap: 10px; margin-top: 16px; }
  button { font-family: var(--font-body); font-weight: 600; font-size: 13px; padding: 9px 18px; border: 0; cursor: pointer; border-radius: 9999px; }
  .btn-primary { background: var(--color-clay); color: var(--color-cream); }
  .btn-secondary { background: var(--color-sage); color: var(--color-cream); }
  .sws { display: flex; gap: 6px; margin: 18px 0 6px; }
  .sw { width: 26px; height: 26px; border-radius: 7px; border: 1px solid rgba(0,0,0,.08); }
  .meta { padding: 14px 24px 20px; display: flex; flex-direction: column; gap: 3px; border-top: 1px solid var(--color-sand-dark); margin-top: 6px; font-size: 12px; color: var(--color-stone); }
  .meta code { font-size: 13px; font-weight: 700; color: var(--color-bark); background: var(--color-sand); padding: 2px 8px; border-radius: 6px; align-self: flex-start; }
</style>
</head>
<body>
  <div class="page-head">
    <h1>Náhľad dizajnov</h1>
    <p>${themes.length} seedov. Vyber si, ktorý sa ti páči, a nastav jeho hodnotu (text v <code>code</code>) do premennej <code>DESIGN_SEED</code>.</p>
  </div>
  <div class="grid">
    ${themes.map(card).join("\n")}
  </div>
</body>
</html>`;

async function main() {
  const out = path.join(process.cwd(), "theme-preview.html");
  await writeFile(out, html, "utf8");
  console.log(`Hotovo → ${out}`);
  console.log(`Seedy: ${seeds.join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
