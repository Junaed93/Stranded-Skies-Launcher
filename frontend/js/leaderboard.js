// Parse URL Parameters
const urlParams = new URLSearchParams(window.location.search);
const scoreParam = urlParams.get('score');
const modeParam = urlParams.get('mode');

// DOM Elements
const yourScoreSection = document.getElementById('yourScoreSection');
const playerScoreEl = document.getElementById('playerScore');
const gameModeDisplay = document.getElementById('gameModeDisplay');
const listElement = document.getElementById('list');

// 1. Handle "Your Score" Display
if (scoreParam) {
    yourScoreSection.style.display = 'block';
    playerScoreEl.textContent = scoreParam;
    if (modeParam) {
        gameModeDisplay.textContent = `Mode: ${modeParam}`;
    }
    
    // If user is already logged in locally but was redirected with params (Edge case or specific design choice)
    // We could offer to "Quick Save" here, but for now strict "Back to Menu to Login" is safer.
    // Optionally: Automatically try to post if we have a token (Recovery flow).
}

// 2. Fetch Leaderboard Data
fetch("http://localhost:8080/api/leaderboard")
    .then(res => {
        if (!res.ok) throw new Error("API Offline");
        return res.json();
    })
    .then(data => {
        listElement.innerHTML = "";
        
        if (data.length === 0) {
            listElement.innerHTML = '<li style="text-align: center; padding: 20px;">No scores yet. Be the first!</li>';
            return;
        }

        // Sort just in case backend didn't (though backend should)
        // data.sort((a, b) => b.score - a.score); 

        data.forEach((e, index) => {
            const li = document.createElement("li");
            li.className = "leaderboard-item";
            
            // Medals for top 3
            let rankDisplay = index + 1;
            if (index === 0) rankDisplay = "🥇";
            if (index === 1) rankDisplay = "🥈";
            if (index === 2) rankDisplay = "🥉";

            li.innerHTML = `
                <span class="rank">${rankDisplay}</span>
                <span class="player-name">${escapeHtml(e.username)}</span>
                <span class="score">${e.score}</span>
                <span class="gamemode">${e.gameMode || 'Normal'}</span>
            `;
            listElement.appendChild(li);
        });
    })
    .catch(err => {
        console.error(err);
        listElement.innerHTML = '<li style="text-align: center; padding: 20px; color: var(--danger-color);">Failed to load leaderboard. Server might be offline.</li>';
    });

// Helper: Prevent XSS
function escapeHtml(text) {
    if (!text) return "Unknown";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function filterLeaderboard() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toUpperCase();
    const ul = document.getElementById("list");
    const li = ul.getElementsByTagName('li');

    for (let i = 0; i < li.length; i++) {
        const nameSpan = li[i].getElementsByClassName("player-name")[0];
        if (nameSpan) {
            const txtValue = nameSpan.textContent || nameSpan.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                li[i].style.display = "";
            } else {
                li[i].style.display = "none";
            }
        }
    }
}
