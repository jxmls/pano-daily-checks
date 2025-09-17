// scripts/db-ping.mjs
import pg from "pg";
const { Pool } = pg;

// Toggle which pooler you want to test:
const USE_SESSION_POOLER = false; // true = 5432 (session), false = 6543 (transaction)

const pool = new Pool({
  user: "postgres.nhidtksvlimfvxlhthqh",
  password: "ip123!D",
  host: "aws-0-eu-west-2.pooler.supabase.com",
  port: USE_SESSION_POOLER ? 5432 : 6543,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
  channelBinding: "disable",
});

(async () => {
  try {
    const r = await pool.query("select version(), now()");
    console.log("DB OK:", r.rows[0]);
  } catch (err) {
    console.error("DB ERROR:", err.stack || err.message);
  } finally {
    await pool.end();
  }
})();
