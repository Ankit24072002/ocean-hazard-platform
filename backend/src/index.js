import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";


// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend root
const envPath = path.join(__dirname, "../.env");
console.log("👉 Trying to load .env from:", envPath);

const result = dotenv.config({ path: envPath });

// If dotenv failed, show why
if (result.error) {
  console.error("❌ dotenv failed to load:", result.error);
} else {
  console.log("✅ dotenv loaded:", result.parsed);
}

import http from "http";
import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { router as authRouter } from "./routes/auth.js";
import { router as reportRouter } from "./routes/reports.js";
import { initDb } from "./lib/db.js";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173", // ✅ match frontend
    credentials: true,
  },
});

// Debug print to confirm env is loaded
console.log("DB ENV DEBUG:", {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  STORAGE_DIR: process.env.STORAGE_DIR,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
});

app.set("io", io);

// ✅ Middlewares
app.use(
  cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true })
);

app.use(express.json({ limit: "10mb" }));

// ✅ Serve uploaded files correctly
const uploadDir = process.env.STORAGE_DIR || path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadDir));

// ✅ Routes
app.use("/api/auth", authRouter);
app.use("/api/reports", reportRouter);

app.get("/", (_, res) => res.json({ ok: true, service: "backend" }));

// ✅ Start server after DB ready
const PORT = process.env.PORT || 4000;
(async () => {
  await initDb();
  server.listen(PORT, () =>
    console.log(`✅ API running at http://localhost:${PORT}`)
  );
})();


