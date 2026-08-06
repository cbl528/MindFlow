package com.caobolun.business.rag.request;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * RAG Trace 运行记录分页请求
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class RagTraceRunPageRequest extends Page {

    private String traceId;

    private String conversationId;

    private String taskId;

    private String status;
}
