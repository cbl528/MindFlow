package com.caobolun.business.core.parse.model;

import java.util.List;

/**
 * 段落 Block：由 ParagraphChunker 按 token 切分，可跨段落合并到目标长度，但不跨 heading
 *
 * @param text 段落文本，保留链接、图片与行内代码标记而丢掉强调标记；markdown 里内嵌的非表格 HTML
 */
public record ParagraphBlock(
        Provenance provenance,
        String text
) implements Block {
}