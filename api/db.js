// api/db.js (ESM)
import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("Missing env: DATABASE_URL");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  channelBinding: "disable",
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const query = (text, params) => pool.query(text, params);
