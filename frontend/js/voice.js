const peerConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

const myPeerId = "peer_" + Math.random().toString(36).substr(2, 9);
console.log("[Voice] My Peer ID:", myPeerId);

let localStream = null;
let peerConnections = {}; 
let isVoiceActive = false;
let pendingCandidates = {}; 

let voiceIndicator = null;

function createVoiceIndicator() {
    voiceIndicator = document.createElement('div');
    voiceIndicator.id = 'voiceIndicator';
    voiceIndicator.innerHTML = '🎙 TRANSMITTING...';
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
    
    stomp.subscribe("/topic/voice", function(response) {
        const data = JSON.parse(response.body);
        
        if (data.senderId === myPeerId) {
            return;
        }
        
        console.log("[Voice] Signal received:", data.type, "from:", data.senderId);
        
        if (data.targetId && data.targetId !== myPeerId) {
            console.log("[Voice] Message not for us, ignoring");
            return;
        }
        
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
    console.log("[Voice] Sending signal:", data.type, data.targetId ? "to:" + data.targetId : "(broadcast)");
    stomp.send("/app/voice", {}, JSON.stringify(data));
}

async function startVoice() {
    if (isVoiceActive) return;
    isVoiceActive = true;
    
    console.log("[Voice] Starting broadcast...");
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        console.log("[Voice] Microphone access granted, tracks:", localStream.getTracks().length);
        
        if (voiceIndicator) voiceIndicator.style.display = 'block';
        
        const broadcastPc = createPeerConnection("broadcast");
        peerConnections["broadcast"] = broadcastPc;
        
        localStream.getTracks().forEach(track => {
            console.log("[Voice] Adding track:", track.kind);
            broadcastPc.addTrack(track, localStream);
        });
        
        const offer = await broadcastPc.createOffer();
        await broadcastPc.setLocalDescription(offer);
        
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
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    Object.keys(peerConnections).forEach(id => {
        if (peerConnections[id]) {
            peerConnections[id].close();
        }
    });
    peerConnections = {};
    pendingCandidates = {};
    
    document.querySelectorAll('audio[id^="audio_"]').forEach(el => el.remove());
    
    if (voiceIndicator) voiceIndicator.style.display = 'none';
    
    sendSignal({ type: "hangup" });
    
    isVoiceActive = false;
}

function createPeerConnection(peerId) {
    console.log("[Voice] Creating peer connection for:", peerId);
    
    const pc = new RTCPeerConnection(peerConfig);
    
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("[Voice] ICE candidate generated for:", peerId);
            sendSignal({
                type: "candidate",
                candidate: {
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex
                },
                targetId: peerId === "broadcast" ? undefined : peerId
            });
        }
    };
    
    pc.ontrack = (event) => {
        console.log("[Voice] RECEIVED REMOTE TRACK from:", peerId, event.streams);
        
        const existingAudio = document.getElementById('audio_' + peerId);
        if (existingAudio) existingAudio.remove();
        
        const audio = document.createElement('audio');
        audio.id = 'audio_' + peerId;
        audio.autoplay = true;
        audio.volume = 1.0;
        
        if (event.streams && event.streams[0]) {
            audio.srcObject = event.streams[0];
        } else {
            const stream = new MediaStream();
            stream.addTrack(event.track);
            audio.srcObject = stream;
        }
        
        document.body.appendChild(audio);
        
        audio.play()
            .then(() => console.log("[Voice] Audio playing for:", peerId))
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
        console.log("[Voice] Connection state for", peerId + ":", pc.connectionState);
    };
    
    pc.oniceconnectionstatechange = () => {
        console.log("[Voice] ICE state for", peerId + ":", pc.iceConnectionState);
    };
    
    return pc;
}

async function handleOffer(data) {
    console.log("[Voice] Handling offer from:", data.senderId);
    
    try {
        const pc = createPeerConnection(data.senderId);
        peerConnections[data.senderId] = pc;
        
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        console.log("[Voice] Remote description set for:", data.senderId);
        
        if (pendingCandidates[data.senderId]) {
            for (const candidate of pendingCandidates[data.senderId]) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("[Voice] Applied pending ICE candidate");
            }
            delete pendingCandidates[data.senderId];
        }
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("[Voice] Local description set for:", data.senderId);
        
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
    
    const pc = peerConnections["broadcast"];
    if (!pc) {
        console.warn("[Voice] No broadcast connection found");
        return;
    }
    
    try {
        if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log("[Voice] Remote description set from answer");
            
            if (pendingCandidates[data.senderId] || pendingCandidates["broadcast"]) {
                const candidates = (pendingCandidates[data.senderId] || []).concat(pendingCandidates["broadcast"] || []);
                for (const candidate of candidates) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log("[Voice] Applied pending ICE candidate from answer handler");
                }
                delete pendingCandidates[data.senderId];
                delete pendingCandidates["broadcast"];
            }
        } else {
            console.warn("[Voice] Unexpected signaling state:", pc.signalingState);
        }
    } catch (err) {
        console.error("[Voice] Error handling answer:", err);
    }
}

async function handleCandidate(data) {
    console.log("[Voice] Handling ICE candidate from:", data.senderId);
    
    let pc = peerConnections[data.senderId] || peerConnections["broadcast"];
    
    if (!data.candidate) {
        console.warn("[Voice] Empty candidate received");
        return;
    }
    
    if (!pc || !pc.remoteDescription) {
        console.log("[Voice] No ready peer connection, queuing ICE candidate");
        if (!pendingCandidates[data.senderId]) {
            pendingCandidates[data.senderId] = [];
        }
        pendingCandidates[data.senderId].push(data.candidate);
        return;
    }
    
    try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log("[Voice] ICE candidate added for:", data.senderId);
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
    
    delete pendingCandidates[data.senderId];
}

document.addEventListener("keydown", (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    if (e.key.toLowerCase() === "v" && !e.repeat && !isVoiceActive) {
        startVoice();
    }
});

document.addEventListener("keyup", (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    if (e.key.toLowerCase() === "v") {
        stopVoice();
    }
});

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

initVoice();

console.log("[Voice] Script loaded - Hold V to talk");
