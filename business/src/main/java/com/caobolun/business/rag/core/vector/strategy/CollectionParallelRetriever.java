package com.caobolun.business.rag.core.vector.strategy;

import com.caobolun.business.rag.core.retrieval.RetrieveRequest;
import com.caobolun.business.rag.core.vector.VectorRetrieverService;
import com.caobolun.framework.convention.RetrievedChunk;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.concurrent.Executor;

/**
 * Collection 并行检索器
 * 继承模板类，实现 Collection 特定的检索逻辑
 */
@Slf4j
public class CollectionParallelRetriever extends AbstractParallelRetriever<String> {

    public CollectionParallelRetriever(VectorRetrieverService retrieverService,
                                       Executor executor) {
        super(retrieverService, executor);
    }

    @Override
    protected List<RetrievedChunk> createRetrievalTask(String question, String collectionName, float[] queryVector, int topK) {
        try {
            return retrieverService.retrieveByVector(
                    queryVector,
                    RetrieveRequest.builder()
                            .collectionName(collectionName)
                            .query(question)
                            .topK(topK)
                            .build()
            );
        } catch (Exception e) {
            log.error("在 collection {} 中检索失败，错误: {}", collectionName, e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    protected String getTargetIdentifier(String collectionName) {
        return "Collection: " + collectionName;
    }

    @Override
    protected String getStatisticsName() {
        return "全局检索";
    }
}
