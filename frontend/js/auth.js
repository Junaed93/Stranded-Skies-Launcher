const API = "http://localhost:8080";

function saveToken(token, username, isUpgrade = false) {
  localStorage.setItem("token", token);
  localStorage.setItem("username", username);
  window.location.href = "game.html";
}

async function login() {
  const usernameInput = document.getElementById("loginUser");
  const passwordInput = document.getElementById("loginPass");

  try {
      const res = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameInput.value,
          password: passwordInput.value
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Login failed");
      }
      const data = await res.json();
      if(data.token) saveToken(data.token, usernameInput.value, false);
  } catch (e) {
      console.error(e);
      alert(e.message || "Error connecting to server");
  }
}

async function register() {
  console.log("Register clicked");
  const usernameInput = document.getElementById("regUser");
  const passwordInput = document.getElementById("regPass");
  const confirmInput = document.getElementById("regPassConfirm");

  if (!usernameInput.value || !passwordInput.value) {
      alert("Please enter username and password");
      return;
  }
  
  if (passwordInput.value !== confirmInput.value) {
      alert("Passwords do not match!");
      return;
  }

  // Check if current user is Guest
  const currentToken = localStorage.getItem("token");
  const currentUsername = localStorage.getItem("username");
  const isGuest = currentUsername && currentUsername.startsWith("Guest_");
  let isUpgrade = false;

  try {
      let res;
      
      if (isGuest && currentToken) {
          console.log("Upgrading Guest account...");
          res = await fetch(API + "/auth/upgrade", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + currentToken 
            },
            body: JSON.stringify({
              username: usernameInput.value,
              password: passwordInput.value
            })
          });
          isUpgrade = true;
      } else {
          console.log("Creating new account...");
          res = await fetch(API + "/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: usernameInput.value,
              password: passwordInput.value
            })
          });
      }
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errData = await res.json();
        alert("Server Error: " + (errData.error || "Unknown error"));
        throw new Error(errData.error || "Registration failed");
      }
      
      const data = await res.json();
      console.log("Success:", data);
      
      if(data.token) {
          alert(isGuest ? "Account Upgraded! Score Saved." : "Registration Successful! Logging in...");
          saveToken(data.token, usernameInput.value, isUpgrade);
      } else {
          alert("Failed: No token received");
      }
  } catch (e) {
      console.error(e);
      alert("Network/Script Error: " + e.message);
  }
}

async function guest() {
  try {
      const res = await fetch(API + "/auth/guest", { method: "POST" });
      const data = await res.json();
      if(data.token) saveToken(data.token, data.username || "Guest", false);
      else alert("Guest login failed");
  } catch (e) {
      console.error(e);
      alert("Error connecting to server");
  }
}
