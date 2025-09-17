import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../lib/db.js";
import { body, validationResult } from "express-validator";

export const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

// ================= REGISTER =================
router.post(
  "/register",
  body("name").isLength({ min: 2 }),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);

    try {
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1,$2,$3)
         RETURNING id, name, email, role, trust_score`,
        [name, email, hash]
      );

      const user = result.rows[0];
      // 🔑 Generate token on registration
      const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({ token, user });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
);

// ================= LOGIN =================
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

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // 🔑 Generate token on login
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        trust_score: user.trust_score,
      },
    });
  }
);

// ================= AUTH MIDDLEWARE =================
export function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}
