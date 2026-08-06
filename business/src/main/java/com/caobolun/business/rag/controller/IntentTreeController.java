package com.caobolun.business.rag.controller;

import com.caobolun.business.ingestion.service.IntentTreeService;
import com.caobolun.business.rag.request.IntentNodeBatchRequest;
import com.caobolun.business.rag.request.IntentNodeCreateRequest;
import com.caobolun.business.rag.request.IntentNodeUpdateRequest;
import com.caobolun.business.rag.vo.IntentNodeTreeVO;
import com.caobolun.framework.convention.Result;
import com.caobolun.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 意图树控制器
 * 提供意图节点树的查询、创建、更新和删除功能
 */
@RestController
@RequiredArgsConstructor
public class IntentTreeController {

    private final IntentTreeService intentTreeService;

    /**
     * 获取完整的意图节点树
     */
    @GetMapping("/intent-tree/trees")
    public Result<List<IntentNodeTreeVO>> tree() {
        return Results.success(intentTreeService.getFullTree());
    }

    /**
     * 创建意图节点
     */
    @PostMapping("/intent-tree")
    public Result<String> createNode(@RequestBody IntentNodeCreateRequest requestParam) {
        return Results.success(intentTreeService.createNode(requestParam));
    }

    /**
     * 更新意图节点
     */
    @PutMapping("/mindflow/intent-tree/{id}")
    public void updateNode(@PathVariable String id, @RequestBody IntentNodeUpdateRequest requestParam) {
        intentTreeService.updateNode(id, requestParam);
    }

    /**
     * 删除意图节点
     */
    @DeleteMapping("/mindflow/intent-tree/{id}")
    public void deleteNode(@PathVariable String id) {
        intentTreeService.deleteNode(id);
    }

    /**
     * 批量启用节点
     */
    @PostMapping("/mindflow/intent-tree/batch/enable")
    public void batchEnable(@RequestBody IntentNodeBatchRequest requestParam) {
        intentTreeService.batchEnableNodes(requestParam.getIds());
    }

    /**
     * 批量停用节点
     */
    @PostMapping("/mindflow/intent-tree/batch/disable")
    public void batchDisable(@RequestBody IntentNodeBatchRequest requestParam) {
        intentTreeService.batchDisableNodes(requestParam.getIds());
    }

    /**
     * 批量删除节点
     */
    @PostMapping("/mindflow/intent-tree/batch/delete")
    public void batchDelete(@RequestBody IntentNodeBatchRequest requestParam) {
        intentTreeService.batchDeleteNodes(requestParam.getIds());
    }
}
