import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;

  const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!authToken && !url.startsWith("file:")) {
    console.warn(
      "TURSO_AUTH_TOKEN is not set; remote database calls will fail.",
    );
  }

  const client = createClient({ url, authToken });
  _db = drizzle(client, { schema });
  return _db;
}
