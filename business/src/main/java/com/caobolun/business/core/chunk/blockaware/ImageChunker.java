package com.caobolun.business.core.chunk.blockaware;


import com.caobolun.business.core.chunk.model.ChunkDraft;
import com.caobolun.business.core.chunk.model.ChunkMetadata;
import com.caobolun.business.core.parse.model.AssetRef;
import com.caobolun.business.core.parse.model.ImageBlock;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 图片 chunker：每个 ImageBlock 产生一个 atomic VectorChunk
 * <p>
 * 渲染为 markdown 图片链接 {@code ![caption](http://...)}，保证整段不会被切碎
 * 同时把 ImageBlock 的 AssetRef 挂载到 VectorChunk.assets，检索时可用
 */
@Component
public class ImageChunker implements BlockChunker<ImageBlock> {

    @Override
    public Class<ImageBlock> blockType() {
        return ImageBlock.class;
    }

    @Override
    public List<ChunkDraft> chunk(ImageBlock block, ChunkContext ctx) {
        if (block == null || block.asset() == null) {
            return List.of();
        }
        AssetRef asset = block.asset();
        String markdown = "![" + pickCaption(block) + "](" + asset.publicUrl() + ")";

        String description = block.description();
        boolean hasDescription = description != null && !description.isBlank();
        String content = hasDescription ? description.strip() + "\n\n" + markdown : markdown;

        ChunkMetadata metadata = ChunkMetadata.builder()
                .outlinePath(ctx.outlinePath())
                .assets(List.of(asset))
                .provenance(block.provenance())
                .build();

        return List.of(ChunkDraft.of(content, hasDescription ? description.strip() : null, metadata));
    }

    private String pickCaption(ImageBlock block) {
        if (block.caption() != null && !block.caption().isEmpty()) {
            return block.caption();
        }
        if (block.altText() != null && !block.altText().isEmpty()) {
            return block.altText();
        }
        return "";
    }
}
