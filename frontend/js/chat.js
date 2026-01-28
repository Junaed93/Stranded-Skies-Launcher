let socket = new SockJS(`${CONFIG.API_URL}/ws`);
let stomp = Stomp.over(socket);
let isChatConnected = false;

const myUsername = localStorage.getItem("username") || "Anonymous";

console.log("Connecting to chat server...");

stomp.connect({}, function(frame) {
    console.log("Connected: " + frame);
    isChatConnected = true;
    
    const statusEl = document.getElementById("connectionStatus");
    if (statusEl) {
        statusEl.innerText = "Online";
        statusEl.style.color = "#2ed573";
    }
    
    stomp.subscribe("/topic/chat", function(response) {
        console.log("Message received:", response.body);
        const data = JSON.parse(response.body);
        const messages = document.getElementById("messages");
        if (messages) {
            const div = document.createElement("div");
            div.innerHTML = "<b>" + (data.username || "Unknown") + ":</b> " + (data.message || "");
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
    });
    
}, function(error) {
    console.error("Connection error:", error);
    isChatConnected = false;
    const statusEl = document.getElementById("connectionStatus");
    if (statusEl) {
        statusEl.innerText = "Offline";
        statusEl.style.color = "#ff4757";
    }
});

function sendMessage() {
    if (!isChatConnected) {
        alert("Not connected to chat server");
        return;
    }
    
    const msgInput = document.getElementById("msg");
    if (!msgInput || !msgInput.value.trim()) return;
    
    stomp.send("/app/chat", {}, JSON.stringify({
        username: myUsername,
        message: msgInput.value
    }));
    
    msgInput.value = "";
}
