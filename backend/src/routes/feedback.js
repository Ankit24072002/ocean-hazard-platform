import express from "express";
import { verifyToken } from "../middlewares/auth.js"; // JWT middleware

export const router = express.Router();

// POST /api/feedback
router.post("/", verifyToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id; // From JWT

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Example: save to database
    // await db.query("INSERT INTO feedback(user_id, message) VALUES($1, $2)", [userId, message]);

    console.log("Feedback received:", { userId, message });

    res.json({ ok: true, message: "Feedback submitted successfully!" });
  } catch (err) {
    console.error("Feedback save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// middlewares/auth.js
import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

