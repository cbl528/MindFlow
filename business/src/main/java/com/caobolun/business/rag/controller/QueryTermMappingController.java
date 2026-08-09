package com.caobolun.business.rag.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.caobolun.business.rag.request.QueryTermMappingCreateRequest;
import com.caobolun.business.rag.request.QueryTermMappingPageRequest;
import com.caobolun.business.rag.request.QueryTermMappingUpdateRequest;
import com.caobolun.business.rag.service.QueryTermMappingAdminService;
import com.caobolun.business.rag.vo.QueryTermMappingVO;
import com.caobolun.framework.convention.Result;
import com.caobolun.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 关键词映射管理控制器
 */
@RestController
@RequiredArgsConstructor
public class QueryTermMappingController {

    private final QueryTermMappingAdminService queryTermMappingAdminService;

    /**
     * 分页查询映射规则
     */
    @GetMapping("/mindflow/mappings")
    public Result<IPage<QueryTermMappingVO>> pageQuery(QueryTermMappingPageRequest requestParam) {
        return Results.success(queryTermMappingAdminService.pageQuery(requestParam));
    }

    /**
     * 查询映射规则详情
     */
    @GetMapping("/mindflow/mappings/{id}")
    public Result<QueryTermMappingVO> queryById(@PathVariable String id) {
        return Results.success(queryTermMappingAdminService.queryById(id));
    }

    /**
     * 创建映射规则
     */
    @PostMapping("/mindflow/mappings")
    public Result<String> create(@RequestBody QueryTermMappingCreateRequest requestParam) {
        return Results.success(queryTermMappingAdminService.create(requestParam));
    }

    /**
     * 更新映射规则
     */
    @PutMapping("/mindflow/mappings/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody QueryTermMappingUpdateRequest requestParam) {
        queryTermMappingAdminService.update(id, requestParam);
        return Results.success();
    }

    /**
     * 删除映射规则
     */
    @DeleteMapping("/mindflow/mappings/{id}")
    public Result<Void> delete(@PathVariable String id) {
        queryTermMappingAdminService.delete(id);
        return Results.success();
    }
}