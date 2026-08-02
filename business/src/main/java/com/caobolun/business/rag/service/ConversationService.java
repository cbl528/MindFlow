package com.caobolun.business.rag.service;

import com.caobolun.business.rag.bo.ConversationCreateBO;
import com.caobolun.business.rag.request.ConversationUpdateRequest;
import com.caobolun.business.rag.vo.ConversationVO;

import java.util.List;

public interface ConversationService {

    /**
     * 根据用户ID获取会话列表
     *
     * @param userId 用户ID
     * @return 会话视图对象列表
     */
    List<ConversationVO> listByUserId(String userId);

    /**
     * 创建或更新会话
     * 如果 ConversationCreateBO 里的会话 ID 存在则更新，不存在则创建
     *
     * @param request 创建请求对象
     */
    void createOrUpdate(ConversationCreateBO request);

    /**
     * 重命名会话
     *
     * @param conversationId 会话 ID
     * @param request        更新请求对象
     */
    void rename(String conversationId, ConversationUpdateRequest request);

    /**
     * 删除会话
     *
     * @param conversationId 会话 ID
     */
    void delete(String conversationId);
}
