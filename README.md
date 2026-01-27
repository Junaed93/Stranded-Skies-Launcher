# 🌌 Stranded Skies - Launcher & Game

![Banner Placeholder](https://via.placeholder.com/1200x300?text=Stranded+Skies+Launcher)

> A multiplayer WebGL game with a high-performance Spring Boot backend. Features secure authentication, real-time voice chat, and competitive leaderboards.

![Java](https://img.shields.io/badge/Java-25-orange?style=flat-square&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.2-green?style=flat-square&logo=springboot)
![Node.js](https://img.shields.io/badge/Node.js-Latest-green?style=flat-square&logo=nodedotjs)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 📖 Table of Contents
- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [🕹️ Controls](#-controls)
- [🔧 API Endpoints](#-api-endpoints)
- [📁 Project Structure](#-project-structure)
- [📸 Screenshots](#-screenshots)
- [🔗 Links](#-links)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Secure Login, Registration, and Guest access via JWT. |
| 🛡️ **Session Guard** | Middleware to protect routes and ensure valid sessions. |
| 🏆 **Leaderboard** | Global top scores display with a premium glassmorphism UI. |
| 🎙️ **Voice Chat** | Low-latency Push-to-Talk (Hold **V**) using WebRTC. |
| 💬 **Real-time Chat** | Instant messaging system powered by WebSocket & Stomp. |
| 💾 **Start Persistence** | Automatic score submission and user state management. |

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Spring Boot 4.0.2
- **Language:** Java 25
- **Database:** H2 (In-Memory)
- **Security:** Spring Security + JWT
- **Real-time:** WebSocket + STOMP

### Frontend
- **Runtime:** Node.js (Custom Server)
- **Styling:** CSS3 (Glassmorphism Design)
- **Logic:** Vanilla JavaScript (ES6+)
- **Game Engine:** Unity WebGL

---

## 🚀 Quick Start

### Prerequisites
- **Java JDK 25**: Verify with `java -version`
- **Node.js**: Verify with `node -v`

### 1. Start the Backend
Runs on Port `8080`.
```powershell
cd Backend
.\gradlew.bat clean build
.\gradlew.bat bootRun
```
> **Success:** Wait for `Started UnityBackendApplication in ... seconds`

### 2. Start the Frontend
Runs on Port `3000`.
```powershell
cd frontend
node server.js
```
> *Note: No `npm install` required - uses built-in Node modules.*

### 3. Launch
Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

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
│   ├── src/main/java/.../
│   │   ├── controller/        # REST Controllers
│   │   ├── security/          # JWT Config & Filters
│   │   ├── service/           # Business Logic
│   │   └── handler/           # WebSocket Handlers
│   └── data/                  # H2 Database Files
│
└── frontend/                   # Web Client Server
    ├── index.html             # Landing / Login Page
    ├── game.html              # Main Game Wrapper
    ├── js/                    # Client-side Logic
    │   ├── auth.js            # Auth State Management
    │   ├── voice.js           # WebRTC Implementation
    │   └── chat.js            # WebSocket Chat
    ├── css/                   # Styling
    └── game/                  # Unity WebGL Exports
```

---

## 📸 Screenshots

*(Add your screenshots here)*

| Login Screen | In-Game |
|:---:|:---:|
| ![Login](https://via.placeholder.com/400x225?text=Login+Screen) | ![Game](https://via.placeholder.com/400x225?text=Gameplay) |

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| **Port 8080 Busy** | Run `Stop-Process -Name java -Force` in PowerShell. |
| **Game Not Loading** | Ensure Frontend server is running (`node server.js`). |
| **CORS Errors** | Verify Backend is on `8080` and Client on `3000`. |
| **Database Locks** | Delete the `Backend/data/` folder and restart the Backend. |

### H2 Console Access
- **URL:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
- **JDBC URL:** `jdbc:h2:file:D:/Launcher/Backend/data/game`
- **User:** `sa`
- **Password:** `password`

---

## 🔗 Links
- [Unity Project](https://github.com/Junaed93/Stranded-Skies)

---