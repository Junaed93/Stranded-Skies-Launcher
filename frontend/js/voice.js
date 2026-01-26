const peerConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

let localStream = null;
let peerConnection = null;

function initVoice() {
    if (typeof stomp === 'undefined' || !isChatConnected) {
        setTimeout(initVoice, 500);
        return;
    }
    
    console.log("Voice system ready");
    
    stomp.subscribe("/topic/voice", function(response) {
        const data = JSON.parse(response.body);
        console.log("Voice signal received:", data.type);
        
        if (data.type === "offer") {
            handleOffer(data);
        } else if (data.type === "answer") {
            handleAnswer(data);
        } else if (data.type === "candidate") {
            handleCandidate(data);
        }
    });
}

async function startVoice() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        peerConnection = new RTCPeerConnection(peerConfig);
        
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                stomp.send("/app/voice", {}, JSON.stringify({
                    type: "candidate",
                    candidate: event.candidate
                }));
            }
        };
        
        peerConnection.ontrack = (event) => {
            const audio = new Audio();
            audio.srcObject = event.streams[0];
            audio.play();
        };
        
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        stomp.send("/app/voice", {}, JSON.stringify({
            type: "offer",
            offer: offer
        }));
        
        console.log("Voice broadcast started");
    } catch (err) {
        console.error("Voice error:", err);
    }
}

function stopVoice() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    console.log("Voice broadcast stopped");
}

async function handleOffer(data) {
    peerConnection = new RTCPeerConnection(peerConfig);
    
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            stomp.send("/app/voice", {}, JSON.stringify({
                type: "candidate",
                candidate: event.candidate
            }));
        }
    };
    
    peerConnection.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play();
    };
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    stomp.send("/app/voice", {}, JSON.stringify({
        type: "answer",
        answer: answer
    }));
}

async function handleAnswer(data) {
    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
}

async function handleCandidate(data) {
    if (peerConnection && data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
}

// Attach to main document
document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "v" && !localStream) {
        startVoice();
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key.toLowerCase() === "v" && localStream) {
        stopVoice();
    }
});

// Also attach to Iframe (since Game steals focus)
const unityIframe = document.getElementById("unity");
if (unityIframe) {
    unityIframe.onload = function() {
        try {
            const iframeDoc = unityIframe.contentDocument || unityIframe.contentWindow.document;
            iframeDoc.addEventListener("keydown", (e) => {
                if (e.key.toLowerCase() === "v" && !localStream) {
                    startVoice();
                }
            });
            iframeDoc.addEventListener("keyup", (e) => {
                if (e.key.toLowerCase() === "v" && localStream) {
                    stopVoice();
                }
            });
            console.log("Voice controls attached to Game Iframe");
        } catch (e) {
            console.warn("Could not attach voice controls to iframe (CORS?):", e);
        }
    };
}

initVoice();
