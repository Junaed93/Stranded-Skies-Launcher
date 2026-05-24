# Stranded Skies - Launcher & Game

> Launcher for Stranded Sky - (Singleplayer and Multiplayer 2D platformer game) with a Spring Boot backend. Features secure authentication, real-time voice chat, and competitive leaderboards.

** Game GitHub:** [Stranded Skies](https://github.com/Junaed93/Stranded-Skies)

![Java](https://img.shields.io/badge/Java-25-orange?style=flat-square&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.2-green?style=flat-square&logo=springboot)
![Unity](https://img.shields.io/badge/Unity-WebGL-black?style=flat-square&logo=unity)

---
## Table of Contents
- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Controls](#controls)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)

---

##  About the Project

**Stranded Skies** is a comprehensive full-stack game project. It consists of a Unity WebGL game client and a custom-built game launcher that handles player authentication, session management, and leaderboard tracking. The backend is powered by Spring Boot, providing a robust and secure REST API that the launcher and game interact with.

---

## Features

- **Robust Authentication System**: Secure Login, Registration, and Guest access using JWT (JSON Web Tokens).
- **Session Management Guard**: Frontend middleware to protect routes, ensuring only authenticated users can access the game client.
- **Global Leaderboard**: Real-time top scores display with a premium UI design.
- **In-Game Voice Chat**: Low-latency Push-to-Talk (Hold **V**) utilizing WebRTC for seamless team communication.
- **Real-time Chat**: Instant text messaging system powered by WebSocket & Stomp protocols.
- **Data Persistence**: H2 Database integration for reliable data storage.

---

##  Tech Stack

### Backend Architecture
- **Framework:** Spring Boot 4.0.2
- **Language:** Java 25
- **Database:** H2 (Relational Database)
- **Security:** Spring Security + JWT Authentication
- **Real-time:** WebSockets & STOMP

### Frontend / Client
- **Type:** Static Web App (HTML5 / CSS3 / Vanilla JS)
- **Game Engine:** Unity WebGL
- **Styling:** CSS3 (Modern Glassmorphism UI/UX Design)
- **Hosting Compatibility:** Any Static Host (Vercel, Netlify, GitHub Pages, etc.)

---

##  Quick Start

### Prerequisites
- **Java JDK 25**: Verify your installation by running `java -version`.
- **Node.js**: Required to run the frontend local server.
- **Unity WebGL Build**: Copy your exported Unity WebGL `Build` folder into the `frontend/game/` directory. It must be placed alongside the `index.html` file to load properly.

### Run Locally

**1. Start the Backend Server** (Runs on Port 8081)
```powershell
cd Backend
.\gradlew.bat bootRun
```
*Note: You can also open the `Backend` directory in IntelliJ IDEA and run the `BackendApplication.java` file directly.*

**2. Start the Frontend Application**
Open a new terminal window in the `frontend` directory:
```powershell
cd frontend
node server.js
```
The frontend server will start on port 3000. Open `http://localhost:3000/launcher.html` in your web browser to access the game launcher.

---

##  Controls

| Key / Input | Action |
|-------------|--------|
| **W A S D** | Move Character |
| **Space** | Jump |
| **Mouse** | Look / Aim |
| **Left Click** | Attack / Shoot |
| **Hold V** | Voice Chat (Push-to-Talk) |

---


## Project Structure

```bash
Stranded-Skies-Launcher/
├── Backend/                    # Spring Boot Application (Java)
│   ├── src/main/java/.../
│   │   ├── controller/         # REST API Controllers
│   │   ├── security/           # JWT Configuration & Filters
│   │   └── service/            # Core Business Logic
│   └── data/                   # H2 Database Files
│
└── frontend/                   # Static Web Client (HTML/CSS/JS)
    ├── launcher.html           # Login / Landing Page
    ├── index.html              # Game Page (Auth Guarded)
    ├── leaderboard.html        # Leaderboard UI
    ├── js/                     # Client-side Logic
    │   ├── config.js           # API Configuration (Ports/URLs)
    │   ├── auth.js             # Auth handling & Redirects
    │   └── game-launcher.js    # Unity Loader integration
    └── game/                   # Unity WebGL Exports (Needs Build folder)
```

---

*For more information or to contribute, visit the [Stranded Skies GitHub Repository](https://github.com/Junaed93/Stranded-Skies).*
