package com.caobolun.business.core.chunk;

import cn.hutool.core.util.IdUtil;
import com.caobolun.business.core.chunk.model.Chunk;
import com.caobolun.business.core.chunk.model.ChunkBudget;
import com.caobolun.business.core.chunk.model.ChunkMetadata;
import com.caobolun.business.core.parse.BlockTextRenderer;
import com.caobolun.business.core.parse.model.Block;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;

/**
 * 结构化分块服务（统一分块入口）
 * <p>
 * 封装"<b>blocks 非空 → block-aware 分发；否则 → 纯文本 legacy 策略</b>"的唯一判断，
 * 供两条分块入口共用：
 * <ul>
 *   <li>{@code ingestion} 流水线的 ChunkerNode（Pipeline 模式）</li>
 *   <li>{@code knowledge} 文档的 KnowledgeDocumentServiceImpl（简单分块模式）</li>
 * </ul>
 * 两处曾各写各的，导致简单分块模式漏接 block-aware（表格被拍平成文本后随意切碎）；
 * 收口到此服务后单一真相源，杜绝再次漂移
 */
@Service
@RequiredArgsConstructor
public class StructuredChunkingService {

    private final ChunkingService chunkingService;
    private final ChunkingStrategyFactory chunkingStrategyFactory;

    /**
     * 不分块哨兵：chunkSize/targetChars 取该值时整篇文档合成单个 chunk，不再切分
     */
    public static final int WHOLE_DOCUMENT_SENTINEL = -1;
    /**
     * 体量预算默认值（ChunkingOptions 未提供 size 键时用）
     */
    private static final int DEFAULT_MAX_CHARS = 512;
    /**
     * 段落重叠默认值
     */
    private static final int DEFAULT_OVERLAP = 64;
    /**
     * 表格每 chunk 最大数据行数（硬上限；实际块大小由体量预算驱动）
     */
    private static final int DEFAULT_ROWS_PER_CHUNK = 50;

    /**
     * 分块：blocks 非空走 block-aware，否则用 fallbackText 走 legacy 文本策略
     *
     * @param blocks       解析产出的结构化 Block，可空
     * @param fallbackText blocks 为空时的纯文本兜底
     * @param mode         legacy 文本策略类型（blocks 为空时使用）
     * @param options      legacy 文本策略参数，同时用于派生 block-aware 体量预算
     * @param rowsPerChunk block-aware 表格行上限，可空取默认
     * @return VectorChunk 列表（未嵌入）；blocks 与 fallbackText 都空时返回空列表
     */
    public List<VectorChunk> chunk(List<Block> blocks, String fallbackText,
                                   ChunkingMode mode, ChunkingOptions options, Integer rowsPerChunk) {
        // 不分块（chunkSize=-1）：整篇合成单个 chunk，优先于 block-aware / legacy 切分
        if (isWholeDocument(options)) {
            return wholeDocumentChunk(blocks, fallbackText);
        }
        if (blocks != null && !blocks.isEmpty()) {
            List<Chunk> chunks = chunkingService.chunk(blocks, toBudget(options, rowsPerChunk));
            return chunks.stream().map(StructuredChunkingService::toVectorChunk).toList();
        }
        if (!StringUtils.hasText(fallbackText)) {
            return List.of();
        }
        return chunkingStrategyFactory.requireStrategy(mode).chunk(fallbackText, options);
    }

    /**
     * 判断是否为"不分块"：任一 size 键（chunkSize/targetChars）取哨兵值 {@code -1}
     */
    private static boolean isWholeDocument(ChunkingOptions options) {
        if (options == null) {
            return false;
        }
        Map<String, Integer> cfg = options.toConfigMap();
        for (String key : new String[]{"chunkSize", "targetChars"}) {
            Integer v = cfg.get(key);
            if (v != null && v == WHOLE_DOCUMENT_SENTINEL) {
                return true;
            }
        }
        return false;
    }

    /**
     * 整篇合成单个 chunk：内容取 fallbackText（解析渲染或增强后的全文），缺失时回退到 blocks 渲染
     *
     * @return 单元素列表；全文为空时返回空列表
     */
    private List<VectorChunk> wholeDocumentChunk(List<Block> blocks, String fallbackText) {
        String whole = StringUtils.hasText(fallbackText)
                ? fallbackText
                : (blocks != null && !blocks.isEmpty() ? BlockTextRenderer.render(blocks) : "");
        if (!StringUtils.hasText(whole)) {
            return List.of();
        }
        VectorChunk chunk = VectorChunk.builder()
                .chunkId(IdUtil.getSnowflakeNextIdStr())
                .index(0)
                .content(whole)
                .embeddingText(whole)
                .blockType("DOCUMENT")
                .build();
        return List.of(chunk);
    }

    /**
     * 从 legacy ChunkingOptions 派生 ChunkBudget，使 block-aware 与文本策略共用同一组体量参数
     * <p>
     * maxChars 预算优先取 chunkSize（固定大小）/ targetChars（语义感知）；overlap 同理
     * rowsPerChunk 由调用方透传，缺省取硬上限默认值
     */
    private ChunkBudget toBudget(ChunkingOptions options, Integer rowsPerChunk) {
        Map<String, Integer> cfg = options == null ? Map.of() : options.toConfigMap();
        int maxChars = firstPositive(cfg);
        int overlap = firstNonNegative(cfg);
        // 防御：overlap 必须 < maxChars，否则 ChunkBudget 校验会抛错
        if (overlap >= maxChars) {
            overlap = Math.max(0, maxChars - 1);
        }
        int rows = (rowsPerChunk != null && rowsPerChunk > 0) ? rowsPerChunk : DEFAULT_ROWS_PER_CHUNK;
        return new ChunkBudget(maxChars, overlap, rows);
    }

    /**
     * 把内核块还原成 {@link VectorChunk}：块元数据序列化到 metadata 扩展位，
     * 结构字段（章节路径 / 资产）原样搬入 VectorChunk
     */
    private static VectorChunk toVectorChunk(Chunk chunk) {
        ChunkMetadata metadata = chunk.metadata();
        return VectorChunk.builder()
                .chunkId(chunk.chunkId())
                .index(chunk.index())
                .content(chunk.content())
                .embeddingText(chunk.embeddingText())
                .metadata(metadata.toMap())
                .assets(metadata.assets())
                .outlinePath(metadata.outlinePath())
                .build();
    }

    /**
     * 按 keys 顺序取第一个存在且为正的值，否则返回默认
     */
    private static int firstPositive(Map<String, Integer> cfg) {
        for (String key : new String[]{"chunkSize", "targetChars", "maxChars"}) {
            Integer v = cfg.get(key);
            if (v != null && v > 0) {
                return v;
            }
        }
        return StructuredChunkingService.DEFAULT_MAX_CHARS;
    }

    /**
     * 按 keys 顺序取第一个存在且非负的值（重叠允许为 0），否则返回默认
     */
    private static int firstNonNegative(Map<String, Integer> cfg) {
        for (String key : new String[]{"overlapSize", "overlapChars"}) {
            Integer v = cfg.get(key);
            if (v != null && v >= 0) {
                return v;
            }
        }
        return StructuredChunkingService.DEFAULT_OVERLAP;
    }
}
