// ========================================
// SESSION GUARD - Protect pages requiring login
// ========================================

const SESSION_API = "http://localhost:8080/auth/validate";

(function() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // No token at all - redirect immediately
    if (!token) {
        console.log("[Session] No token found, redirecting to login...");
        redirectToLogin();
        return;
    }

    // Validate token with backend
    validateSession(token);
})();

async function validateSession(token) {
    try {
        const response = await fetch(SESSION_API, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.valid) {
                console.log("[Session] Valid session for:", data.username);
                // Update username in case it changed (e.g., after upgrade)
                localStorage.setItem("username", data.username);
                showPage();
                return;
            }
        }

        // Token invalid or expired
        console.log("[Session] Invalid token, clearing and redirecting...");
        clearSession();
        redirectToLogin();

    } catch (error) {
        console.error("[Session] Validation error:", error);
        // If backend is down, allow access if token exists (offline mode)
        // Or be strict and redirect - choosing strict for security
        console.log("[Session] Backend unreachable, redirecting to login...");
        redirectToLogin();
    }
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
}

function redirectToLogin() {
    window.location.href = "index.html";
}

function showPage() {
    // Remove the loading overlay if exists
    const overlay = document.getElementById("sessionLoadingOverlay");
    if (overlay) {
        overlay.remove();
    }
    // Make body visible (if hidden initially)
    document.body.style.visibility = "visible";
    document.body.style.opacity = "1";
}

// Logout function (call from UI)
function logout() {
    clearSession();
    redirectToLogin();
}
