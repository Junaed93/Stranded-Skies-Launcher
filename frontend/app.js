const BASE_URL = 'http://localhost:8080';
const UNITY_URL = './game/index.html';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const guestBtn = document.getElementById('guestBtn');
const toggleAuthText = document.getElementById('toggleAuthText');
const authTitle = document.getElementById('authTitle');
const errorDisplay = document.getElementById('errorDisplay');
const leaderboardList = document.getElementById('leaderboardList');

// State
let isLoginMode = true;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchLeaderboard();
});

// Event Listeners
if (toggleAuthText) {
    toggleAuthText.addEventListener('click', toggleAuthMode);
}

if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}

if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
}

if (guestBtn) {
    guestBtn.addEventListener('click', handleGuestLogin);
}

// Functions

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    errorDisplay.style.display = 'none';
    
    if (isLoginMode) {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authTitle.innerText = 'Pilot Login';
        toggleAuthText.innerHTML = 'New here? <span style="color: var(--accent-color); text-decoration: underline;">Create an account</span>';
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        authTitle.innerText = 'Recruit Registration';
        toggleAuthText.innerHTML = 'Already have an account? <span style="color: var(--accent-color); text-decoration: underline;">Login</span>';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    showError(null);
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        launchGame(data.token);

    } catch (err) {
        showError(err.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    showError(null);

    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        launchGame(data.token);

    } catch (err) {
        showError(err.message);
    }
}

async function handleGuestLogin() {
    showError(null);
    try {
        const response = await fetch(`${BASE_URL}/auth/guest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '' // Empty body as per spec
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Guest login failed');
        }

        launchGame(data.token);

    } catch (err) {
        showError(err.message);
    }
}

function launchGame(token) {
    if (!token) {
        showError("Authentication Error: No token received");
        return;
    }

    // Store token
    localStorage.setItem('jwt_token', token);

    // Redirect to Unity
    // As per spec: /game/index.html?token=JWT_TOKEN
    const targetUrl = `${UNITY_URL}?token=${token}`;
    alert(`Launching Stranded Skies...\nToken: ${token.substring(0, 10)}...`); // User feedback
    window.location.href = targetUrl;
}

async function fetchLeaderboard() {
    try {
        const response = await fetch(`${BASE_URL}/api/leaderboard`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) return;

        const data = await response.json();
        renderLeaderboard(data);

    } catch (err) {
        console.error("Failed to load leaderboard", err);
        leaderboardList.innerHTML = '<li class="leaderboard-item" style="justify-content:center; color: var(--text-secondary);">Offline Mode - Leaderboard Unavailable</li>';
    }
}

function renderLeaderboard(data) {
    leaderboardList.innerHTML = '';
    
    // Sort by score desc just in case backend doesn't, though usually it does.
    // Spec doesn't say backend sorts, but result example implies it might.
    // We will assume data is array of objects.
    
    data.slice(0, 5).forEach((entry, index) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-item';
        
        li.innerHTML = `
            <div style="display:flex; align-items:center;">
                <span class="rank">#${index + 1}</span>
                <span class="player-name">${entry.username}</span>
            </div>
            <div style="display:flex; align-items:center;">
                <span class="score">${entry.score}</span>
                <span class="gamemode">${entry.gameMode || ''}</span>
            </div>
        `;
        leaderboardList.appendChild(li);
    });
}

function showError(msg) {
    if (msg) {
        errorDisplay.innerText = msg;
        errorDisplay.style.display = 'block';
    } else {
        errorDisplay.style.display = 'none';
    }
}
