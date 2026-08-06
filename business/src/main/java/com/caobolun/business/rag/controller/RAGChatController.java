package com.caobolun.business.rag.controller;


import com.caobolun.business.rag.config.RAGDefaultProperties;
import com.caobolun.business.rag.service.RAGChatService;
import com.caobolun.framework.convention.Result;
import com.caobolun.framework.idempotent.IdempotentSubmit;
import com.caobolun.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
public class RAGChatController {

    private final RAGChatService ragChatService;
    private final RAGDefaultProperties ragDefaultProperties;

    /**
     * 发起 SSE 流式对话
     */
    @IdempotentSubmit(
            key = "T(com.nageoffer.ai.ragent.framework.context.UserContext).getUserId()",
            message = "当前会话处理中，请稍后再发起新的对话"
    )
    @GetMapping(value = "/mindflow/rag/chat", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter chat(@RequestParam String question,
                           @RequestParam(required = false) String conversationId,
                           @RequestParam(required = false, defaultValue = "false") Boolean deepThinking) {
        SseEmitter emitter = new SseEmitter(ragDefaultProperties.getSseTimeoutMs());
        ragChatService.streamChat(question, conversationId, deepThinking, emitter);
        return emitter;
    }

    /**
     * 停止指定任务
     */
    @IdempotentSubmit
    @PostMapping(value = "/mindflow/rag/v1/stop")
    public Result<Void> stop(@RequestParam String taskId) {
        ragChatService.stopTask(taskId);
        return Results.success();
    }

}
