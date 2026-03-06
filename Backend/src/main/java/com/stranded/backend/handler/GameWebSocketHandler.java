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
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(GameWebSocketHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Maps session ID -> player unique ID
    private final Map<String, String> sessionPlayerIds = new ConcurrentHashMap<>();
    // Maps session ID -> WebSocketSession
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    // Maps session ID -> roomId
    private final Map<String, String> sessionRoomIds = new ConcurrentHashMap<>();
    // Maps roomId -> Set of session IDs in that room
    private final Map<String, Set<String>> rooms = new ConcurrentHashMap<>();

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
                    handleJoin(session, json);
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

    private void handleJoin(WebSocketSession session, JsonNode json) {
        String playerId = sessionPlayerIds.get(session.getId());
        String roomId = json.has("roomId") ? json.get("roomId").asText() : "default";

        // Register session under the room
        sessionRoomIds.put(session.getId(), roomId);
        rooms.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(session.getId());

        log.info("[GameWS] Player {} joined room {}", playerId, roomId);

        // Notify other players in the same room that a new player joined
        ObjectNode joinMsg = objectMapper.createObjectNode();
        joinMsg.put("type", "PLAYER_JOINED");
        joinMsg.put("id", playerId);
        broadcastToRoom(roomId, joinMsg, session.getId());
    }

    private void handleMove(WebSocketSession senderSession, JsonNode json) {
        String senderId = sessionPlayerIds.get(senderSession.getId());
        String roomId = sessionRoomIds.getOrDefault(senderSession.getId(), "default");

        // Create outgoing message with sender's ID attached
        ObjectNode outgoing = objectMapper.createObjectNode();
        outgoing.put("type", "MOVE");
        outgoing.put("id", senderId);
        outgoing.put("x", json.has("x") ? json.get("x").asDouble() : 0.0);
        outgoing.put("y", json.has("y") ? json.get("y").asDouble() : 0.0);
        outgoing.put("velX", json.has("velX") ? json.get("velX").asDouble() : 0.0);
        outgoing.put("grounded", json.has("grounded") && json.get("grounded").asBoolean());

        // Broadcast to all OTHER connected clients in the SAME ROOM
        broadcastToRoom(roomId, outgoing, senderSession.getId());
    }

    private void broadcastToRoom(String roomId, ObjectNode message, String excludeSessionId) {
        Set<String> roomSessions = rooms.get(roomId);
        if (roomSessions == null)
            return;

        String jsonStr;
        try {
            jsonStr = objectMapper.writeValueAsString(message);
        } catch (Exception e) {
            log.error("[GameWS] Failed to serialize message", e);
            return;
        }

        TextMessage broadcastMessage = new TextMessage(jsonStr);
        for (String sessionId : roomSessions) {
            if (excludeSessionId != null && sessionId.equals(excludeSessionId))
                continue;
            WebSocketSession targetSession = sessions.get(sessionId);
            if (targetSession != null && targetSession.isOpen()) {
                try {
                    synchronized (targetSession) {
                        targetSession.sendMessage(broadcastMessage);
                    }
                } catch (IOException e) {
                    log.error("[GameWS] Failed to send to session {}: {}", sessionId, e.getMessage());
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String playerId = sessionPlayerIds.remove(session.getId());
        sessions.remove(session.getId());
        String roomId = sessionRoomIds.remove(session.getId());

        if (playerId != null && roomId != null) {
            log.info("[GameWS] Player {} disconnected from room {} (status: {})", playerId, roomId, status);

            Set<String> roomSessions = rooms.get(roomId);
            if (roomSessions != null) {
                roomSessions.remove(session.getId());
                if (roomSessions.isEmpty()) {
                    rooms.remove(roomId);
                    log.info("[GameWS] Room {} is now empty, removed", roomId);
                }
            }

            // Broadcast LEAVE to all remaining clients in the room
            ObjectNode leaveMessage = objectMapper.createObjectNode();
            leaveMessage.put("type", "LEAVE");
            leaveMessage.put("id", playerId);
            broadcastToRoom(roomId, leaveMessage, null);
        }
    }

    // --- Methods used by GameRoomController ---

    public Set<String> getActiveRoomIds() {
        return rooms.keySet();
    }

    public int getRoomPlayerCount(String roomId) {
        Set<String> roomSessions = rooms.get(roomId);
        return roomSessions != null ? roomSessions.size() : 0;
    }

    public String createRoom() {
        String roomId = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        rooms.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet());
        log.info("[GameWS] Room created: {}", roomId);
        return roomId;
    }
}
