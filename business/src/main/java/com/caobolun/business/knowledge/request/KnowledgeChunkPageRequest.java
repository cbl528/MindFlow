package com.caobolun.business.knowledge.request;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class KnowledgeChunkPageRequest extends Page {

    private Integer enabled;
}
