package com.caobolun.business.knowledge.request;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.caobolun.business.knowledge.vo.KnowledgeBaseVO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;

/**
 * 知识库分页查询请求
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class KnowledgeBasePageRequest extends Page<KnowledgeBaseVO> {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 知识库名称（支持模糊匹配）
     */
    private String name;
}
