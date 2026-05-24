import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@libsql/client";

// Applies Prisma migration SQL files to the configured libSQL database (e.g.
// Turso). The native Prisma migration engine cannot connect to a remote
// libsql:// URL, so we run the generated SQL ourselves and track which
// migrations have already been applied.

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL nie je nastavený v prostredí.");
  process.exit(1);
}

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
});

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

async function main() {
  await client.executeMultiple(
    "CREATE TABLE IF NOT EXISTS _app_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);",
  );

  const result = await client.execute("SELECT name FROM _app_migrations");
  const applied = new Set(result.rows.map((row) => String(row.name)));

  const dirs = (await readdir(migrationsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  let appliedCount = 0;
  for (const name of dirs) {
    if (applied.has(name)) {
      console.log(`= preskočené (už aplikované): ${name}`);
      continue;
    }
    const sql = await readFile(path.join(migrationsDir, name, "migration.sql"), "utf8");
    console.log(`→ aplikujem: ${name}`);
    await client.executeMultiple(sql);
    await client.execute({
      sql: "INSERT INTO _app_migrations (name, applied_at) VALUES (?, ?)",
      args: [name, new Date().toISOString()],
    });
    appliedCount++;
  }

  console.log(
    appliedCount > 0
      ? `Hotovo. Aplikovaných migrácií: ${appliedCount}.`
      : "Databáza je aktuálna, nič netreba aplikovať.",
  );
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
