# MindFlow 项目参考

> 本项目的目标是复刻 [RAGent](https://github.com/nageoffer/ragent) 开源 RAG 系统，使用现代 Web 技术栈（Node.js/TypeScript）重新实现。

---

## RAGent 参考架构

以下内容来自对 `E:\JavaProject\ragent` 的深度分析（Java 17 + Spring Boot 3.5.7 实现）。

### 技术栈对比

| 层级 | RAGent (Java) | MindFlow (目标) |
|------|---------------|-----------------|
| 语言 | Java 17 | Node.js / TypeScript |
| 框架 | Spring Boot 3.5.7 | TBD |
| ORM | MyBatis-Plus + PostgreSQL | TBD |
| 向量库 | Milvus / pgvector | TBD |
| 消息队列 | RocketMQ | TBD |
| 缓存 | Redis + Redisson | TBD |
| 对象存储 | S3 (MinIO) / OSS | TBD |
| AI协议 | OkHttp + Gson (直连LLM) | TBD |
| 文档解析 | Apache Tika + MinerU | TBD |
| 前端 | React 18 + Vite + shadcn/ui | React / Next.js |

### 模块架构

```
ragent/
├── bootstrap/   -- 主启动模块: 控制器 + RAG业务逻辑 + 知识库 + 文档摄入
├── framework/   -- 公共基础设施: 异常/MQ/缓存/链路追踪/幂等/雪花ID
├── infra-ai/    -- AI 基础设施: LLM/Embedding/Rerank 多供应商路由+故障转移
└── mcp-server/  -- MCP 工具服务 (独立部署)
```

### 核心模块详解

#### bootstrap — RAG 业务引擎 (~500 Java文件)

**分层领域模型:**
```
com.nageoffer.ai.ragent/
├── rag/                  # 核心 RAG 引擎
│   ├── core/rewrite/     -- 查询改写 + 子问题拆分
│   ├── core/intent/      -- 意图识别树 (LLM分类 → 节点匹配)
│   ├── core/guidance/    -- 歧义检测 + 引导提示
│   ├── core/retrieval/   -- 多通道并行检索引擎
│   │   ├── channel/       -- 4通道: VectorSearch / KeywordSearch / GraphSearch / WebSearch
│   │   └── postprocessor/ -- 后处理链: Fusion(RRF) → Rerank → Dedup → 元数据富化
│   ├── core/memory/      -- 会话记忆 (N轮历史 + 持久化摘要)
│   ├── core/prompt/      -- Prompt模板管理 + 上下文组装
│   ├── core/source/      -- 来源引用 + 行内角标 [N]
│   ├── core/vector/      -- 向量库 (Milvus/PgVector 双实现) + 装饰器(同步图谱/关键词)
│   ├── core/keyword/     -- ES 关键词检索
│   ├── core/graph/       -- LightRAG 知识图谱
│   ├── core/mcp/         -- MCP 工具注册/参数提取/执行
│   ├── service/pipeline/ -- StreamChatPipeline (8阶段流水线)
│   └── service/handler/  -- SSE 流式处理
├── ingestion/            # 文档摄入流水线
│   ├── engine/            -- 链式节点执行引擎
│   ├── node/              -- Fetcher → Parser → Chunker → Enricher → Enhancer → Indexer
│   └── strategy/fetcher/  -- HttpUrl / Feishu 等源获取器
├── core/parser/           # 文档解析器
│   ├── TikaDocumentParser  -- 通用格式 (Tika)
│   ├── MinerUDocumentParser -- PDF (MinerU SaaS)
│   ├── ExcelDocumentParser  -- Excel
│   ├── ImageDocumentParser  -- 图片 (VLM 图生文)
│   └── model/              -- 解析块模型 (Block/ParsedDocument)
├── core/chunk/            # 文本分块
│   ├── strategy/           -- FixedSizeTextChunker / StructureAwareTextChunker
│   └── blockaware/         -- 块感知分块 (Heading/Paragraph/Table/List/Code/Image)
└── knowledge/             # 知识库 CRUD + 文档调度
```

#### infra-ai — AI 基础设施

**核心接口链:**
```
ChatClient (供应商级: chat/streamChat)
   ← AbstractOpenAIStyleChatClient (模板方法)
     ← SiliconFlowChatClient / BaiLianChatClient / OllamaChatClient / AIHubMixChatClient

LLMService (业务级: chat( request, tier? ))
   ← RoutingLLMService (路由实现)
     → ModelSelector (根据 tier + thinking 筛选候选)
     → ModelRoutingExecutor (遍历候选 + 故障转移 + 熔断健康检查)
     → ModelHealthStore (3态熔断器: CLOSED/OPEN/HALF_OPEN)

同类结构: EmbeddingService / RerankService / VlmService
```

**Tier 档位机制:**
- `fast` — 低延迟, 用于标题/摘要/改写
- `standard` — 默认, 质量/成本平衡
- `deep` — 深度思考, 最高质量
- 每个 tier 在 YAML 中配置: 有序候选模型列表 + 超时预算

#### framework — 公共基础设施

| 包 | 关键内容 |
|----|---------|
| `convention/` | ChatMessage(含Role/SourceRef), ChatRequest, Result, RetrievedChunk |
| `web/` | GlobalExceptionHandler, Results, SseEmitterSender |
| `trace/` | RagTraceContext(TTL), @RagTraceNode 注解, StreamSpan |
| `exception/` | Abstract/Client/Service/Remote 异常体系 |
| `mq/` | MessageWrapper, RocketMQ 生产者适配器, 事务消息 |
| `idempotent/` | @IdempotentSubmit/@IdempotentConsume 注解 + AOP |

### 关键设计模式

| 模式 | 使用位置 | 说明 |
|------|---------|------|
| **策略模式** | SearchChannel / DocumentParser / ChunkingStrategy / ObjectStorageClient | 可插拔的算法实现 |
| **模板方法** | AbstractOpenAIStyleChatClient | 固定骨架(构建→调用→解析) + 子类钩子 |
| **流水线** | StreamChatPipeline(8阶段) / IngestionEngine(链式节点) | 顺序多阶段处理 |
| **装饰器** | GraphSyncingVectorStoreService / KeywordSyncingVectorStoreService | 增强向量写入不修改核心流程 |
| **责任链** | SearchResultPostProcessor 链(Fusion→Rerank→Dedup→富化) | 可组合的后处理步骤 |
| **回调** | StreamCallback(流式) / LlmFirstPacketProbe(首包探测) | 解耦事件生产与消费 |
| **熔断器** | ModelHealthStore (CLOSED/OPEN/HALF_OPEN) | 保护系统避免频繁调用失败模型 |
| **AOP** | @RagTraceNode / @IdempotentConsume | 横切关注点(追踪/幂等) |

### RAG 流式对话完整流程

```
用户问题
 → ChatQueueLimiter (分布式限流)
 → StreamChatPipeline.execute():
    1. loadMemory()       — 加载历史 (数据库)
    2. rewriteQuery()     — 查询改写 + 子问题拆分 (LLM)
    3. resolveIntents()   — 意图树匹配 (LLM分类)
    4. handleGuidance()?  — 歧义检测, 有歧义则引导返回
    5. handleSystemOnly()?— MCP 工具类意图直接响应
    6. retrieve()         — 多通道并行检索
       → MultiChannelRetrievalEngine
         → SearchChannel[4] (并行) → PostProcessor[4] (链式)
       → MCP 工具并行执行
    7. handleEmptyRetrieval()? — 无结果则提示
    8. streamRagResponse() — 组装Prompt → LLM流式输出 (SSE)
```

### 文档摄入流程

```
上传文档 → IngestionEngine.execute():
  FetcherNode (下载)
    → ParserNode (Tika / MinerU / Markdown / Excel / 图片)
    → ChunkerNode (固定大小 / 结构感知 / 块感知)
    → EnricherNode (关键词/问题生成, LLM富化)
    → EnhancerNode (内容增强, LLM)
    → IndexerNode (向量库写入 + 同步图谱/关键词)
```

### 配置项参考

关键配置域 (对应 RAGent `application.yaml`):

- `ai.providers.*` — LLM 供应商 (url/apiKey/endpoints)
- `ai.chat.*` — 聊天模型 (candidates + tiers + 熔断策略)
- `ai.embedding.*` / `ai.rerank.*` — 嵌入/重排序
- `rag.storage.*` — 对象存储 (S3/OSS 端点/密钥/桶名)
- `rag.vector.*` — 向量库类型 (milvus/pg)
- `rag.keyword.*` — 关键词检索 (none/es)
- `rag.graph.*` — 知识图谱 (none/lightrag)
- `rag.search.channels.*` — 各检索通道开关
- `rag.search.fusion.*` — RRF 融合参数
- `rag.memory.*` — 会话记忆策略
- `rag.citation.*` — 引用角标开关
- `rag.rate-limit.*` — 速率限制
