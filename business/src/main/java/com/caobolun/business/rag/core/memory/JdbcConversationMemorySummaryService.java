package com.caobolun.business.rag.core.memory;

import com.caobolun.framework.convention.ChatMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.Executor;

@Slf4j
@Service
@RequiredArgsConstructor
public class JdbcConversationMemorySummaryService implements ConversationMemorySummaryService {

    private static final String SUMMARY_LOCK_PREFIX = "ragent:memory:summary:lock:";

    private final ConversationGroupService conversationGroupService;
    private final ConversationMessageService conversationMessageService;
    private final MemoryProperties memoryProperties;
    private final LLMService llmService;
    private final PromptTemplateLoader promptTemplateLoader;
    private final RedissonClient redissonClient;
    private final Executor memorySummaryExecutor;

    @Override
    public void compressIfNeeded(String conversationId, String userId, ChatMessage message) {

    }

    @Override
    public ChatMessage loadLatestSummary(String conversationId, String userId) {
        return null;
    }

    @Override
    public ChatMessage decorateIfNeeded(ChatMessage summary) {
        return null;
    }
}
