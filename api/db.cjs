const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,            // aws-0-eu-west-2.pooler.supabase.com
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,        // postgres
  user: process.env.DB_USER,            // postgres.<project>
  password: process.env.DB_PASSWORD,    // P4n0R0cks991
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
