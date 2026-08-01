package com.caobolun.business.rag.service.impl;

import com.caobolun.business.rag.entity.ConversationDO;
import com.caobolun.business.rag.entity.ConversationMessageDO;
import com.caobolun.business.rag.entity.ConversationSummaryDO;
import com.caobolun.business.rag.service.ConversationGroupService;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class ConversationGroupServiceImpl implements ConversationGroupService {
    @Override
    public List<ConversationMessageDO> listLatestUserOnlyMessages(String conversationId, String userId, int limit) {
        return List.of();
    }

    @Override
    public List<ConversationMessageDO> listMessagesBetweenIds(String conversationId, String userId, String afterId, String beforeId) {
        return List.of();
    }

    @Override
    public String findMaxMessageIdAtOrBefore(String conversationId, String userId, Date at) {
        return "";
    }

    @Override
    public long countUserMessages(String conversationId, String userId) {
        return 0;
    }

    @Override
    public ConversationSummaryDO findLatestSummary(String conversationId, String userId) {
        return null;
    }

    @Override
    public ConversationDO findConversation(String conversationId, String userId) {
        return null;
    }
}
