package com.caobolun.business.ingestion.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.caobolun.business.ingestion.request.IngestionPipelineCreateRequest;
import com.caobolun.business.ingestion.request.IngestionPipelineUpdateRequest;
import com.caobolun.business.ingestion.service.IngestionPipelineService;
import com.caobolun.business.ingestion.vo.IngestionPipelineVO;
import com.caobolun.framework.convention.Result;
import com.caobolun.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 数据摄入流水线控制层
 */
@RestController
@RequiredArgsConstructor
@Validated
public class IngestionPipelineController {

    private final IngestionPipelineService pipelineService;

    /**
     * 创建数据摄入流水线
     */
    @PostMapping("/ingestion/pipelines")
    public Result<IngestionPipelineVO> create(@RequestBody IngestionPipelineCreateRequest request) {
        return Results.success(pipelineService.create(request));
    }

    /**
     * 更新数据摄入流水线
     */
    @PutMapping("/ingestion/pipelines/{id}")
    public Result<IngestionPipelineVO> update(@PathVariable String id,
                                              @RequestBody IngestionPipelineUpdateRequest request) {
        return Results.success(pipelineService.update(id, request));
    }

    /**
     * 获取单个数据摄入流水线详情
     */
    @GetMapping("/ingestion/pipelines/{id}")
    public Result<IngestionPipelineVO> get(@PathVariable String id) {
        return Results.success(pipelineService.get(id));
    }

    /**
     * 分页查询数据摄入流水线
     */
    @GetMapping("/ingestion/pipelines")
    public Result<IPage<IngestionPipelineVO>> page(@RequestParam(value = "pageNo", defaultValue = "1") int pageNo,
                                                   @RequestParam(value = "pageSize", defaultValue = "10") int pageSize,
                                                   @RequestParam(value = "keyword", required = false) String keyword) {
        return Results.success(pipelineService.page(new Page<>(pageNo, pageSize), keyword));
    }

    /**
     * 删除数据摄入流水线
     */
    @DeleteMapping("/ingestion/pipelines/{id}")
    public Result<Void> delete(@PathVariable String id) {
        pipelineService.delete(id);
        return Results.success();
    }
}
