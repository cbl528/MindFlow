package com.caobolun.business.rag.core.prompt;

import com.caobolun.business.rag.core.intent.NodeScore;
import com.caobolun.framework.convention.RetrievedChunk;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;

import java.util.List;
import java.util.Map;

/**
 * 上下文格式化器，负责将知识库检索结果和 MCP 工具调用结果格式化为可嵌入 Prompt 的文本
 */
public interface ContextFormatter {

    /**
     * 格式化知识库检索上下文
     *
     * @param kbIntents        知识库意图节点及其得分列表
     * @param rerankedByIntent 按意图分组的重排序后检索文档块
     * @param contextTopK      最终进 LLM 的文档块条数上限（检索预算的 contextTopK 段）
     * @return 格式化后的知识库上下文文本
     */
    String formatKbContext(List<NodeScore> kbIntents, Map<String, List<RetrievedChunk>> rerankedByIntent, int contextTopK);

    /**
     * 格式化 MCP 工具调用上下文
     *
     * @param toolResults MCP 工具调用结果，按工具名称分组
     * @param mcpIntents  MCP 意图节点及其得分列表
     * @return 格式化后的 MCP 上下文文本
     */
    String formatMcpContext(Map<String, List<CallToolResult>> toolResults, List<NodeScore> mcpIntents);
}
