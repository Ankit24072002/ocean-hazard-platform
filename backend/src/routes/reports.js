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

// =================== HOTSPOTS ===================
router.get("/analytics/hotspots", async (req, res) => {
  try {
    const q = await pool.query(`
      SELECT
        round(lat::numeric, 1)::double precision AS lat,
        round(lon::numeric, 1)::double precision AS lon,
        hazard_type,
        count(*)::int AS count,
        avg(credibility)::real AS credibility
      FROM reports
      WHERE created_at > now() - interval '7 days'
      GROUP BY round(lat::numeric, 1), round(lon::numeric, 1), hazard_type
      HAVING count(*) >= 1
      ORDER BY count(*) DESC
      LIMIT 50
    `);
    res.json(q.rows);
  } catch (e) {
    console.error("âŒ Error fetching hotspots:", e);
    res.status(500).json({ error: "Failed to fetch hotspots" });
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

// =================== DELETE report ===================
router.delete("/:id", auth, async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM reports WHERE id=$1", [req.params.id]);
    const report = q.rows[0];
    if (!report) return res.status(404).json({ error: "Report not found" });

    const userQ = await pool.query("SELECT role FROM users WHERE id=$1", [req.user.sub]);
    const role = userQ.rows[0]?.role || req.user.role;
    if (report.user_id !== req.user.sub && !["analyst", "official"].includes(role)) {
      return res.status(403).json({ error: "Not allowed to delete this report" });
    }

    await pool.query("DELETE FROM reports WHERE id=$1", [req.params.id]);
    req.app.get("io").emit("reports:delete", { id: req.params.id });
    res.json({ ok: true, id: req.params.id });
  } catch (e) {
    console.error("âŒ Error deleting report:", e);
    res.status(400).json({ error: e.message || "Failed to delete report" });
  }
});


// =================== VERIFY report ===================
router.put("/:id/verify", auth, async (req, res) => {
  try {
    const { status = "verified", note = "" } = req.body;
    const allowedStatuses = ["verified", "rejected", "pending"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid verification status" });
    }

    const userQ = await pool.query("SELECT id, role FROM users WHERE id=$1", [req.user.sub]);
    const user = userQ.rows[0];
    if (!user) return res.status(401).json({ error: "User session no longer exists. Please sign in again." });

    if (!["analyst", "official"].includes(user.role)) {
      return res.status(403).json({ error: "Only analysts and officials can verify reports" });
    }

    const updatedQ = await pool.query("UPDATE reports SET status=$1 WHERE id=$2 RETURNING *", [
      status,
      req.params.id,
    ]);
    const updated = updatedQ.rows[0];
    if (!updated) return res.status(404).json({ error: "Report not found" });

    await pool.query(
      "INSERT INTO verifications (report_id, verifier_id, status, note) VALUES ($1,$2,$3,$4)",
      [req.params.id, req.user.sub, status, note]
    );

    req.app.get("io").emit("reports:update", updated);
    res.json(updated);
  } catch (e) {
    console.error("❌ Error verifying report:", e);
    res.status(400).json({ error: e.message || "Failed to verify report" });
  }
});
