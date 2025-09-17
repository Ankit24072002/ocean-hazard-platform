import express from "express";
import multer from "multer";
import fs from "fs";
import { pool } from "../lib/db.js";
import { auth } from "./auth.js";
import { classifyText } from "../services/nlp.js";
import { credibilityScore } from "../services/credibility.js";

export const router = express.Router();

// =================== File Upload Setup ===================
const storageDir = process.env.STORAGE_DIR || "./uploads";
fs.mkdirSync(storageDir, { recursive: true });
const upload = multer({ dest: storageDir });

// =================== GET all reports ===================
router.get("/", async (req, res) => {
  try {
    const { type, status, limit = 100 } = req.query;
    const parts = [];
    const vals = [];

    if (type) {
      parts.push(`hazard_type = $${vals.length + 1}`);
      vals.push(type);
    }
    if (status) {
      parts.push(`status = $${vals.length + 1}`);
      vals.push(status);
    }

    const where = parts.length ? "WHERE " + parts.join(" AND ") : "";
    const q = await pool.query(
      `SELECT * FROM reports ${where} ORDER BY created_at DESC LIMIT $${vals.length + 1}`,
      [...vals, limit]
    );

    res.json(q.rows);
  } catch (e) {
    console.error("❌ Error fetching reports:", e);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// =================== GET single report ===================
router.get("/:id", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM reports WHERE id=$1", [
      req.params.id,
    ]);
    if (q.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json(q.rows[0]);
  } catch (e) {
    console.error("❌ Error fetching report:", e);
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

// =================== CREATE new report ===================
router.post("/", auth, upload.single("media"), async (req, res) => {
  try {
    const { description, lat, lon, hazard_type } = req.body;
    const media_url = req.file ? `/uploads/${req.file.filename}` : null;

    const userQ = await pool.query(
      "SELECT id, trust_score FROM users WHERE id=$1",
      [req.user.sub]
    );
    const user = userQ.rows[0];
    if (!user) return res.status(400).json({ error: "User not found" });

    // NLP classification
    const nlp = await classifyText(description || "");

    // credibility calculation
    const score = credibilityScore({
      user,
      hasMedia: !!media_url,
      socialMatches: 1,
      distanceCluster: 1,
    });

    const ins = await pool.query(
      `INSERT INTO reports 
        (user_id, description, hazard_type, language, credibility, lat, lon, media_url, status, created_at) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending', NOW()) 
       RETURNING *`,
      [
        req.user.sub,
        description,
        hazard_type || nlp.hazard_type,
        nlp.language,
        score,
        lat,
        lon,
        media_url,
      ]
    );

    const report = ins.rows[0];

    // websocket broadcast
    req.app.get("io").emit("reports:new", report);

    res.status(201).json(report);
  } catch (e) {
    console.error("❌ Error creating report:", e);
    res.status(400).json({ error: e.message || "Failed to create report" });
  }
});

// =================== VERIFY report ===================
router.put("/:id/verify", auth, async (req, res) => {
  try {
    const { status = "verified", note = "" } = req.body;

    await pool.query(
      "INSERT INTO verifications (report_id, verifier_id, status, note) VALUES ($1,$2,$3,$4)",
      [req.params.id, req.user.sub, status, note]
    );

    await pool.query("UPDATE reports SET status=$1 WHERE id=$2", [
      status,
      req.params.id,
    ]);

    const q = await pool.query("SELECT * FROM reports WHERE id=$1", [
      req.params.id,
    ]);
    const updated = q.rows[0];

    req.app.get("io").emit("reports:update", updated);
    res.json(updated);
  } catch (e) {
    console.error("❌ Error verifying report:", e);
    res.status(400).json({ error: e.message || "Failed to verify report" });
  }
});
