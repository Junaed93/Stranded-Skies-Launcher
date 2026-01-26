package com.stranded.backend.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stranded.backend.entity.ChatMessage;
import com.stranded.backend.repository.ChatMessageRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class ChatHandler extends TextWebSocketHandler {

    private final List<WebSocketSession> sessions = new ArrayList<>();
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatHandler(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // Assume message payload is JSON: {"sender": "...", "content": "..."}
        // Ideally we would validate token from query param or header, but for MVP
        // standard WS:
        // We trust the sender in the message or minimal validation.

        try {
            @SuppressWarnings("unchecked")
            Map<String, String> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String sender = payload.get("sender");
            String content = payload.get("content");

            if (sender != null && content != null) {
                // Save to DB
                ChatMessage chatMessage = new ChatMessage(sender, content);
                chatMessageRepository.save(chatMessage);

                // Broadcast
                String broadcastMessage = objectMapper.writeValueAsString(chatMessage);
                for (WebSocketSession s : sessions) {
                    if (s.isOpen()) {
                        s.sendMessage(new TextMessage(broadcastMessage));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessions.remove(session);
    }
}
