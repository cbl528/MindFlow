package com.caobolun.business.core.chunk.blockaware;


import cn.hutool.core.util.IdUtil;
import com.caobolun.business.core.chunk.VectorChunk;
import com.caobolun.business.core.chunk.model.ChunkDraft;
import com.caobolun.business.core.chunk.model.ChunkMetadata;
import com.caobolun.business.core.parse.model.TableBlock;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 表格 chunker：按 {@code maxChars} 体量预算累加切分数据行，<b>每个 chunk 都包含完整表头</b>
 * <p>
 * 关键设计：
 * <ul>
 *   <li>headers 从 TableBlock.headers 直接取，不靠正则提取（vs 老路径的字符串 chunker）</li>
 *   <li>切分按 key-value 渲染长度累加到 maxChars 预算，{@code rowsPerChunk} 仅作硬上限，
 *       兼顾宽表不超 embedding 上限、窄表不过度碎片化；单行体量超预算时保持整行原子，自成一块</li>
 *   <li>content 渲染为完整 markdown 表格（展示）；embeddingText 用 key-value（嵌入）</li>
 *   <li>sectionContext 写入 sheet 名 + 表头摘要，便于检索时回填上下文</li>
 *   <li>无数据行的 TableBlock（仅 headers）：产生一个仅含表头的 chunk</li>
 * </ul>
 *
 * ImageChunker — 图片
 *
 *   逻辑：一个图片 → 一个草稿，永不切。content = 描述 + markdown 图链，body = 纯描述（去
 *   URL 噪声）。caption 优先取 caption，没有取 altText。图片 AssetRef 挂进
 *   metadata.assets。
 *
 *   例：描述"系统架构图"、URL https://cdn.example.com/arch.png
 *   - content = 系统架构图\n\n![系统架构图](https://cdn.example.com/arch.png)
 *   - body = 系统架构图
 */
@Component
public class TableChunker implements BlockChunker<TableBlock> {

    @Override
    public Class<TableBlock> blockType() {
        return TableBlock.class;
    }

    @Override
    public List<ChunkDraft> chunk(TableBlock block, ChunkContext ctx) {
        if (block == null) {
            return List.of();
        }
        List<String> headers = block.headers() == null ? List.of() : block.headers();
        List<List<String>> rows = block.rows() == null ? List.of() : block.rows();
        if (headers.isEmpty() && rows.isEmpty()) {
            return List.of();
        }

        // 预算只量 KV 行本身，刻意不扣装配器追加的章节路径前缀：真去扣，深层章节会把可用预算逼近 0，
        // 退化成每行一块、每块大半是逐字相同的前缀
        int maxRows = Math.max(1, ctx.budget().rowsPerChunk());
        // 整张表撑得住容忍上限就不切，切开后每块虽重带表头，跨块的行间对比仍然做不了
        int budget = rows.size() <= maxRows
                && renderKeyValueRows(headers, rows).length() <= ctx.budget().toleranceChars()
                ? ctx.budget().toleranceChars()
                : Math.max(1, ctx.budget().maxChars());

        List<ChunkDraft> result = new ArrayList<>();

        if (rows.isEmpty()) {
            result.add(buildDraft(block, ctx, headers, List.of()));
            return result;
        }

        // 贪心累加：超硬上限或（非空且加入下一行会超预算）则先落块
        List<List<String>> group = new ArrayList<>();
        int groupCost = 0;
        for (List<String> row : rows) {
            int rowCost = renderKeyValueRow(headers, row).length();
            boolean overCap = group.size() >= maxRows;
            boolean overBudget = !group.isEmpty() && groupCost + rowCost > budget;
            if (overCap || overBudget) {
                result.add(buildDraft(block, ctx, headers, group));
                group = new ArrayList<>();
                groupCost = 0;
            }
            group.add(row);
            groupCost += rowCost;
        }
        result.add(buildDraft(block, ctx, headers, group));
        return ChunkDraft.pieces(result);
    }

    private ChunkDraft buildDraft(TableBlock block, ChunkContext ctx, List<String> headers, List<List<String>> rows) {
        ChunkMetadata metadata = ChunkMetadata.builder()
                .outlinePath(ctx.outlinePath())
                .provenance(block.provenance())
                .build();
        // 章节路径由装配器统一拼进向量文本，此处只给 key-value 正文，避免重复前缀
        return ChunkDraft.of(renderMarkdownTable(headers, rows), renderKeyValueRows(headers, rows), metadata);
    }

    private String renderKeyValueRows(List<String> headers, List<List<String>> rows) {
        StringBuilder sb = new StringBuilder();
        for (List<String> row : rows) {
            String line = renderKeyValueRow(headers, row);
            if (line.isEmpty()) {
                continue;
            }
            if (!sb.isEmpty()) {
                sb.append('\n');
            }
            sb.append(line);
        }
        return sb.toString();
    }

    /**
     * 单行渲染成 {@code 列名: 值}，"; " 拼接、跳过空值、整行空返回空串；同时用作预算切分的行体量度量
     */
    private String renderKeyValueRow(List<String> headers, List<String> row) {
        StringBuilder line = new StringBuilder();
        for (int c = 0; c < row.size(); c++) {
            String value = row.get(c);
            if (value == null || value.isEmpty()) {
                continue;
            }
            String key = c < headers.size() ? headers.get(c) : "";
            if (!line.isEmpty()) {
                line.append("; ");
            }
            if (!key.isEmpty()) {
                line.append(oneLine(key)).append(": ");
            }
            line.append(oneLine(value));
        }
        return line.toString();
    }

    /**
     * 把 cell 内换行压成空格：key 与 value 之间夹一个断行会影响检索
     */
    private static String oneLine(String text) {
        return text.replaceAll("\\r\\n|\\r|\\n", " ");
    }

    private String renderMarkdownTable(List<String> headers, List<List<String>> rows) {
        StringBuilder sb = new StringBuilder();
        appendRow(sb, headers);
        appendSeparator(sb, headers.size());
        for (List<String> row : rows) {
            appendRow(sb, row);
        }
        if (!sb.isEmpty() && sb.charAt(sb.length() - 1) == '\n') {
            sb.deleteCharAt(sb.length() - 1);
        }
        return sb.toString();
    }

    private void appendRow(StringBuilder sb, List<String> cells) {
        sb.append('|');
        for (String cell : cells) {
            sb.append(' ').append(sanitizeCell(cell)).append(" |");
        }
        sb.append('\n');
    }

    /**
     * 清洗 cell 以适配 markdown 表格语法
     * <p>
     * 单元格内换行（Excel Alt+Enter）转 {@code <br>}，裸换行会从中间截断表格行、使整块退化成普通段落；
     * 竖线转义，cell 内的字面 {@code |} 会被误判为列分隔
     */
    private String sanitizeCell(String cell) {
        if (cell == null || cell.isEmpty()) {
            return "";
        }
        return cell.replace("|", "\\|").replaceAll("\\r\\n|\\r|\\n", "<br>");
    }

    private void appendSeparator(StringBuilder sb, int colCount) {
        sb.append('|');
        sb.append("---|".repeat(Math.max(0, colCount)));
        sb.append('\n');
    }
}
