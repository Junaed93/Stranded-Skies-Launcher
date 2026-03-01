package com.stranded.backend.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(GameWebSocketHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Maps session ID -> player unique ID
    private final Map<String, String> sessionPlayerIds = new ConcurrentHashMap<>();
    // Maps session ID -> WebSocketSession
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String playerId = UUID.randomUUID().toString().substring(0, 8);
        sessionPlayerIds.put(session.getId(), playerId);
        sessions.put(session.getId(), session);
        log.info("[GameWS] Player connected: {} (session: {})", playerId, session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.debug("[GameWS] Received from {}: {}", sessionPlayerIds.get(session.getId()), payload);

        try {
            JsonNode json = objectMapper.readTree(payload);
            String type = json.has("type") ? json.get("type").asText() : "";

            switch (type) {
                case "JOIN":
                    handleJoin(session);
                    break;
                case "MOVE":
                    handleMove(session, json);
                    break;
                default:
                    log.warn("[GameWS] Unknown message type: {}", type);
                    break;
            }
        } catch (Exception e) {
            log.error("[GameWS] Error processing message: {}", e.getMessage(), e);
        }
    }

    private void handleJoin(WebSocketSession session) {
        String playerId = sessionPlayerIds.get(session.getId());
        log.info("[GameWS] Player {} joined the game", playerId);

        // Send existing players' info to the newly joined player
        // (They will appear when MOVE messages start arriving)
    }

    private void handleMove(WebSocketSession senderSession, JsonNode json) {
        String senderId = sessionPlayerIds.get(senderSession.getId());

        // Create outgoing message with sender's ID attached
        ObjectNode outgoing = objectMapper.createObjectNode();
        outgoing.put("type", "MOVE");
        outgoing.put("id", senderId);
        outgoing.put("x", json.has("x") ? json.get("x").asDouble() : 0.0);
        outgoing.put("y", json.has("y") ? json.get("y").asDouble() : 0.0);
        outgoing.put("velX", json.has("velX") ? json.get("velX").asDouble() : 0.0);
        outgoing.put("grounded", json.has("grounded") && json.get("grounded").asBoolean());

        String outgoingJson;
        try {
            outgoingJson = objectMapper.writeValueAsString(outgoing);
        } catch (Exception e) {
            log.error("[GameWS] Failed to serialize MOVE message", e);
            return;
        }

        // Broadcast to all OTHER connected clients
        TextMessage broadcastMessage = new TextMessage(outgoingJson);
        for (Map.Entry<String, WebSocketSession> entry : sessions.entrySet()) {
            WebSocketSession targetSession = entry.getValue();
            if (targetSession.isOpen() && !targetSession.getId().equals(senderSession.getId())) {
                try {
                    synchronized (targetSession) {
                        targetSession.sendMessage(broadcastMessage);
                    }
                } catch (IOException e) {
                    log.error("[GameWS] Failed to send MOVE to session {}: {}",
                            entry.getKey(), e.getMessage());
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String playerId = sessionPlayerIds.remove(session.getId());
        sessions.remove(session.getId());

        if (playerId != null) {
            log.info("[GameWS] Player disconnected: {} (status: {})", playerId, status);

            // Broadcast LEAVE to all remaining clients
            ObjectNode leaveMessage = objectMapper.createObjectNode();
            leaveMessage.put("type", "LEAVE");
            leaveMessage.put("id", playerId);

            String leaveJson = objectMapper.writeValueAsString(leaveMessage);
            TextMessage broadcastMessage = new TextMessage(leaveJson);

            for (WebSocketSession s : sessions.values()) {
                if (s.isOpen()) {
                    try {
                        synchronized (s) {
                            s.sendMessage(broadcastMessage);
                        }
                    } catch (IOException e) {
                        log.error("[GameWS] Failed to send LEAVE to session: {}", e.getMessage());
                    }
                }
            }
        }
    }
}
