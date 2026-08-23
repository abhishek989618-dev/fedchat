
import "dotenv/config";
import pg from "pg";
import fs from "node:fs";
import path from "node:path";

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;
const FAILED_MIGRATIONS = [
  "20260813204455_deploy",
  "20260815000100_repair_deploy_schema",
];
const repairFile = path.resolve("prisma/migrations/20260815000100_repair_deploy_schema/migration.sql");

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Create/configure server/.env before running database commands.");
  process.exit(1);
}

if (!fs.existsSync(repairFile)) {
  console.error(`Missing repair migration: ${repairFile}`);
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

try {
  for (const migrationName of FAILED_MIGRATIONS) {
    const result = await pool.query(`
      SELECT id, migration_name, finished_at, rolled_back_at, logs
      FROM "_prisma_migrations"
      WHERE migration_name = $1
      ORDER BY started_at DESC
      LIMIT 1
    `, [migrationName]);

    const row = result.rows[0];
    if (!row || row.finished_at || row.rolled_back_at) {
      continue;
    }

    console.warn(`Detected unfinished migration ${migrationName}.`);

    // Prisma migrations run transactionally here. The failed migration itself was rolled
    // back by PostgreSQL, so this repair only needs to normalize the legacy schema and
    // mark the failed history row as rolled back. The replacement migration will rerun.
    if (migrationName === "20260815000100_repair_deploy_schema") {
      const repairSql = fs.readFileSync(repairFile, "utf8");
      await pool.query("BEGIN");
      try {
        await pool.query(repairSql);
        await pool.query(`
          UPDATE "_prisma_migrations"
          SET rolled_back_at = NOW(), logs = COALESCE(logs, '') || E'\nAuto-repaired failed repair migration.'
          WHERE id = $1 AND finished_at IS NULL AND rolled_back_at IS NULL
        `, [row.id]);
        await pool.query("COMMIT");
      } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
      }
      console.log(`${migrationName} was marked rolled back after schema normalization.`);
      continue;
    }

    // For the old deploy migration, normalize the schema first, then roll back its history row.
    const repairSql = fs.readFileSync(repairFile, "utf8");
    await pool.query("BEGIN");
    try {
      await pool.query(repairSql);
      await pool.query(`
        UPDATE "_prisma_migrations"
        SET rolled_back_at = NOW(), logs = COALESCE(logs, '') || E'\nAuto-repaired by scripts/db-repair.mjs'
        WHERE id = $1 AND finished_at IS NULL AND rolled_back_at IS NULL
      `, [row.id]);
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
    console.log(`${migrationName} was marked rolled back after schema normalization.`);
  }

  console.log("Database migration preflight completed.");
} finally {
  await pool.end();
}
