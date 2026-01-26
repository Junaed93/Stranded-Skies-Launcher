# 🌌 Stranded Skies - Launcher & Game

Welcome to the **Stranded Skies** project! This repository contains the Multiplayer Backend (Spring Boot) and the WebGL Game Frontend.

Follow the interactive checklist below to set up and run the project.

---

## 🚀 Interactive Setup Guide

### 1. Prerequisites
Ensure you have the following installed:
- [ ] **Java JDK 17+** (Run `java -version` to check)
- [ ] **Node.js** (Run `node -v` to check)
- [ ] **Git** (Optional, for version control)

### 2. Backend Setup (Game Server)
The backend handles authentication, multiplayer logic, and the leaderboard.

- [ ] **Navigate to Backend folder**:
  ```powershell
  cd Backend
  ```
- [ ] **Clean and Build** (Fixes database locks/build issues):
  ```powershell
  .\gradlew.bat clean build
  ```
- [ ] **Run the Server**:
  ```powershell
  .\gradlew.bat bootRun
  ```
  > ✅ **Success Check**: Wait for `Started UnityBackendApplication in ... seconds` in the logs.
  >
  > ⚠️ **Troubleshooting**: If it fails with `org.h2.mvstore.db`, delete files in `Backend/data/` and try again.

### 3. Frontend Setup (Game Client)
The frontend serves the Unity WebGL game and handles the UI.

- [ ] **Open a new terminal** (Keep backend running!).
- [ ] **Navigate to Frontend folder**:
  ```powershell
  cd frontend
  ```
- [ ] **Start the Local Server**:
  ```powershell
  node server.js
  ```
- [ ] **Open in Browser**:
  [http://localhost:3000](http://localhost:3000)

---

## 🎮 How to Play

1.  **Login / Guest**:
    -   Click **"Play as Guest"** to start immediately.
    -   Or **Login/Register** to save your stats permanently.
2.  **Controls**:
    -   **WASD**: Move
    -   **Space**: Jump
    -   **Mouse**: Look/Aim
    -   **Left Click**: Attack
    -   **V**: Voice Chat (Hold to talk)
3.  **Saving Scores**:
    -   If playing as **Guest**, when you die/finish, a "Save Score" popup will appear.
    -   Create an account there to **upgrade** your guest session and save your score to the leaderboard!

---

## 🛠️ Project Structure

-   `/Backend` - Spring Boot (Java) WebSocket server.
    -   `src/main/java/.../controller`: API Endpoints (Auth, Scores, Leaderboard).
    -   `data/`: H2 Database files (auto-created).
-   `/frontend` - HTML/JS + Unity WebGL Build.
    -   `index.html`: Landing & Login page.
    -   `game.html`: Main game container (Iframe).
    -   `game/`: Unity WebGL build files.
    -   `js/`: Logic for Auth, Chat, Voice, and Game Launching.

---

## 🆘 Common Issues

-   **"Port 8080 already in use"**: The backend is already running. Close other terminal windows or run `Stop-Process -Name java -Force` in PowerShell.
-   **"Game not loading"**: Ensure `node server.js` is running. Do not open `index.html` directly from a file path (C:/...).
-   **"CORS Error"**: Ensure Backend is running on port 8080 and Frontend on port 3000.
