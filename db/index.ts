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
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS game_rooms (
        id TEXT PRIMARY KEY NOT NULL,
        code TEXT UNIQUE NOT NULL,
        host_player_id TEXT NOT NULL,
        status TEXT DEFAULT 'lobby' NOT NULL,
        round_count INTEGER NOT NULL,
        current_round INTEGER DEFAULT 0 NOT NULL,
        current_letter TEXT DEFAULT '' NOT NULL,
        used_letters_json TEXT DEFAULT '[]' NOT NULL,
        categories_json TEXT DEFAULT '[]' NOT NULL,
        stopped_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS game_rooms_code_unique ON game_rooms (code)"),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS game_players (
        id TEXT PRIMARY KEY NOT NULL,
        room_id TEXT NOT NULL,
        name TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        score INTEGER DEFAULT 0 NOT NULL,
        joined_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS game_players_room_idx ON game_players (room_id)"),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS game_answers (
        room_id TEXT NOT NULL,
        round_index INTEGER NOT NULL,
        player_id TEXT NOT NULL,
        category_index INTEGER NOT NULL,
        answer TEXT DEFAULT '' NOT NULL,
        normalized TEXT DEFAULT '' NOT NULL,
        host_valid INTEGER,
        points INTEGER DEFAULT 0 NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (room_id, round_index, player_id, category_index)
      )`),
      env.DB.prepare("CREATE INDEX IF NOT EXISTS game_answers_round_idx ON game_answers (room_id, round_index)"),
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
