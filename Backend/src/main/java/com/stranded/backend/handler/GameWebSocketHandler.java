package com.stranded.backend.handler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class GameWebSocketHandler extends TextWebSocketHandler {

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private static final Map<String, String> sessionToPlayerId = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String playerId = UUID.randomUUID().toString();
        sessions.put(session.getId(), session);
        sessionToPlayerId.put(session.getId(), playerId);
        System.out.println("Player connected: " + playerId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        JsonNode json = objectMapper.readTree(payload);
        String type = json.has("type") ? json.get("type").asText() : "";
        String playerId = sessionToPlayerId.get(session.getId());

        switch (type) {
            case "JOIN":
                broadcastToOthers(session, objectMapper.writeValueAsString(Map.of(
                        "type", "JOIN",
                        "id", playerId)));
                break;

            case "MOVE":
                Map<String, Object> moveData = Map.of(
                        "type", "MOVE",
                        "id", playerId,
                        "x", json.has("x") ? json.get("x").asDouble() : 0,
                        "y", json.has("y") ? json.get("y").asDouble() : 0,
                        "velX", json.has("velX") ? json.get("velX").asDouble() : 0,
                        "grounded", json.has("grounded") ? json.get("grounded").asBoolean() : true);
                broadcastToOthers(session, objectMapper.writeValueAsString(moveData));
                break;

            default:
                broadcastToOthers(session, payload);
                break;
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String playerId = sessionToPlayerId.remove(session.getId());
        sessions.remove(session.getId());

        if (playerId != null) {
            String leaveMessage = objectMapper.writeValueAsString(Map.of(
                    "type", "LEAVE",
                    "id", playerId));
            broadcast(leaveMessage);
            System.out.println("Player disconnected: " + playerId);
        }
    }

    private void broadcast(String message) {
        sessions.values().forEach(session -> {
            try {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(message));
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }

    private void broadcastToOthers(WebSocketSession sender, String message) {
        sessions.values().forEach(session -> {
            try {
                if (session.isOpen() && !session.getId().equals(sender.getId())) {
                    session.sendMessage(new TextMessage(message));
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }
}
