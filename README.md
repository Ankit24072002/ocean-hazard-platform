🌊 Integrated Platform for Crowdsourced Ocean Hazard Reporting

MVP-ready full-stack + AI scaffold for real-time hazard reporting, verification, and visualization.

📦 Tech Stack
Frontend

⚛️ React + Vite (fast dev server, modern build)

🎨 TailwindCSS (utility-first styling)

🗺 Leaflet (interactive hazard mapping)

Backend

🟢 Node.js + Express (API + auth)

🔑 JWT Authentication (secure login + role-based access)

🐘 PostgreSQL (persistent report storage) via pg

🤖 AI Microservice (optional): report classification & credibility scoring

Infrastructure

🐳 Docker Compose (one command setup)

🗄 Postgres (DB)

📦 MinIO (optional) for image/media storage

⚡ Quick Start (Development)
1. Prerequisites

Make sure you have installed:

Node.js
 v18+

Docker
 (optional but recommended)

PNPM (preferred) or NPM

2. Environment Setup

Copy the example environment file and update values:

cp backend/.env.example backend/.env


Fill in the required keys:

DATABASE_URL → Postgres connection string

JWT_SECRET → Secret key for auth

MINIO_* → If using MinIO for media storage

3. Run with Docker Compose (recommended)
docker compose up --build


Services exposed:

🌐 Frontend → http://localhost:5173||https://ocean-hazard-platform-14.onrender.com

🔌 Backend API → http://localhost:4000||https://ocean-hazard-platform-13.onrender.com

🐘 PostgreSQL → localhost:5432

4. Run Locally (without Docker)
🔹 Backend
cd backend
pnpm install   # or npm install
pnpm dev       # or npm run dev

🔹 Frontend
cd frontend
pnpm install   # or npm install
pnpm dev       # or npm run dev

🔹 AI Service (optional)
# Example placeholder - customize your AI microservice here
pnpm dev:ai

🎮 Demo Flow

User submits a hazard report

Input: text description, geotag location, optional photo.

Backend triggers AI service

/classify → Determines hazard type (flood, cyclone, oil spill, etc.).

Detects report language.

Credibility Score Computed

Factors include:

✅ Attached media

👤 User trust level

🌍 Social corroboration (multiple reports in same area)

Map Updates in Real-Time

Reports shown on the interactive Leaflet map.

Uses WebSocket events for instant updates.

Official Verification

Admin/official users can verify reports.

Verified reports highlighted for credibility.

🚀 Features at a Glance

🌍 Real-time hazard mapping

📝 Crowdsourced reports (with geotag + optional photo)

🤖 AI-based classification & credibility scoring

🔒 Secure authentication with JWT

🛠 Role-based workflows (User → Submit, Official → Verify)

💾 PostgreSQL persistence + optional MinIO for storage

📊 Interactive dashboard for insights

🛣️ Roadmap / Next Steps

 Mobile-friendly UI with offline reporting

 Push notifications for nearby hazards

 Advanced AI credibility model (social media signals, cross-source validation)

 Multi-language support

✨ With this scaffold, you have everything to build an MVP-ready AI + crowdsourced hazard reporting platform.
