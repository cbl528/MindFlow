package com.caobolun.business.rag.service.impl;

import com.caobolun.business.rag.bo.ConversationMessageBO;
import com.caobolun.business.rag.bo.ConversationSummaryBO;
import com.caobolun.business.rag.enums.ConversationMessageOrder;
import com.caobolun.business.rag.mapper.ConversationMapper;
import com.caobolun.business.rag.mapper.ConversationMessageMapper;
import com.caobolun.business.rag.mapper.ConversationSummaryMapper;
import com.caobolun.business.rag.service.ConversationMessageService;
import com.caobolun.business.rag.service.ratelimit.MessageFeedbackService;
import com.caobolun.business.rag.vo.ConversationMessageVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationMessageServiceImpl implements ConversationMessageService {

    private final ConversationMessageMapper conversationMessageMapper;
    private final ConversationSummaryMapper conversationSummaryMapper;
    private final ConversationMapper conversationMapper;
    private final MessageFeedbackService feedbackService;

    @Override
    public String addMessage(ConversationMessageBO conversationMessage) {
        return "";
    }

    @Override
    public List<ConversationMessageVO> listMessages(String conversationId, String userId, Integer limit, ConversationMessageOrder order) {
        return List.of();
    }

    @Override
    public void addMessageSummary(ConversationSummaryBO conversationSummary) {

    }
}
