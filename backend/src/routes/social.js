import express from "express";
import { pool } from "../lib/db.js";
import { auth } from "./auth.js";
import { classifyText } from "../services/nlp.js";

export const router = express.Router();

const demoPosts = [
  {
    platform: "Twitter",
    author: "coastwatch_kochi",
    content: "High tide water entering beach road near Fort Kochi. People moving vehicles now.",
    lat: 9.965,
    lon: 76.242,
    source_url: "https://twitter.com"
  },
  {
    platform: "YouTube",
    author: "local_live",
    content: "Wave damage visible near the pier after overnight storm surge.",
    lat: 19.81,
    lon: 85.83,
    source_url: "https://youtube.com"
  },
  {
    platform: "Facebook",
    author: "resident_group",
    content: "Flooded beach access closed. Informative update, no injuries reported.",
    lat: 13.08,
    lon: 80.28,
    source_url: "https://facebook.com"
  }
];

router.get("/", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM social_posts ORDER BY created_at DESC LIMIT 100");
    if (q.rows.length) return res.json(q.rows);

    const enriched = await Promise.all(
      demoPosts.map(async (post) => ({ ...post, ...(await classifyText(post.content)) }))
    );
    res.json(enriched.map((post, index) => ({ id: `demo-${index}`, created_at: new Date(), ...post })));
  } catch (e) {
    console.error("Social feed error:", e);
    res.status(500).json({ error: "Failed to fetch social posts" });
  }
});

router.post("/ingest", auth, async (req, res) => {
  try {
    const { platform, author, content, lat, lon, source_url } = req.body;
    if (!platform || !content) return res.status(400).json({ error: "platform and content are required" });

    const nlp = await classifyText(content);
    const q = await pool.query(
      `INSERT INTO social_posts
        (platform, author, content, language, hazard_type, sentiment, urgency, lat, lon, source_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [platform, author, content, nlp.language, nlp.hazard_type, nlp.sentiment, nlp.urgency, lat, lon, source_url]
    );

    req.app.get("io").emit("social:new", q.rows[0]);
    res.status(201).json(q.rows[0]);
  } catch (e) {
    res.status(400).json({ error: e.message || "Failed to ingest social post" });
  }
});

router.get("/warnings", async (req, res) => {
  try {
    const q = await pool.query("SELECT * FROM official_warnings ORDER BY created_at DESC");
    res.json(q.rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch official warnings" });
  }
});
