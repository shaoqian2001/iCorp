import { neon } from "@neondatabase/serverless";

// Per-user workspace snapshots in Postgres (Neon / Vercel Postgres). This is
// the ONLY server-side data store, and it holds an opaque JSON blob (the same
// versioned snapshot the client export produces) keyed by the user id.

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "No database URL set (DATABASE_URL / POSTGRES_URL). Cloud backup is unavailable.",
    );
  }
  return neon(url);
}

let schemaReady = false;

async function ensureSchema(sql: ReturnType<typeof getSql>): Promise<void> {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS workspaces (
      user_id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  schemaReady = true;
}

export interface StoredWorkspace {
  data: unknown;
  updatedAt: string;
}

export async function getWorkspace(
  userId: string,
): Promise<StoredWorkspace | null> {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = (await sql`
    SELECT data, updated_at FROM workspaces WHERE user_id = ${userId}
  `) as { data: unknown; updated_at: string }[];
  const row = rows[0];
  return row ? { data: row.data, updatedAt: row.updated_at } : null;
}

export async function saveWorkspace(
  userId: string,
  data: unknown,
): Promise<{ updatedAt: string }> {
  const sql = getSql();
  await ensureSchema(sql);
  const rows = (await sql`
    INSERT INTO workspaces (user_id, data, updated_at)
    VALUES (${userId}, ${JSON.stringify(data)}::jsonb, now())
    ON CONFLICT (user_id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    RETURNING updated_at
  `) as { updated_at: string }[];
  return { updatedAt: rows[0].updated_at };
}
