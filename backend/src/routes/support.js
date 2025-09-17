import express from "express";
import pool from "../lib/db.js"; // ✅ correct relative path
  // make sure db.js has your Pool config

const router = express.Router();

// POST /api/support - Submit a new support request
router.post("/", async (req, res) => {
  try {
    const { name, email, issue, details } = req.body;

    if (!name || !email || !issue || !details) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      `INSERT INTO support_requests (name, email, issue, details)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, issue, details]
    );

    res.status(201).json({
      message: "Support request submitted successfully!",
      request: result.rows[0],
    });
  } catch (err) {
    console.error("Error inserting support request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
