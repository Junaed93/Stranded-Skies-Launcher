const token = sessionStorage.getItem("token") || localStorage.getItem("token");
const username =
  sessionStorage.getItem("username") ||
  localStorage.getItem("username") ||
  "Player";

if (!token) {
  window.location.href = "launcher.html";
}

document.getElementById("unity").src =
  `game/index.html?token=${token}&name=${encodeURIComponent(username)}`;
