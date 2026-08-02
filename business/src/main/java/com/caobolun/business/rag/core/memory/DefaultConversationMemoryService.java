package com.caobolun.business.rag.core.memory;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.caobolun.framework.convention.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Slf4j
@Service
public class DefaultConversationMemoryService implements ConversationMemoryService {

    private ConversationMemoryStore memoryStore;
    private ConversationMemorySummaryService summaryService;
    private Executor memoryLoadExecutor;

    public DefaultConversationMemoryService(ConversationMemoryStore conversationMemoryStore,
                                            ConversationMemorySummaryService conversationMemorySummaryService,
                                            Executor memoryLoadExecutor) {
        this.memoryStore = conversationMemoryStore;
        this.summaryService = conversationMemorySummaryService;
        this.memoryLoadExecutor = memoryLoadExecutor;
    }

    @Override
    public List<ChatMessage> load(String conversationId, String userId) {
        // 参数校验
        if (StrUtil.isBlank(conversationId) || StrUtil.isBlank(userId)) {
            return List.of();
        }
        long startTime = System.currentTimeMillis();

        try {
            // 线程池执行记忆汇总
            CompletableFuture<ChatMessage> summaryFuture = CompletableFuture.supplyAsync(
                    () -> loadSummaryWithFallback(conversationId, userId), memoryLoadExecutor
            );
            // 线程池执行记忆历史
            CompletableFuture<List<ChatMessage>> historyFuture = CompletableFuture.supplyAsync(
                    () -> loadHistoryWithFallback(conversationId, userId), memoryLoadExecutor
            );
            return CompletableFuture.allOf(summaryFuture, historyFuture)
                    .thenApply(v -> {
                        ChatMessage summary = summaryFuture.join();
                        List<ChatMessage> historyMessage = historyFuture.join();
                        log.debug("加载对话记忆 - conversationId: {}, userId: {}, 摘要: {}, 历史消息数: {}, 耗时: {}ms",
                                conversationId, userId, summary != null, historyMessage.size(), System.currentTimeMillis() - startTime);
                        return attachSummary(summary, historyMessage);
                    }).join();
        } catch (Exception e) {
            log.error("加载对话记忆失败 - conversationId: {}, userId: {}", conversationId, userId, e);
            return List.of();
        }
    }

    // 整合会话总结和历史对话信息
    private List<ChatMessage> attachSummary(ChatMessage summary, List<ChatMessage> messages) {
        // 确保返回值不为 null
        if (CollUtil.isEmpty(messages)) {
            return List.of();
        }
        if (summary == null) {
            return messages;
        }
        List<ChatMessage> result = new ArrayList<>();
        result.add(summaryService.decorateIfNeeded(summary));
        result.addAll(messages);
        return result;
    }

    @Override
    public String append(String conversationId, String userId, ChatMessage message) {
        if (StrUtil.isBlank(conversationId) || StrUtil.isBlank(userId)) {
            return null;
        }
        String messageId = memoryStore.append(conversationId, userId, message);
        summaryService.compressIfNeeded(conversationId, userId, message);
        return messageId;
    }

    /**
     * 加载摘要，失败时返回 null
     */
    private ChatMessage loadSummaryWithFallback(String conversationId, String userId) {
        try {
            return summaryService.loadLatestSummary(conversationId, userId);
        } catch (Exception e) {
            log.warn("加载摘要失败，将跳过摘要 - conversationId: {}, userId: {}", conversationId, userId, e);
            return null;
        }
    }

    /**
     * 加载历史记录，失败时返回空列表
     */
    private List<ChatMessage> loadHistoryWithFallback(String conversationId, String userId) {
        try {
            List<ChatMessage> history = memoryStore.loadHistory(conversationId, userId);
            return history != null ? history : List.of();
        } catch (Exception e) {
            log.error("加载历史记录失败 - conversationId: {}, userId: {}", conversationId, userId, e);
            return List.of();
        }
    }
}
