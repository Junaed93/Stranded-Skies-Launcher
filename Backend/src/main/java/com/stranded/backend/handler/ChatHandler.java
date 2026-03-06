package com.stranded.backend.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stranded.backend.entity.ChatMessage;
import com.stranded.backend.repository.ChatMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatHandler.class);

    // roomId -> list of sessions in that room
    private final Map<String, List<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
    // session ID -> roomId
    private final Map<String, String> sessionRoomMap = new ConcurrentHashMap<>();

    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatHandler(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String roomId = extractRoomId(session);
        if (roomId == null)
            roomId = "default";

        sessionRoomMap.put(session.getId(), roomId);
        roomSessions.computeIfAbsent(roomId, k -> Collections.synchronizedList(new ArrayList<>())).add(session);

        log.info("[ChatWS] Session {} joined chat room '{}'. Room now has {} sessions. Total rooms: {}",
                session.getId(), roomId,
                roomSessions.get(roomId).size(),
                roomSessions.size());

        // Send existing chat history for this room
        List<ChatMessage> history = chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId);
        for (ChatMessage msg : history) {
            Map<String, Object> msgMap = new LinkedHashMap<>();
            msgMap.put("sender", msg.getSender());
            msgMap.put("content", msg.getContent());
            msgMap.put("roomId", msg.getRoomId());
            msgMap.put("timestamp", msg.getTimestamp() != null ? msg.getTimestamp().toString() : null);
            String json = objectMapper.writeValueAsString(msgMap);
            session.sendMessage(new TextMessage(json));
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            @SuppressWarnings("unchecked")
            Map<String, String> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String sender = payload.get("sender");
            String content = payload.get("content");
            String roomId = sessionRoomMap.getOrDefault(session.getId(), "default");

            if (sender != null && content != null) {
                ChatMessage chatMessage = new ChatMessage(sender, content, roomId);
                chatMessageRepository.save(chatMessage);

                Map<String, Object> broadcastMap = new LinkedHashMap<>();
                broadcastMap.put("sender", chatMessage.getSender());
                broadcastMap.put("content", chatMessage.getContent());
                broadcastMap.put("roomId", chatMessage.getRoomId());
                broadcastMap.put("timestamp",
                        chatMessage.getTimestamp() != null ? chatMessage.getTimestamp().toString() : null);
                String broadcastJson = objectMapper.writeValueAsString(broadcastMap);

                // Broadcast only to sessions in the same room
                List<WebSocketSession> targets = roomSessions.getOrDefault(roomId, Collections.emptyList());
                for (WebSocketSession s : targets) {
                    if (s.isOpen()) {
                        synchronized (s) {
                            s.sendMessage(new TextMessage(broadcastJson));
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("[ChatWS] Error processing message", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String roomId = sessionRoomMap.remove(session.getId());
        log.info("[ChatWS] Session {} disconnected from room '{}'", session.getId(), roomId);
        if (roomId != null) {
            List<WebSocketSession> sessions = roomSessions.get(roomId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    roomSessions.remove(roomId);
                }
            }
        }
    }

    private String extractRoomId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null)
            return null;

        // Try query string parsing directly for robustness
        String query = uri.getQuery();
        log.info("[ChatWS] Raw URI: {}, Query: {}", uri, query);

        if (query != null) {
            for (String param : query.split("&")) {
                String[] kv = param.split("=", 2);
                if (kv.length == 2 && "roomId".equals(kv[0])) {
                    String value = kv[1];
                    try {
                        value = java.net.URLDecoder.decode(value, "UTF-8");
                    } catch (Exception ignored) {
                    }
                    log.info("[ChatWS] Extracted roomId: '{}'", value);
                    return value;
                }
            }
        }

        log.warn("[ChatWS] No roomId found in URI: {}", uri);
        return null;
    }

    // --- Methods used by GameRoomController ---

    public Set<String> getActiveRoomIds() {
        log.info("[ChatWS] getActiveRoomIds called. Rooms: {}", roomSessions.keySet());
        return roomSessions.keySet();
    }

    public int getRoomPlayerCount(String roomId) {
        List<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions == null) {
            log.info("[ChatWS] getRoomPlayerCount('{}') = 0 (no entry)", roomId);
            return 0;
        }
        int count = (int) sessions.stream().filter(WebSocketSession::isOpen).count();
        log.info("[ChatWS] getRoomPlayerCount('{}') = {} (total={}, open={})", roomId, count, sessions.size(), count);
        return count;
    }
}
