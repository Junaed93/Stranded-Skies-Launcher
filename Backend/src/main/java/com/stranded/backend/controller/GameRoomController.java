package com.stranded.backend.controller;

import com.stranded.backend.entity.ChatMessage;
import com.stranded.backend.handler.ChatHandler;
import com.stranded.backend.handler.GameWebSocketHandler;
import com.stranded.backend.repository.ChatMessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/rooms")
public class GameRoomController {

    private static final Logger log = LoggerFactory.getLogger(GameRoomController.class);

    private final GameWebSocketHandler gameWebSocketHandler;
    private final ChatHandler chatHandler;
    private final ChatMessageRepository chatMessageRepository;

    public GameRoomController(GameWebSocketHandler gameWebSocketHandler,
            ChatHandler chatHandler,
            ChatMessageRepository chatMessageRepository) {
        this.gameWebSocketHandler = gameWebSocketHandler;
        this.chatHandler = chatHandler;
        this.chatMessageRepository = chatMessageRepository;
    }

    @GetMapping
    public ResponseEntity<?> listRooms() {
        // Combine rooms from both game handler and chat handler
        Set<String> allRoomIds = new LinkedHashSet<>();
        allRoomIds.addAll(gameWebSocketHandler.getActiveRoomIds());
        allRoomIds.addAll(chatHandler.getActiveRoomIds());

        log.info("[Rooms] Listing rooms. Game rooms: {}, Chat rooms: {}",
                gameWebSocketHandler.getActiveRoomIds(), chatHandler.getActiveRoomIds());

        List<Map<String, Object>> roomList = new ArrayList<>();
        for (String roomId : allRoomIds) {
            Map<String, Object> room = new LinkedHashMap<>();
            room.put("roomId", roomId);
            int chatCount = chatHandler.getRoomPlayerCount(roomId);
            int gameCount = gameWebSocketHandler.getRoomPlayerCount(roomId);
            int count = Math.max(chatCount, gameCount);
            room.put("playerCount", count);
            log.info("[Rooms] Room '{}': chatCount={}, gameCount={}, reported={}", roomId, chatCount, gameCount, count);
            roomList.add(room);
        }
        return ResponseEntity.ok(roomList);
    }

    @PostMapping
    public ResponseEntity<?> createRoom() {
        String roomId = gameWebSocketHandler.createRoom();
        return ResponseEntity.ok(Map.of("roomId", roomId));
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<?> getRoomMessages(@PathVariable String roomId) {
        List<ChatMessage> messages = chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId);
        return ResponseEntity.ok(messages);
    }
}
