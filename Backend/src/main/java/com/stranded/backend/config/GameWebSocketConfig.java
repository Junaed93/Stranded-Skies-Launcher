package com.stranded.backend.config;

import com.stranded.backend.handler.ChatHandler;
import com.stranded.backend.handler.GameWebSocketHandler;
import com.stranded.backend.handler.VoiceHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class GameWebSocketConfig implements WebSocketConfigurer {

    private final GameWebSocketHandler gameWebSocketHandler;
    private final ChatHandler chatHandler;
    private final VoiceHandler voiceHandler;

    public GameWebSocketConfig(GameWebSocketHandler gameWebSocketHandler,
                               ChatHandler chatHandler,
                               VoiceHandler voiceHandler) {
        this.gameWebSocketHandler = gameWebSocketHandler;
        this.chatHandler = chatHandler;
        this.voiceHandler = voiceHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Game multiplayer endpoint — raw WebSocket (no SockJS) for Unity WebGL
        registry.addHandler(gameWebSocketHandler, "/game")
                .setAllowedOriginPatterns("*");

        // Chat WebSocket endpoint
        registry.addHandler(chatHandler, "/ws/chat")
                .setAllowedOriginPatterns("*");

        // Voice WebSocket endpoint
        registry.addHandler(voiceHandler, "/ws/voice")
                .setAllowedOriginPatterns("*");
    }
}
