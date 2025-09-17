import express from "express";
import jwt from "jsonwebtoken";
import Report from "./models/Report.js"; // Replace with your DB model
const router = express.Router();

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// POST /api/reports
router.post("/reports", authenticateToken, async (req, res) => {
  try {
    const { description, hazard_type, lat, lon } = req.body;

    if (!description || !hazard_type || lat == null || lon == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create new report in DB
    const newReport = await Report.create({
      description,
      hazard_type,
      lat,
      lon,
      status: "New",
      user_id: req.user.id, // optional if tracking the submitter
      createdAt: new Date(),
    });

    // ✅ Always return JSON
    return res.status(201).json(newReport);
  } catch (err) {
    console.error("Error creating report:", err);
    return res.status(500).json({ error: "Failed to create report" });
  }
});

export default router;
