import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "../.env");

const result = dotenv.config({ path: envPath });
if (result.error && !process.env.RENDER) {
  console.warn("Local .env was not loaded:", result.error.message);
}

import http from "http";
import express from "express";
import cors from "cors";
import passport from "passport";
import { Server as SocketIOServer } from "socket.io";
import { router as authRouter } from "./routes/auth.js";
import { router as reportRouter } from "./routes/reports.js";
import { router as socialRouter } from "./routes/social.js";
import { initDb } from "./lib/db.js";

const app = express();
const server = http.createServer(app);
const corsOrigin = parseCorsOrigin(process.env.CORS_ORIGIN);
const frontendDistDir = path.join(__dirname, "../../frontend/dist");
const backendPublicDir = path.join(__dirname, "../public");
const staticDir = fs.existsSync(path.join(frontendDistDir, "index.html"))
  ? frontendDistDir
  : backendPublicDir;
const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

console.log("Runtime config:", {
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  storageDir: process.env.STORAGE_DIR || "./uploads",
  corsOrigin,
});

app.set("io", io);
app.disable("x-powered-by");
app.use(securityHeaders);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(passport.initialize());

const uploadDir = process.env.STORAGE_DIR || path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadDir));

app.use("/api/auth", authRouter);
app.use("/api/reports", reportRouter);
app.use("/api/social", socialRouter);

app.get("/api/health", (_, res) => res.json({ ok: true, service: "backend" }));

app.use(
  express.static(staticDir, {
    setHeaders(res, filePath) {
      if (filePath.endsWith("sw.js")) {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  })
);

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();

  const indexPath = path.join(staticDir, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);

  return res.json({ ok: true, service: "backend" });
});

const PORT = process.env.PORT || 4000;
(async () => {
  await initDb();
  server.listen(PORT, () => console.log(`API running on port ${PORT}`));
})();

function parseCorsOrigin(value) {
  if (!value || value.trim() === "*") return "*";

  const origins = value
    .replace(/(https?:\/\/)/g, ' $1') // Handle accidentally concatenated URLs missing a delimiter
    .split(/[\s,;]+/)
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
}

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(self), camera=(), microphone=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://www.youtube.com https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; ")
  );

  if (req.secure || req.get("x-forwarded-proto") === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}
