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
let peerConnections = {}; // peerId -> RTCPeerConnection
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
    
    const style = document.createElement('style');
    style.textContent = `@keyframes pulse { from { opacity: 0.7; } to { opacity: 1; } }`;
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
        
        // Ignore messages from self
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
}

function sendSignal(data) {
    data.senderId = myPeerId;
    console.log("[Voice] Sending signal:", data.type);
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
        
        console.log("[Voice] Microphone access granted, tracks:", localStream.getTracks().length);
        
        // Show indicator
        if (voiceIndicator) voiceIndicator.style.display = 'block';
        
        // Create peer connection
        const pc = createPeerConnection(myPeerId);
        peerConnections["outgoing"] = pc;
        
        // Add local tracks to connection
        localStream.getTracks().forEach(track => {
            console.log("[Voice] Adding track:", track.kind);
            pc.addTrack(track, localStream);
        });
        
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        sendSignal({
            type: "offer",
            offer: {
                type: offer.type,
                sdp: offer.sdp
            }
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
    
    // Remove all remote audio elements
    document.querySelectorAll('audio[id^="audio_"]').forEach(el => el.remove());
    
    // Hide indicator
    if (voiceIndicator) voiceIndicator.style.display = 'none';
    
    // Notify others
    sendSignal({ type: "hangup" });
    
    isVoiceActive = false;
}

function createPeerConnection(peerId) {
    console.log("[Voice] Creating peer connection for:", peerId);
    
    const pc = new RTCPeerConnection(peerConfig);
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("[Voice] ICE candidate generated");
            sendSignal({
                type: "candidate",
                candidate: {
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex
                }
            });
        }
    };
    
    pc.ontrack = (event) => {
        console.log("[Voice] RECEIVED REMOTE TRACK!", event.streams);
        
        // Remove existing audio
        const existingAudio = document.getElementById('audio_' + peerId);
        if (existingAudio) existingAudio.remove();
        
        // Create audio element
        const audio = document.createElement('audio');
        audio.id = 'audio_' + peerId;
        audio.autoplay = true;
        audio.volume = 1.0;
        
        if (event.streams && event.streams[0]) {
            audio.srcObject = event.streams[0];
        } else {
            // Fallback: create stream from track
            const stream = new MediaStream();
            stream.addTrack(event.track);
            audio.srcObject = stream;
        }
        
        document.body.appendChild(audio);
        
        // Force play
        audio.play()
            .then(() => console.log("[Voice] Audio playing!"))
            .catch(e => {
                console.warn("[Voice] Autoplay blocked, click anywhere to enable");
                const enableAudio = () => {
                    audio.play();
                    document.removeEventListener('click', enableAudio);
                };
                document.addEventListener('click', enableAudio);
            });
    };
    
    pc.onconnectionstatechange = () => {
        console.log("[Voice] Connection state:", pc.connectionState);
    };
    
    pc.oniceconnectionstatechange = () => {
        console.log("[Voice] ICE state:", pc.iceConnectionState);
    };
    
    return pc;
}

async function handleOffer(data) {
    console.log("[Voice] Handling offer from:", data.senderId);
    
    try {
        // Create a new peer connection for this sender
        const pc = createPeerConnection(data.senderId);
        peerConnections[data.senderId] = pc;
        
        // Set remote description (the offer)
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        console.log("[Voice] Remote description set");
        
        // Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("[Voice] Local description set");
        
        sendSignal({
            type: "answer",
            answer: {
                type: answer.type,
                sdp: answer.sdp
            },
            targetId: data.senderId
        });
        
        console.log("[Voice] Answer sent to:", data.senderId);
    } catch (err) {
        console.error("[Voice] Error handling offer:", err);
    }
}

async function handleAnswer(data) {
    console.log("[Voice] Handling answer from:", data.senderId);
    
    const pc = peerConnections["outgoing"];
    if (!pc) {
        console.warn("[Voice] No outgoing connection found");
        return;
    }
    
    try {
        if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log("[Voice] Remote description set from answer");
        } else {
            console.warn("[Voice] Unexpected signaling state:", pc.signalingState);
        }
    } catch (err) {
        console.error("[Voice] Error handling answer:", err);
    }
}

async function handleCandidate(data) {
    console.log("[Voice] Handling ICE candidate from:", data.senderId);
    
    // Try to find the right peer connection
    let pc = peerConnections[data.senderId] || peerConnections["outgoing"];
    
    if (!pc) {
        console.warn("[Voice] No peer connection found for candidate");
        return;
    }
    
    if (!data.candidate) {
        console.warn("[Voice] Empty candidate received");
        return;
    }
    
    try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log("[Voice] ICE candidate added");
    } catch (e) {
        console.warn("[Voice] ICE candidate error:", e.message);
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
