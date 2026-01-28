const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "launcher.html";
}

document.getElementById("unity").src =
  `game/index.html?token=${token}`;
