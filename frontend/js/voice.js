// ========================================
// VOICE CHAT - Push-to-Talk with WebRTC
// ========================================

const peerConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

// Generate unique ID for this client
const myPeerId = "peer_" + Math.random().toString(36).substr(2, 9);
console.log("[Voice] My Peer ID:", myPeerId);

let localStream = null;
let peerConnections = {}; // Multiple peers support
let isVoiceActive = false;

// Visual indicator
let voiceIndicator = null;

function createVoiceIndicator() {
    voiceIndicator = document.createElement('div');
    voiceIndicator.id = 'voiceIndicator';
    voiceIndicator.innerHTML = 'TRANSMITTING...';
    voiceIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 71, 87, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: bold;
        font-family: sans-serif;
        z-index: 9999;
        display: none;
        animation: pulse 0.5s ease-in-out infinite alternate;
    `;
    document.body.appendChild(voiceIndicator);
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            from { opacity: 0.7; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

function initVoice() {
    if (typeof stomp === 'undefined' || !isChatConnected) {
        console.log("[Voice] Waiting for STOMP connection...");
        setTimeout(initVoice, 500);
        return;
    }
    
    console.log("[Voice] System initialized!");
    createVoiceIndicator();
    
    // Subscribe to voice signaling
    stomp.subscribe("/topic/voice", function(response) {
        const data = JSON.parse(response.body);
        
        // IMPORTANT: Ignore messages from self
        if (data.senderId === myPeerId) {
            return;
        }
        
        console.log("[Voice] Signal received:", data.type, "from:", data.senderId);
        
        switch(data.type) {
            case "offer":
                handleOffer(data);
                break;
            case "answer":
                handleAnswer(data);
                break;
            case "candidate":
                handleCandidate(data);
                break;
            case "hangup":
                handleHangup(data);
                break;
        }
    });
    
    // Announce presence
    sendSignal({ type: "join" });
}

function sendSignal(data) {
    data.senderId = myPeerId;
    stomp.send("/app/voice", {}, JSON.stringify(data));
}

async function startVoice() {
    if (isVoiceActive) return;
    isVoiceActive = true;
    
    console.log("[Voice] Starting broadcast...");
    
    try {
        // Get microphone
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        console.log("[Voice] Microphone access granted");
        
        // Show indicator
        if (voiceIndicator) voiceIndicator.style.display = 'block';
        
        // Create peer connection and send offer
        const pc = createPeerConnection("broadcast");
        
        // Add local tracks
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
        
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        sendSignal({
            type: "offer",
            offer: offer
        });
        
        console.log("[Voice] Offer sent!");
        
    } catch (err) {
        console.error("[Voice] Error:", err);
        isVoiceActive = false;
        if (voiceIndicator) voiceIndicator.style.display = 'none';
    }
}

function stopVoice() {
    if (!isVoiceActive) return;
    
    console.log("[Voice] Stopping broadcast...");
    
    // Stop local stream
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // Close all peer connections
    Object.keys(peerConnections).forEach(id => {
        if (peerConnections[id]) {
            peerConnections[id].close();
        }
    });
    peerConnections = {};
    
    // Hide indicator
    if (voiceIndicator) voiceIndicator.style.display = 'none';
    
    // Notify others
    sendSignal({ type: "hangup" });
    
    isVoiceActive = false;
}

function createPeerConnection(peerId) {
    console.log("[Voice] Creating peer connection for:", peerId);
    
    const pc = new RTCPeerConnection(peerConfig);
    peerConnections[peerId] = pc;
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            sendSignal({
                type: "candidate",
                candidate: event.candidate,
                targetId: peerId
            });
        }
    };
    
    pc.ontrack = (event) => {
        console.log("[Voice] Received remote track from:", peerId);
        
        // Remove existing audio for this peer
        const existingAudio = document.getElementById('audio_' + peerId);
        if (existingAudio) existingAudio.remove();
        
        // Create new audio element
        const audio = document.createElement('audio');
        audio.id = 'audio_' + peerId;
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        audio.volume = 1.0;
        document.body.appendChild(audio);
        
        audio.play().then(() => {
            console.log("[Voice] Audio playing from:", peerId);
        }).catch(e => {
            console.warn("[Voice] Autoplay blocked - click page to enable");
            document.addEventListener('click', () => audio.play(), { once: true });
        });
    };
    
    pc.onconnectionstatechange = () => {
        console.log("[Voice] Connection state:", pc.connectionState);
    };
    
    return pc;
}

async function handleOffer(data) {
    console.log("[Voice] Handling offer from:", data.senderId);
    
    const pc = createPeerConnection(data.senderId);
    
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
    
    // Create answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    sendSignal({
        type: "answer",
        answer: answer,
        targetId: data.senderId
    });
    
    console.log("[Voice] Answer sent to:", data.senderId);
}

async function handleAnswer(data) {
    console.log("[Voice] Handling answer from:", data.senderId);
    
    const pc = peerConnections["broadcast"] || peerConnections[data.senderId];
    if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log("[Voice] Remote description set");
    }
}

async function handleCandidate(data) {
    // Find the right peer connection
    const pc = peerConnections["broadcast"] || peerConnections[data.senderId];
    
    if (pc && data.candidate) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
            console.warn("[Voice] ICE candidate error:", e);
        }
    }
}

function handleHangup(data) {
    console.log("[Voice] Peer hung up:", data.senderId);
    
    const audio = document.getElementById('audio_' + data.senderId);
    if (audio) audio.remove();
    
    if (peerConnections[data.senderId]) {
        peerConnections[data.senderId].close();
        delete peerConnections[data.senderId];
    }
}

// ========================================
// KEY BINDINGS - Hold V to talk
// ========================================

document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "v" && !e.repeat && !isVoiceActive) {
        startVoice();
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() === "v") {
        stopVoice();
    }
});

// Also try to attach to iframe
const unityIframe = document.getElementById("unity");
if (unityIframe) {
    unityIframe.onload = function() {
        try {
            const iframeDoc = unityIframe.contentDocument || unityIframe.contentWindow.document;
            iframeDoc.addEventListener("keydown", (e) => {
                if (e.key.toLowerCase() === "v" && !e.repeat && !isVoiceActive) {
                    startVoice();
                }
            });
            iframeDoc.addEventListener("keyup", (e) => {
                if (e.key.toLowerCase() === "v") {
                    stopVoice();
                }
            });
            console.log("[Voice] Controls attached to iframe");
        } catch (e) {
            console.warn("[Voice] Cannot attach to iframe (CORS)");
        }
    };
}

// Initialize
initVoice();

console.log("[Voice] Script loaded - Hold V to talk");
