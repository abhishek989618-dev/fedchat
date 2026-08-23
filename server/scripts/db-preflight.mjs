// Kept as a lightweight compatibility check for older deployment instructions.
// db:deploy now performs the safe repair automatically via db-repair.mjs.

import "dotenv/config";
import pg from "pg";
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const result = await pool.query(`SELECT to_regclass('public._prisma_migrations') AS table_name`);
  console.log(result.rows[0]?.table_name ? "Prisma migration table detected." : "Prisma migration table will be created by Prisma.");
} finally {
  await pool.end();
}
