package com.caobolun.business.rag.request;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 示例问题分页查询请求
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class SampleQuestionPageRequest extends Page {

    /**
     * 关键词（支持匹配标题、描述、问题内容）
     */
    private String keyword;
}
