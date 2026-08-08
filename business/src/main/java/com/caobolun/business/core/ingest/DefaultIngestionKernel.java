package com.caobolun.business.core.ingest;

import com.caobolun.business.core.chunk.ChunkingService;
import com.caobolun.business.core.chunk.model.Chunk;
import com.caobolun.business.core.chunk.model.EmbeddedChunk;
import com.caobolun.business.core.ingest.embed.ChunkEmbeddingService;
import com.caobolun.business.core.ingest.sink.ChunkIndexWriter;
import com.caobolun.business.core.parse.DocumentParser;
import com.caobolun.business.core.parse.MimeTypeDetector;
import com.caobolun.business.core.parse.model.Block;
import com.caobolun.business.core.parse.model.ParsedDocument;
import com.caobolun.business.core.parse.registry.ParserRegistry;
import com.caobolun.framework.exception.ClientException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 摄取内核默认实现：固定五步骨架，全文唯一一条摄取执行序列
 * <p>
 * 入口不收 MIME 也不收嵌入模型，任务状态与摄取日志一概不碰
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DefaultIngestionKernel implements IngestionKernel {

    /**
     * 解析器 options 键：原始文件名，写进块来源信息
     */
    private static final String OPT_SOURCE_FILE = "sourceFile";

    /**
     * 解析器 options 键：文档 ID，决定图片资产的归属目录 {@code assets/{docId}/...}
     */
    private static final String OPT_DOCUMENT_ID = "documentId";

    private final ParserRegistry parserRegistry;
    private final ChunkingService chunkingService;
    private final ChunkEmbeddingService chunkEmbeddingService;
    private final ChunkIndexWriter chunkIndexWriter;

    /**
     * 执行一次完整摄取：类型识别 → 解析 → 分块 → 向量化 → 索引落库，固定五步骨架，
     * 调用方不可跳过、不可换序、不可替换。
     * 成功返回 {@link IngestionOutcome}（真实 MIME、命中的解析器、Block 数、落库块与各阶段耗时），
     * 失败抛 {@link ClientException}，由外层统一收口。
     * <p>
     * 边界约定：
     * <ul>
     *   <li>入口不收 MIME 也不收嵌入模型——类型识别是全文唯一一次，嵌入模型/维度一律取自落点，没有可传错的入参；</li>
     *   <li>任务状态流转与摄取日志归外层，本方法只负责把「一块字节」变成「落库结果」。</li>
     * </ul>
     *
     * @param doc    文档身份：docId 决定资产归属与落库归属，filename 参与类型识别（可为空）
     * @param bytes  文件原始字节；为 null 或空数组直接抛「文件内容为空」
     * @param spec   文档级摄取配置（解析档位 + 分块预算）；传 null 时回落 {@link IngestionSpec#defaults()}
     * @param target 向量落点：逻辑分区 + 嵌入模型 + 强制维度，第④步据此向量化并校验维度
     * @return 摄取结果，够外层写摄取日志与更新统计
     */
    @Override
    public IngestionOutcome run(DocumentRef doc,
                                byte[] bytes,
                                IngestionSpec spec,
                                VectorTarget target) {
        // 入参校验：空字节直接拒绝，避免空内容一路走到解析才暴露
        if (bytes == null || bytes.length == 0) {
            throw new ClientException("文件内容为空：docId=" + doc.docId());
        }
        // 未传 spec 时回落默认档位/预算（调用方通常都会传，这里仅兜底）
        IngestionSpec effectiveSpec = spec == null ? IngestionSpec.defaults() : spec;

        // ① identity：全链路唯一一次类型识别（以字节内容为主、文件名兜底），识别不出直接失败
        String mimeType = MimeTypeDetector.detect(bytes, doc.filename());
        if (!StringUtils.hasText(mimeType)) {
            throw new ClientException("无法识别文件类型：docId=" + doc.docId() + ", filename=" + doc.filename());
        }

        // ② parse：(MIME × 档位) → 解析器；结构化解析产出 Block 列表，各阶段独立计时
        long parseStart = System.currentTimeMillis();
        // 按「(MIME × 档位)」在注册表里找到对应文档类型应该用哪个解析器，并返回这个解析器实例。
        DocumentParser parser = parserRegistry.require(mimeType, effectiveSpec.parseProfile());
        // 结构化解析：返回有序的 Block 列表（章节、段落、表格、图片等）
        ParsedDocument parsed = parser.parseStructured(bytes, mimeType, parserOptions(doc));
        List<Block> blocks = parsed.blocks() == null ? List.of() : parsed.blocks();
        long parseMillis = System.currentTimeMillis() - parseStart;
        log.info("摄取-解析完成 docId={} mime={} 档位={} 解析器={} blocks={}",
                doc.docId(), mimeType, effectiveSpec.parseProfile().getCode(), parser.getParserType(), blocks.size());

        // ③ chunk：按 Block 类型选 chunker，套用分块预算 → 落库块列表
        long chunkStart = System.currentTimeMillis();
        List<Chunk> chunks = chunkingService.chunk(blocks, effectiveSpec.budget());
        long chunkMillis = System.currentTimeMillis() - chunkStart;

        // 解析出内容但分不出块（如空文档）：直接失败，避免下游拿空列表做无意义向量化
        if (chunks.isEmpty()) {
            throw new ClientException("分块结果为空：docId=" + doc.docId() + ", mime=" + mimeType);
        }

        // ④ embed：模型与维度都来自落点，此处逐条校验维度——物理空间列宽写死，错位要在这里暴露
        long embedStart = System.currentTimeMillis();
        List<EmbeddedChunk> embedded = chunkEmbeddingService.embed(chunks, target);
        long embedMillis = System.currentTimeMillis() - embedStart;

        // ⑤ index：扇出到全部索引落点（关系库 / 向量 / 未来新增后端），事务边界在写入器内，多落点同事务
        long indexStart = System.currentTimeMillis();
        chunkIndexWriter.replaceDocument(target, doc, embedded);
        long indexMillis = System.currentTimeMillis() - indexStart;

        // 汇总结果：只回传块与耗时，向量已写进各索引后端，不再随结果传出一份
        return new IngestionOutcome(mimeType, parser.getParserType(), blocks.size(), chunks,
                new IngestionOutcome.IngestionTimings(parseMillis, chunkMillis, embedMillis, indexMillis));
    }

    /**
     * 组装解析器入参（options）：docId 必须传——解析器用它给图片资产命名 {@code assets/{docId}/...}，
     * 漏传则资产落进随机目录、与文档失联；filename 可选，写进块来源信息供溯源
     *
     * @param doc 文档身份，使用其 docId 与 filename 字段
     * @return 传给 {@link DocumentParser#parseStructured} 的 options 映射
     */
    private Map<String, Object> parserOptions(DocumentRef doc) {
        Map<String, Object> options = new HashMap<>();
        if (StringUtils.hasText(doc.filename())) {
            options.put(OPT_SOURCE_FILE, doc.filename());
        }
        options.put(OPT_DOCUMENT_ID, doc.docId());
        return options;
    }
}
