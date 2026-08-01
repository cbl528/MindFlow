package com.caobolun.business.rag.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.caobolun.business.rag.request.RagTraceRunPageRequest;
import com.caobolun.business.rag.vo.RagTraceDetailVO;
import com.caobolun.business.rag.vo.RagTraceNodeVO;
import com.caobolun.business.rag.vo.RagTraceRunVO;

import java.util.List;

/**
 * RAG Trace 查询服务
 */
public interface RagTraceQueryService {

    IPage<RagTraceRunVO> pageRuns(RagTraceRunPageRequest request);

    RagTraceDetailVO detail(String traceId);

    List<RagTraceNodeVO> listNodes(String traceId);
}