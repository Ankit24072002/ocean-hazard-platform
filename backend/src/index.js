import dotenv from "dotenv";
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
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(passport.initialize());

const uploadDir = process.env.STORAGE_DIR || path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadDir));

app.use("/api/auth", authRouter);
app.use("/api/reports", reportRouter);
app.use("/api/social", socialRouter);

app.get("/", (_, res) => res.json({ ok: true, service: "backend" }));

const PORT = process.env.PORT || 4000;
(async () => {
  await initDb();
  server.listen(PORT, () => console.log(`API running on port ${PORT}`));
})();

function parseCorsOrigin(value) {
  if (!value || value.trim() === "*") return "*";

  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
}
