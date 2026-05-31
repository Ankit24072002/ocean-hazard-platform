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
      google_id TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'citizen',
      role_selected_at timestamptz,
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

    CREATE TABLE IF NOT EXISTS social_posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      platform TEXT NOT NULL,
      author TEXT,
      content TEXT NOT NULL,
      language TEXT,
      hazard_type TEXT,
      sentiment TEXT,
      urgency TEXT,
      lat DOUBLE PRECISION,
      lon DOUBLE PRECISION,
      source_url TEXT,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS official_warnings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      hazard_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'watch',
      area TEXT,
      lat DOUBLE PRECISION,
      lon DOUBLE PRECISION,
      valid_until timestamptz,
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

  await pool.query(`
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role_selected_at timestamptz;
  `);

  await pool.query(`
    INSERT INTO official_warnings (title, hazard_type, severity, area, lat, lon, valid_until)
    SELECT * FROM (VALUES
      ('High wave alert for Kerala coast', 'High Waves', 'warning', 'Kerala coast', 9.9312, 76.2673, now() + interval '24 hours'),
      ('Storm surge watch near Odisha coast', 'Storm Surge', 'watch', 'Odisha coast', 19.8135, 85.8312, now() + interval '18 hours'),
      ('Tsunami information bulletin', 'Tsunami', 'advisory', 'Andaman and Nicobar Islands', 11.7401, 92.6586, now() + interval '12 hours')
    ) AS seed(title, hazard_type, severity, area, lat, lon, valid_until)
    WHERE NOT EXISTS (SELECT 1 FROM official_warnings);
  `);

  console.log("✅ Database initialized successfully");
}
