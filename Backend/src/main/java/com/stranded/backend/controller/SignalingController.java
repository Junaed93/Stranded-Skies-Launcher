package com.stranded.backend.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class SignalingController {

    @MessageMapping("/voice")
    @SendTo("/topic/voice")
    public String relaySignal(String signal) {
        return signal;
    }
}
