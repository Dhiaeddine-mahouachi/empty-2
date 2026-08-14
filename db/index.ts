import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let initialization: Promise<unknown> | null = null;

export async function getDb() {
  const { env } = await import("cloudflare:workers");
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  initialization ??= (async () => {
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL,
      template_id TEXT NOT NULL,
      language TEXT DEFAULT 'tr' NOT NULL,
      business_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      primary_color TEXT DEFAULT '#a3ff12' NOT NULL,
      phone TEXT DEFAULT '' NOT NULL,
      whatsapp TEXT DEFAULT '' NOT NULL,
      email TEXT NOT NULL,
      address TEXT DEFAULT '' NOT NULL,
      contact_name TEXT NOT NULL,
      offers_json TEXT DEFAULT '[]' NOT NULL,
      details_json TEXT DEFAULT '{}' NOT NULL,
      payment_status TEXT DEFAULT 'unpaid' NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      owner_note TEXT DEFAULT '' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      approved_at TEXT,
      revision INTEGER DEFAULT 1 NOT NULL
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS projects_slug_unique ON projects (slug)"),
    ]);

    // Older QuickSite deployments already have the projects table. Keep their
    // requests and add the new fields in place instead of requiring a reset.
    const tableInfo = await env.DB.prepare("PRAGMA table_info(projects)").all<{ name: string }>();
    const columns = new Set((tableInfo.results ?? []).map((column) => column.name));
    if (!columns.has("details_json")) {
      await env.DB.prepare("ALTER TABLE projects ADD COLUMN details_json TEXT DEFAULT '{}' NOT NULL").run();
    }
    if (!columns.has("payment_status")) {
      await env.DB.prepare("ALTER TABLE projects ADD COLUMN payment_status TEXT DEFAULT 'unpaid' NOT NULL").run();
    }
  })();
  await initialization;

  return drizzle(env.DB, { schema });
}
