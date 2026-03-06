// game-launcher.js — Room-aware game launcher
// The game is now launched by the room selection modal in index.html.
// This file only handles the redirect guard for unauthenticated users.

const token = sessionStorage.getItem("token") || localStorage.getItem("token");
const username =
  sessionStorage.getItem("username") ||
  localStorage.getItem("username") ||
  "Player";

if (!token) {
  window.location.href = "launcher.html";
}

// The Unity iframe src is now set by launchGameWithRoom() in index.html
// after a room is selected.
