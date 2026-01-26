const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "index.html";
}

document.getElementById("unity").src =
  `/game/index.html?token=${token}`;
