/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.caobolun.business.rag.core.intent;

import com.caobolun.business.rag.enums.IntentKind;

import java.util.ArrayList;
import java.util.List;

import static com.caobolun.business.rag.enums.IntentLevel.CATEGORY;
import static com.caobolun.business.rag.enums.IntentLevel.DOMAIN;
import static com.caobolun.business.rag.enums.IntentLevel.TOPIC;

/**
 * 构造意图识别树
 * <p>
 * 设计原则：意图树是"问法路由目录"，不是组织架构图。
 * 只有叶子节点参与意图打分并挂载检索目标（Milvus Collection）。
 * 叶子粒度可以细于 Collection 粒度（多个叶子共享同一 Collection，仅用于提升路由精度）。
 */
public class IntentTreeFactory {

    // ===================== Collection 常量（需与 t_knowledge_base.collection_name 一致）====================
    private static final String COLLECTION_HR = "grp_hr";
    private static final String COLLECTION_FINANCE = "grp_finance";
    private static final String COLLECTION_ADMIN = "grp_admin";
    private static final String COLLECTION_SECURITY = "grp_security";
    private static final String COLLECTION_IT = "it_support";
    private static final String COLLECTION_OA = "sys_oa";
    private static final String COLLECTION_CRM = "sys_crm";

    public static List<IntentNode> buildIntentTree() {
        List<IntentNode> roots = new ArrayList<>();

        // ========== 1. 集团管理（跨系统的领域问题） ==========
        IntentNode group = IntentNode.builder()
                .id("group")
                .name("集团管理")
                .level(DOMAIN)
                .kind(IntentKind.KB)
                .build();

        IntentNode hr = IntentNode.builder()
                .id("group-hr")
                .name("人事")
                .level(CATEGORY)
                .parentId(group.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_HR))
                .topK(5)
                .description("招聘、入职、转正、考勤、请假、薪资、绩效、离职等人事管理制度问题")
                .examples(List.of(
                        "请假流程是怎样的？",
                        "试用期多久转正？",
                        "迟到会有什么处罚？",
                        "年假有几天？",
                        "绩效工资怎么算？",
                        "离职需要提前多久申请？"
                ))
                .build();

        IntentNode finance = IntentNode.builder()
                .id("group-finance")
                .name("财务")
                .level(CATEGORY)
                .parentId(group.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_FINANCE))
                .topK(5)
                .description("报销、发票、付款、预算、成本中心等财务制度问题")
                .examples(List.of(
                        "差旅报销需要哪些资料？",
                        "发票抬头有哪些？",
                        "报销多久能到账？",
                        "采购付款流程是怎样的？"
                ))
                .build();

        IntentNode admin = IntentNode.builder()
                .id("group-admin")
                .name("行政后勤")
                .level(CATEGORY)
                .parentId(group.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_ADMIN))
                .topK(5)
                .description("办公用品申领、会议室预订、访客接待、公务用车、物业报修等行政后勤问题")
                .examples(List.of(
                        "怎么预订会议室？",
                        "办公用品在哪里领？",
                        "访客进入园区怎么登记？",
                        "办公室报修找谁？"
                ))
                .build();

        IntentNode security = IntentNode.builder()
                .id("group-security")
                .name("信息安全合规")
                .level(CATEGORY)
                .parentId(group.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_SECURITY))
                .topK(5)
                .description("账号密码规范、数据分级与外发审批、钓鱼邮件、安全事件上报、合规审计等信息安全问题")
                .examples(List.of(
                        "数据外发需要审批吗？",
                        "强密码要求是什么？",
                        "收到钓鱼邮件怎么办？",
                        "发现安全事件上报给谁？"
                ))
                .build();

        group.setChildren(List.of(hr, finance, admin, security));
        roots.add(group);

        // ========== 2. 技术支持（IT 主题问题，三个叶子共享同一 Collection） ==========
        IntentNode it = IntentNode.builder()
                .id("it")
                .name("技术支持")
                .level(DOMAIN)
                .kind(IntentKind.KB)
                .build();

        IntentNode itOffice = IntentNode.builder()
                .id("it-office")
                .name("账号与办公软件")
                .level(CATEGORY)
                .parentId(it.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_IT))
                .topK(5)
                .description("企业账号开通与密码重置、企业邮箱、Office 等办公软件的安装与使用问题")
                .examples(List.of(
                        "邮箱密码忘了怎么重置？",
                        "怎么申请安装专业软件？",
                        "企业微信登不上怎么办？"
                ))
                .build();

        IntentNode itNetwork = IntentNode.builder()
                .id("it-network")
                .name("网络与VPN")
                .level(CATEGORY)
                .parentId(it.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_IT))
                .topK(5)
                .description("公司 WiFi、有线网络、VPN 连接、远程办公访问内网等网络问题")
                .examples(List.of(
                        "公司 VPN 连不上怎么办？",
                        "出差怎么访问内网？",
                        "办公室 WiFi 密码是多少？"
                ))
                .build();

        IntentNode itHardware = IntentNode.builder()
                .id("it-hardware")
                .name("硬件与设备")
                .level(CATEGORY)
                .parentId(it.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_IT))
                .topK(5)
                .description("办公电脑、打印机、会议设备等硬件设备的领取、驱动安装与故障报修问题")
                .examples(List.of(
                        "打印机怎么连接？",
                        "新员工电脑怎么领取？",
                        "视频会议设备故障找谁？"
                ))
                .build();

        it.setChildren(List.of(itOffice, itNetwork, itHardware));
        roots.add(it);

        // ========== 3. 业务系统（用户会点名系统的实体问题） ==========
        IntentNode biz = IntentNode.builder()
                .id("biz")
                .name("业务系统")
                .level(DOMAIN)
                .kind(IntentKind.KB)
                .build();

        // OA 系统
        IntentNode oa = IntentNode.builder()
                .id("biz-oa")
                .name("OA系统")
                .level(CATEGORY)
                .parentId(biz.getId())
                .kind(IntentKind.KB)
                .description("OA 办公协同平台，包含流程审批、待办、公告、文档中心等模块")
                .build();

        IntentNode oaIntro = IntentNode.builder()
                .id("biz-oa-intro")
                .name("系统介绍")
                .level(TOPIC)
                .parentId(oa.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_OA))
                .topK(5)
                .description("OA 系统整体功能说明、主要模块、典型使用场景")
                .examples(List.of(
                        "OA 系统是做什么的？",
                        "OA 系统有哪些模块？"
                ))
                .build();

        IntentNode oaUsage = IntentNode.builder()
                .id("biz-oa-usage")
                .name("使用与审批")
                .level(TOPIC)
                .parentId(oa.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_OA))
                .topK(5)
                .description("OA 系统中审批流程的发起与处理、待办、公告、文档中心等具体操作问题")
                .examples(List.of(
                        "请假审批在 OA 哪里提交？",
                        "待办审批怎么转给别人？",
                        "公告在哪里查看？"
                ))
                .build();

        oa.setChildren(List.of(oaIntro, oaUsage));

        // CRM 销售系统
        IntentNode crm = IntentNode.builder()
                .id("biz-crm")
                .name("CRM销售系统")
                .level(CATEGORY)
                .parentId(biz.getId())
                .kind(IntentKind.KB)
                .description("CRM 客户与销售管理平台，包含客户、商机、订单、报表等模块")
                .build();

        IntentNode crmIntro = IntentNode.builder()
                .id("biz-crm-intro")
                .name("功能介绍")
                .level(TOPIC)
                .parentId(crm.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_CRM))
                .topK(5)
                .description("CRM 系统的功能模块、客户管理、商机与订单管理等功能介绍")
                .examples(List.of(
                        "CRM 系统支持哪些功能？",
                        "怎么在 CRM 里创建客户档案？",
                        "商机分哪几个阶段？"
                ))
                .build();

        IntentNode crmSecurity = IntentNode.builder()
                .id("biz-crm-security")
                .name("数据与权限")
                .level(TOPIC)
                .parentId(crm.getId())
                .kind(IntentKind.KB)
                .collectionNames(List.of(COLLECTION_CRM))
                .topK(5)
                .description("CRM 数据可见范围、客户归属变更、数据导出审批与保密要求")
                .examples(List.of(
                        "CRM 里销售能看到哪些客户？",
                        "客户数据可以导出吗？",
                        "客户归属怎么变更？"
                ))
                .build();

        crm.setChildren(List.of(crmIntro, crmSecurity));

        biz.setChildren(List.of(oa, crm));
        roots.add(biz);

        // ========== 4. MCP 实时数据意图查询 ==========
        IntentNode sales = IntentNode.builder()
                .id("sales")
                .name("实时数据")
                .level(DOMAIN)
                .kind(IntentKind.MCP)
                .build();

        IntentNode salesData = IntentNode.builder()
                .id("sales-data")
                .name("销售数据统计")
                .level(CATEGORY)
                .parentId(sales.getId())
                .mcpToolId("sales_query")
                .kind(IntentKind.MCP)
                .promptTemplate(MCP_SALES_DATA_PROMPT_TEMPLATE)
                .paramPromptTemplate(MCP_SALES_DATA_PARAMETER_EXTRACT_PROMPT)
                .description("销售总额、销售量、销售占比、销售趋势、销售预测等实时统计数据")
                .examples(List.of(
                        "销售总额是多少？",
                        "本月各区域销量排名？",
                        "明年的销售预测是多少？"
                ))
                .build();

        sales.setChildren(List.of(salesData));
        roots.add(sales);

        // ========== 5. 系统交互 / 助手说明 ==========
        IntentNode sys = IntentNode.builder()
                .id("sys")
                .name("系统交互")
                .level(DOMAIN)
                .kind(IntentKind.SYSTEM)
                .build();

        IntentNode welcome = IntentNode.builder()
                .id("sys-welcome")
                .name("欢迎与问候")
                .level(CATEGORY)
                .parentId(sys.getId())
                .description("用户与助手打招呼，如：你好、早上好、hi、在吗 等")
                .examples(List.of(
                        "你好",
                        "hello",
                        "早上好",
                        "在吗",
                        "嗨"
                ))
                .kind(IntentKind.SYSTEM)
                .build();

        IntentNode aboutBot = IntentNode.builder()
                .id("sys-about-bot")
                .name("关于助手")
                .level(CATEGORY)
                .parentId(sys.getId())
                .description("询问助手是做什么的、是谁、能做什么等")
                .examples(List.of(
                        "你是谁",
                        "你是做什么的",
                        "你能帮我做什么",
                        "你是什么AI"
                ))
                .kind(IntentKind.SYSTEM)
                .build();

        sys.setChildren(List.of(welcome, aboutBot));
        roots.add(sys);

        // 填充 fullPath
        fillFullPath(roots, null);
        return roots;
    }

    private static void fillFullPath(List<IntentNode> nodes, IntentNode parent) {
        for (IntentNode node : nodes) {
            if (parent == null) {
                node.setFullPath(node.getName());
            } else {
                node.setFullPath(parent.getFullPath() + " > " + node.getName());
            }
            if (node.getChildren() != null && !node.getChildren().isEmpty()) {
                fillFullPath(node.getChildren(), node);
            }
        }
    }

    // =====================常量方法====================

    public static final String MCP_SALES_DATA_PARAMETER_EXTRACT_PROMPT = """
            Hello，你是一个高度专业且严谨的【工具参数提取器】。

            你的唯一任务是：严格按照提供的【工具定义】（Tool Definition）和【参数列表】（Parameters）的约束，从【用户问题】（User Query）中提取所有必要的参数，并以 JSON 格式输出。

            ---

            ### 核心提取逻辑

            1. **数据源限定**：只使用【用户问题】中的信息作为提取来源。
            2. **参数范围限定**：只提取 <parameters> 标签内定义的参数，**禁止**添加任何工具定义中不存在的额外字段。
            3. **必填参数处理（Strict Mode）**：
               - 如果参数是 **"required": true** 且在用户问题中无法找到明确值：
                 - 如果工具定义中提供了 **"default"** 值，请使用该默认值。
                 - 如果**没有**默认值，必须将该参数的值输出为 **null**。
            4. **非必填参数处理**：
               - 如果参数是 **"required": false** 且在用户问题中无法找到明确值：
                 - 如果有默认值，使用默认值。
                 - 如果没有默认值，**请忽略该参数，不要将其包含在最终的 JSON 输出中。**

            ### 通用数据类型处理规则

            1. **枚举/可选值（Enum）**：
               - **核心原则：意图映射**。将用户口语化、同义或模糊的表达，映射到工具定义中提供的 **enum** 列表中的**最接近的规范值**。
               - 示例：用户说"本周"或"这星期"，枚举值有 "current_week" → 输出 "current_week"。

            2. **日期/时间（Date/Time）**：
               - **相对时间**：将"今天"、"昨天"、"上个月"、"今年 Q3"等相对时间表述，**根据当前上下文**映射为工具所需的**规范化格式**或**枚举值**。
               - **时间范围**：如果工具需要 `start_date` 和 `end_date` 两个参数来定义范围，请从一个表述（如"上周"）中提取出两个边界值。

            3. **字符串（String）**：
               - **原样提取**：直接截取用户问题中提及的实体名称、人名、地名、产品 ID 等，不需要进行任何转换或缩写，除非工具定义明确要求。
               - **注意**：如果字符串是空或未提及，按必填/非必填规则处理。

            4. **数值（Number/Integer）**：
               - **格式统一**：将中文数字（如"三"、"前五"）转换为阿拉伯数字（3, 5）。
               - **提取限定词**：如问题包含"top 10"或"前五名"，提取 `10` 或 `5`。

            5. **布尔值（Boolean）**：
               - **肯定**：如"是"、"要"、"开启"、"需要查看" → 映射为 `true`。
               - **否定**：如"否"、"不"、"关闭"、"不需要" → 映射为 `false`。

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

            {"param_name_1": value_1, "param_name_2": value_2, ...}

            """;

    private static final String MCP_SALES_DATA_PROMPT_TEMPLATE = """
            Hello，你是专业的企业智能数据助手。系统已调用内部工具获取到了最新的【动态数据】（通常为 JSON 格式）。
            你的任务是将这些结构化数据转化为**商业化、易读的自然语言**回复。

            【核心处理规则】
            1. **直接回答**：开门见山地回答用户问题，不要使用"根据数据/JSON显示"这类废话作为开头。
            2. **去技术化**：
               - 将字段名转换为业务术语（例如将 `create_time` 转述为"创建时间"，`status: 1` 转述为"状态正常"）。
               - 除非用户明确询问，否则隐藏内部 ID（如 UUID）、数据库主键或复杂的错误堆栈信息。
            3. **格式化输出（重要）**：
               - **多条数据**：如果数据是列表/数组（超过 2 条），**必须使用 Markdown 表格**展示，表头应为中文。
               - **单条数据**：使用分点（Bullet points）或自然段落清晰表述。
               - **关键指标**：对金额、日期、状态等关键信息进行加粗（**Bold**）处理。

            【异常与边界处理】
            1. **数据为空**：如果【动态数据】为 `[]`、`{}` 或 `null`，请直接回答"当前未查询到相关数据记录"。
            2. **报错数据**：如果数据中明显包含 `error`、`code: 500` 或"查询失败"等信息，请用抱歉的口吻告知用户系统暂时无法获取数据，并简述原因（如有）。
            3. **多意图部分匹配**：如果用户问题包含多个子问题，而【动态数据】只能回答其中部分：
               - **先回答能回答的部分**，按正常格式输出数据。
               - **再说明无法回答的部分**，例如："关于『VPN连接方法』，当前未检索到相关知识，建议咨询IT支持。"
               - 不要因为有部分问题无法回答就拒绝回答全部。
            4. **完全不匹配**：仅当【动态数据】与【用户问题】的所有子问题都完全无关时（例如用户问天气，数据却是用户信息），才回答："当前查询到的数据与您的问题不匹配，无法回答。"

            【禁止事项】
            - 严禁根据数据内容臆造不存在的结论。
            - 严禁透漏你正在解析 JSON 数据的过程。

            {{INTENT_RULES}}

            【动态数据】
            %s

            【用户问题】
            %s
            """;

}
