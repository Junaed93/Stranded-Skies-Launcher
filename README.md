# 🌌 Stranded Skies - Launcher & Game

A multiplayer WebGL game with Spring Boot backend, featuring authentication, voice chat, and leaderboards.

---

## 🚀 Quick Start

### Prerequisites
- **Java JDK 17+** (`java -version`)
- **Node.js** (`node -v`)

### 1. Start Backend (Terminal 1)
```powershell
cd Backend
.\gradlew.bat clean build
.\gradlew.bat bootRun
```
> ✅ Wait for: `Started UnityBackendApplication in ... seconds`

### 2. Start Frontend (Terminal 2)
```powershell
cd frontend
node server.js
```

### 3. Play!
Open: [http://localhost:3000](http://localhost:3000)

---

## 🎮 Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Login, Register, Guest mode with JWT |
| **Session Guard** | Protected pages require valid token |
| **Leaderboard** | Top scores with glassmorphism UI |
| **Voice Chat** | Push-to-talk (Hold **V**) via WebRTC |
| **Real-time Chat** | WebSocket-based messaging |
| **Score Reporting** | Automatic save for logged-in users |

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Space | Jump |
| Mouse | Look/Aim |
| Left Click | Attack |
| **V** (Hold) | Voice Chat |

---

## 📁 Project Structure

```
Launcher/
├── Backend/                    # Spring Boot Server
│   ├── src/main/java/.../
│   │   ├── controller/        # API Endpoints
│   │   ├── security/          # JWT Auth & Filters
│   │   └── service/           # Business Logic
│   └── data/                  # H2 Database (auto-created)
│
└── frontend/                   # Web Client
    ├── index.html             # Login/Landing Page
    ├── game.html              # Game Container
    ├── leaderboard.html       # Leaderboard Page
    ├── js/
    │   ├── auth.js            # Authentication
    │   ├── session.js         # Session Guard
    │   ├── chat.js            # Real-time Chat
    │   └── voice.js           # Voice Chat (WebRTC)
    └── game/                  # Unity WebGL Build
```

---

## 🔧 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Create account |
| POST | `/auth/login` | ❌ | Get JWT token |
| POST | `/auth/guest` | ❌ | Guest session |
| GET | `/auth/validate` | ✅ | Check token validity |
| POST | `/api/scores` | ✅ | Submit score |
| GET | `/api/leaderboard` | ❌ | Get top scores |

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 8080 in use | `Stop-Process -Name java -Force` |
| Game not loading | Ensure `node server.js` is running |
| CORS errors | Backend must be on 8080, Frontend on 3000 |
| H2 Database lock | Delete `Backend/data/` folder and restart |
| Session redirect loop | Clear browser localStorage |

---

## 🗄️ H2 Database Console

Access: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)

| Setting | Value |
|---------|-------|
| JDBC URL | `jdbc:h2:file:D:/Launcher/Backend/data/game` |
| Username | `sa` |
| Password | `password` |

---

## 📝 License

MIT License - Feel free to use and modify!
