package com.stranded.backend.config;

import com.stranded.backend.handler.GameWebSocketHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class GameWebSocketConfig implements WebSocketConfigurer {

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(gameWebSocketHandler(), "/game")
                .setAllowedOrigins("*");
    }

    @Bean
    public GameWebSocketHandler gameWebSocketHandler() {
        return new GameWebSocketHandler();
    }
}
