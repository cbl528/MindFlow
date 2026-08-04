package com.caobolun.business.core.parse.model;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.List;

/**
 * 结构化解析产物的统一基类（内存中间表示 IR）
 * <p>
 * Block 是解析器输出到 ChunkerNode 之间的中间表示，仅存活于解析阶段
 * 最终入向量库的 VectorChunk.content 仍是 markdown 字符串，markdown 在 ChunkerNode 阶段渲染
 * <p>
 * 关键设计：
 * <ul>
 *   <li>sealed interface 保证编译期穷举，新增 Block 类型时所有 switch 必须显式处理</li>
 *   <li>每个子类强类型字段，告别 Map&lt;String,Object&gt; 垃圾桶</li>
 *   <li>id() 提供唯一标识，供 AssetRef.sourceBlockId 与资产 key 规则引用</li>
 *   <li>markdown 不在 Block 上，chunker 渲染时按需生成</li>
 * </ul>
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "@type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = HeadingBlock.class, name = "heading"),
        @JsonSubTypes.Type(value = ParagraphBlock.class, name = "paragraph"),
        @JsonSubTypes.Type(value = TableBlock.class, name = "table"),
        @JsonSubTypes.Type(value = HtmlTableBlock.class, name = "html_table"),
        @JsonSubTypes.Type(value = ImageBlock.class, name = "image"),
        @JsonSubTypes.Type(value = CodeBlock.class, name = "code"),
        @JsonSubTypes.Type(value = ListBlock.class, name = "list")
})
public sealed interface Block permits HeadingBlock, ParagraphBlock, TableBlock, HtmlTableBlock, ImageBlock, CodeBlock, ListBlock {

    /**
     * 来源信息：文件、页码 / sheet、bbox / 单元格范围
     */
    Provenance provenance();
}
