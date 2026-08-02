package com.caobolun.business.rag.core.memory;

import com.caobolun.business.rag.config.MemoryProperties;
import com.caobolun.business.rag.service.ConversationService;
import com.caobolun.framework.convention.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class JdbcConversationMemoryStore implements ConversationMemoryStore {

    private final ConversationService conversationService;
    private final ConversationMessageService conversationMessageService;
    private final MemoryProperties memoryProperties;

    @Override
    public List<ChatMessage> loadHistory(String conversationId, String userId) {
        return List.of();
    }

    @Override
    public String append(String conversationId, String userId, ChatMessage message) {
        return "";
    }

    @Override
    public void refreshCache(String conversationId, String userId) {

    }
}