import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { body, validationResult } from "express-validator";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../lib/db.js";

export const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";
const FRONTEND_URL =
  process.env.FRONTEND_URL || process.env.CORS_ORIGIN || process.env.RENDER_EXTERNAL_URL || "http://localhost:5173";
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api/auth/google/callback` : "http://localhost:4000/api/auth/google/callback");
const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (googleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL
      },
      async (_, __, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("Google account did not provide an email"));

          const name = profile.displayName || email.split("@")[0];
          const existing = await pool.query(
            "SELECT id, name, email, role, trust_score, role_selected_at FROM users WHERE email=$1 OR google_id=$2",
            [email, profile.id]
          );

          if (existing.rows[0]) {
            const user = existing.rows[0];
            await pool.query("UPDATE users SET google_id=$1 WHERE id=$2 AND google_id IS NULL", [
              profile.id,
              user.id
            ]);

            if (!user.role_selected_at) {
              const needsRole = await pool.query(
                `UPDATE users
                 SET role='pending'
                 WHERE id=$1
                 RETURNING id, name, email, role, trust_score`,
                [user.id]
              );
              return done(null, needsRole.rows[0]);
            }

            return done(null, user);
          }

          const created = await pool.query(
            `INSERT INTO users (name, email, google_id, role)
             VALUES ($1,$2,$3,'pending')
             RETURNING id, name, email, role, trust_score`,
            [name, email, profile.id]
          );

          return done(null, created.rows[0]);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
}

function buildSession(user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      trust_score: user.trust_score
    }
  };
}

router.post(
  "/register",
  body("name").isLength({ min: 2 }),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role = "citizen" } = req.body;
    const safeRole = ["citizen", "analyst", "official"].includes(role) ? role : "citizen";
    const hash = await bcrypt.hash(password, 10);

    try {
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, role_selected_at)
         VALUES ($1,$2,$3,$4,NOW())
         RETURNING id, name, email, role, trust_score`,
        [name, email, hash, safeRole]
      );

      res.json(buildSession(result.rows[0]));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const q = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    const user = q.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.password_hash) {
      return res.status(401).json({ error: "This account uses Google sign-in. Continue with Google." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    res.json(buildSession(user));
  }
);

router.get("/google", (req, res, next) => {
  if (!googleEnabled) {
    return res.status(503).json({
      error: "Google login is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env."
    });
  }

  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (!googleEnabled) return res.redirect(`${FRONTEND_URL}?auth=google-not-configured`);

  passport.authenticate("google", { session: false }, (error, user) => {
    if (error || !user) return res.redirect(`${FRONTEND_URL}?auth=google-failed`);

    const session = buildSession(user);
    const redirectUrl = new URL(FRONTEND_URL);
    redirectUrl.searchParams.set("token", session.token);
    redirectUrl.searchParams.set("user", Buffer.from(JSON.stringify(session.user)).toString("base64url"));
    redirectUrl.searchParams.set("auth", "google");
    res.redirect(redirectUrl.toString());
  })(req, res, next);
});

router.patch("/me/role", auth, body("role").isIn(["citizen", "analyst", "official"]), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const q = await pool.query(
      `UPDATE users
       SET role=$1
          , role_selected_at=NOW()
       WHERE id=$2
       RETURNING id, name, email, role, trust_score`,
      [req.body.role, req.user.sub]
    );

    if (!q.rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(buildSession(q.rows[0]));
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update role" });
  }
});

export function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
