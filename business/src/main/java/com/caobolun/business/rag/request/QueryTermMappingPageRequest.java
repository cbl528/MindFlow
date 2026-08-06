package com.caobolun.business.rag.request;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 关键词映射分页查询请求
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class QueryTermMappingPageRequest extends Page {

    /**
     * 关键词（支持匹配 sourceTerm/targetTerm）
     */
    private String keyword;
}
