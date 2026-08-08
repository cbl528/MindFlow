// ============================================================
// MindFlow 前端共享类型 —— 对齐后端 Result / IPage 与各模块 VO
// ============================================================

/** 后端统一返回包装 */
export interface Result<T = unknown> {
  code: string
  message: string
  data: T
  requestId: string
}

/** MyBatis-Plus IPage 分页结构 */
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
  orders?: unknown[]
  optimizeCountSql?: boolean
  searchCount?: boolean
  countId?: string
  maxLimit?: number
}

// ---------- 用户 / 鉴权 ----------

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginVO {
  userId: string
  role: string
  token: string
  avatar?: string
}

export interface CurrentUserVO {
  userId: string
  /** 登录响应不含用户名，需再调 /user/me 获取 */
  username?: string
  role: string
  avatar?: string
}

export interface UserVO {
  id: string
  username: string
  role: string
  avatar?: string
  createTime?: string
  updateTime?: string
}

// ---------- 知识库 ----------

export interface KnowledgeBaseVO {
  id: string
  name: string
  embeddingModel?: string
  collectionName?: string
  documentCount?: number
  createdBy?: string
  createTime?: string
  updateTime?: string
}

export type SourceType = 'file' | 'url' | 'feishu' | 's3'

export interface KnowledgeDocumentVO {
  id: string
  kbId: string
  docName: string
  sourceType?: SourceType
  sourceLocation?: string
  scheduleEnabled?: boolean
  scheduleCron?: string
  enabled?: boolean
  chunkCount?: number
  fileUrl?: string
  fileType?: string
  fileSize?: number
  processMode?: 'chunk' | 'pipeline'
  ingestionSpec?: string
  pipelineId?: string
  status?: string
  chunksEdited?: boolean
  createdBy?: string
  updatedBy?: string
  createTime?: string
  updateTime?: string
}

export interface KnowledgeDocumentSearchVO {
  id: string
  kbId: string
  docName: string
  kbName?: string
}

export interface KnowledgeChunkVO {
  id: string
  kbId: string
  docId: string
  chunkIndex?: number
  content: string
  contentHash?: string
  charCount?: number
  tokenCount?: number
  enabled?: boolean
  createTime?: string
  updateTime?: string
}

export interface KnowledgeDocumentChunkLogVO {
  id: string
  docId: string
  status?: string
  processMode?: string
  chunkStrategy?: string
  pipelineId?: string
  pipelineName?: string
  extractDuration?: number
  chunkDuration?: number
  embedDuration?: number
  persistDuration?: number
  otherDuration?: number
  totalDuration?: number
  chunkCount?: number
  errorMessage?: string
  startTime?: string
  endTime?: string
  createTime?: string
}

export interface ChunkStrategyVO {
  value: string
  label: string
  defaultConfig?: Record<string, number>
}

export interface IngestionSpecSchemaVO {
  parseProfileLabel?: string
  parseProfiles?: Array<{ value: string; label: string }>
  parseProfileExtensions?: string[]
  budgetFields?: Array<{ key: string; label: string; unit: string; min: number; max: number; step: number }>
  wholeDocumentSentinel?: string
}

// ---------- 摄入流水线 / 任务 ----------

export interface IngestionPipelineNodeVO {
  id?: string
  nodeId: string
  nodeType: string
  settings?: Record<string, unknown>
  condition?: Record<string, unknown> | null
  nextNodeId?: string | null
}

export interface IngestionPipelineVO {
  id: string
  name: string
  description?: string
  createdBy?: string
  nodes: IngestionPipelineNodeVO[]
  createTime?: string
  updateTime?: string
}

export type IngestionStatus = 'pending' | 'running' | 'success' | 'failed'

export interface IngestionResult {
  taskId: string
  pipelineId: string
  status: IngestionStatus
  chunkCount?: number
  message?: string
}

export interface IngestionTaskNodeVO {
  id: string
  taskId: string
  pipelineId: string
  nodeId: string
  nodeType: string
  nodeOrder: number
  status: IngestionStatus
  durationMs?: number
  message?: string
  errorMessage?: string
  output?: Record<string, unknown>
  createTime?: string
  updateTime?: string
}

export interface IngestionTaskVO {
  id: string
  pipelineId: string
  sourceType?: SourceType
  sourceLocation?: string
  sourceFileName?: string
  status: IngestionStatus
  chunkCount?: number
  errorMessage?: string
  metadata?: Record<string, unknown>
  startedAt?: string
  completedAt?: string
  createdBy?: string
  createTime?: string
  updateTime?: string
}

// ---------- 意图树 ----------

export type IntentKind = 0 | 1 | 2 // 0=KB 1=SYSTEM 2=MCP

export interface IntentNodeTreeVO {
  id: string
  intentCode?: string
  name: string
  level?: number
  parentCode?: string | null
  description?: string
  examples?: string[]
  collectionName?: string
  collectionNames?: string[]
  topK?: number
  kind?: IntentKind
  sortOrder?: number
  enabled?: boolean
  mcpToolId?: string
  promptSnippet?: string
  promptTemplate?: string
  paramPromptTemplate?: string
  children?: IntentNodeTreeVO[]
}

// ---------- 示例问题 ----------

export interface SampleQuestionVO {
  id: string
  title: string
  description?: string
  question: string
  createTime?: string
  updateTime?: string
}

// ---------- 链路追踪 ----------

export interface RagTraceRunVO {
  traceId: string
  traceName?: string
  entryMethod?: string
  conversationId?: string
  taskId?: string
  userId?: string
  username?: string
  status: string
  errorMessage?: string
  durationMs?: number
  ttftMs?: number
  question?: string
  startTime?: string
  endTime?: string
}

export interface RagTraceNodeVO {
  traceId: string
  nodeId: string
  parentNodeId?: string
  depth?: number
  nodeType?: string
  nodeName?: string
  className?: string
  methodName?: string
  status: string
  errorMessage?: string
  durationMs?: number
  startTime?: string
  endTime?: string
}

export interface RagTraceDetailVO {
  run: RagTraceRunVO
  nodes: RagTraceNodeVO[]
}

// ---------- 仪表盘 ----------

export interface DashboardKpiVO {
  value: number
  delta?: number
  deltaPct?: number
}

export interface DashboardOverviewVO {
  window?: string
  compareWindow?: string
  updatedAt?: string
  kpis: {
    totalUsers: DashboardKpiVO
    activeUsers: DashboardKpiVO
    totalSessions: DashboardKpiVO
    sessions24h: DashboardKpiVO
    totalMessages: DashboardKpiVO
    messages24h: DashboardKpiVO
  }
}

export interface DashboardPerformanceVO {
  window?: string
  avgLatencyMs?: number
  p95LatencyMs?: number
  successRate?: number
  errorRate?: number
  noDocRate?: number
  slowRate?: number
}

export interface DashboardTrendPointVO {
  ts: string
  value: number
}

export interface DashboardTrendSeriesVO {
  name: string
  data: DashboardTrendPointVO[]
}

export interface DashboardTrendsVO {
  metric?: string
  window?: string
  granularity?: string
  series: DashboardTrendSeriesVO[]
}

// ---------- 审计日志 ----------

export interface BizChangeLogVO {
  id: string
  bizType?: string
  bizId?: string
  operationType?: string
  actionDesc?: string
  beforeSnapshot?: string
  afterSnapshot?: string
  changeDiff?: string
  operatorId?: string
  operatorName?: string
  operatorRole?: string
  success?: boolean
  errorMessage?: string
  className?: string
  methodName?: string
  ip?: string
  userAgent?: string
  createTime?: string
}

// ---------- 对话 / SSE ----------

export interface SourceRef {
  index: number
  docId: string
  docName?: string
  sourceType?: string
  fileType?: string
  url?: string
  excerpt?: string
}

export interface MetaPayload {
  conversationId: string
  taskId: string
}

export interface MessageDelta {
  type: 'think' | 'response'
  delta: string
}

export interface CompletionPayload {
  messageId: string
  title?: string
  sources?: SourceRef[]
  messageStatus: 'NORMAL' | 'INTERRUPTED' | 'REJECTED'
}

export interface RecommendedQuestionsPayload {
  status: 'SUCCESS' | 'EMPTY' | 'FAILED'
  questions: string[]
}

// ---------- 会话列表 / 消息历史（后端） ----------

export interface ConversationVO {
  conversationId: string
  title?: string
  /** 最后活动时间（Date 序列化：时间戳或 ISO 字符串） */
  lastTime?: string | number
}

export interface ConversationMessageVO {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  thinkingContent?: string
  thinkingDuration?: number
  vote?: 1 | -1
  sources?: SourceRef[]
  recommendedQuestions?: string[]
  messageStatus?: 'NORMAL' | 'INTERRUPTED' | 'REJECTED'
  createTime?: string
}

// 前端本地会话/消息模型
export type ChatMessageStatus = 'streaming' | 'thinking' | 'complete' | 'error' | 'interrupted'

export interface ChatMessage {
  id: string
  messageId?: string
  role: 'user' | 'assistant'
  content: string
  thinkingContent?: string
  thinkingDuration?: number
  status: ChatMessageStatus
  sources?: SourceRef[]
  vote?: 1 | -1
  createTime?: string
  recommendedQuestions?: string[] | null
  recStatus?: 'idle' | 'loading' | 'ready' | 'error'
  error?: string
}

export interface ChatSession {
  /** 会话唯一 id（路由键，稳定） */
  id: string
  /** 服务端会话 id（SSE meta 事件下发，追问时回传） */
  conversationId?: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
  /**
   * 后端消息加载状态：
   * - undefined：本地会话/演示模式，消息由前端自己维护
   * - idle/loading：后端会话待加载/加载中
   * - loaded：已从后端拉取
   * - error：加载失败
   */
  messagesStatus?: 'idle' | 'loading' | 'loaded' | 'error'
}
