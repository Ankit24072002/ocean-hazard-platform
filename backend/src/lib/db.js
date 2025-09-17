import pkg from "pg";
const { Pool } = pkg;

// Debug print to verify env variables
console.log("DB ENV DEBUG:", {
  DATABASE_URL: process.env.DATABASE_URL,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
});

// Flexible pool config
export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : new Pool({
      user: process.env.DB_USER || "ocean",
      password: process.env.DB_PASSWORD || "oceanpass",
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || "oceanhazard",
    });

export async function initDb() {
  // Ensure pgcrypto extension is ready before using gen_random_uuid
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'citizen',
      trust_score REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id),
      description TEXT,
      hazard_type TEXT,
      language TEXT,
      credibility REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      lat DOUBLE PRECISION NOT NULL,
      lon DOUBLE PRECISION NOT NULL,
      media_url TEXT,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
      verifier_id uuid REFERENCES users(id),
      status TEXT NOT NULL,
      note TEXT,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  console.log("✅ Database initialized successfully");
}
