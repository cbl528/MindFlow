package com.caobolun.business.rag.service.impl;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import com.caobolun.business.rag.service.RAGChatService;
import com.caobolun.business.rag.service.handler.StreamCallbackFactory;
import com.caobolun.business.rag.service.handler.StreamTaskManager;
import com.caobolun.business.rag.service.pipeline.StreamChatContext;
import com.caobolun.business.rag.service.pipeline.StreamChatPipeline;
import com.caobolun.business.rag.service.ratelimit.ChatQueueLimiter;
import com.caobolun.business.rag.trace.StreamChatTraceRunner;
import com.caobolun.framework.context.UserContext;
import com.caobolun.infraai.chat.StreamCallback;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Service
@RequiredArgsConstructor
public class RAGChatServiceImpl implements RAGChatService {

    private final ChatQueueLimiter chatQueueLimiter;
    private final StreamCallbackFactory callbackFactory;
    private final StreamChatTraceRunner traceRunner;
    private final StreamTaskManager taskManager;
    private final StreamChatPipeline chatPipeline;

    @Override
    public void streamChat(String question, String conversationId, Boolean deepThinking, SseEmitter emitter) {
        String actualConversationId = StrUtil.isBlank(conversationId) ? IdUtil.getSnowflakeNextIdStr() : conversationId;
        String taskId = IdUtil.getSnowflakeNextIdStr();
        StreamCallback callback = callbackFactory.createChatEventHandler(emitter, conversationId, taskId);

        chatQueueLimiter.enqueue(question, actualConversationId, emitter,
                () -> traceRunner.run(question, conversationId, taskId, callback, traceAware -> {
                    StreamChatContext ctx = StreamChatContext.builder()
                            .question(question)
                            .conversationId(actualConversationId)
                            .taskId(taskId)
                            .deepThinking(Boolean.TRUE.equals(deepThinking))
                            .userId(UserContext.getUserId())
                            .callback(traceAware)
                            .build();
                    chatPipeline.execute(ctx);
                }));
    }

    @Override
    public void stopTask(String taskId) {
        taskManager.cancel(taskId);
    }
}
