package com.caobolun.business.ingestion.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.caobolun.business.rag.entity.IntentNodeDO;
import com.caobolun.business.rag.request.IntentNodeCreateRequest;
import com.caobolun.business.rag.request.IntentNodeUpdateRequest;
import com.caobolun.business.rag.vo.IntentNodeTreeVO;

import java.util.List;

public interface IntentTreeService extends IService<IntentNodeDO> {

    /**
     * 查询整棵意图树（包含 RAG + SYSTEM）
     */
    List<IntentNodeTreeVO> getFullTree();

    /**
     * 新增节点
     */
    String createNode(IntentNodeCreateRequest requestParam);

    /**
     * 更新节点
     */
    void updateNode(String id, IntentNodeUpdateRequest requestParam);

    /**
     * 删除节点（逻辑删除）
     */
    void deleteNode(String id);

    /**
     * 批量启用节点
     */
    void batchEnableNodes(List<String> ids);

    /**
     * 批量停用节点
     */
    void batchDisableNodes(List<String> ids);

    /**
     * 批量删除节点（逻辑删除）
     */
    void batchDeleteNodes(List<String> ids);

    /**
     * 从 IntentTreeFactory 初始化全量 Tree 到数据库
     */
    int initFromFactory();
}
