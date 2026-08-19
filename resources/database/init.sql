-- ============================================================================
-- MindFlow MySQL 初始化脚本
-- 依据 RAGent 源项目 schema_pg.sql（PostgreSQL，已合并 v1.1.0 全部升级变更）转换
-- 转换要点：
--   1) 主键/外键 ID 均为雪花 ID 字符串（VARCHAR(20)），与当前代码的
--      CustomIdentifierGenerator / SnowflakeIdInitializer 一致
--   2) 向量存储使用 Milvus（本项目选型），t_knowledge_vector 表不再需要，
--      参考下方「Milvus 集合建议」
--   3) 需要 MySQL 8.0.13+（JSON 列使用表达式默认值）
--   4) update_time 使用 MySQL 的 ON UPDATE CURRENT_TIMESTAMP 自动刷新，
--      与代码侧 MetaObjectHandler 自动填充不冲突
-- 注意：切换 MySQL 后，framework 的 DataBaseConfiguration 中分页插件
--      DbType.POSTGRE_SQL 需改为 DbType.MYSQL
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `mindflow`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `mindflow`;

-- ============================================================================
-- 用户与会话表
-- ============================================================================

CREATE TABLE `t_user` (
    `id`          varchar(20)  NOT NULL COMMENT '主键ID（雪花ID）',
    `username`    varchar(64)  NOT NULL COMMENT '用户名，唯一',
    `password`    varchar(128) NOT NULL COMMENT '密码',
    `role`        varchar(32)  NOT NULL COMMENT '角色：admin/user',
    `avatar`      varchar(128) DEFAULT NULL COMMENT '用户头像',
    `create_time` datetime     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     tinyint(1)   NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

CREATE TABLE `t_conversation` (
    `id`              varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `conversation_id` varchar(20) NOT NULL COMMENT '会话ID',
    `user_id`         varchar(20) NOT NULL COMMENT '用户ID',
    `title`           varchar(128) NOT NULL COMMENT '会话名称',
    `last_time`       datetime DEFAULT NULL COMMENT '最近消息时间',
    `create_time`     datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`     datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`         tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_conversation_user` (`conversation_id`, `user_id`),
    KEY `idx_user_time` (`user_id`, `last_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话列表';

CREATE TABLE `t_conversation_summary` (
    `id`              varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `conversation_id` varchar(20) NOT NULL COMMENT '会话ID',
    `user_id`         varchar(20) NOT NULL COMMENT '用户ID',
    `last_message_id` varchar(20) NOT NULL COMMENT '摘要最后消息ID',
    `content`         text        NOT NULL COMMENT '会话摘要内容',
    `create_time`     datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`     datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`         tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    KEY `idx_conv_user` (`conversation_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话摘要表（与消息表分离存储）';

CREATE TABLE `t_message` (
    `id`                   varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `conversation_id`      varchar(20) NOT NULL COMMENT '会话ID',
    `user_id`              varchar(20) NOT NULL COMMENT '用户ID',
    `role`                 varchar(16) NOT NULL COMMENT '角色：user/assistant',
    `content`              text        NOT NULL COMMENT '消息内容',
    `thinking_content`     text        DEFAULT NULL COMMENT '深度思考内容',
    `thinking_duration`    int         DEFAULT NULL COMMENT '深度思考耗时（秒）',
    `sources`              json        DEFAULT NULL COMMENT '回答来源（文档级来源列表 JSON）',
    `recommended_questions` json       DEFAULT NULL COMMENT '推荐追问问题',
    `retrieved_chunks`     json        DEFAULT NULL COMMENT '推荐问题 grounding 片段',
    `reply_to_message_id`  varchar(20) DEFAULT NULL COMMENT '当前助手消息对应的用户消息ID',
    `message_status`       varchar(16) NOT NULL DEFAULT 'NORMAL' COMMENT '消息结束状态：NORMAL=正常完成，INTERRUPTED=用户中断，REJECTED=限流拒绝',
    `create_time`          datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`          datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`              tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    KEY `idx_conversation_user_time` (`conversation_id`, `user_id`, `create_time`),
    KEY `idx_conversation_summary` (`conversation_id`, `user_id`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话消息记录表';

CREATE TABLE `t_message_feedback` (
    `id`              varchar(20)  NOT NULL COMMENT '主键ID（雪花ID）',
    `message_id`      varchar(20)  NOT NULL COMMENT '消息ID',
    `conversation_id` varchar(20)  NOT NULL COMMENT '会话ID',
    `user_id`         varchar(20)  NOT NULL COMMENT '用户ID',
    `vote`            tinyint(1)   NOT NULL COMMENT '投票 1：赞 -1：踩',
    `reason`          varchar(255) DEFAULT NULL COMMENT '反馈原因',
    `comment`         varchar(1024) DEFAULT NULL COMMENT '反馈评论',
    `create_time`     datetime     NOT NULL COMMENT '创建时间',
    `update_time`     datetime     NOT NULL COMMENT '更新时间',
    `deleted`         tinyint(1)   NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_msg_user` (`message_id`, `user_id`),
    KEY `idx_conversation_id` (`conversation_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话消息反馈表';

CREATE TABLE `t_sample_question` (
    `id`          varchar(20)  NOT NULL COMMENT '主键ID（雪花ID）',
    `title`       varchar(64)  DEFAULT NULL COMMENT '展示标题',
    `description` varchar(255) DEFAULT NULL COMMENT '描述或提示',
    `question`    varchar(255) NOT NULL COMMENT '示例问题内容',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     tinyint(1)  NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    KEY `idx_sample_question_deleted` (`deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='示例问题表';

-- ============================================================================
-- 智能体配置表
-- ============================================================================

CREATE TABLE `t_agent_profile` (
    `id`          varchar(20)  NOT NULL COMMENT '主键ID（雪花ID）',
    `name`        varchar(128) NOT NULL COMMENT '展示名称，全局唯一',
    `description` text         DEFAULT NULL COMMENT '描述',
    `avatar`      varchar(128) DEFAULT NULL COMMENT '头像预设标识，取值由前端预设表定义',
    `builtin`     tinyint(1)   NOT NULL DEFAULT 0 COMMENT '是否内置：1-内置智能体（不可编辑删除），所有空槽位的回落终点',
    `active`      tinyint(1)   NOT NULL DEFAULT 0 COMMENT '是否激活：全局仅允许一条为1（唯一性由应用层保证）',
    `create_by`   varchar(20)  DEFAULT NULL COMMENT '创建人',
    `update_by`   varchar(20)  DEFAULT NULL COMMENT '修改人',
    `create_time` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     tinyint(1)   NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_agent_profile_name` (`name`, `deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='智能体配置表';

CREATE TABLE `t_agent_prompt` (
    `id`          varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `agent_id`    varchar(20) NOT NULL COMMENT '智能体ID（关联 t_agent_profile.id）',
    `slot_key`    varchar(32) NOT NULL COMMENT '槽位标识（AgentPromptSlot 枚举名，如 KB_ANSWER/RECOMMENDED_QUESTIONS）',
    `content`     text        DEFAULT NULL COMMENT '提示词全文，空白视为未配置并回落内置智能体',
    `create_by`   varchar(20) DEFAULT NULL COMMENT '创建人',
    `update_by`   varchar(20) DEFAULT NULL COMMENT '修改人',
    `create_time` datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     tinyint(1)  NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_agent_prompt_slot` (`agent_id`, `slot_key`, `deleted`),
    KEY `idx_agent_prompt_agent` (`agent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='智能体提示词配置表';

-- ============================================================================
-- 业务变更审计表
-- ============================================================================

CREATE TABLE `t_biz_change_log` (
    `id`              varchar(20)  NOT NULL COMMENT '主键ID（雪花ID）',
    `biz_type`        varchar(64)  NOT NULL COMMENT '业务对象类型',
    `biz_id`          varchar(64)  NOT NULL COMMENT '业务对象主键',
    `operation_type`  varchar(32)  NOT NULL COMMENT '操作类型',
    `action_desc`     varchar(512) DEFAULT NULL COMMENT '操作描述',
    `before_snapshot` json         DEFAULT NULL COMMENT '变更前快照',
    `after_snapshot`  json         DEFAULT NULL COMMENT '变更后快照',
    `change_diff`     json         DEFAULT NULL COMMENT '变更差异',
    `operator_id`     varchar(64)  DEFAULT NULL COMMENT '操作人ID',
    `operator_name`   varchar(128) DEFAULT NULL COMMENT '操作人名称',
    `operator_role`   varchar(64)  DEFAULT NULL COMMENT '操作人角色',
    `success`         tinyint(1)   NOT NULL DEFAULT 1 COMMENT '是否成功',
    `error_message`   text         DEFAULT NULL COMMENT '失败信息',
    `class_name`      varchar(255) DEFAULT NULL COMMENT '触发类名',
    `method_name`     varchar(255) DEFAULT NULL COMMENT '触发方法名',
    `ip`              varchar(64)  DEFAULT NULL COMMENT '来源IP',
    `user_agent`      varchar(512) DEFAULT NULL COMMENT 'User-Agent',
    `create_time`     datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_biz_change_log_biz` (`biz_type`, `biz_id`),
    KEY `idx_biz_change_log_time` (`create_time`),
    KEY `idx_biz_change_log_operator` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='业务数据变更审计日志表';

-- ============================================================================
-- 知识库表
-- ============================================================================

CREATE TABLE `t_knowledge_base` (
    `id`              varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `name`            varchar(128) NOT NULL COMMENT '知识库名称',
    `remark`          varchar(255) DEFAULT NULL COMMENT '备注',
    `embedding_model` varchar(64)  NOT NULL COMMENT '嵌入模型标识',
    `collection_name` varchar(64)  NOT NULL COMMENT 'Collection名称（Milvus 中对应集合）',
    `created_by`      varchar(20)  NOT NULL COMMENT '创建人',
    `updated_by`      varchar(20)  DEFAULT NULL COMMENT '修改人',
    `create_time`     datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`     datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`         tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_collection_name` (`collection_name`),
    KEY `idx_kb_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库表';

CREATE TABLE `t_knowledge_document` (
    `id`               varchar(20)   NOT NULL COMMENT '主键ID（雪花ID）',
    `kb_id`            varchar(20)   NOT NULL COMMENT '知识库ID',
    `doc_name`         varchar(256)  NOT NULL COMMENT '文档名称',
    `enabled`          tinyint(1)    NOT NULL DEFAULT 1 COMMENT '是否启用 1：启用 0：禁用',
    `chunk_count`      int           DEFAULT 0 COMMENT '分块数量',
    `file_url`         varchar(1024) NOT NULL COMMENT '文件存储路径',
    `file_type`        varchar(16)   NOT NULL COMMENT '文件类型',
    `mime_type`        varchar(128)  DEFAULT NULL COMMENT '真实MIME类型（字节探测得出，服务解析路由）',
    `file_size`        bigint        DEFAULT NULL COMMENT '文件大小（字节）',
    `process_mode`     varchar(16)   DEFAULT 'chunk' COMMENT '处理模式：chunk/pipeline',
    `status`           varchar(16)   NOT NULL DEFAULT 'pending' COMMENT '状态：pending/running/success/failed',
    `source_type`      varchar(16)   DEFAULT NULL COMMENT '来源类型：file/url',
    `source_location`  varchar(1024) DEFAULT NULL COMMENT '来源地址',
    `schedule_enabled` tinyint(1)    DEFAULT NULL COMMENT '是否启用定时刷新',
    `schedule_cron`    varchar(64)   DEFAULT NULL COMMENT '定时表达式',
    `ingestion_spec`   json          DEFAULT NULL COMMENT '文档级摄取配置JSON（解析档位+分块预算）',
    `pipeline_id`      varchar(20)   DEFAULT NULL COMMENT 'Pipeline ID',
    `created_by`       varchar(20)   NOT NULL COMMENT '创建人',
    `updated_by`       varchar(20)   DEFAULT NULL COMMENT '修改人',
    `create_time`      datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`      datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`          tinyint(1)    NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    KEY `idx_kb_id` (`kb_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库文档表';

CREATE TABLE `t_knowledge_chunk` (
    `id`           varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `kb_id`        varchar(20) NOT NULL COMMENT '知识库ID',
    `doc_id`       varchar(20) NOT NULL COMMENT '文档ID',
    `chunk_index`  int         NOT NULL COMMENT '分块序号（从0开始）',
    `content`      longtext    NOT NULL COMMENT '分块内容',
    `content_hash` varchar(64) DEFAULT NULL COMMENT '内容哈希（幂等/去重）',
    `char_count`   int         DEFAULT NULL COMMENT '字符数',
    `token_count`   int         DEFAULT NULL COMMENT 'Token数',
    `embedding_text` longtext   DEFAULT NULL COMMENT '向量文本：章节路径+正文（重建向量的唯一正确来源）',
    `enabled`       tinyint(1)  NOT NULL DEFAULT 1 COMMENT '是否启用 0：禁用 1：启用',
    `created_by`   varchar(20) NOT NULL COMMENT '创建人',
    `updated_by`   varchar(20) DEFAULT NULL COMMENT '修改人',
    `create_time`  datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`  datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`      tinyint(1)  NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    KEY `idx_doc_id` (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库文档分块表';

CREATE TABLE `t_knowledge_document_chunk_log` (
    `id`               varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `doc_id`           varchar(20) NOT NULL COMMENT '文档ID',
    `status`           varchar(16) NOT NULL COMMENT '状态',
    `process_mode`     varchar(16) DEFAULT NULL COMMENT '处理模式',
    `parse_profile`    varchar(16) DEFAULT NULL COMMENT '解析档位（fast/fidelity，仅chunk模式）',
    `pipeline_id`      varchar(20) DEFAULT NULL COMMENT 'Pipeline ID',
    `extract_duration` bigint      DEFAULT NULL COMMENT '文本提取耗时（毫秒）',
    `chunk_duration`   bigint      DEFAULT NULL COMMENT '分块耗时（毫秒）',
    `embed_duration`   bigint      DEFAULT NULL COMMENT '向量化耗时（毫秒）',
    `persist_duration` bigint      DEFAULT NULL COMMENT 'DB持久化耗时（毫秒）',
    `total_duration`   bigint      DEFAULT NULL COMMENT '总耗时（毫秒）',
    `chunk_count`      int         DEFAULT NULL COMMENT '分块数量',
    `error_message`    text        DEFAULT NULL COMMENT '错误信息',
    `start_time`       datetime    DEFAULT NULL COMMENT '开始时间',
    `end_time`         datetime    DEFAULT NULL COMMENT '结束时间',
    `create_time`      datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`      datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_doc_id_log` (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库文档分块日志表';

CREATE TABLE `t_knowledge_document_schedule` (
    `id`                varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `doc_id`            varchar(20) NOT NULL COMMENT '文档ID',
    `kb_id`             varchar(20) NOT NULL COMMENT '知识库ID',
    `cron_expr`         varchar(64) DEFAULT NULL COMMENT 'Cron表达式',
    `enabled`           tinyint(1)  DEFAULT 0 COMMENT '是否启用定时',
    `next_run_time`     datetime    DEFAULT NULL COMMENT '下次执行时间',
    `last_run_time`     datetime    DEFAULT NULL COMMENT '上次执行时间',
    `last_success_time` datetime    DEFAULT NULL COMMENT '上次成功时间',
    `last_status`       varchar(16) DEFAULT NULL COMMENT '上次状态',
    `last_error`        varchar(512) DEFAULT NULL COMMENT '上次错误',
    `last_etag`         varchar(256) DEFAULT NULL COMMENT '上次ETag',
    `last_modified`     varchar(256) DEFAULT NULL COMMENT '上次修改时间',
    `last_content_hash` varchar(128) DEFAULT NULL COMMENT '上次内容哈希',
    `lock_owner`        varchar(128) DEFAULT NULL COMMENT '锁持有者',
    `lock_until`        datetime    DEFAULT NULL COMMENT '锁过期时间',
    `create_time`       datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_doc_id` (`doc_id`),
    KEY `idx_next_run` (`next_run_time`),
    KEY `idx_lock_until` (`lock_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库文档定时刷新任务表';

CREATE TABLE `t_knowledge_document_schedule_exec` (
    `id`            varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `schedule_id`   varchar(20) NOT NULL COMMENT '调度ID',
    `doc_id`        varchar(20) NOT NULL COMMENT '文档ID',
    `kb_id`         varchar(20) NOT NULL COMMENT '知识库ID',
    `status`        varchar(16) NOT NULL COMMENT '状态',
    `message`       varchar(512) DEFAULT NULL COMMENT '消息',
    `start_time`    datetime    DEFAULT NULL COMMENT '开始时间',
    `end_time`      datetime    DEFAULT NULL COMMENT '结束时间',
    `file_name`     varchar(512) DEFAULT NULL COMMENT '文件名',
    `file_size`     bigint      DEFAULT NULL COMMENT '文件大小',
    `content_hash`  varchar(128) DEFAULT NULL COMMENT '内容哈希',
    `etag`          varchar(256) DEFAULT NULL COMMENT 'ETag',
    `last_modified` varchar(256) DEFAULT NULL COMMENT '最后修改时间',
    `create_time`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_schedule_time` (`schedule_id`, `start_time`),
    KEY `idx_doc_id_exec` (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识库文档定时刷新执行记录';

-- ============================================================================
-- RAG 意图与查询表
-- ============================================================================

CREATE TABLE `t_intent_node` (
    `id`                    varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `kb_id`                 varchar(20) DEFAULT NULL COMMENT '知识库ID',
    `intent_code`           varchar(64) NOT NULL COMMENT '业务唯一标识',
    `name`                  varchar(64) NOT NULL COMMENT '展示名称',
    `level`                 tinyint(4)  NOT NULL COMMENT '层级 0：DOMAIN 1：CATEGORY 2：TOPIC',
    `parent_code`           varchar(64) DEFAULT NULL COMMENT '父节点标识',
    `description`           varchar(512) DEFAULT NULL COMMENT '语义描述',
    `examples`              text        DEFAULT NULL COMMENT '示例问题',
    `collection_name`       varchar(128) DEFAULT NULL COMMENT '兼容旧版本，后续删除',
    `collection_names`      json        NOT NULL DEFAULT ('[]') COMMENT '知识库Collection集合',
    `top_k`                 int         DEFAULT NULL COMMENT '知识库检索TopK',
    `mcp_tool_id`           varchar(128) DEFAULT NULL COMMENT 'MCP工具ID',
    `kind`                  tinyint(1)  NOT NULL DEFAULT 0 COMMENT '类型 0：RAG知识库类 1：SYSTEM系统交互类',
    `prompt_snippet`        text        DEFAULT NULL COMMENT '提示词片段',
    `prompt_template`       text        DEFAULT NULL COMMENT '提示词模板',
    `param_prompt_template` text        DEFAULT NULL COMMENT '参数提取提示词模板（MCP模式专属）',
    `sort_order`            int         NOT NULL DEFAULT 0 COMMENT '排序字段',
    `enabled`               tinyint(1)  NOT NULL DEFAULT 1 COMMENT '是否启用 1：启用 0：禁用',
    `create_by`             varchar(20) DEFAULT NULL COMMENT '创建人',
    `update_by`             varchar(20) DEFAULT NULL COMMENT '修改人',
    `create_time`           datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`           datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    `deleted`               tinyint(1)  NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='意图树节点配置表';

CREATE TABLE `t_query_term_mapping` (
    `id`          varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `domain`      varchar(64) DEFAULT NULL COMMENT '领域',
    `source_term` varchar(128) NOT NULL COMMENT '源词',
    `target_term` varchar(128) NOT NULL COMMENT '目标词',
    `match_type`  tinyint(4)  NOT NULL DEFAULT 1 COMMENT '匹配类型 1：精确 2：模糊',
    `priority`    int         NOT NULL DEFAULT 100 COMMENT '优先级',
    `enabled`     tinyint(1)  NOT NULL DEFAULT 1 COMMENT '是否启用',
    `remark`      varchar(255) DEFAULT NULL COMMENT '备注',
    `create_by`   varchar(20) DEFAULT NULL COMMENT '创建人',
    `update_by`   varchar(20) DEFAULT NULL COMMENT '修改人',
    `create_time` datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    PRIMARY KEY (`id`),
    KEY `idx_domain` (`domain`),
    KEY `idx_source` (`source_term`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关键词归一化映射表';

CREATE TABLE `t_rag_trace_run` (
    `id`              varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `trace_id`        varchar(64) NOT NULL COMMENT '全局链路ID',
    `trace_name`      varchar(128) DEFAULT NULL COMMENT '链路名称',
    `entry_method`    varchar(256) DEFAULT NULL COMMENT '入口方法',
    `conversation_id` varchar(20) DEFAULT NULL COMMENT '会话ID',
    `task_id`         varchar(20) DEFAULT NULL COMMENT '任务ID',
    `user_id`         varchar(20) DEFAULT NULL COMMENT '用户ID',
    `status`          varchar(16) NOT NULL DEFAULT 'RUNNING' COMMENT 'RUNNING/SUCCESS/ERROR',
    `error_message`   varchar(1000) DEFAULT NULL COMMENT '错误信息',
    `start_time`      datetime(3) DEFAULT NULL COMMENT '开始时间',
    `end_time`        datetime(3) DEFAULT NULL COMMENT '结束时间',
    `duration_ms`     bigint DEFAULT NULL COMMENT '耗时毫秒',
    `extra_data`      text DEFAULT NULL COMMENT '扩展字段(JSON)',
    `create_time`     datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`     datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`         tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_run_id` (`trace_id`),
    KEY `idx_task_id` (`task_id`),
    KEY `idx_user_id_trace` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Trace 运行记录表';

CREATE TABLE `t_rag_trace_node` (
    `id`             varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `trace_id`       varchar(20) NOT NULL COMMENT '所属链路ID',
    `node_id`        varchar(20) NOT NULL COMMENT '节点ID',
    `parent_node_id` varchar(20) DEFAULT NULL COMMENT '父节点ID',
    `depth`          int         DEFAULT 0 COMMENT '节点深度',
    `node_type`      varchar(16) DEFAULT NULL COMMENT '节点类型',
    `node_name`      varchar(128) DEFAULT NULL COMMENT '节点名称',
    `class_name`     varchar(256) DEFAULT NULL COMMENT '类名',
    `method_name`    varchar(128) DEFAULT NULL COMMENT '方法名',
    `status`         varchar(16) NOT NULL DEFAULT 'RUNNING' COMMENT 'RUNNING/SUCCESS/ERROR',
    `error_message`  varchar(1000) DEFAULT NULL COMMENT '错误信息',
    `start_time`     datetime(3) DEFAULT NULL COMMENT '开始时间',
    `end_time`       datetime(3) DEFAULT NULL COMMENT '结束时间',
    `duration_ms`    bigint DEFAULT NULL COMMENT '耗时毫秒',
    `extra_data`     text DEFAULT NULL COMMENT '扩展字段(JSON)',
    `create_time`    datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`    datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`        tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_run_node` (`trace_id`, `node_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Trace 节点记录表';

-- ============================================================================
-- 摄入流水线表
-- ============================================================================

CREATE TABLE `t_ingestion_pipeline` (
    `id`          varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `name`        varchar(100) NOT NULL COMMENT '流水线名称',
    `description` text DEFAULT NULL COMMENT '流水线描述',
    `created_by`  varchar(20) NOT NULL DEFAULT '' COMMENT '创建人',
    `updated_by`  varchar(20) NOT NULL DEFAULT '' COMMENT '更新人',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`     tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ingestion_pipeline_name` (`name`, `deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='摄取流水线表';

CREATE TABLE `t_ingestion_pipeline_node` (
    `id`             varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `pipeline_id`    varchar(20) NOT NULL COMMENT '流水线ID',
    `node_id`        varchar(20) NOT NULL COMMENT '节点标识（同一流水线内唯一）',
    `node_type`      varchar(16) NOT NULL COMMENT '节点类型',
    `next_node_id`   varchar(20) DEFAULT NULL COMMENT '下一个节点ID',
    `settings_json`  json DEFAULT NULL COMMENT '节点配置JSON',
    `condition_json` json DEFAULT NULL COMMENT '条件JSON',
    `created_by`     varchar(20) NOT NULL DEFAULT '' COMMENT '创建人',
    `updated_by`     varchar(20) NOT NULL DEFAULT '' COMMENT '更新人',
    `create_time`    datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`    datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`        tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_ingestion_pipeline_node` (`pipeline_id`, `node_id`, `deleted`),
    KEY `idx_ingestion_pipeline_node_pipeline` (`pipeline_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='摄取流水线节点表';

CREATE TABLE `t_ingestion_task` (
    `id`               varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `pipeline_id`      varchar(20) NOT NULL COMMENT '流水线ID',
    `source_type`      varchar(20) NOT NULL COMMENT '来源类型',
    `source_location`  text DEFAULT NULL COMMENT '来源地址或URL',
    `source_file_name` varchar(255) DEFAULT NULL COMMENT '原始文件名',
    `status`           varchar(16) NOT NULL COMMENT '任务状态',
    `chunk_count`      int DEFAULT 0 COMMENT '分块数量',
    `error_message`    text DEFAULT NULL COMMENT '错误信息',
    `logs_json`        json DEFAULT NULL COMMENT '节点日志JSON',
    `metadata_json`    json DEFAULT NULL COMMENT '扩展元数据JSON',
    `started_at`       datetime DEFAULT NULL COMMENT '开始时间',
    `completed_at`     datetime DEFAULT NULL COMMENT '完成时间',
    `created_by`       varchar(20) NOT NULL DEFAULT '' COMMENT '创建人',
    `updated_by`       varchar(20) NOT NULL DEFAULT '' COMMENT '更新人',
    `create_time`      datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`      datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`          tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    KEY `idx_ingestion_task_pipeline` (`pipeline_id`),
    KEY `idx_ingestion_task_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='摄取任务表';

CREATE TABLE `t_ingestion_task_node` (
    `id`            varchar(20) NOT NULL COMMENT '主键ID（雪花ID）',
    `task_id`       varchar(20) NOT NULL COMMENT '任务ID',
    `pipeline_id`   varchar(20) NOT NULL COMMENT '流水线ID',
    `node_id`       varchar(20) NOT NULL COMMENT '节点标识',
    `node_type`     varchar(16) NOT NULL COMMENT '节点类型',
    `node_order`    int         NOT NULL DEFAULT 0 COMMENT '节点顺序',
    `status`        varchar(16) NOT NULL COMMENT '节点状态',
    `duration_ms`   bigint      NOT NULL DEFAULT 0 COMMENT '执行耗时（毫秒）',
    `message`       text DEFAULT NULL COMMENT '节点消息',
    `error_message` text DEFAULT NULL COMMENT '错误信息',
    `output_json`   longtext DEFAULT NULL COMMENT '节点输出JSON（全量）',
    `create_time`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted`       tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
    PRIMARY KEY (`id`),
    KEY `idx_ingestion_task_node_task` (`task_id`),
    KEY `idx_ingestion_task_node_pipeline` (`pipeline_id`),
    KEY `idx_ingestion_task_node_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='摄取任务节点表';

-- ============================================================================
-- 向量存储说明（MySQL 无法存储向量，向量统一放 Milvus）
-- ============================================================================
-- 源项目 t_knowledge_vector 表用于 pgvector 模式（PostgreSQL vector 扩展），
-- 本项目选型 MySQL + Milvus，故不在 MySQL 建此表。分块内容/元数据已落在
-- t_knowledge_chunk，向量写入 Milvus 集合。
--
-- 建议的 Milvus 集合字段（collection_name 与 t_knowledge_base.collection_name 对应）：
--   pk          VARCHAR(64)  主键 = chunk_id
--   doc_id      VARCHAR(20)  标量字段，用于按文档过滤/删除
--   kb_id       VARCHAR(20)  标量字段，用于按知识库过滤
--   block_type  VARCHAR(20)  标量字段（PARAGRAPH/LIST/TABLE/IMAGE/CODE）
--   metadata    JSON         标量字段（outlinePath/sectionContext 等检索元数据）
--   embedding   FLOAT_VECTOR(1536)  向量字段
-- 建集合时创建索引：METRIC_TYPE=COSINE, INDEX_TYPE=HNSW

-- ============================================================================
-- 初始数据
-- ============================================================================

INSERT INTO `t_user` (`id`, `username`, `password`, `role`, `avatar`, `create_time`, `update_time`, `deleted`)
VALUES ('2001523723396308993', 'admin', 'admin', 'admin',
        'https://static.deepseek.com/user-avatar/G_6cuD8GbD53VwGRwisvCsZ6',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

INSERT INTO `t_intent_node`
(`id`, `intent_code`, `name`, `level`, `parent_code`, `description`, `examples`,
 `collection_names`, `top_k`, `mcp_tool_id`, `kind`, `prompt_template`,
 `param_prompt_template`, `sort_order`, `enabled`, `create_by`, `update_by`, `deleted`)
VALUES
    ('group',          'group',          '集团管理',   0, NULL,        NULL, NULL,                    '[]', NULL, NULL, 0, NULL, NULL, 0, 1, 'admin', 'admin', 0),
    ('group-hr',       'group-hr',       '人事',       1, 'group',     '招聘、入职、转正、考勤、请假、薪资、绩效、离职等人事管理制度问题', '["请假流程是怎样的？","试用期多久转正？","迟到会有什么处罚？","年假有几天？","绩效工资怎么算？","离职需要提前多久申请？"]', '["grp_hr"]', 5, NULL, 0, NULL, NULL, 1, 1, 'admin', 'admin', 0),
    ('group-finance',  'group-finance',  '财务',       1, 'group',     '报销、发票、付款、预算、成本中心等财务制度问题', '["差旅报销需要哪些资料？","发票抬头有哪些？","报销多久能到账？","采购付款流程是怎样的？"]', '["grp_finance"]', 5, NULL, 0, NULL, NULL, 2, 1, 'admin', 'admin', 0),
    ('group-admin',    'group-admin',    '行政后勤',   1, 'group',     '办公用品申领、会议室预订、访客接待、公务用车、物业报修等行政后勤问题', '["怎么预订会议室？","办公用品在哪里领？","访客进入园区怎么登记？","办公室报修找谁？"]', '["grp_admin"]', 5, NULL, 0, NULL, NULL, 3, 1, 'admin', 'admin', 0),
    ('group-security', 'group-security', '信息安全合规', 1, 'group',    '账号密码规范、数据分级与外发审批、钓鱼邮件、安全事件上报、合规审计等信息安全问题', '["数据外发需要审批吗？","强密码要求是什么？","收到钓鱼邮件怎么办？","发现安全事件上报给谁？"]', '["grp_security"]', 5, NULL, 0, NULL, NULL, 4, 1, 'admin', 'admin', 0),
    ('it',             'it',             '技术支持',   0, NULL,        NULL, NULL,                    '[]', NULL, NULL, 0, NULL, NULL, 5, 1, 'admin', 'admin', 0),
    ('it-office',      'it-office',      '账号与办公软件', 1, 'it',     '企业账号开通与密码重置、企业邮箱、Office 等办公软件的安装与使用问题', '["邮箱密码忘了怎么重置？","怎么申请安装专业软件？","企业微信登不上怎么办？"]', '["it_support"]', 5, NULL, 0, NULL, NULL, 6, 1, 'admin', 'admin', 0),
    ('it-network',     'it-network',     '网络与VPN',  1, 'it',         '公司 WiFi、有线网络、VPN 连接、远程办公访问内网等网络问题', '["公司 VPN 连不上怎么办？","出差怎么访问内网？","办公室 WiFi 密码是多少？"]', '["it_support"]', 5, NULL, 0, NULL, NULL, 7, 1, 'admin', 'admin', 0),
    ('it-hardware',    'it-hardware',    '硬件与设备', 1, 'it',         '办公电脑、打印机、会议设备等硬件设备的领取、驱动安装与故障报修问题', '["打印机怎么连接？","新员工电脑怎么领取？","视频会议设备故障找谁？"]', '["it_support"]', 5, NULL, 0, NULL, NULL, 8, 1, 'admin', 'admin', 0),
    ('biz',            'biz',            '业务系统',   0, NULL,        NULL, NULL,                    '[]', NULL, NULL, 0, NULL, NULL, 9, 1, 'admin', 'admin', 0),
    ('biz-oa',         'biz-oa',         'OA系统',     1, 'biz',        'OA 办公协同平台，包含流程审批、待办、公告、文档中心等模块', NULL, '[]', NULL, NULL, 0, NULL, NULL, 10, 1, 'admin', 'admin', 0),
    ('biz-oa-intro',   'biz-oa-intro',   '系统介绍',   2, 'biz-oa',     'OA 系统整体功能说明、主要模块、典型使用场景', '["OA 系统是做什么的？","OA 系统有哪些模块？"]', '["sys_oa"]', 5, NULL, 0, NULL, NULL, 11, 1, 'admin', 'admin', 0),
    ('biz-oa-usage',   'biz-oa-usage',   '使用与审批', 2, 'biz-oa',     'OA 系统中审批流程的发起与处理、待办、公告、文档中心等具体操作问题', '["请假审批在 OA 哪里提交？","待办审批怎么转给别人？","公告在哪里查看？"]', '["sys_oa"]', 5, NULL, 0, NULL, NULL, 12, 1, 'admin', 'admin', 0),
    ('biz-crm',        'biz-crm',        'CRM销售系统', 1, 'biz',       'CRM 客户与销售管理平台，包含客户、商机、订单、报表等模块', NULL, '[]', NULL, NULL, 0, NULL, NULL, 13, 1, 'admin', 'admin', 0),
    ('biz-crm-intro',  'biz-crm-intro',  '功能介绍',   2, 'biz-crm',    'CRM 系统的功能模块、客户管理、商机与订单管理等功能介绍', '["CRM 系统支持哪些功能？","怎么在 CRM 里创建客户档案？","商机分哪几个阶段？"]', '["sys_crm"]', 5, NULL, 0, NULL, NULL, 14, 1, 'admin', 'admin', 0),
    ('biz-crm-security', 'biz-crm-security', '数据与权限', 2, 'biz-crm', 'CRM 数据可见范围、客户归属变更、数据导出审批与保密要求', '["CRM 里销售能看到哪些客户？","客户数据可以导出吗？","客户归属怎么变更？"]', '["sys_crm"]', 5, NULL, 0, NULL, NULL, 15, 1, 'admin', 'admin', 0),
    ('sales',          'sales',          '实时数据',   0, NULL,        NULL, NULL,                    '[]', NULL, NULL, 2, NULL, NULL, 16, 1, 'admin', 'admin', 0),
    ('sales-data',     'sales-data',     '销售数据统计', 1, 'sales',    '销售总额、销售量、销售占比、销售趋势、销售预测等实时统计数据', '["销售总额是多少？","本月各区域销量排名？","明年的销售预测是多少？"]', '[]', NULL, 'sales_query', 2, 'Hello，你是专业的企业智能数据助手。系统已调用内部工具获取到了最新的【动态数据】（通常为 JSON 格式）。你的任务是将这些结构化数据转化为**商业化、易读的自然语言**回复。

【核心处理规则】
1. **直接回答**：开门见山地回答用户问题，不要使用"根据数据/JSON显示"这类废话作为开头。
2. **去技术化**：将字段名转换为业务术语（例如将 `create_time` 转述为"创建时间"，`status: 1` 转述为"状态正常"）。除非用户明确询问，否则隐藏内部 ID（如 UUID）、数据库主键或复杂的错误堆栈信息。
3. **格式化输出（重要）**：多条数据用 Markdown 表格展示，表头应为中文；单条数据用分点或自然段落；金额、日期、状态等关键信息加粗。

【异常与边界处理】
1. **数据为空**：如果【动态数据】为 `[]`、`{}` 或 `null`，请直接回答"当前未查询到相关数据记录"。
2. **报错数据**：如果数据中明显包含 `error`、`code: 500` 或"查询失败"等信息，请用抱歉的口吻告知用户系统暂时无法获取数据，并简述原因（如有）。
3. **多意图部分匹配**：先回答能回答的部分，再说明无法回答的部分。
4. **完全不匹配**：仅当【动态数据】与【用户问题】的所有子问题都完全无关时，才回答"当前查询到的数据与您的问题不匹配，无法回答。"

【禁止事项】
- 严禁根据数据内容臆造不存在的结论。
- 严禁透漏你正在解析 JSON 数据的过程。

{{INTENT_RULES}}

【动态数据】
%s

【用户问题】
%s', 'Hello，你是一个高度专业且严谨的【工具参数提取器】。

你的唯一任务是：严格按照提供的【工具定义】（Tool Definition）和【参数列表】（Parameters）的约束，从【用户问题】（User Query）中提取所有必要的参数，并以 JSON 格式输出。

---

### 核心提取逻辑

1. **数据源限定**：只使用【用户问题】中的信息作为提取来源。
2. **参数范围限定**：只提取 <parameters> 标签内定义的参数，**禁止**添加任何工具定义中不存在的额外字段。
3. **必填参数处理（Strict Mode）**：如果参数是 **"required": true** 且在用户问题中无法找到明确值，有默认值则使用默认值，没有则输出为 **null**。
4. **非必填参数处理**：如果参数是 **"required": false** 且在用户问题中无法找到明确值，有默认值则使用默认值，没有则**忽略该参数，不要包含在最终 JSON 中**。

### 通用数据类型处理规则

1. **枚举/可选值（Enum）**：将用户口语化、同义或模糊的表达，映射到工具定义中提供的 **enum** 列表中的**最接近的规范值**。示例：用户说"本周"或"这星期"，枚举值有 "current_week" → 输出 "current_week"。
2. **日期/时间（Date/Time）**：相对时间（"今天"、"昨天"、"上个月"、"今年 Q3"）映射为工具所需的**规范化格式**或**枚举值**；如需要 `start_date` 和 `end_date` 范围，从一个表述中提取两个边界值。
3. **字符串（String）**：原样提取用户问题中提及的实体名称、人名、地名、产品 ID 等，不做转换或缩写。
4. **数值（Number/Integer）**：将中文数字（"三"、"前五"）转换为阿拉伯数字（3, 5）；如问题包含"top 10"或"前五名"，提取 `10` 或 `5`。
5. **布尔值（Boolean）**：肯定（"是"、"要"、"开启"）映射为 `true`；否定（"否"、"不"、"关闭"）映射为 `false`。

---

### 输入数据与输出格式

请勿在输出 JSON 对象之外添加任何解释、注释或其他文本。

#### 【工具定义】
<tool_definition>
%s
</tool_definition>

#### 【用户问题】
<user_query>
%s
</user_query>

#### 【输出格式（JSON Object Only）】

{"param_name_1": value_1, "param_name_2": value_2, ...}', 17, 1, 'admin', 'admin', 0),
    ('sys',            'sys',            '系统交互',   0, NULL,        NULL, NULL,                    '[]', NULL, NULL, 1, NULL, NULL, 18, 1, 'admin', 'admin', 0),
    ('sys-welcome',    'sys-welcome',    '欢迎与问候', 1, 'sys',        '用户与助手打招呼，如：你好、早上好、hi、在吗 等', '["你好","hello","早上好","在吗","嗨"]', '[]', NULL, NULL, 1, NULL, NULL, 19, 1, 'admin', 'admin', 0),
    ('sys-about-bot',  'sys-about-bot',  '关于助手',   1, 'sys',        '询问助手是做什么的、是谁、能做什么等', '["你是谁","你是做什么的","你能帮我做什么","你是什么AI"]', '[]', NULL, NULL, 1, NULL, NULL, 20, 1, 'admin', 'admin', 0);
