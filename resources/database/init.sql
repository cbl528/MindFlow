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
    `file_size`        bigint        DEFAULT NULL COMMENT '文件大小（字节）',
    `process_mode`     varchar(16)   DEFAULT 'chunk' COMMENT '处理模式：chunk/pipeline',
    `status`           varchar(16)   NOT NULL DEFAULT 'pending' COMMENT '状态：pending/running/success/failed',
    `source_type`      varchar(16)   DEFAULT NULL COMMENT '来源类型：file/url',
    `source_location`  varchar(1024) DEFAULT NULL COMMENT '来源地址',
    `schedule_enabled` tinyint(1)    DEFAULT NULL COMMENT '是否启用定时刷新',
    `schedule_cron`    varchar(64)   DEFAULT NULL COMMENT '定时表达式',
    `chunk_strategy`   varchar(32)   DEFAULT NULL COMMENT '分块策略',
    `chunk_config`     json          DEFAULT NULL COMMENT '分块配置JSON',
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
    `token_count`  int         DEFAULT NULL COMMENT 'Token数',
    `enabled`      tinyint(1)  NOT NULL DEFAULT 1 COMMENT '是否启用 0：禁用 1：启用',
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
    `chunk_strategy`   varchar(16) DEFAULT NULL COMMENT '分块策略',
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
    `deleted`     tinyint(1)  NOT NULL DEFAULT 0 COMMENT '是否删除 0：正常 1：删除',
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
