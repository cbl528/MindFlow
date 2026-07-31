package com.caobolun.business.rag.core.memory;

import com.caobolun.framework.convention.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.Executor;

@Slf4j
@Service
public class DefaultConversationMemoryService implements ConversationMemoryService {

    private ConversationMemoryStore conversationMemoryStore;
    private ConversationMemorySummaryService conversationMemorySummaryService;
    private Executor memoryLoadExecutor;

    public DefaultConversationMemoryService(ConversationMemoryStore conversationMemoryStore,
                                            ConversationMemorySummaryService conversationMemorySummaryService,
                                            Executor memoryLoadExecutor){
        this.conversationMemoryStore = conversationMemoryStore;
        this.conversationMemorySummaryService = conversationMemorySummaryService;
        this.memoryLoadExecutor = memoryLoadExecutor;
    }

    @Override
    public List<ChatMessage> load(String conversationId, String userId) {
        return List.of();
    }

    @Override
    public String append(String conversationId, String userId, ChatMessage message) {
        return "";
    }
}
