// ============================================================
// 前端演示死数据 —— 后端联通前用于渲染所有页面
// 结构完全对齐 src/types/index.ts 中的 VO 类型
// ============================================================

import type {
  BizChangeLogVO,
  ChatMessage,
  ChunkStrategyVO,
  CompletionPayload,
  CurrentUserVO,
  DashboardOverviewVO,
  DashboardPerformanceVO,
  DashboardTrendsVO,
  IngestionPipelineNodeVO,
  IngestionPipelineVO,
  IngestionResult,
  IngestionTaskNodeVO,
  IngestionTaskVO,
  IntentNodeTreeVO,
  KnowledgeBaseVO,
  KnowledgeChunkVO,
  KnowledgeDocumentChunkLogVO,
  KnowledgeDocumentSearchVO,
  KnowledgeDocumentVO,
  LoginVO,
  PageResult,
  RagTraceDetailVO,
  RagTraceNodeVO,
  RagTraceRunVO,
  RecommendedQuestionsPayload,
  SampleQuestionVO,
  SourceRef,
  UserVO,
} from '@/types'

export const seed = {
  login: {
    userId: '2001523723396308993',
    role: 'admin',
    token: 'demo-token-mindflow-0000',
    avatar: 'https://static.deepseek.com/user-avatar/G_6cuD8GbD53VwGRwisvCsZ6',
  } as LoginVO,

  currentUser: {
    userId: '2001523723396308993',
    username: 'admin',
    role: 'admin',
    avatar: 'https://static.deepseek.com/user-avatar/G_6cuD8GbD53VwGRwisvCsZ6',
  } as CurrentUserVO,

  users: [
    { id: 'u1', username: 'admin', role: 'admin', avatar: 'https://static.deepseek.com/user-avatar/G_6cuD8GbD53VwGRwisvCsZ6', createTime: '2026-07-01 10:00:00', updateTime: '2026-07-20 09:30:00' },
    { id: 'u2', username: 'zhangwei', role: 'user', avatar: 'https://static.deepseek.com/user-avatar/9c3b3c0b0d3e4f0d9d4b6e5f1a0f5f3e', createTime: '2026-07-03 14:20:00', updateTime: '2026-07-18 11:05:00' },
    { id: 'u3', username: 'liuyang', role: 'user', avatar: 'https://static.deepseek.com/user-avatar/5d2a8f2c6b7a4e9f8c1d3b2a9e0f7c5d', createTime: '2026-07-05 09:15:00', updateTime: '2026-07-22 16:40:00' },
    { id: 'u4', username: 'wangfang', role: 'user', avatar: 'https://static.deepseek.com/user-avatar/7e4f1c9a3d5b8f2e6a0c4d8b1e7f2a3c', createTime: '2026-07-08 18:45:00', updateTime: '2026-07-25 10:12:00' },
    { id: 'u5', username: 'chenjing', role: 'user', avatar: 'https://static.deepseek.com/user-avatar/2b6d9e0f4a8c3d7e5f1b0a9c6d2e8f4a', createTime: '2026-07-12 08:30:00', updateTime: '2026-07-26 14:55:00' },
    { id: 'u6', username: 'zhaolei', role: 'user', avatar: 'https://static.deepseek.com/user-avatar/8c1a5e2f7b3d9c0a4e6f8b1d2c5a9e3b', createTime: '2026-07-15 13:00:00', updateTime: '2026-07-28 09:20:00' },
  ] as UserVO[],

  knowledgeBases: [
    { id: 'kb1', name: '员工手册与制度', embeddingModel: 'bge-m3', collectionName: 'kb_emp_handbook', documentCount: 18, createdBy: 'admin', createTime: '2026-07-02 10:00:00', updateTime: '2026-07-30 15:20:00' },
    { id: 'kb2', name: '产品文档', embeddingModel: 'bge-m3', collectionName: 'kb_product', documentCount: 42, createdBy: 'admin', createTime: '2026-07-02 10:05:00', updateTime: '2026-07-29 11:30:00' },
    { id: 'kb3', name: '技术支持知识库', embeddingModel: 'text-embedding-3', collectionName: 'kb_support', documentCount: 27, createdBy: 'zhangwei', createTime: '2026-07-06 16:00:00', updateTime: '2026-07-28 09:10:00' },
    { id: 'kb4', name: '财务报销制度', embeddingModel: 'bge-m3', collectionName: 'kb_finance', documentCount: 9, createdBy: 'admin', createTime: '2026-07-09 10:30:00', updateTime: '2026-07-25 14:40:00' },
    { id: 'kb5', name: '信息安全规范', embeddingModel: 'text-embedding-3', collectionName: 'kb_security', documentCount: 6, createdBy: 'chenjing', createTime: '2026-07-11 09:00:00', updateTime: '2026-07-24 17:05:00' },
    { id: 'kb6', name: '招聘与入职指南', embeddingModel: 'bge-m3', collectionName: 'kb_hr', documentCount: 12, createdBy: 'wangfang', createTime: '2026-07-14 11:20:00', updateTime: '2026-07-22 10:35:00' },
  ] as KnowledgeBaseVO[],

  documents: [
    { id: 'd1', kbId: 'kb1', docName: '员工考勤管理制度.pdf', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 24, fileType: 'application/pdf', fileSize: 2560000, processMode: 'chunk', status: 'success', createdBy: 'admin', createTime: '2026-07-02 10:10:00', updateTime: '2026-07-02 10:12:00' },
    { id: 'd2', kbId: 'kb1', docName: '薪酬福利管理办法.docx', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 31, fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 3840000, processMode: 'chunk', status: 'success', createdBy: 'admin', createTime: '2026-07-02 10:15:00', updateTime: '2026-07-02 10:18:00' },
    { id: 'd3', kbId: 'kb1', docName: '请假与出差流程.md', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 8, fileType: 'text/markdown', fileSize: 120000, processMode: 'chunk', status: 'success', createdBy: 'zhangwei', createTime: '2026-07-03 09:00:00', updateTime: '2026-07-03 09:02:00' },
    { id: 'd4', kbId: 'kb2', docName: 'MindFlow 产品白皮书.pdf', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 56, fileType: 'application/pdf', fileSize: 12500000, processMode: 'chunk', status: 'success', createdBy: 'admin', createTime: '2026-07-04 14:00:00', updateTime: '2026-07-04 14:06:00' },
    { id: 'd5', kbId: 'kb2', docName: 'API 对接文档.md', sourceType: 'url', sourceLocation: 'https://docs.mindflow.dev/api', scheduleEnabled: true, scheduleCron: '0 0 3 * * ?', enabled: true, chunkCount: 33, fileType: 'text/markdown', fileSize: 0, processMode: 'pipeline', pipelineId: 'p1', status: 'success', createdBy: 'liuyang', createTime: '2026-07-05 10:00:00', updateTime: '2026-07-28 03:00:00' },
    { id: 'd6', kbId: 'kb3', docName: '常见问题排查手册.pdf', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 40, fileType: 'application/pdf', fileSize: 5200000, processMode: 'chunk', status: 'success', createdBy: 'zhangwei', createTime: '2026-07-06 16:30:00', updateTime: '2026-07-06 16:35:00' },
    { id: 'd7', kbId: 'kb3', docName: '工单处理 SLA 说明.docx', sourceType: 'file', scheduleEnabled: false, enabled: false, chunkCount: 12, fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 980000, processMode: 'chunk', status: 'success', createdBy: 'liuyang', createTime: '2026-07-08 11:00:00', updateTime: '2026-07-20 15:00:00' },
    { id: 'd8', kbId: 'kb4', docName: '差旅报销标准.pdf', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 15, fileType: 'application/pdf', fileSize: 1700000, processMode: 'chunk', status: 'success', createdBy: 'admin', createTime: '2026-07-09 10:40:00', updateTime: '2026-07-09 10:42:00' },
    { id: 'd9', kbId: 'kb4', docName: '采购付款流程.docx', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 10, fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 860000, processMode: 'chunk', status: 'failed', createdBy: 'wangfang', createTime: '2026-07-18 14:00:00', updateTime: '2026-07-18 14:01:00' },
    { id: 'd10', kbId: 'kb5', docName: '数据分级与外发审批规范.md', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 9, fileType: 'text/markdown', fileSize: 96000, processMode: 'chunk', status: 'success', createdBy: 'chenjing', createTime: '2026-07-11 09:20:00', updateTime: '2026-07-11 09:22:00' },
    { id: 'd11', kbId: 'kb5', docName: '强密码与账号规范.pdf', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 6, fileType: 'application/pdf', fileSize: 640000, processMode: 'chunk', status: 'success', createdBy: 'chenjing', createTime: '2026-07-11 09:30:00', updateTime: '2026-07-11 09:31:00' },
    { id: 'd12', kbId: 'kb6', docName: '新员工入职指南.docx', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 18, fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: 2200000, processMode: 'chunk', status: 'success', createdBy: 'wangfang', createTime: '2026-07-14 11:30:00', updateTime: '2026-07-14 11:33:00' },
    { id: 'd13', kbId: 'kb2', docName: '2026 年产品路线图.pdf', sourceType: 'file', scheduleEnabled: false, enabled: true, chunkCount: 22, fileType: 'application/pdf', fileSize: 7800000, processMode: 'chunk', status: 'pending', createdBy: 'admin', createTime: '2026-07-30 09:00:00', updateTime: '2026-07-30 09:00:00' },
  ] as KnowledgeDocumentVO[],

  documentSearch: [
    { id: 'd1', kbId: 'kb1', docName: '员工考勤管理制度.pdf', kbName: '员工手册与制度' },
    { id: 'd4', kbId: 'kb2', docName: 'MindFlow 产品白皮书.pdf', kbName: '产品文档' },
    { id: 'd5', kbId: 'kb2', docName: 'API 对接文档.md', kbName: '产品文档' },
    { id: 'd6', kbId: 'kb3', docName: '常见问题排查手册.pdf', kbName: '技术支持知识库' },
  ] as KnowledgeDocumentSearchVO[],

  chunks: [
    { id: 'c1', kbId: 'kb1', docId: 'd1', chunkIndex: 0, content: '第一条 为规范员工考勤管理，保障正常工作秩序，依据国家有关法律法规，结合公司实际情况，制定本制度。员工应按照排班安排按时上下班，不得迟到、早退、旷工。', charCount: 78, tokenCount: 64, enabled: true, createTime: '2026-07-02 10:12:00', updateTime: '2026-07-02 10:12:00' },
    { id: 'c2', kbId: 'kb1', docId: 'd1', chunkIndex: 1, content: '第二条 考勤记录以打卡系统为准，因公外出、出差等特殊情况需提前在 OA 系统提交申请。月度考勤汇总将于次月 5 日前完成，作为工资核算依据。', charCount: 66, tokenCount: 55, enabled: true, createTime: '2026-07-02 10:12:00', updateTime: '2026-07-02 10:12:00' },
    { id: 'c3', kbId: 'kb1', docId: 'd1', chunkIndex: 2, content: '第三条 迟到 30 分钟以内记迟到一次；超过 30 分钟按旷工半日处理。全年累计迟到 10 次及以上者，取消当年评优资格。', charCount: 51, tokenCount: 43, enabled: true, createTime: '2026-07-02 10:12:00', updateTime: '2026-07-02 10:12:00' },
    { id: 'c4', kbId: 'kb1', docId: 'd2', chunkIndex: 0, content: '一、薪酬构成。员工薪酬由基本工资、岗位工资、绩效工资、津贴补贴四部分构成。绩效工资依据季度考核结果按比例发放。', charCount: 48, tokenCount: 40, enabled: true, createTime: '2026-07-02 10:18:00', updateTime: '2026-07-02 10:18:00' },
    { id: 'c5', kbId: 'kb1', docId: 'd2', chunkIndex: 1, content: '二、福利待遇。公司为全员缴纳五险一金，提供补充商业保险、年度体检、带薪年假（5-15 天，依据工龄递增）、节日福利等。', charCount: 56, tokenCount: 47, enabled: true, createTime: '2026-07-02 10:18:00', updateTime: '2026-07-02 10:18:00' },
    { id: 'c6', kbId: 'kb1', docId: 'd2', chunkIndex: 2, content: '三、晋升调薪。每年 3 月、9 月组织职级评审，通过评审者依据评定结果调整基本工资；特别优秀者可随时启动特批调薪。', charCount: 54, tokenCount: 45, enabled: false, createTime: '2026-07-02 10:18:00', updateTime: '2026-07-02 10:18:00' },
    { id: 'c7', kbId: 'kb4', docId: 'd8', chunkIndex: 0, content: '差旅报销标准：住宿费一线城市每人每晚不超过 500 元，二线城市不超过 350 元；市内交通凭票据实报销；出差伙食补助每天 80 元。', charCount: 55, tokenCount: 46, enabled: true, createTime: '2026-07-09 10:42:00', updateTime: '2026-07-09 10:42:00' },
    { id: 'c8', kbId: 'kb4', docId: 'd8', chunkIndex: 1, content: '报销需在差旅结束 14 个工作日内提交，附发票与行程单。发票抬头为公司全称，增值税普通发票须开具公司税号。', charCount: 50, tokenCount: 42, enabled: true, createTime: '2026-07-09 10:42:00', updateTime: '2026-07-09 10:42:00' },
    { id: 'c9', kbId: 'kb5', docId: 'd10', chunkIndex: 0, content: '数据分为公开、内部、机密、绝密四个等级。对外发送内部及以上级别数据，须经部门负责人审批；机密及以上须经信息安全负责人审批。', charCount: 58, tokenCount: 49, enabled: true, createTime: '2026-07-11 09:22:00', updateTime: '2026-07-11 09:22:00' },
    { id: 'c10', kbId: 'kb5', docId: 'd10', chunkIndex: 1, content: '发现疑似数据泄露事件，应立即报告信息安全组（security@mindflow.cn），并保留相关日志与证据，严禁私自处置。', charCount: 49, tokenCount: 41, enabled: true, createTime: '2026-07-11 09:22:00', updateTime: '2026-07-11 09:22:00' },
    { id: 'c11', kbId: 'kb2', docId: 'd4', chunkIndex: 0, content: 'MindFlow 是基于 RAG 架构的企业级智能知识助手，支持多知识库、多意图、多通道检索（向量/关键词/图谱/联网），提供深度思考与流式输出。', charCount: 60, tokenCount: 52, enabled: true, createTime: '2026-07-04 14:06:00', updateTime: '2026-07-04 14:06:00' },
    { id: 'c12', kbId: 'kb2', docId: 'd4', chunkIndex: 1, content: '系统采用可插拔的检索通道与后处理链（融合→重排→去重→元数据富化），并支持意图树引导与来源引用，回答可追溯。', charCount: 51, tokenCount: 44, enabled: true, createTime: '2026-07-04 14:06:00', updateTime: '2026-07-04 14:06:00' },
  ] as KnowledgeChunkVO[],

  chunkLogs: [
    { id: 'l1', docId: 'd1', status: 'success', processMode: 'chunk', chunkStrategy: 'structure_aware', extractDuration: 820, chunkDuration: 340, embedDuration: 1520, persistDuration: 260, totalDuration: 2940, chunkCount: 24, startTime: '2026-07-02 10:10:00', endTime: '2026-07-02 10:12:00', createTime: '2026-07-02 10:12:00' },
    { id: 'l2', docId: 'd4', status: 'success', processMode: 'chunk', chunkStrategy: 'fixed_size', extractDuration: 1240, chunkDuration: 610, embedDuration: 4210, persistDuration: 480, totalDuration: 6540, chunkCount: 56, startTime: '2026-07-04 14:00:00', endTime: '2026-07-04 14:06:00', createTime: '2026-07-04 14:06:00' },
    { id: 'l3', docId: 'd5', status: 'success', processMode: 'pipeline', chunkStrategy: 'structure_aware', pipelineId: 'p1', pipelineName: '文档入库标准流水线', extractDuration: 2100, chunkDuration: 760, embedDuration: 3860, persistDuration: 520, totalDuration: 7240, chunkCount: 33, startTime: '2026-07-28 03:00:00', endTime: '2026-07-28 03:02:00', createTime: '2026-07-28 03:02:00' },
    { id: 'l4', docId: 'd9', status: 'failed', processMode: 'chunk', chunkStrategy: 'structure_aware', errorMessage: '文档解析失败：不支持的加密格式', totalDuration: 980, chunkCount: 0, startTime: '2026-07-18 14:00:00', endTime: '2026-07-18 14:01:00', createTime: '2026-07-18 14:01:00' },
  ] as KnowledgeDocumentChunkLogVO[],

  chunkStrategies: [
    { value: 'fixed_size', label: '固定大小分块', defaultConfig: { chunkSize: 800, overlap: 100 } },
    { value: 'structure_aware', label: '结构感知分块', defaultConfig: { minChars: 200, maxChars: 2000 } },
    { value: 'block_aware', label: '块感知分块', defaultConfig: { minChars: 100, maxChars: 1500 } },
  ] as ChunkStrategyVO[],

  pipelines: [
    { id: 'p1', name: '文档入库标准流水线', description: '标准流程：抓取 → 解析 → 分块 → 富化 → 索引', createdBy: 'admin', createTime: '2026-07-02 11:00:00', updateTime: '2026-07-02 11:00:00', nodes: [
      { nodeId: 'fetcher-1', nodeType: 'fetcher', nextNodeId: 'parser-1' },
      { nodeId: 'parser-1', nodeType: 'parser', nextNodeId: 'chunker-1' },
      { nodeId: 'chunker-1', nodeType: 'chunker', nextNodeId: 'enricher-1' },
      { nodeId: 'enricher-1', nodeType: 'enricher', nextNodeId: 'indexer-1' },
      { nodeId: 'indexer-1', nodeType: 'indexer' },
    ] as IngestionPipelineNodeVO[] },
    { id: 'p2', name: 'URL 定时抓取流水线', description: '针对远程链接：抓取 → 解析 → 分块 → 索引，定时重跑', createdBy: 'liuyang', createTime: '2026-07-05 10:30:00', updateTime: '2026-07-05 10:30:00', nodes: [
      { nodeId: 'fetcher-1', nodeType: 'fetcher', nextNodeId: 'parser-1' },
      { nodeId: 'parser-1', nodeType: 'parser', nextNodeId: 'chunker-1' },
      { nodeId: 'chunker-1', nodeType: 'chunker', nextNodeId: 'indexer-1' },
      { nodeId: 'indexer-1', nodeType: 'indexer' },
    ] as IngestionPipelineNodeVO[] },
    { id: 'p3', name: '深度解析流水线（图片/PDF）', description: '解析 → 增强 → 分块 → 富化 → 索引', createdBy: 'admin', createTime: '2026-07-10 09:00:00', updateTime: '2026-07-10 09:00:00', nodes: [
      { nodeId: 'parser-1', nodeType: 'parser', nextNodeId: 'enhancer-1' },
      { nodeId: 'enhancer-1', nodeType: 'enhancer', nextNodeId: 'chunker-1' },
      { nodeId: 'chunker-1', nodeType: 'chunker', nextNodeId: 'enricher-1' },
      { nodeId: 'enricher-1', nodeType: 'enricher', nextNodeId: 'indexer-1' },
      { nodeId: 'indexer-1', nodeType: 'indexer' },
    ] as IngestionPipelineNodeVO[] },
  ] as IngestionPipelineVO[],

  tasks: [
    { id: 't1', pipelineId: 'p1', sourceType: 'file', sourceFileName: '员工考勤管理制度.pdf', status: 'success', chunkCount: 24, startedAt: '2026-07-02 10:10:00', completedAt: '2026-07-02 10:12:00', createdBy: 'admin', createTime: '2026-07-02 10:10:00', updateTime: '2026-07-02 10:12:00' },
    { id: 't2', pipelineId: 'p2', sourceType: 'url', sourceLocation: 'https://docs.mindflow.dev/api', sourceFileName: 'API 对接文档', status: 'success', chunkCount: 33, startedAt: '2026-07-05 10:00:00', completedAt: '2026-07-05 10:03:00', createdBy: 'liuyang', createTime: '2026-07-05 10:00:00', updateTime: '2026-07-05 10:03:00' },
    { id: 't3', pipelineId: 'p3', sourceType: 'file', sourceFileName: '产品设计稿合集.zip', status: 'running', chunkCount: 0, startedAt: '2026-07-30 09:00:00', createdBy: 'admin', createTime: '2026-07-30 09:00:00', updateTime: '2026-07-30 09:01:00' },
    { id: 't4', pipelineId: 'p1', sourceType: 'file', sourceFileName: '采购付款流程.docx', status: 'failed', errorMessage: '文档解析失败：不支持的加密格式', startedAt: '2026-07-18 14:00:00', completedAt: '2026-07-18 14:01:00', createdBy: 'wangfang', createTime: '2026-07-18 14:00:00', updateTime: '2026-07-18 14:01:00' },
    { id: 't5', pipelineId: 'p2', sourceType: 'url', sourceLocation: 'https://wiki.mindflow.cn/sla', sourceFileName: '工单 SLA 说明', status: 'success', chunkCount: 12, startedAt: '2026-07-08 11:00:00', completedAt: '2026-07-08 11:01:00', createdBy: 'zhangwei', createTime: '2026-07-08 11:00:00', updateTime: '2026-07-08 11:01:00' },
    { id: 't6', pipelineId: 'p1', sourceType: 'file', sourceFileName: '新员工入职指南.docx', status: 'pending', startedAt: '2026-07-14 11:30:00', createdBy: 'wangfang', createTime: '2026-07-14 11:30:00', updateTime: '2026-07-14 11:30:00' },
  ] as IngestionTaskVO[],

  taskNodes: [
    { id: 'tn1', taskId: 't1', pipelineId: 'p1', nodeId: 'fetcher-1', nodeType: 'fetcher', nodeOrder: 1, status: 'success', durationMs: 410, createTime: '2026-07-02 10:10:00', updateTime: '2026-07-02 10:10:00' },
    { id: 'tn2', taskId: 't1', pipelineId: 'p1', nodeId: 'parser-1', nodeType: 'parser', nodeOrder: 2, status: 'success', durationMs: 820, createTime: '2026-07-02 10:10:00', updateTime: '2026-07-02 10:10:00' },
    { id: 'tn3', taskId: 't1', pipelineId: 'p1', nodeId: 'chunker-1', nodeType: 'chunker', nodeOrder: 3, status: 'success', durationMs: 340, createTime: '2026-07-02 10:10:00', updateTime: '2026-07-02 10:10:00' },
    { id: 'tn4', taskId: 't1', pipelineId: 'p1', nodeId: 'enricher-1', nodeType: 'enricher', nodeOrder: 4, status: 'success', durationMs: 1520, createTime: '2026-07-02 10:10:00', updateTime: '2026-07-02 10:10:00' },
    { id: 'tn5', taskId: 't1', pipelineId: 'p1', nodeId: 'indexer-1', nodeType: 'indexer', nodeOrder: 5, status: 'success', durationMs: 260, createTime: '2026-07-02 10:10:00', updateTime: '2026-07-02 10:10:00' },
    { id: 'tn6', taskId: 't4', pipelineId: 'p1', nodeId: 'fetcher-1', nodeType: 'fetcher', nodeOrder: 1, status: 'success', durationMs: 120, createTime: '2026-07-18 14:00:00', updateTime: '2026-07-18 14:00:00' },
    { id: 'tn7', taskId: 't4', pipelineId: 'p1', nodeId: 'parser-1', nodeType: 'parser', nodeOrder: 2, status: 'failed', durationMs: 860, errorMessage: '文档解析失败：不支持的加密格式', createTime: '2026-07-18 14:00:00', updateTime: '2026-07-18 14:00:00' },
  ] as IngestionTaskNodeVO[],

  ingestionResult: {
    taskId: 't-demo-12345',
    pipelineId: 'p1',
    status: 'success',
    chunkCount: 18,
    message: '任务提交成功',
  } as IngestionResult,

  intentTree: [
    {
      id: 'sys', intentCode: 'sys', name: '系统意图', level: 0, parentCode: null, description: '系统级意图', kind: 1, sortOrder: 0, enabled: true,
      children: [
        { id: 'sys-welcome', intentCode: 'sys-welcome', name: '欢迎与问候', level: 1, parentCode: 'sys', description: '用户与助手打招呼', examples: ['你好', 'hello', '早上好', '在吗', '嗨'], kind: 1, sortOrder: 19, enabled: true },
        { id: 'sys-help', intentCode: 'sys-help', name: '帮助与能力咨询', level: 1, parentCode: 'sys', description: '询问助手能做什么', examples: ['你能做什么', '你有什么功能'], kind: 1, sortOrder: 20, enabled: true },
      ],
    },
    {
      id: 'group', intentCode: 'group', name: '集团管理', level: 0, parentCode: null, description: '集团制度类问题', kind: 0, sortOrder: 0, enabled: true,
      children: [
        { id: 'group-hr', intentCode: 'group-hr', name: '人事', level: 1, parentCode: 'group', description: '招聘、入职、转正、考勤、请假、薪资、绩效、离职等人事制度问题', examples: ['请假流程是怎样的？', '试用期多久转正？', '迟到会有什么处罚？', '年假有几天？', '绩效工资怎么算？'], collectionNames: ['kb_emp_handbook'], topK: 5, kind: 0, sortOrder: 1, enabled: true },
        { id: 'group-finance', intentCode: 'group-finance', name: '财务', level: 1, parentCode: 'group', description: '报销、发票、付款、预算、成本中心等财务制度问题', examples: ['差旅报销需要哪些资料？', '发票抬头有哪些？', '报销多久能到账？'], collectionNames: ['kb_finance'], topK: 5, kind: 0, sortOrder: 2, enabled: true },
        { id: 'group-admin', intentCode: 'group-admin', name: '行政后勤', level: 1, parentCode: 'group', description: '办公用品申领、会议室预订、访客接待等行政后勤问题', examples: ['怎么预订会议室？', '办公用品在哪里领？'], kind: 0, sortOrder: 3, enabled: false },
        { id: 'group-security', intentCode: 'group-security', name: '信息安全合规', level: 1, parentCode: 'group', description: '账号密码规范、数据分级与外发审批、钓鱼邮件、安全事件上报', examples: ['数据外发需要审批吗？', '强密码要求是什么？', '收到钓鱼邮件怎么办？'], collectionNames: ['kb_security'], topK: 5, kind: 0, sortOrder: 4, enabled: true },
      ],
    },
    {
      id: 'it', intentCode: 'it', name: '技术支持', level: 0, parentCode: null, description: 'IT 支持类问题', kind: 0, sortOrder: 5, enabled: true,
      children: [
        { id: 'it-office', intentCode: 'it-office', name: '账号与办公软件', level: 1, parentCode: 'it', description: '企业账号开通与密码重置、企业邮箱、Office 等办公软件的安装与使用问题', examples: ['邮箱密码忘了怎么重置？', '怎么申请安装专业软件？'], collectionNames: ['kb_support'], topK: 5, kind: 0, sortOrder: 6, enabled: true },
        { id: 'it-network', intentCode: 'it-network', name: '网络与 VPN', level: 1, parentCode: 'it', description: '公司 WiFi、有线网络、VPN 连接、远程办公访问内网等网络问题', examples: ['公司 VPN 连不上怎么办？', '办公室 WiFi 密码是多少？'], collectionNames: ['kb_support'], topK: 5, kind: 0, sortOrder: 7, enabled: true },
      ],
    },
    {
      id: 'biz', intentCode: 'biz', name: '业务系统', level: 0, parentCode: null, description: '业务系统相关', kind: 0, sortOrder: 9, enabled: true,
      children: [],
    },
  ] as IntentNodeTreeVO[],

  traceRuns: [
    { traceId: 'tr1', traceName: 'RAG-Stream', entryMethod: 'RAGChatController.chat', conversationId: 'conv-001', userId: 'u2', username: 'zhangwei', status: 'SUCCESS', durationMs: 3210, ttftMs: 980, question: '请假的流程是什么？', startTime: '2026-07-29 14:20:11', endTime: '2026-07-29 14:20:14' },
    { traceId: 'tr2', traceName: 'RAG-Stream', entryMethod: 'RAGChatController.chat', conversationId: 'conv-002', userId: 'u3', username: 'liuyang', status: 'SUCCESS', durationMs: 4860, ttftMs: 1450, question: '差旅报销需要哪些资料？', startTime: '2026-07-29 14:32:05', endTime: '2026-07-29 14:32:10' },
    { traceId: 'tr3', traceName: 'RAG-Stream', entryMethod: 'RAGChatController.chat', conversationId: 'conv-003', userId: 'u4', username: 'wangfang', status: 'FAILED', durationMs: 2850, ttftMs: 0, errorMessage: '检索通道全部返回空', question: '如何部署 K8s 集群？', startTime: '2026-07-29 15:01:44', endTime: '2026-07-29 15:01:47' },
    { traceId: 'tr4', traceName: 'RAG-Stream', entryMethod: 'RAGChatController.chat', conversationId: 'conv-004', userId: 'u5', username: 'chenjing', status: 'SUCCESS', durationMs: 5520, ttftMs: 2010, question: '发现钓鱼邮件应该怎么处理？', startTime: '2026-07-29 16:12:30', endTime: '2026-07-29 16:12:36' },
    { traceId: 'tr5', traceName: 'RAG-Stream', entryMethod: 'RAGChatController.chat', conversationId: 'conv-001', userId: 'u2', username: 'zhangwei', status: 'SUCCESS', durationMs: 2100, ttftMs: 620, question: '试用期多久转正？', startTime: '2026-07-30 09:05:12', endTime: '2026-07-30 09:05:14' },
    { traceId: 'tr6', traceName: 'RAG-Stream', entryMethod: 'RAGChatController.chat', conversationId: 'conv-005', userId: 'u6', username: 'zhaolei', status: 'SUCCESS', durationMs: 3980, ttftMs: 1100, question: 'VPN 连不上怎么办？', startTime: '2026-07-30 10:18:02', endTime: '2026-07-30 10:18:06' },
    { traceId: 'tr7', traceName: 'RAG-Stream', entryMethod: 'RAGChatController.chat', conversationId: 'conv-006', userId: 'u1', username: 'admin', status: 'SUCCESS', durationMs: 7340, ttftMs: 2800, deepThinking: true, question: '对比 MindFlow 与市面上其他 RAG 方案的区别', startTime: '2026-07-30 11:40:33', endTime: '2026-07-30 11:40:40' },
    { traceId: 'tr8', traceName: 'RAG-Stream', entryMethod: 'RAGChatController.chat', conversationId: 'conv-007', userId: 'u3', username: 'liuyang', status: 'SUCCESS', durationMs: 1670, ttftMs: 480, question: '会议室怎么预订？', startTime: '2026-07-30 14:05:19', endTime: '2026-07-30 14:05:21' },
  ] as RagTraceRunVO[],

  traceNodes: [
    { traceId: 'tr1', nodeId: 'n1', nodeType: 'pipeline', nodeName: 'loadMemory', className: 'StreamChatPipeline', methodName: 'loadMemory', status: 'SUCCESS', durationMs: 45, startTime: '2026-07-29 14:20:11', endTime: '2026-07-29 14:20:11' },
    { traceId: 'tr1', nodeId: 'n2', nodeType: 'llm', nodeName: 'rewriteQuery', className: 'QueryRewriteService', methodName: 'rewrite', status: 'SUCCESS', durationMs: 640, startTime: '2026-07-29 14:20:11', endTime: '2026-07-29 14:20:12' },
    { traceId: 'tr1', nodeId: 'n3', nodeType: 'llm', nodeName: 'resolveIntents', className: 'IntentResolver', methodName: 'resolve', status: 'SUCCESS', durationMs: 720, startTime: '2026-07-29 14:20:12', endTime: '2026-07-29 14:20:13' },
    { traceId: 'tr1', nodeId: 'n4', nodeType: 'retrieval', nodeName: 'vectorRetrieval', className: 'MultiChannelRetrievalEngine', methodName: 'search', status: 'SUCCESS', durationMs: 380, startTime: '2026-07-29 14:20:13', endTime: '2026-07-29 14:20:13' },
    { traceId: 'tr1', nodeId: 'n5', nodeType: 'rerank', nodeName: 'rerank', className: 'RerankProcessor', methodName: 'process', status: 'SUCCESS', durationMs: 210, startTime: '2026-07-29 14:20:13', endTime: '2026-07-29 14:20:13' },
    { traceId: 'tr1', nodeId: 'n6', nodeType: 'llm', nodeName: 'streamRagResponse', className: 'RagResponseStreamer', methodName: 'stream', status: 'SUCCESS', durationMs: 1200, startTime: '2026-07-29 14:20:13', endTime: '2026-07-29 14:20:14' },
  ] as RagTraceNodeVO[],

  traceDetail: {
    run: {
      traceId: 'tr1', traceName: 'RAG-Stream', entryMethod: 'RAGChatController.chat', conversationId: 'conv-001', userId: 'u2', username: 'zhangwei', status: 'SUCCESS', durationMs: 3210, ttftMs: 980, question: '请假的流程是什么？', startTime: '2026-07-29 14:20:11', endTime: '2026-07-29 14:20:14',
    },
    nodes: [
      { traceId: 'tr1', nodeId: 'n1', nodeType: 'pipeline', nodeName: 'loadMemory', className: 'StreamChatPipeline', methodName: 'loadMemory', status: 'SUCCESS', durationMs: 45, startTime: '2026-07-29 14:20:11', endTime: '2026-07-29 14:20:11' },
      { traceId: 'tr1', nodeId: 'n2', nodeType: 'llm', nodeName: 'rewriteQuery', className: 'QueryRewriteService', methodName: 'rewrite', status: 'SUCCESS', durationMs: 640, startTime: '2026-07-29 14:20:11', endTime: '2026-07-29 14:20:12' },
      { traceId: 'tr1', nodeId: 'n3', nodeType: 'llm', nodeName: 'resolveIntents', className: 'IntentResolver', methodName: 'resolve', status: 'SUCCESS', durationMs: 720, startTime: '2026-07-29 14:20:12', endTime: '2026-07-29 14:20:13' },
      { traceId: 'tr1', nodeId: 'n4', nodeType: 'retrieval', nodeName: 'vectorRetrieval', className: 'MultiChannelRetrievalEngine', methodName: 'search', status: 'SUCCESS', durationMs: 380, startTime: '2026-07-29 14:20:13', endTime: '2026-07-29 14:20:13' },
      { traceId: 'tr1', nodeId: 'n5', nodeType: 'rerank', nodeName: 'rerank', className: 'RerankProcessor', methodName: 'process', status: 'SUCCESS', durationMs: 210, startTime: '2026-07-29 14:20:13', endTime: '2026-07-29 14:20:13' },
      { traceId: 'tr1', nodeId: 'n6', nodeType: 'llm', nodeName: 'streamRagResponse', className: 'RagResponseStreamer', methodName: 'stream', status: 'SUCCESS', durationMs: 1200, startTime: '2026-07-29 14:20:13', endTime: '2026-07-29 14:20:14' },
    ],
  } as RagTraceDetailVO,

  changeLogs: [
    { id: 'log1', bizType: 'KNOWLEDGE_BASE', bizId: 'kb1', operationType: 'UPDATE', actionDesc: '更新知识库「员工手册与制度」的名称', operatorId: 'u1', operatorName: 'admin', operatorRole: 'admin', success: true, className: 'KnowledgeBaseService', methodName: 'update', ip: '10.10.0.12', userAgent: 'Chrome/126', createTime: '2026-07-30 15:20:00' },
    { id: 'log2', bizType: 'KNOWLEDGE_DOCUMENT', bizId: 'd9', operationType: 'DELETE', actionDesc: '删除文档「采购付款流程.docx」', operatorId: 'u1', operatorName: 'admin', operatorRole: 'admin', success: true, className: 'KnowledgeDocumentService', methodName: 'remove', ip: '10.10.0.12', userAgent: 'Chrome/126', createTime: '2026-07-30 14:55:00' },
    { id: 'log3', bizType: 'INTENT_NODE', bizId: 'group-admin', operationType: 'UPDATE', actionDesc: '启用意图节点「行政后勤」', operatorId: 'u1', operatorName: 'admin', operatorRole: 'admin', success: true, className: 'IntentNodeService', methodName: 'update', ip: '10.10.0.8', userAgent: 'Edge/127', createTime: '2026-07-30 14:12:00' },
    { id: 'log4', bizType: 'USER', bizId: 'u6', operationType: 'CREATE', actionDesc: '新增用户「zhaolei」', operatorId: 'u1', operatorName: 'admin', operatorRole: 'admin', success: true, className: 'UserService', methodName: 'create', ip: '10.10.0.12', userAgent: 'Chrome/126', createTime: '2026-07-29 17:40:00' },
    { id: 'log5', bizType: 'SAMPLE_QUESTION', bizId: 'sq5', operationType: 'UPDATE', actionDesc: '更新示例问题「如何配置意图树」', operatorId: 'u1', operatorName: 'admin', operatorRole: 'admin', success: true, className: 'SampleQuestionService', methodName: 'update', ip: '10.10.0.12', userAgent: 'Chrome/126', createTime: '2026-07-29 16:08:00' },
    { id: 'log6', bizType: 'INGESTION_PIPELINE', bizId: 'p3', operationType: 'CREATE', actionDesc: '创建流水线「深度解析流水线」', operatorId: 'u1', operatorName: 'admin', operatorRole: 'admin', success: true, className: 'IngestionPipelineService', methodName: 'create', ip: '10.10.0.12', userAgent: 'Chrome/126', createTime: '2026-07-29 11:22:00' },
    { id: 'log7', bizType: 'KNOWLEDGE_DOCUMENT', bizId: 'd13', operationType: 'CREATE', actionDesc: '上传文档「2026 年产品路线图.pdf」', operatorId: 'u1', operatorName: 'admin', operatorRole: 'admin', success: false, errorMessage: 'Embedding 服务超时', className: 'KnowledgeDocumentService', methodName: 'upload', ip: '10.10.0.12', userAgent: 'Chrome/126', createTime: '2026-07-30 09:00:00' },
  ] as BizChangeLogVO[],

  sampleQuestions: [
    { id: 'sq1', title: '帮我总结', description: '如何高效使用知识库检索', question: '如何高效使用知识库检索？', createTime: '2026-07-03 10:00:00', updateTime: '2026-07-03 10:00:00' },
    { id: 'sq2', title: '告诉我', description: '系统支持哪些文档格式', question: '系统支持哪些文档格式？', createTime: '2026-07-03 10:05:00', updateTime: '2026-07-03 10:05:00' },
    { id: 'sq3', title: '演示一下', description: '输入一段内容并分块存储', question: '请演示文档分块的完整流程', createTime: '2026-07-05 14:00:00', updateTime: '2026-07-05 14:00:00' },
    { id: 'sq4', title: '查看', description: '如何配置意图识别树', question: '如何配置意图识别树？', createTime: '2026-07-06 09:30:00', updateTime: '2026-07-06 09:30:00' },
    { id: 'sq5', title: '帮助', description: '深度思考模式怎么开启', question: '深度思考模式怎么开启？', createTime: '2026-07-10 11:00:00', updateTime: '2026-07-10 11:00:00' },
    { id: 'sq6', title: '入门', description: '第一次使用应该做什么', question: '第一次使用 MindFlow 应该做什么？', createTime: '2026-07-12 16:20:00', updateTime: '2026-07-12 16:20:00' },
  ] as SampleQuestionVO[],

  recommendedQuestions: {
    status: 'SUCCESS',
    questions: ['请假的流程是什么？', '试用期多久可以转正？', '年假有几天？', '迟到会有什么处罚？'],
  } as RecommendedQuestionsPayload,

  dashboardOverview: {
    window: '7d',
    compareWindow: 'prev_7d',
    updatedAt: '2026-07-30 18:00:00',
    kpis: {
      totalUsers: { value: 128, delta: 12, deltaPct: 0.103 },
      activeUsers: { value: 46, delta: 5, deltaPct: 0.122 },
      totalSessions: { value: 1240, delta: 168, deltaPct: 0.157 },
      sessions24h: { value: 86, delta: -6, deltaPct: -0.065 },
      totalMessages: { value: 5832, delta: 720, deltaPct: 0.141 },
      messages24h: { value: 412, delta: 33, deltaPct: 0.087 },
    },
  } as DashboardOverviewVO,

  dashboardPerformance: {
    window: '7d',
    avgLatencyMs: 1980,
    p95LatencyMs: 4520,
    successRate: 0.965,
    errorRate: 0.035,
    noDocRate: 0.082,
    slowRate: 0.11,
  } as DashboardPerformanceVO,

  dashboardTrends: {
    metric: 'messages',
    window: '7d',
    granularity: 'day',
    series: [
      {
        name: '消息量',
        data: [
          { ts: '07-24', value: 720 },
          { ts: '07-25', value: 840 },
          { ts: '07-26', value: 655 },
          { ts: '07-27', value: 980 },
          { ts: '07-28', value: 1120 },
          { ts: '07-29', value: 1045 },
          { ts: '07-30', value: 1280 },
        ],
      },
    ],
  } as DashboardTrendsVO,

  demoAnswer: `根据**员工考勤管理制度**，请假流程如下：

1. **提前申请**：请假需提前在 OA 系统提交请假申请，注明请假类型（年假/病假/事假）、起止时间及事由[1]。
2. **审批流程**：3 天以内由直属上级审批，3 天以上需同时抄送部门负责人[1]。
3. **销假**：假期结束返岗后，需在 OA 系统确认销假记录[2]。

年假说明：入职满 1 年享受 5 天年假，工龄每增加 1 年递增 1 天，上限 15 天[2]。年假需在本年度内使用完毕，逾期不补。

如需了解更多，可查看《员工考勤管理制度》原文，或询问「试用期多久转正」等具体问题。`,

  demoThinking: `好的，用户询问的是请假流程。根据意图树匹配，该问题命中「人事」意图（group-hr），对应知识库集合 kb_emp_handbook。

我需要检索员工考勤制度中关于请假的相关条款：
1. 请假申请方式与前置条件
2. 审批流程与权限
3. 年假/病假/事假的具体规定

检索到 3 个相关分块，其中包含请假流程、审批权限、年假规则等关键信息，现在组织回答。`,

  demoSources: [
    { index: 1, docId: 'd1', docName: '员工考勤管理制度.pdf', sourceType: 'file', fileType: 'application/pdf', excerpt: '第五条 请假需提前在 OA 系统提交申请……3 天以内由直属上级审批，3 天以上需抄送部门负责人。' },
    { index: 2, docId: 'd2', docName: '薪酬福利管理办法.docx', sourceType: 'file', fileType: 'docx', excerpt: '年假：入职满一年享受 5 天，工龄每增加一年递增 1 天，上限 15 天，本年度内使用完毕。' },
  ] as SourceRef[],

  demoMessageId: 'demo-msg-20260730-001',

  demoPreview: `# 员工考勤管理制度（演示预览）

> 本文档为前端演示用固定数据，后端联通后展示真实文档内容。

## 第一章 总则

第一条 为规范员工考勤管理，保障正常工作秩序，依据国家有关法律法规，结合公司实际情况，制定本制度。

第二条 考勤记录以打卡系统为准，因公外出、出差等特殊情况需提前在 OA 系统提交申请。

## 第二章 考勤规则

第三条 迟到 30 分钟以内记迟到一次；超过 30 分钟按旷工半日处理。

第四条 全年累计迟到 10 次及以上者，取消当年评优资格。

## 第三章 请假管理

第五条 请假需提前在 OA 系统提交请假申请，注明请假类型、起止时间及事由。

第六条 3 天以内由直属上级审批，3 天以上需同时抄送部门负责人。

## 第四章 附则

第七条 本制度自发布之日起施行，解释权归人力资源部。`,
}

// ---------- 分页与延迟辅助 ----------

export function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** 将数组按前端参数风格切分为 PageResult */
export function pageOf<T>(
  records: T[],
  params: { current?: unknown; size?: unknown; pageNo?: unknown; pageSize?: unknown } & Record<string, unknown> = {},
  filterFn?: (item: T, params: Record<string, unknown>) => boolean,
): PageResult<T> {
  const current = Number(params.current ?? params.pageNo ?? 1)
  const size = Number(params.size ?? params.pageSize ?? 10)
  const filtered = filterFn ? records.filter((r) => filterFn(r, params as Record<string, unknown>)) : records
  const start = (current - 1) * size
  return {
    records: filtered.slice(start, start + size),
    total: filtered.length,
    size,
    current,
    pages: Math.ceil(filtered.length / size),
  }
}

// ---------- 演示对话辅助 ----------

/** 从种子内容生成一段预设回答（带来源角标，便于预览角标功能） */
export function demoConversationSeed(): { messages: ChatMessage[]; title: string } {
  return {
    title: '员工制度咨询',
    messages: [
      {
        id: 'demo-u1',
        role: 'user',
        content: '请假的流程是什么？',
        status: 'complete',
        createTime: '2026-07-30 09:00:00',
      },
      {
        id: 'demo-a1',
        role: 'assistant',
        content: seed.demoAnswer,
        thinkingContent: seed.demoThinking,
        thinkingDuration: 3.2,
        status: 'complete',
        messageId: 'demo-msg-001',
        sources: seed.demoSources,
        recommendedQuestions: seed.recommendedQuestions.questions,
        recStatus: 'ready',
        createTime: '2026-07-30 09:00:03',
      },
      {
        id: 'demo-u2',
        role: 'user',
        content: '试用期多久转正？年假有几天？',
        status: 'complete',
        createTime: '2026-07-30 09:02:00',
      },
      {
        id: 'demo-a2',
        role: 'assistant',
        content:
          '根据《薪酬福利管理办法》和员工手册：\n\n- **试用期**：一般为 3 个月，表现优秀可提前转正[2]。\n- **年假**：入职满 1 年享 5 天，工龄每增加 1 年递增 1 天，上限 15 天[2]。\n\n还有其他想了解的吗？',
        status: 'complete',
        messageId: 'demo-msg-002',
        sources: seed.demoSources,
        recommendedQuestions: ['绩效工资怎么算？', '迟到会有什么处罚？'],
        recStatus: 'ready',
        createTime: '2026-07-30 09:02:02',
      },
    ],
  }
}

// ---------- 模拟流式输出的事件序列 ----------

export interface DemoStreamEvent {
  event: 'meta' | 'message' | 'finish' | 'done' | 'reject' | 'error'
  data: unknown
}

/** 构造一条演示回复的事件序列（可中止） */
export function buildDemoStream(
  question: string,
  deepThinking: boolean,
): Array<{ delay: number; emit: () => DemoStreamEvent }> {
  const events: Array<{ delay: number; emit: () => DemoStreamEvent }> = []
  const t = (ms: number, fn: () => DemoStreamEvent) => events.push({ delay: ms, emit: fn })
  let acc = 0

  acc += 300
  t(acc, () => ({ event: 'meta', data: { conversationId: `demo-conv-${Math.random().toString(36).slice(2, 8)}`, taskId: `demo-task-${Math.random().toString(36).slice(2, 10)}` } }))

  if (deepThinking) {
    const think = seed.demoThinking
    for (let i = 0; i < think.length; i += 6) {
      acc += 40
      const chunk = think.slice(i, i + 6)
      t(acc, () => ({ event: 'message', data: { type: 'think', delta: chunk } }))
    }
  }

  const answer = seed.demoAnswer
  for (let i = 0; i < answer.length; i += 5) {
    acc += 18
    const chunk = answer.slice(i, i + 5)
    t(acc, () => ({ event: 'message', data: { type: 'response', delta: chunk } }))
  }

  acc += 80
  t(acc, () => ({
    event: 'finish',
    data: {
      messageId: `demo-msg-${Date.now().toString(36)}`,
      title: question.length > 16 ? `${question.slice(0, 16)}…` : question,
      sources: seed.demoSources,
      messageStatus: 'NORMAL',
    } as CompletionPayload,
  }))

  acc += 20
  t(acc, () => ({ event: 'done', data: '[DONE]' }))
  return events
}
