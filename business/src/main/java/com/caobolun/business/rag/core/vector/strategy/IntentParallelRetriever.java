package com.caobolun.business.rag.core.vector.strategy;

import com.caobolun.business.rag.core.intent.IntentNode;
import com.caobolun.business.rag.core.intent.NodeScore;
import com.caobolun.business.rag.core.retrieval.RetrieveRequest;
import com.caobolun.business.rag.core.vector.VectorRetrieverService;
import com.caobolun.framework.convention.RetrievedChunk;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.concurrent.Executor;

/**
 * 意图并行检索器
 * 继承模板类，实现意图特定的检索逻辑
 */
@Slf4j
public class IntentParallelRetriever extends AbstractParallelRetriever<IntentParallelRetriever.IntentTask> {

    public record IntentTask(NodeScore nodeScore, int intentTopK) {
    }

    public IntentParallelRetriever(VectorRetrieverService retrieverService,
                                   Executor executor) {
        super(retrieverService, executor);
    }

    /**
     * 按意图节点并行检索：将 NodeScore 解析为各自召回深度后委托模板方法执行
     * （独立命名以避免与父类 {@code executeParallelRetrieval(String, List, int)} 泛型擦除后签名冲突）
     */
    public List<RetrievedChunk> retrieveByIntents(String question,
                                                  List<NodeScore> targets,
                                                  int recallBudget) {
        List<IntentTask> intentTasks = targets.stream()
                .map(nodeScore -> new IntentTask(
                        nodeScore,
                        resolveIntentTopK(nodeScore, recallBudget)
                ))
                .toList();
        return super.executeParallelRetrieval(question, intentTasks, recallBudget);
    }

    @Override
    protected List<RetrievedChunk> createRetrievalTask(String question, IntentTask task, float[] queryVector, int ignoredTopK) {
        NodeScore nodeScore = task.nodeScore();
        IntentNode node = nodeScore.getNode();
        List<String> collectionNames = node.getEffectiveCollectionNames();
        if (collectionNames.isEmpty()) {
            return List.of();
        }
        try {
            return retrieverService.retrieveByVector(
                    queryVector,
                    RetrieveRequest.builder()
                            .collectionNames(collectionNames)
                            .query(question)
                            .topK(task.intentTopK())
                            .build()
            );
        } catch (Exception e) {
            log.error("意图检索失败 - 意图ID: {}, 意图名称: {}, Collections: {}, 错误: {}",
                    node.getId(), node.getName(), collectionNames, e.getMessage(), e);
            return List.of();
        }
    }

    @Override
    protected String getTargetIdentifier(IntentTask task) {
        NodeScore nodeScore = task.nodeScore();
        IntentNode node = nodeScore.getNode();
        return String.format("意图ID: %s, 意图名称: %s", node.getId(), node.getName());
    }

    @Override
    protected String getStatisticsName() {
        return "意图检索";
    }

    /**
     * 计算单个意图节点检索 TopK
     * 节点级 node.topK 为该意图的绝对召回深度、优先；否则用统一的每通道召回条数 recallBudget
     */
    private int resolveIntentTopK(NodeScore nodeScore, int recallBudget) {
        if (nodeScore != null && nodeScore.getNode() != null) {
            Integer nodeTopK = nodeScore.getNode().getTopK();
            if (nodeTopK != null && nodeTopK > 0) {
                return nodeTopK;
            }
        }
        return recallBudget;
    }
}
