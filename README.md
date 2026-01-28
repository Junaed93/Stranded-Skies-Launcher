# 🌌 Stranded Skies - Launcher & Game

![Banner Placeholder](https://via.placeholder.com/1200x300?text=Stranded+Skies+Launcher)

> A multiplayer WebGL game with a high-performance Spring Boot backend. Features secure authentication, real-time voice chat, and competitive leaderboards. Now deployment-ready with Docker!

![Java](https://img.shields.io/badge/Java-25-orange?style=flat-square&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.2-green?style=flat-square&logo=springboot)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)


---

## 📖 Table of Contents
- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [☁️ Deployment](#-deployment)
- [🕹️ Controls](#-controls)
- [🔧 API Endpoints](#-api-endpoints)
- [📁 Project Structure](#-project-structure)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Secure Login, Registration, and Guest access via JWT. |
| 🛡️ **Session Guard** | Middleware to protect routes and ensure valid sessions. |
| 🏆 **Leaderboard** | Global top scores display with a premium glassmorphism UI. |
| 🎙️ **Voice Chat** | Low-latency Push-to-Talk (Hold **V**) using WebRTC. |
| 💬 **Real-time Chat** | Instant messaging system powered by WebSocket & Stomp. |
| 💾 **Persistence** | H2 Database with Docker Volume support. |

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Spring Boot 4.0.2
- **Language:** Java 25
- **Database:** H2 (File-based, Container-ready)
- **Security:** Spring Security + JWT
- **Containerization:** Docker + Docker Compose

### Frontend
- **Type:** Static Web App (HTML/CSS/JS)
- **Hosting:** Any Static Host (Vercel / GitHub Pages / etc.)
- **Game Engine:** Unity WebGL
- **Styling:** CSS3 (Glassmorphism Design)

---

## 🚀 Quick Start

### Prerequisites
- **Java JDK 25**: Verify with `java -version`
- **Docker**: (Optional) For containerized run.

### Option 1: Run Locally (Manual)
**1. Start Backend** (Port 8080)
```powershell
cd Backend
.\gradlew.bat bootRun
```

**2. Start Frontend**
- Open `frontend/launcher.html` directly in your browser.
- OR use a simple server: `npx serve frontend`

### Option 2: Run with Docker 🐳
**1. Start Backend**
```powershell
cd Backend
docker-compose up --build
```
**2. Start Frontend**
- Open `frontend/launcher.html`.

---

## ☁️ Deployment

### 1. Backend (Railway / Render / Fly.io)
The backend includes a `Dockerfile` for easy deployment.
- **Service**: Create a new web service connected to the `Backend` folder.
- **Port**: `8080`
- **Volume**: Mount a volume to `/app/data` to persist user accounts.
- **Env Vars**:
    - `JWT_SECRET`: (Generate a secure key)
    - `DB_URL`: `jdbc:h2:file:./data/game;DB_CLOSE_DELAY=-1;AUTO_RECONNECT=TRUE`

### 2. Frontend (Static Host)
- **Config**: Update `frontend/js/config.js` with your deployed Backend URL.
- **Deploy**: Upload the `frontend` folder to any static hosting provider.

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| **W A S D** | Move Character |
| **Space** | Jump |
| **Mouse** | Look / Aim |
| **Left Click** | Attack / Shoot |
| **Hold V** | Voice Chat (Push-to-Talk) |

---

## 🔧 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ | Create a new user account |
| `POST` | `/auth/login` | ❌ | Authenticate and retrieve JWT |
| `POST` | `/auth/guest` | ❌ | Create a temporary guest session |
| `GET` | `/auth/validate` | ✅ | Verify current token validity |

### Game Data
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/scores` | ✅ | Submit final game score |
| `GET` | `/api/leaderboard` | ❌ | Retrieve top 50 global scores |

---

## 📁 Project Structure

```bash
Launcher/
├── Backend/                    # Spring Boot Application
│   ├── Dockerfile             # 🐳 Deployment Config
│   ├── docker-compose.yml     # Local Docker Setup
│   ├── src/main/java/.../
│   │   ├── controller/        # REST Controllers
│   │   ├── security/          # JWT Config & Filters
│   │   └── service/           # Logic
│   └── data/                  # H2 Database Files
│
└── frontend/                   # Static Web Client
    ├── launcher.html          # Login / Landing Page
    ├── index.html             # Game Page (Auth Guarded)
    ├── leaderboard.html       # Leaderboard UI
    ├── js/                    # Client-side Logic
    │   ├── config.js          # API Configuration
    │   ├── auth.js            # Auth & Redirects
    │   └── game-launcher.js   # Unity Loader
    └── game/                  # Unity WebGL Exports
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| **File Not Found** | Ensure `frontend/js/game-launcher.js` uses relative paths (`game/index.html`). |
| **CORS Errors** | Check `js/config.js` and ensure Backend is running. |
| **Data Lost on Restart** | Ensure Docker Volume is mounted to `/app/data`. |

---
