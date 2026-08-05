package com.caobolun.business.knowledge.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.caobolun.business.core.chunk.ChunkingMode;
import com.caobolun.business.knowledge.request.KnowledgeBaseCreateRequest;
import com.caobolun.business.knowledge.request.KnowledgeBasePageRequest;
import com.caobolun.business.knowledge.request.KnowledgeBaseUpdateRequest;
import com.caobolun.business.knowledge.service.KnowledgeBaseService;
import com.caobolun.business.knowledge.vo.ChunkStrategyVO;
import com.caobolun.business.knowledge.vo.KnowledgeBaseVO;
import com.caobolun.framework.convention.Result;
import com.caobolun.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

/**
 * 知识库控制器
 * 提供知识库的增删改查等基础操作接口
 */
@RestController
@RequiredArgsConstructor
public class KnowledgeBaseController {

    private final KnowledgeBaseService knowledgeBaseService;

    /**
     * 创建知识库
     */
    @PostMapping("/mindflow/v1/knowledge-base")
    public Result<String> createKnowledgeBase(@RequestBody KnowledgeBaseCreateRequest requestParam) {
        return Results.success(knowledgeBaseService.create(requestParam));
    }

    /**
     * 重命名知识库
     */
    @PutMapping("/mindflow/v1/knowledge-base/{kb-id}")
    public Result<Void> renameKnowledgeBase(@PathVariable("kb-id") String kbId,
                                            @RequestBody KnowledgeBaseUpdateRequest requestParam) {
        knowledgeBaseService.rename(kbId, requestParam);
        return Results.success();
    }

    /**
     * 删除知识库
     */
    @DeleteMapping("/mindflow/v1/knowledge-base/{kb-id}")
    public Result<Void> deleteKnowledgeBase(@PathVariable("kb-id") String kbId) {
        knowledgeBaseService.delete(kbId);
        return Results.success();
    }

    /**
     * 查询知识库详情
     */
    @GetMapping("/mindflow/v1/knowledge-base/{kb-id}")
    public Result<KnowledgeBaseVO> queryKnowledgeBase(@PathVariable("kb-id") String kbId) {
        return Results.success(knowledgeBaseService.queryById(kbId));
    }

    /**
     * 分页查询知识库列表
     */
    @GetMapping("/mindflow/v1/knowledge-base")
    public Result<IPage<KnowledgeBaseVO>> pageQuery(KnowledgeBasePageRequest requestParam) {
        return Results.success(knowledgeBaseService.pageQuery(requestParam));
    }

    /**
     * 查询支持的分块策略列表
     */
    @GetMapping("/mindflow/v1/knowledge-base/chunk-strategies")
    public Result<List<ChunkStrategyVO>> listChunkStrategies() {
        List<ChunkStrategyVO> list = Arrays.stream(ChunkingMode.values())
                .filter(ChunkingMode::isVisible)
                .map(mode -> new ChunkStrategyVO(mode.getValue(), mode.getLabel(), mode.getDefaultConfig()))
                .toList();
        return Results.success(list);
    }
}
