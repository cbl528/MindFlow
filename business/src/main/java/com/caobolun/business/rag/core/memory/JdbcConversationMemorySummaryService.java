package com.caobolun.business.rag.core.memory;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.caobolun.business.rag.config.MemoryProperties;
import com.caobolun.business.rag.core.prompt.PromptTemplateLoader;
import com.caobolun.business.rag.entity.ConversationMessageDO;
import com.caobolun.business.rag.entity.ConversationSummaryDO;
import com.caobolun.business.rag.service.ConversationGroupService;
import com.caobolun.business.rag.service.ConversationMessageService;
import com.caobolun.framework.convention.ChatMessage;
import com.caobolun.infraai.chat.LLMService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
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

    // 对话压缩方法
    @Override
    public void compressIfNeeded(String conversationId, String userId, ChatMessage message) {
        // 判断是否开启对话压缩
        if (!memoryProperties.getSummaryEnabled()) {
            return;
        }
        // 如果聊天对话时助手，跳过
        if (message.getRole() != ChatMessage.Role.ASSISTANT) {
            return;
        }

        CompletableFuture.runAsync(() -> doCompressIfNeeded(conversationId, userId), memorySummaryExecutor)
                .exceptionally(ex -> {
                    log.error("对话记忆摘要异步任务失败 - conversationId: {}, userId: {}",
                            conversationId, userId, ex);
                    return null;
                });
    }

    // 对话压缩的实际执行方法
    private void doCompressIfNeeded(String conversationId, String userId) {
        long startTime = System.currentTimeMillis();
        int triggerTurns = memoryProperties.getSummaryStartTurns(); // 开始总结的对话轮数阈值
        int maxTurns = memoryProperties.getHistoryKeepTurns(); // 保留的历史对话轮数
        if (maxTurns <= 0 || triggerTurns <= 0) {
            return;
        }

        String lockKey = SUMMARY_LOCK_PREFIX + buildLockKey(conversationId, userId);
        RLock lock = redissonClient.getLock(lockKey);
        if(!lock.tryLock()){
            return;
        }
        try{
            long total = conversationGroupService.countUserMessages(conversationId, userId);
            if (total < triggerTurns) {
                return;
            }

            ConversationSummaryDO latestSummary = conversationGroupService.findLatestSummary(conversationId, userId);
            List<ConversationMessageDO> latestUserTurns = conversationGroupService.listLatestUserOnlyMessages(
                    conversationId,
                    userId,
                    maxTurns
            );
            if (latestUserTurns.isEmpty()) {
                return;
            }
            String historyStartId = resolveHistoryStartId(latestUserTurns);
            if (StrUtil.isBlank(historyStartId)) {
                return;
            }

            String afterId = resolveSummaryStartId(conversationId, userId, latestSummary);
            if (afterId != null && Long.parseLong(afterId) >= Long.parseLong(historyStartId)) {
                return;
            }

            // 摘要覆盖约一半原文窗口；只有这段重叠滑出窗口后才再次生成摘要
            String summaryCutoffId = resolveSummaryCutoffId(latestUserTurns);
            if (StrUtil.isBlank(summaryCutoffId)) {
                return;
            }

            List<ConversationMessageDO> toSummarize = conversationGroupService.listMessagesBetweenIds(
                    conversationId,
                    userId,
                    afterId,
                    summaryCutoffId
            );
            if (CollUtil.isEmpty(toSummarize)) {
                return;
            }

            String lastMessageId = resolveLastMessageId(toSummarize);
            if (StrUtil.isBlank(lastMessageId)) {
                return;
            }

            String existingSummary = latestSummary == null ? "" : latestSummary.getContent();
            String summary = summarizeMessages(toSummarize, existingSummary);
            if (StrUtil.isBlank(summary)) {
                return;
            }

            createSummary(conversationId, userId, summary, lastMessageId);
            log.info("摘要成功 - conversationId：{}，userId：{}，消息数：{}，耗时：{}ms",
                    conversationId, userId, toSummarize.size(),
                    System.currentTimeMillis() - startTime);
        } catch (Exception e) {
            log.error("摘要失败 - conversationId：{}，userId：{}", conversationId, userId, e);
        } finally {
            if(lock.isHeldByCurrentThread()){
                lock.unlock();
            }
        }
    }
    private String buildLockKey(String conversationId, String userId) {
        return userId.trim() + ":" + conversationId.trim();
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
