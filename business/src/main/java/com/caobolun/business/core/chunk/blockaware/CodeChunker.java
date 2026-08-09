/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.caobolun.business.core.chunk.blockaware;


import cn.hutool.core.util.IdUtil;
import com.caobolun.business.core.chunk.VectorChunk;
import com.caobolun.business.core.chunk.model.ChunkDraft;
import com.caobolun.business.core.chunk.model.ChunkMetadata;
import com.caobolun.business.core.parse.model.CodeBlock;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 代码块 chunker：每个 CodeBlock 产生一个 atomic VectorChunk
 * <p>
 * 永不切分 —— 代码块语法对完整性敏感（缺少 fence 或半截行会破坏前端渲染与 LLM 理解）
 * 渲染为标准 markdown 代码块 ``` 围栏
 *
 * 逻辑：永不主动切，一个代码块 = 一个草稿。只有代码超过 3072 才按行累加切，每片包进
 *   围栏；单行超预算整行独立成块，绝不从行中间切。
 *
 *   例：100 行 / 5000 字符的 Java 代码 → 按行累加切成若干片（每片 ≤1024），每片：
 *   - content = ```java\n...代码片...\n```
 *   - body = 裸代码（不带围栏）
 *
 *   原因：代码缺 fence 或半截行会破坏前端渲染和 LLM 理解。
 */
@Component
public class CodeChunker implements BlockChunker<CodeBlock> {

    @Override
    public Class<CodeBlock> blockType() {
        return CodeBlock.class;
    }

    @Override
    public List<ChunkDraft> chunk(CodeBlock block, ChunkContext ctx) {
        if (block == null) {
            return List.of();
        }
        String language = block.language() == null ? "" : block.language();
        String code = block.code() == null ? "" : block.code();

        ChunkMetadata metadata = ChunkMetadata.builder()
                .outlinePath(ctx.outlinePath())
                .provenance(block.provenance())
                .build();

        List<String> segments = code.length() <= ctx.budget().toleranceChars()
                ? List.of(code)
                : splitByLines(code, ctx.budget().maxChars());

        List<ChunkDraft> result = new ArrayList<>(segments.size());
        for (String segment : segments) {
            String markdown = "```" + language + "\n" + segment + "\n```";
            result.add(ChunkDraft.of(markdown, segment, metadata));
        }
        return ChunkDraft.pieces(result);
    }

    /**
     * 按行累加切分：单行超预算时整行独立成块，绝不从行中间切断
     */
    private static List<String> splitByLines(String code, int maxChars) {
        List<String> segments = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String line : code.split("\n", -1)) {
            int addition = current.isEmpty() ? line.length() : current.length() + 1 + line.length();
            if (!current.isEmpty() && addition > maxChars) {
                segments.add(current.toString());
                current.setLength(0);
            }
            if (!current.isEmpty()) {
                current.append('\n');
            }
            current.append(line);
        }
        if (!current.isEmpty()) {
            segments.add(current.toString());
        }
        return segments.isEmpty() ? List.of(code) : segments;
    }
}
