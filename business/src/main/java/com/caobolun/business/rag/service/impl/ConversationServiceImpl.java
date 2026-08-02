package com.caobolun.business.rag.service.impl;

import com.caobolun.business.rag.bo.ConversationCreateBO;
import com.caobolun.business.rag.request.ConversationUpdateRequest;
import com.caobolun.business.rag.service.ConversationService;
import com.caobolun.business.rag.vo.ConversationVO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConversationServiceImpl implements ConversationService {

    @Override
    public List<ConversationVO> listByUserId(String userId) {
        return List.of();
    }

    @Override
    public void createOrUpdate(ConversationCreateBO request) {

    }

    @Override
    public void rename(String conversationId, ConversationUpdateRequest request) {

    }

    @Override
    public void delete(String conversationId) {

    }
}
