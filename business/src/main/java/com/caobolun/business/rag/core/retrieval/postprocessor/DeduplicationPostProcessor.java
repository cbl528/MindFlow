package com.caobolun.business.rag.core.retrieval.postprocessor;

import cn.hutool.crypto.digest.DigestUtil;
import com.caobolun.business.rag.core.retrieval.channel.SearchChannelResult;
import com.caobolun.business.rag.core.retrieval.channel.SearchContext;
import com.caobolun.framework.convention.RetrievedChunk;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 去重后置处理器
 * <p>
 * 合并多个通道的结果并按 key 去重：同一 Chunk 多路命中时保留首次出现的实例
 * 不在此处比较跨通道分数（量纲不可比），最终名次统一交由下游 RRF 融合赋分
 */
@Slf4j
@Component
public class DeduplicationPostProcessor implements SearchResultPostProcessor {

    @Override
    public String getName() {
        return "Deduplication";
    }

    @Override
    public int getOrder() {
        return 1;  // 最先执行
    }

    @Override
    public boolean isEnabled(SearchContext context) {
        return true;  // 始终启用
    }

    @Override
    public List<RetrievedChunk> process(List<RetrievedChunk> chunks,
                                        List<SearchChannelResult> results,
                                        SearchContext context) {
        // 按 key 做集合去并：同一 Chunk 多路命中时保留首次出现的实例即可
        // 不比较各通道原始分——BM25/余弦/图谱分跨量纲不可比，且最终名次由下游 RRF 融合统一赋分
        // 通道遍历顺序不影响结果：下游融合（RRF 累加）与归因（从 results 重算）均与顺序无关
        Map<String, RetrievedChunk> chunkMap = new LinkedHashMap<>();
        for (SearchChannelResult result : results) {
            for (RetrievedChunk chunk : result.getChunks()) {
                chunkMap.putIfAbsent(generateChunkKey(chunk), chunk);
            }
        }
        return new ArrayList<>(chunkMap.values());
    }

    /**
     * 生成 Chunk 唯一键
     */
    private String generateChunkKey(RetrievedChunk chunk) {
        // 基于 id 或内容摘要生成唯一键
        // 注意不能用 String.hashCode()：32 位哈希碰撞概率不可忽略（如 "Aa" 与 "BB"），
        // 碰撞会把内容不同的 Chunk 误判为重复并静默丢弃，这里改用 SHA-256 内容摘要
        return chunk.getId() != null
                ? chunk.getId()
                : DigestUtil.sha256Hex(chunk.getText() == null ? "" : chunk.getText());
    }
}
