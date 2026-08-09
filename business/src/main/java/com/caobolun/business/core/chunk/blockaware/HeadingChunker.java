package com.caobolun.business.core.chunk.blockaware;

import com.caobolun.business.core.chunk.model.ChunkDraft;
import com.caobolun.business.core.chunk.model.ChunkMetadata;
import com.caobolun.business.core.parse.model.HeadingBlock;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 标题 chunker：标题按原文位置回到正文
 * <p>
 * 标题不产块的话，{@code content} 就不是文档原貌而是被剥掉全部结构的裸正文，命中的块回填模型时也无从
 * 判断出自哪一节；井号数取原始级别，不按路径深度重算
 * HeadingChunker — 标题
 *
 *   逻辑：一个标题 → 一个草稿。content 还原成 markdown 井号，body
 *   只留纯文字（井号对嵌入模型是零信息 token）。标记
 *   heading=true，这是打包阶段分节的依据。
 *
 *   例：## 3.2 保证金制度
 *   - content = ## 3.2 保证金制度
 *   - body = 3.2 保证金制度
 */
@Component
public class HeadingChunker implements BlockChunker<HeadingBlock> {

    private static final int MAX_LEVEL = 6;

    @Override
    public Class<HeadingBlock> blockType() {
        return HeadingBlock.class;
    }

    @Override
    public List<ChunkDraft> chunk(HeadingBlock block, ChunkContext ctx) {
        if (block == null || !StringUtils.hasText(block.text())) {
            return List.of();
        }
        String text = block.text().strip();
        ChunkMetadata metadata = ChunkMetadata.builder()
                .outlinePath(ctx.outlinePath())
                .provenance(block.provenance())
                .build();

        int level = Math.clamp(block.level(), 1, MAX_LEVEL);
        // 向量文本不带井号，markdown 标记对嵌入模型是零信息 token
        return List.of(ChunkDraft.ofHeading("#".repeat(level) + " " + text, text, metadata));
    }
}
