package com.caobolun.business.knowledge.request;

import lombok.Data;

@Data
public class KnowledgeBaseUpdateRequest {

    private String id;

    /**
     * 知识库名称（可修改）
     */
    private String name;

    /**
     * 知识库备注（可修改）
     */
    private String remark;

    /**
     * 嵌入模型（有文档分块后禁止修改）
     */
    private String embeddingModel;
}
