import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import mysql from "mysql2/promise";

const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error("DATABASE_URL manquante");
const parsed = new URL(sourceUrl);
const adminUrl = new URL(sourceUrl);
adminUrl.pathname = "/";
const database = `fresh_migrations_${Date.now()}_${randomBytes(3).toString("hex")}`;
const connection = await mysql.createConnection(adminUrl.toString());
try {
  await connection.query(`CREATE DATABASE \`${database}\``);
  const targetUrl = new URL(sourceUrl);
  targetUrl.pathname = `/${database}`;
  const result = spawnSync("pnpm", ["drizzle-kit", "migrate"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: targetUrl.toString() },
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
  const [tables] = await connection.query(`SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('document_versions', '__drizzle_migrations')`, [database]);
  const names = new Set(tables.map((row) => row.TABLE_NAME));
  if (!names.has("document_versions") || !names.has("__drizzle_migrations")) throw new Error("Tables documentaires attendues absentes après migration");
  console.log(`Fresh migration validation succeeded on temporary database ${database}`);
} finally {
  await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await connection.end();
}
