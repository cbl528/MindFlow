package com.caobolun.business.knowledge.service.impl;


import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.lang.Assert;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.caobolun.business.audit.constant.BizChangeBizType;
import com.caobolun.business.audit.constant.BizChangeOperationType;
import com.caobolun.business.audit.support.BizChangeLogContext;
import com.caobolun.business.core.chunk.model.EmbeddedChunk;
import com.caobolun.business.core.ingest.*;
import com.caobolun.business.core.ingest.sink.ChunkIndexWriter;
import com.caobolun.business.core.parse.registry.ParserRegistry;
import com.caobolun.business.ingestion.domain.context.IngestionContext;
import com.caobolun.business.ingestion.domain.pipeline.PipelineDefinition;
import com.caobolun.business.ingestion.engine.IngestionEngine;
import com.caobolun.business.ingestion.entity.IngestionPipelineDO;
import com.caobolun.business.ingestion.mapper.IngestionPipelineMapper;
import com.caobolun.business.ingestion.service.IngestionPipelineService;
import com.caobolun.business.knowledge.config.KnowledgeScheduleProperties;
import com.caobolun.business.knowledge.entity.KnowledgeBaseDO;
import com.caobolun.business.knowledge.entity.KnowledgeChunkDO;
import com.caobolun.business.knowledge.entity.KnowledgeDocumentChunkLogDO;
import com.caobolun.business.knowledge.entity.KnowledgeDocumentDO;
import com.caobolun.business.knowledge.enums.DocumentStatus;
import com.caobolun.business.knowledge.enums.ProcessMode;
import com.caobolun.business.knowledge.enums.SourceType;
import com.caobolun.business.knowledge.handler.RemoteFileFetcher;
import com.caobolun.business.knowledge.mapper.KnowledgeBaseMapper;
import com.caobolun.business.knowledge.mapper.KnowledgeChunkMapper;
import com.caobolun.business.knowledge.mapper.KnowledgeDocumentChunkLogMapper;
import com.caobolun.business.knowledge.mapper.KnowledgeDocumentMapper;
import com.caobolun.business.knowledge.mq.event.KnowledgeDocumentChunkEvent;
import com.caobolun.business.knowledge.request.KnowledgeDocumentPageRequest;
import com.caobolun.business.knowledge.request.KnowledgeDocumentUpdateRequest;
import com.caobolun.business.knowledge.request.KnowledgeDocumentUploadRequest;
import com.caobolun.business.knowledge.schedule.CronScheduleHelper;
import com.caobolun.business.knowledge.service.KnowledgeChunkService;
import com.caobolun.business.knowledge.service.KnowledgeDocumentScheduleService;
import com.caobolun.business.knowledge.service.KnowledgeDocumentService;
import com.caobolun.business.knowledge.support.IngestionSpecCodec;
import com.caobolun.business.knowledge.support.VectorTargetResolver;
import com.caobolun.business.knowledge.vo.KnowledgeDocumentChunkLogVO;
import com.caobolun.business.knowledge.vo.KnowledgeDocumentSearchVO;
import com.caobolun.business.knowledge.vo.KnowledgeDocumentVO;
import com.caobolun.business.rag.core.vector.VectorSpaceId;
import com.caobolun.business.rag.core.vector.VectorStoreService;
import com.caobolun.business.rag.dto.StoredFileDTO;
import com.caobolun.business.rag.service.FileStorageService;
import com.caobolun.business.rag.util.DisplayType;
import com.caobolun.framework.context.UserContext;
import com.caobolun.framework.exception.ClientException;
import com.caobolun.framework.exception.ServiceException;
import com.caobolun.framework.mq.producer.MessageQueueProducer;
import com.mzt.logapi.starter.annotation.LogRecord;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KnowledgeDocumentServiceImpl implements KnowledgeDocumentService {

    private final KnowledgeBaseMapper knowledgeBaseMapper;
    private final KnowledgeDocumentMapper documentMapper;
    private final ParserRegistry parserRegistry;
    private final IngestionKernel ingestionKernel;
    private final ChunkIndexWriter chunkIndexWriter;
    private final IngestionSpecCodec ingestionSpecCodec;
    private final FileStorageService fileStorageService;
    private final VectorStoreService vectorStoreService;
    private final KnowledgeChunkService knowledgeChunkService;
    private final KnowledgeDocumentScheduleService scheduleService;
    private final IngestionPipelineService ingestionPipelineService;
    private final IngestionPipelineMapper ingestionPipelineMapper;
    private final IngestionEngine ingestionEngine;
    private final KnowledgeDocumentChunkLogMapper chunkLogMapper;
    private final KnowledgeChunkMapper chunkMapper;
    private final TransactionOperations transactionOperations;
    private final MessageQueueProducer messageQueueProducer;
    private final KnowledgeScheduleProperties scheduleProperties;
    private final RemoteFileFetcher remoteFileFetcher;
    private final VectorTargetResolver vectorTargetResolver;
    private final BizChangeLogContext bizChangeLogContext;

    @Value("knowledge-document-chunk_topic${unique-name:}")
    private String chunkTopic;

    @Override
    @LogRecord(
            success = "上传文档：{{#bizChangeName}}",
            fail = "上传文档失败：{{#_errorMsg}}",
            type = BizChangeBizType.KNOWLEDGE_DOCUMENT,
            subType = BizChangeOperationType.CREATE,
            bizNo = "{{#bizChangeBizId != null ? #bizChangeBizId : #kbId}}",
            extra = BizChangeLogContext.SNAPSHOT_EXPRESSION,
            condition = BizChangeLogContext.RECORD_CONDITION
    )
    public KnowledgeDocumentVO upload(String kbId, KnowledgeDocumentUploadRequest requestParam, MultipartFile file) {
        KnowledgeBaseDO kbDO = knowledgeBaseMapper.selectById(kbId);
        Assert.notNull(kbDO, () -> new ClientException("知识库不存在"));

        // file/locationfile/localtion_file 转为FILE，空值或者其他值均抛出异常
        SourceType sourceType = SourceType.normalize(requestParam.getSourceType());
        // URL 必须有来源地址：SourceType.URL 且 sourceLocation 为空 → 抛"来源地址不能为空"。FILE 来源不需要 sourceLocation。
        // 定时调度校验：只有当 URL 且 scheduleEnabled=true（isScheduleEnabled，751 行）才继续：
        // scheduleCron 为空 → 抛"定时表达式不能为空"
        // 用 CronScheduleHelper.isIntervalLessThan 校验周期不能短于 scheduleProperties.getMinIntervalSeconds()，非法 cron 抛"定时表达式不合法"
        validateSourceAndSchedule(sourceType, requestParam);
        // 摄取配置的校验排在存文件之前：它只看请求参数，而一旦落了对象再抛异常，
        // 存储里就留下一个没有文档指向它的孤儿。纯校验一律前置到第一个副作用之前
        ProcessModeConfig modeConfig = resolveProcessModeConfig(requestParam);
        StoredFileDTO stored = resolveStoredFile(kbDO.getCollectionName(), sourceType, requestParam.getSourceLocation(), file);
        // 前置拦截：与分块阶段同一套 MIME 路由，无解析器的类型直接拒绝，不落库不发 MQ
        if (!parserRegistry.canParse(stored.getMimeType())) {
            fileStorageService.deleteByUrl(stored.getUrl());
            throw new ClientException("暂不支持的文件类型：" + stored.getDetectedType());
        }

        KnowledgeDocumentDO documentDO = KnowledgeDocumentDO.builder()
                .kbId(kbId)
                .docName(stored.getOriginalFilename())
                .enabled(1)
                .chunkCount(0)
                .fileUrl(stored.getUrl())
                .fileType(stored.getDetectedType())
                .mimeType(stored.getMimeType())
                .fileSize(stored.getSize())
                .status(DocumentStatus.PENDING.getCode())
                .sourceType(sourceType.getValue())
                .sourceLocation(SourceType.URL == sourceType ? StrUtil.trimToNull(requestParam.getSourceLocation()) : null)
                .scheduleEnabled(isScheduleEnabled(sourceType, requestParam) ? 1 : 0)
                .scheduleCron(isScheduleEnabled(sourceType, requestParam) ? StrUtil.trimToNull(requestParam.getScheduleCron()) : null)
                .processMode(modeConfig.processMode().getValue())
                .ingestionSpec(modeConfig.ingestionSpec())
                .pipelineId(modeConfig.pipelineId())
                .createdBy(UserContext.getUsername())
                .updatedBy(UserContext.getUsername())
                .build();
        documentMapper.insert(documentDO);
        bizChangeLogContext.put(String.valueOf(documentDO.getId()), null, documentDO);
        bizChangeLogContext.putName(documentDO.getDocName());

        return toVO(documentDO);
    }

    @Override
    @LogRecord(
            success = "开始文档分块：{{#bizChangeName}}",
            fail = "开始文档分块失败：{{#_errorMsg}}",
            type = BizChangeBizType.KNOWLEDGE_DOCUMENT,
            subType = BizChangeOperationType.RUN,
            bizNo = "{{#docId}}",
            extra = BizChangeLogContext.SNAPSHOT_EXPRESSION,
            condition = BizChangeLogContext.RECORD_CONDITION
    )
    public void startChunk(String docId) {
        // 获取文档
        KnowledgeDocumentDO beforeDO = documentMapper.selectById(docId);
        Assert.notNull(beforeDO, () -> new ClientException("文档不存在"));
        bizChangeLogContext.putName(beforeDO.getDocName());
        KnowledgeDocumentDO before = BeanUtil.copyProperties(beforeDO, KnowledgeDocumentDO.class);
        // 构建队列事件
        KnowledgeDocumentChunkEvent event = KnowledgeDocumentChunkEvent.builder()
                .docId(docId)
                .operator(UserContext.getUsername())
                .build();

        messageQueueProducer.sendInTransaction(
                chunkTopic,
                docId,
                "文档分块",
                event,
                arg -> {
                    // Wrapper 更新不触发 updateTime 自动填充, 显式刷新, 使卡死恢复以分块开始时刻为基准
                    int updated = documentMapper.update(
                            new LambdaUpdateWrapper<KnowledgeDocumentDO>()
                                    .set(KnowledgeDocumentDO::getStatus, DocumentStatus.RUNNING.getCode())
                                    .set(KnowledgeDocumentDO::getUpdatedBy, event.getOperator())
                                    .set(KnowledgeDocumentDO::getUpdateTime, new Date())
                                    .eq(KnowledgeDocumentDO::getId, docId)
                                    .ne(KnowledgeDocumentDO::getStatus, DocumentStatus.RUNNING.getCode())
                    );
                    if (updated == 0) {
                        KnowledgeDocumentDO documentDO = documentMapper.selectById(docId);
                        Assert.notNull(documentDO, () -> new ClientException("文档不存在"));
                        throw new ClientException("文档分块操作正在进行中，请稍后再试");
                    }
                    KnowledgeDocumentDO documentDO = documentMapper.selectById(docId);
                    event.setKbId(documentDO.getKbId());
                    scheduleService.upsertSchedule(documentDO);
                }
        );
        bizChangeLogContext.put(docId, before, documentMapper.selectById(docId));
    }

    @Override
    public void executeChunk(String docId) {
        KnowledgeDocumentDO documentDO = documentMapper.selectById(docId);
        if (documentDO == null) {
            log.warn("文档不存在，跳过分块任务, docId={}", docId);
            return;
        }
        runChunkTask(documentDO);
    }

    /**
     * 执行一次文档分块任务：从对象存储读取文档字节，走摄取内核
     * 「解析 → 分块 → 向量化 → 落库」五步，全程登记分块日志（状态/块数/各阶段耗时）并同步文档状态。
     * <p>
     * 本方法是文档分块的主执行入口，由两条路径到达：
     * <ul>
     *   <li>{@link #executeChunk}：被 MQ 消费者 / 定时调度触发（收到 {@code docId} 后再查库）</li>
     *   <li>{@link #chunkDocument}：供内部逻辑直接以已加载的实体调用</li>
     * </ul>
     * 设计要点：
     * <ol>
     *   <li><b>日志先行</b>：进入即先插一条 RUNNING 日志，成功/失败都在同一条日志上收口；</li>
     *   <li><b>异常兜底</b>：任何异常统一在 catch 里把文档置为 FAILED 并回写错误信息，方法自身不向上抛；</li>
     *   <li><b>耗时拆分</b>：解析/分块/嵌入/持久化各阶段独立计时，便于从日志定位瓶颈。</li>
     * </ol>
     *
     * @param documentDO 文档实体，调用方须保证非空且已存在；
     *                   使用到的字段：id（docId）、kbId、processMode、ingestionSpec、pipelineId、fileUrl
     */
    private void runChunkTask(KnowledgeDocumentDO documentDO) {
        String docId = documentDO.getId();
        // 处理模式：chunk（直接分块）/ pipeline（管道）。空值或非法值在此直接抛异常
        ProcessMode processMode = ProcessMode.normalize(documentDO.getProcessMode());
        // 所属知识库：决定向量落点（逻辑分区/嵌入模型/维度）
        KnowledgeBaseDO kbDO = knowledgeBaseMapper.selectById(documentDO.getKbId());
        // 向量落点身份：由知识库配置（L2）+ 部署配置（L1）合成，缺配置直接失败，不回落系统默认
        VectorTarget target = vectorTargetResolver.resolve(kbDO);
        // 文档级摄取配置（L3）：从 ingestion_spec 的 JSONB 反序列化出 解析档位 + 分块预算
        IngestionSpec spec = ingestionSpecCodec.read(documentDO.getIngestionSpec());
        // 文档身份：docId 决定资产归属，kbId 决定落库归属，是摄取内核的入参
        DocumentRef doc = documentRef(documentDO);

        // 先写一条 RUNNING 分块日志，任务成功/失败都在这条日志上收口
        KnowledgeDocumentChunkLogDO chunkLog = KnowledgeDocumentChunkLogDO.builder()
                .docId(docId)
                .status(DocumentStatus.RUNNING.getCode())
                .processMode(processMode.getValue())
                .parseProfile(spec.parseProfile().getCode()) // 仅 chunk 模式有值，排障时确认走的解析档位
                .pipelineId(documentDO.getPipelineId())      // 仅 pipeline 模式有值
                .startTime(new Date())
                .build();
        chunkLogMapper.insert(chunkLog);

        // 各阶段耗时默认 0：失败路径上已计时的阶段保留真实值，未走到的一律 0
        long totalStartTime = System.currentTimeMillis();
        long extractDuration = 0;   // 文本提取（解析）耗时
        long chunkDuration = 0;     // 分块耗时
        long embedDuration = 0;     // 嵌入 API 耗时
        long persistDuration = 0;   // DB 持久化耗时

        try {
            // 管道模式暂停服务：管道将按自定义代码 / 动态脚本重新设计，届时分块沿用同一内核，
            // 下面这段连同 runPipelineProcess 一并重写。此处显式失败，不静默改用默认分块配置
            if (ProcessMode.PIPELINE == processMode) {
                // long start = System.currentTimeMillis();
                // List<EmbeddedChunk> chunks = runPipelineProcess(documentDO, kbDO, target);
                // chunkDuration = System.currentTimeMillis() - start;
                //
                // long persistStart = System.currentTimeMillis();
                // chunkIndexWriter.replaceDocument(target, doc, chunks);
                // persistDuration = System.currentTimeMillis() - persistStart;
                // savedCount = chunks.size();
                throw new ClientException("管道模式重构中，暂不可用，请改用直接分块：docId=" + docId);
            }

            // 核心摄取：① 读字节 → ② 解析（含类型识别）→ ③ 分块 → ④ 向量化 → ⑤ 各索引后端落库
            IngestionOutcome outcome = ingestionKernel.run(doc, readFileBytes(documentDO), spec, target);
            extractDuration = outcome.timings().parseMillis(); // 解析阶段耗时（含 MIME 类型识别）
            chunkDuration = outcome.timings().chunkMillis();   // 分块阶段耗时（含 Block/Chunk 两层插槽加工）
            embedDuration = outcome.timings().embedMillis();   // 向量化阶段耗时（嵌入 API 往返）
            persistDuration = outcome.timings().indexMillis(); // 索引落库阶段耗时
            int savedCount = outcome.chunkCount();             // 最终落库的块数

            // 回填字节探测出的真实 MIME；展示用的 file_type 仍由扩展名决定，两者互不导出
            refreshMimeType(docId, outcome.mimeType());

            // 成功收口：文档置为 SUCCESS 并回写块数，分块日志记成功
            markChunkSucceeded(docId, savedCount);
            long totalDuration = System.currentTimeMillis() - totalStartTime;
            updateChunkLog(chunkLog.getId(), DocumentStatus.SUCCESS.getCode(), savedCount,
                    extractDuration, chunkDuration, embedDuration, persistDuration, totalDuration, null);
        } catch (Exception e) {
            log.error("文档分块任务执行失败：docId={}", docId, e);
            // 失败收口：文档置为 FAILED（事务内执行），分块日志记失败并回写错误信息
            markChunkFailed(documentDO.getId());
            long totalDuration = System.currentTimeMillis() - totalStartTime;
            updateChunkLog(chunkLog.getId(), DocumentStatus.FAILED.getCode(), 0,
                    extractDuration, chunkDuration, embedDuration, persistDuration, totalDuration, e.getMessage());
        }
    }

    /**
     * 构造文档身份（{@link DocumentRef}）：docId 决定资产归属与落库归属，kbId 决定关系库归属，filename 供类型识别
     *
     * @param documentDO 文档实体，使用其 id / kbId / docName 字段
     * @return 摄取内核所需的文档身份
     */
    private DocumentRef documentRef(KnowledgeDocumentDO documentDO) {
        return new DocumentRef(documentDO.getId(), documentDO.getKbId(), documentDO.getDocName());
    }

    /**
     * 标记文档分块成功：把文档状态置为 SUCCESS，并回写本次最终落库的块数到 chunk_count
     *
     * @param docId      文档 ID
     * @param chunkCount 最终落库的块数，用于刷新文档的块数统计
     */
    private void markChunkSucceeded(String docId, int chunkCount) {
        documentMapper.updateById(KnowledgeDocumentDO.builder()
                .id(docId)
                .chunkCount(chunkCount)
                .status(DocumentStatus.SUCCESS.getCode())
                .updatedBy(UserContext.getUsername())
                .build());
    }

    /**
     * 回填真实 MIME：解析阶段通过字节探测出的 MIME 可能与上传时按扩展名判定的不一致，
     * 这里只更新 mime_type 列；展示用的 file_type 仍由扩展名决定，两者互不影响
     *
     * @param docId    文档 ID
     * @param mimeType 字节探测出的真实 MIME，为空（未识别出）则跳过更新
     */
    private void refreshMimeType(String docId, String mimeType) {
        if (!StringUtils.hasText(mimeType)) {
            return;
        }
        documentMapper.updateById(KnowledgeDocumentDO.builder().id(docId).mimeType(mimeType).build());
    }

    /**
     * 读取文档的原始字节：按 fileUrl 从对象存储拉取并全部读入内存，交给摄取内核做解析
     *
     * @param documentDO 文档实体，使用其 fileUrl 字段
     * @return 文件完整字节
     * @throws ServiceException 读取失败时抛出，由 runChunkTask 的 catch 统一收口
     */
    private byte[] readFileBytes(KnowledgeDocumentDO documentDO) {
        try (InputStream is = fileStorageService.openStream(documentDO.getFileUrl())) {
            return is.readAllBytes();
        } catch (Exception e) {
            throw new ServiceException("读取文件内容失败：docId=" + documentDO.getId());
        }
    }

    /**
     * 更新分块日志：在成功/失败两条收口路径上统一回写最终状态、块数与各阶段耗时
     *
     * @param logId           分块日志 ID
     * @param status          最终状态（success / failed）
     * @param chunkCount      落库块数，失败路径为 0
     * @param extractDuration 文本提取（解析）耗时（毫秒）
     * @param chunkDuration   分块耗时（毫秒）
     * @param embedDuration   嵌入 API 耗时（毫秒）
     * @param persistDuration DB 持久化耗时（毫秒）
     * @param totalDuration   总耗时（毫秒）
     * @param errorMessage    错误信息，成功路径为 null
     */
    private void updateChunkLog(String logId, String status, int chunkCount, long extractDuration,
                                long chunkDuration, long embedDuration, long persistDuration,
                                long totalDuration, String errorMessage) {
        KnowledgeDocumentChunkLogDO update = KnowledgeDocumentChunkLogDO.builder()
                .id(logId)
                .status(status)
                .chunkCount(chunkCount)
                .extractDuration(extractDuration)
                .chunkDuration(chunkDuration)
                .embedDuration(embedDuration)
                .persistDuration(persistDuration)
                .totalDuration(totalDuration)
                .errorMessage(errorMessage)
                .endTime(new Date())
                .build();
        chunkLogMapper.updateById(update);
    }

    private record ProcessModeConfig(ProcessMode processMode, String ingestionSpec, String pipelineId) {
    }

    /**
     * 使用 Pipeline 处理文档，失败直接抛异常，由 runChunkTask 统一处理错误状态
     */
    private List<EmbeddedChunk> runPipelineProcess(KnowledgeDocumentDO documentDO,
                                                   KnowledgeBaseDO kbDO,
                                                   VectorTarget target) {
        String docId = String.valueOf(documentDO.getId());
        String pipelineId = documentDO.getPipelineId();

        if (pipelineId == null) {
            throw new IllegalStateException("Pipeline模式下Pipeline ID为空：docId=" + docId);
        }

        PipelineDefinition pipelineDef = ingestionPipelineService.getDefinition(pipelineId);
        byte[] fileBytes = readFileBytes(documentDO);

        IngestionContext context = IngestionContext.builder()
                .taskId(docId)
                .pipelineId(pipelineId)
                .rawBytes(fileBytes)
                .vectorTarget(target)
                .vectorSpaceId(VectorSpaceId.builder()
                        .logicalName(kbDO.getCollectionName())
                        .build())
                .skipIndexerWrite(true)
                .build();

        IngestionContext result = ingestionEngine.execute(pipelineDef, context);

        if (result.getError() != null) {
            throw new RuntimeException("Pipeline执行失败：" + result.getError().getMessage(), result.getError());
        }

        List<EmbeddedChunk> chunks = result.getChunks();
        if (chunks == null || chunks.isEmpty()) {
            log.warn("Pipeline执行完成但未产生分块：docId={}", docId);
            return List.of();
        }

        return chunks;
    }

    public void chunkDocument(KnowledgeDocumentDO documentDO) {
        if (documentDO == null) {
            return;
        }
        runChunkTask(documentDO);
    }

    /**
     * 标记文档分块失败：在事务内把文档状态置为 FAILED，避免与并发读取产生中间态
     *
     * @param docId 文档 ID
     */
    private void markChunkFailed(String docId) {
        transactionOperations.executeWithoutResult(status -> {
            KnowledgeDocumentDO update = new KnowledgeDocumentDO();
            update.setId(docId);
            update.setStatus(DocumentStatus.FAILED.getCode());
            update.setUpdatedBy(UserContext.getUsername());
            documentMapper.updateById(update);
        });
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @LogRecord(
            success = "删除文档：{{#bizChangeName}}",
            fail = "删除文档失败：{{#_errorMsg}}",
            type = BizChangeBizType.KNOWLEDGE_DOCUMENT,
            subType = BizChangeOperationType.DELETE,
            bizNo = "{{#docId}}",
            extra = BizChangeLogContext.SNAPSHOT_EXPRESSION,
            condition = BizChangeLogContext.RECORD_CONDITION
    )
    public void delete(String docId) {
        KnowledgeDocumentDO documentDO = documentMapper.selectById(docId);
        Assert.notNull(documentDO, () -> new ClientException("文档不存在"));
        bizChangeLogContext.putName(documentDO.getDocName());
        KnowledgeDocumentDO before = BeanUtil.copyProperties(documentDO, KnowledgeDocumentDO.class);

        // 禁止在文档分块运行时删除
        if (DocumentStatus.RUNNING.getCode().equals(documentDO.getStatus())) {
            throw new ClientException("文档正在分块中，无法删除");
        }

        scheduleService.deleteByDocId(docId);
        chunkLogMapper.delete(Wrappers.lambdaQuery(KnowledgeDocumentChunkLogDO.class)
                .eq(KnowledgeDocumentChunkLogDO::getDocId, docId));

        documentDO.setDeleted(1);
        documentDO.setUpdatedBy(UserContext.getUsername());
        documentMapper.deleteById(documentDO);

        // 一次调用覆盖全部落点：关系库块与向量都在扇出里，未来加索引后端也自动跟随
        KnowledgeBaseDO kbDO = knowledgeBaseMapper.selectById(documentDO.getKbId());
        chunkIndexWriter.deleteDocument(vectorTargetResolver.resolve(kbDO), documentRef(documentDO));
        deleteStoredFileQuietly(documentDO);
        bizChangeLogContext.put(docId, before, null);
    }

    @Override
    public KnowledgeDocumentVO get(String docId) {
        KnowledgeDocumentDO documentDO = documentMapper.selectById(docId);
        Assert.notNull(documentDO, () -> new ClientException("文档不存在"));
        return toVO(documentDO);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @LogRecord(
            success = "更新文档：{{#bizChangeName}}",
            fail = "更新文档失败：{{#_errorMsg}}",
            type = BizChangeBizType.KNOWLEDGE_DOCUMENT,
            subType = BizChangeOperationType.UPDATE,
            bizNo = "{{#docId}}",
            extra = BizChangeLogContext.SNAPSHOT_EXPRESSION,
            condition = BizChangeLogContext.RECORD_CONDITION
    )
    public void update(String docId, KnowledgeDocumentUpdateRequest requestParam) {
        KnowledgeDocumentDO documentDO = documentMapper.selectById(docId);
        Assert.notNull(documentDO, () -> new ClientException("文档不存在"));
        bizChangeLogContext.putName(documentDO.getDocName());
        KnowledgeDocumentDO before = BeanUtil.copyProperties(documentDO, KnowledgeDocumentDO.class);

        // 禁止在文档分块运行时修改
        if (DocumentStatus.RUNNING.getCode().equals(documentDO.getStatus())) {
            throw new ClientException("文档正在分块中，无法修改");
        }

        String docName = requestParam == null ? null : requestParam.getDocName();
        if (!StringUtils.hasText(docName)) {
            throw new ClientException("文档名称不能为空");
        }

        LambdaUpdateWrapper<KnowledgeDocumentDO> updateWrapper = Wrappers.lambdaUpdate(KnowledgeDocumentDO.class)
                .eq(KnowledgeDocumentDO::getId, documentDO.getId())
                .set(KnowledgeDocumentDO::getDocName, docName.trim())
                .set(KnowledgeDocumentDO::getUpdatedBy, UserContext.getUsername());

        // 如果传了 processMode，校验并更新处理配置
        if (StringUtils.hasText(requestParam.getProcessMode())) {
            ProcessMode processMode = ProcessMode.normalize(requestParam.getProcessMode());
            updateWrapper.set(KnowledgeDocumentDO::getProcessMode, processMode.getValue());

            if (ProcessMode.CHUNK == processMode) {
                String spec = ingestionSpecCodec.normalize(requestParam.getIngestionSpec());
                updateWrapper.setSql("ingestion_spec = CAST({0} AS jsonb)", spec);
                updateWrapper.set(KnowledgeDocumentDO::getPipelineId, null);
            } else {
                if (!StringUtils.hasText(requestParam.getPipelineId())) {
                    throw new ClientException("使用Pipeline模式时，必须指定Pipeline ID");
                }
                try {
                    ingestionPipelineService.get(requestParam.getPipelineId());
                } catch (Exception e) {
                    throw new ClientException("指定的Pipeline不存在: " + requestParam.getPipelineId());
                }
                updateWrapper.set(KnowledgeDocumentDO::getPipelineId, requestParam.getPipelineId());
                updateWrapper.set(KnowledgeDocumentDO::getIngestionSpec, null);
            }
        }

        // 处理定时调度相关字段（仅 URL 类型文档支持）
        boolean scheduleChanged = false;
        if (SourceType.URL.getValue().equalsIgnoreCase(documentDO.getSourceType())) {
            String newSourceLocation = requestParam.getSourceLocation();
            Integer newScheduleEnabled = requestParam.getScheduleEnabled();
            String newScheduleCron = requestParam.getScheduleCron();

            if (StringUtils.hasText(newSourceLocation)) {
                updateWrapper.set(KnowledgeDocumentDO::getSourceLocation, newSourceLocation.trim());
                scheduleChanged = true;
            }
            if (newScheduleEnabled != null) {
                updateWrapper.set(KnowledgeDocumentDO::getScheduleEnabled, newScheduleEnabled);
                scheduleChanged = true;
            }
            if (StringUtils.hasText(newScheduleCron)) {
                try {
                    CronScheduleHelper.nextRunTime(newScheduleCron, new Date());
                    // 验证 cron 周期不能太短（与 upsertSchedule 保持一致）
                    if (CronScheduleHelper.isIntervalLessThan(newScheduleCron, new Date(), 60)) {
                        throw new ClientException("定时周期不能小于 60 秒");
                    }
                } catch (IllegalArgumentException e) {
                    throw new ClientException("定时表达式不合法: " + e.getMessage());
                }
                updateWrapper.set(KnowledgeDocumentDO::getScheduleCron, newScheduleCron.trim());
                scheduleChanged = true;
            }

            // 验证：启用定时拉取时必须有 cron 和 sourceLocation
            if (scheduleChanged) {
                KnowledgeDocumentDO willBe = documentMapper.selectById(docId);
                Integer finalEnabled = newScheduleEnabled != null ? newScheduleEnabled : willBe.getScheduleEnabled();
                String finalCron = StringUtils.hasText(newScheduleCron) ? newScheduleCron.trim() : willBe.getScheduleCron();
                String finalLocation = StringUtils.hasText(newSourceLocation) ? newSourceLocation.trim() : willBe.getSourceLocation();

                if (finalEnabled != null && finalEnabled == 1) {
                    if (!StringUtils.hasText(finalCron)) {
                        throw new ClientException("启用定时拉取时必须设置定时表达式");
                    }
                    if (!StringUtils.hasText(finalLocation)) {
                        throw new ClientException("启用定时拉取时必须设置来源地址");
                    }
                }
            }
        }

        documentMapper.update(updateWrapper);

        if (scheduleChanged) {
            KnowledgeDocumentDO updated = documentMapper.selectById(docId);
            scheduleService.upsertSchedule(updated);
        }
        bizChangeLogContext.put(docId, before, documentMapper.selectById(docId));
    }

    @Override
    public IPage<KnowledgeDocumentVO> page(String kbId, KnowledgeDocumentPageRequest requestParam) {
        Page<KnowledgeDocumentDO> pageParam = new Page<>(requestParam.getCurrent(), requestParam.getSize());
        LambdaQueryWrapper<KnowledgeDocumentDO> queryWrapper = Wrappers.lambdaQuery(KnowledgeDocumentDO.class)
                .eq(KnowledgeDocumentDO::getKbId, kbId)
                .eq(KnowledgeDocumentDO::getDeleted, 0)
                .like(requestParam.getKeyword() != null && !requestParam.getKeyword().isBlank(), KnowledgeDocumentDO::getDocName, requestParam.getKeyword())
                .eq(requestParam.getStatus() != null && !requestParam.getStatus().isBlank(), KnowledgeDocumentDO::getStatus, requestParam.getStatus())
                .orderByDesc(KnowledgeDocumentDO::getCreateTime);

        IPage<KnowledgeDocumentVO> result = documentMapper.selectPage(pageParam, queryWrapper)
                .convert(this::toVO);

        List<String> docIds = result.getRecords().stream()
                .map(KnowledgeDocumentVO::getId)
                .collect(Collectors.toList());
        Set<String> editedDocIds = findEditedDocIds(docIds);
        result.getRecords().forEach(vo -> vo.setChunksEdited(editedDocIds.contains(vo.getId())));

        return result;
    }

    /**
     * DO → VO：摄取配置经 codec 归一化后再出参
     * <p>
     * 库里可能留着旧构建写下的 {@code Integer.MAX_VALUE}（整篇不分块的领域内部哨兵），
     * 而线路上的约定是 {@code -1}。归一化放在出参这一层，旧行不刷库也能正确回显；
     * 列为空表示"走默认"，这个语义要留着，所以空值不在此处物化成一份显式 JSON
     */
    private KnowledgeDocumentVO toVO(KnowledgeDocumentDO documentDO) {
        KnowledgeDocumentVO vo = BeanUtil.toBean(documentDO, KnowledgeDocumentVO.class);
        if (StringUtils.hasText(documentDO.getIngestionSpec())) {
            vo.setIngestionSpec(ingestionSpecCodec.write(ingestionSpecCodec.read(documentDO.getIngestionSpec())));
        }
        return vo;
    }

    private Set<String> findEditedDocIds(List<String> docIds) {
        if (docIds == null || docIds.isEmpty()) {
            return Collections.emptySet();
        }
        QueryWrapper<KnowledgeChunkDO> wrapper = new QueryWrapper<>();
        wrapper.select("DISTINCT doc_id")
                .in("doc_id", docIds)
                .apply("update_time > create_time + INTERVAL 1 SECOND");
        return chunkMapper.selectObjs(wrapper).stream()
                .map(String::valueOf)
                .collect(Collectors.toSet());
    }

    @Override
    public List<KnowledgeDocumentSearchVO> search(String keyword, int limit) {
        if (!StringUtils.hasText(keyword)) {
            return Collections.emptyList();
        }

        int size = Math.clamp(limit, 1, 20);
        Page<KnowledgeDocumentDO> mpPage = new Page<>(1, size);
        LambdaQueryWrapper<KnowledgeDocumentDO> qw = new LambdaQueryWrapper<KnowledgeDocumentDO>()
                .eq(KnowledgeDocumentDO::getDeleted, 0)
                .like(KnowledgeDocumentDO::getDocName, keyword)
                .orderByDesc(KnowledgeDocumentDO::getUpdateTime);

        IPage<KnowledgeDocumentDO> result = documentMapper.selectPage(mpPage, qw);
        List<KnowledgeDocumentSearchVO> records = result.getRecords().stream()
                .map(each -> BeanUtil.toBean(each, KnowledgeDocumentSearchVO.class))
                .toList();
        if (records.isEmpty()) {
            return records;
        }

        Set<String> kbIds = new HashSet<>();
        for (KnowledgeDocumentSearchVO record : records) {
            if (record.getKbId() != null) {
                kbIds.add(record.getKbId());
            }
        }
        if (kbIds.isEmpty()) {
            return records;
        }

        List<KnowledgeBaseDO> bases = knowledgeBaseMapper.selectByIds(kbIds);
        Map<String, String> nameMap = new HashMap<>();
        if (bases != null) {
            for (KnowledgeBaseDO base : bases) {
                nameMap.put(base.getId(), base.getName());
            }
        }
        for (KnowledgeDocumentSearchVO record : records) {
            record.setKbName(nameMap.get(record.getKbId()));
        }
        return records;
    }

    @Override
    @LogRecord(
            success = "{{#enabled ? '启用' : '禁用'}}文档：{{#bizChangeName}}",
            fail = "修改文档启用状态失败：{{#_errorMsg}}",
            type = BizChangeBizType.KNOWLEDGE_DOCUMENT,
            subType = "{{#enabled ? 'ENABLE' : 'DISABLE'}}",
            bizNo = "{{#docId}}",
            extra = BizChangeLogContext.SNAPSHOT_EXPRESSION,
            condition = BizChangeLogContext.RECORD_CONDITION
    )
    public void enable(String docId, boolean enabled) {
        KnowledgeDocumentDO documentDO = documentMapper.selectById(docId);
        Assert.notNull(documentDO, () -> new ClientException("文档不存在"));
        bizChangeLogContext.putName(documentDO.getDocName());
        KnowledgeDocumentDO before = BeanUtil.copyProperties(documentDO, KnowledgeDocumentDO.class);

        // 禁止在文档分块运行时修改
        if (DocumentStatus.RUNNING.getCode().equals(documentDO.getStatus())) {
            throw new ClientException("文档正在分块中，无法修改");
        }

        // 如果已经是目标状态，直接返回
        int targetEnabled = enabled ? 1 : 0;
        if (documentDO.getEnabled() != null && documentDO.getEnabled() == targetEnabled) {
            bizChangeLogContext.skip();
            return;
        }

        // 提前查知识库，两个分支都需要，避免重复查询
        KnowledgeBaseDO kbDO = knowledgeBaseMapper.selectById(documentDO.getKbId());
        String collectionName = kbDO.getCollectionName();

        // 启用时：embed 耗时较长，在事务外提前执行，避免长事务占用连接
        List<EmbeddedChunk> vectorChunks = Collections.emptyList();
        if (enabled) {
            // 向量文本取库里那份，不用展示文本重新组装——否则章节路径与表格 KV 渲染会静默丢失
            vectorChunks = knowledgeChunkService.embedPersistedChunks(docId, vectorTargetResolver.resolve(kbDO));
            if (CollUtil.isEmpty(vectorChunks)) {
                log.warn("启用文档时未找到任何 Chunk，仅更新启用状态并跳过向量重建，docId={}", docId);
            }
        }

        final List<EmbeddedChunk> finalEmbeddedChunks = vectorChunks;
        transactionOperations.executeWithoutResult(status -> {
            documentDO.setEnabled(targetEnabled);
            documentDO.setUpdatedBy(UserContext.getUsername());
            documentMapper.updateById(documentDO);
            scheduleService.syncScheduleIfExists(documentDO);
            knowledgeChunkService.updateEnabledByDocId(docId, String.valueOf(kbDO.getId()), enabled);

            if (!enabled) {
                vectorStoreService.deleteDocumentVectors(collectionName, docId);
            } else if (CollUtil.isNotEmpty(finalEmbeddedChunks)) {
                vectorStoreService.indexDocumentChunks(collectionName, docId, finalEmbeddedChunks);
            }
        });
        bizChangeLogContext.put(docId, before, documentMapper.selectById(docId));
    }

    @Override
    public IPage<KnowledgeDocumentChunkLogVO> getChunkLogs(String docId, Page<KnowledgeDocumentChunkLogVO> page) {
        Page<KnowledgeDocumentChunkLogDO> mpPage = new Page<>(page.getCurrent(), page.getSize());
        LambdaQueryWrapper<KnowledgeDocumentChunkLogDO> qw = new LambdaQueryWrapper<KnowledgeDocumentChunkLogDO>()
                .eq(KnowledgeDocumentChunkLogDO::getDocId, docId)
                .orderByDesc(KnowledgeDocumentChunkLogDO::getCreateTime);

        IPage<KnowledgeDocumentChunkLogDO> result = chunkLogMapper.selectPage(mpPage, qw);

        List<KnowledgeDocumentChunkLogDO> records = result.getRecords();
        Map<String, String> pipelineNameMap = new HashMap<>();
        if (CollUtil.isNotEmpty(records)) {
            Set<String> pipelineIds = new HashSet<>();
            for (KnowledgeDocumentChunkLogDO record : records) {
                if (record.getPipelineId() != null) {
                    pipelineIds.add(record.getPipelineId());
                }
            }
            if (!pipelineIds.isEmpty()) {
                List<IngestionPipelineDO> pipelines = ingestionPipelineMapper.selectByIds(pipelineIds);
                if (CollUtil.isNotEmpty(pipelines)) {
                    for (IngestionPipelineDO pipeline : pipelines) {
                        pipelineNameMap.put(pipeline.getId(), pipeline.getName());
                    }
                }
            }
        }

        Page<KnowledgeDocumentChunkLogVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(records.stream().map(each -> {
            KnowledgeDocumentChunkLogVO vo = BeanUtil.toBean(each, KnowledgeDocumentChunkLogVO.class);
            if (each.getPipelineId() != null) {
                vo.setPipelineName(pipelineNameMap.get(each.getPipelineId()));
            }
            Long totalDuration = each.getTotalDuration();
            if (totalDuration != null) {
                long other = getOther(each, totalDuration);
                vo.setOtherDuration(Math.max(0, other));
            }
            return vo;
        }).toList());
        return voPage;
    }

    private static long getOther(KnowledgeDocumentChunkLogDO each, Long totalDuration) {
        String mode = each.getProcessMode();
        boolean pipelineMode = ProcessMode.PIPELINE.getValue().equalsIgnoreCase(mode);
        long extract = each.getExtractDuration() == null ? 0 : each.getExtractDuration();
        long chunk = each.getChunkDuration() == null ? 0 : each.getChunkDuration();
        long embed = each.getEmbedDuration() == null ? 0 : each.getEmbedDuration();
        long persist = each.getPersistDuration() == null ? 0 : each.getPersistDuration();
        return pipelineMode
                ? totalDuration - chunk - persist
                : totalDuration - extract - chunk - embed - persist;
    }

    private boolean isScheduleEnabled(SourceType sourceType, KnowledgeDocumentUploadRequest request) {
        return SourceType.URL == sourceType && Boolean.TRUE.equals(request.getScheduleEnabled());
    }

    private void validateSourceAndSchedule(SourceType sourceType, KnowledgeDocumentUploadRequest request) {
        String sourceLocation = StrUtil.trimToNull(request.getSourceLocation());
        if (SourceType.URL == sourceType && !StringUtils.hasText(sourceLocation)) {
            throw new ClientException("来源地址不能为空");
        }
        if (!isScheduleEnabled(sourceType, request)) {
            return;
        }
        String scheduleCron = StrUtil.trimToNull(request.getScheduleCron());
        if (!StringUtils.hasText(scheduleCron)) {
            throw new ClientException("定时表达式不能为空");
        }
        try {
            if (CronScheduleHelper.isIntervalLessThan(scheduleCron, new java.util.Date(), scheduleProperties.getMinIntervalSeconds())) {
                throw new ClientException("定时周期不能小于 " + scheduleProperties.getMinIntervalSeconds() + " 秒");
            }
        } catch (IllegalArgumentException e) {
            throw new ClientException("定时表达式不合法");
        }
    }

    private ProcessModeConfig resolveProcessModeConfig(KnowledgeDocumentUploadRequest request) {
        ProcessMode processMode = ProcessMode.normalize(request.getProcessMode());
        if (ProcessMode.CHUNK == processMode) {
            return new ProcessModeConfig(processMode, ingestionSpecCodec.normalize(request.getIngestionSpec()), null);
        } else {
            if (!StringUtils.hasText(request.getPipelineId())) {
                throw new ClientException("使用Pipeline模式时，必须指定Pipeline ID");
            }
            try {
                ingestionPipelineService.get(request.getPipelineId());
            } catch (Exception e) {
                throw new ClientException("指定的Pipeline不存在: " + request.getPipelineId());
            }
            return new ProcessModeConfig(processMode, null, request.getPipelineId());
        }
    }

    private StoredFileDTO resolveStoredFile(String bucketName, SourceType sourceType, String sourceLocation, MultipartFile file) {
        if (SourceType.FILE == sourceType) {
            Assert.notNull(file, () -> new ClientException("上传文件不能为空"));
            return fileStorageService.upload(bucketName, file);
        }
        return remoteFileFetcher.fetchAndStore(bucketName, sourceLocation);
    }


    @Override
    public String preview(String docId) {
        KnowledgeDocumentDO documentDO = documentMapper.selectById(docId);
        Assert.notNull(documentDO, () -> new ClientException("文档不存在"));
        if (DisplayType.from(documentDO.getFileType()) != DisplayType.MARKDOWN) {
            throw new ClientException("仅支持预览 markdown 格式文档");
        }
        try (InputStream in = fileStorageService.openStream(documentDO.getFileUrl())) {
            return new String(in.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        } catch (ClientException e) {
            throw e;
        } catch (Exception e) {
            throw new ClientException("读取文档内容失败: " + e.getMessage());
        }
    }

    private void deleteStoredFileQuietly(KnowledgeDocumentDO documentDO) {
        if (documentDO == null || !StringUtils.hasText(documentDO.getFileUrl())) {
            return;
        }
        try {
            fileStorageService.deleteByUrl(documentDO.getFileUrl());
        } catch (Exception e) {
            log.warn("删除文档存储文件失败, docId={}, fileUrl={}", documentDO.getId(), documentDO.getFileUrl(), e);
        }
    }
}
