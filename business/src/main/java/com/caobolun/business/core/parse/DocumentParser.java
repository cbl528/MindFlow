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

package com.caobolun.business.core.parse;


import com.caobolun.business.core.parse.model.ParsedDocument;
import com.caobolun.business.core.parse.registry.ParseProfile;

import java.util.Map;
import java.util.Set;

/**
 * 文档解析器统一接口
 * <p>
 * 提供文档解析的通用能力，支持多种文档格式（PDF、Word、Excel、Markdown 等）
 * 可用于知识库导入、RAG 检索等场景。
 * <p>
 * <b>v1.1（多模态解析改造）</b>：核心接口为 {@link #parseStructured}，
 * 返回结构化 {@link ParsedDocument}（含 Block 列表）
 */
public interface DocumentParser {

    /**
     * 获取解析器类型标识
     *
     * @return 解析器类型（如 {@link ParserType#TIKA}、{@link ParserType#MARKDOWN}）
     */
    String getParserType();

    /**
     * 结构化解析：返回有序的 Block 列表（章节、段落、表格、图片等）
     * <p>
     * 所有 DocumentParser 必须实现本方法。Tika/Markdown 等老解析器可输出简化的
     * ParagraphBlock 列表作为过渡（M6 阶段升级为真正的 block 化解析）
     *
     * @param content  文档的二进制字节数组
     * @param mimeType 文档的 MIME 类型（可选）
     * @param options  解析选项（可选）
     * @return 结构化解析结果
     */
    ParsedDocument parseStructured(byte[] content, String mimeType, Map<String, Object> options);

    /**
     * 认领清单：档位 → 该档位下认领的 MIME 集合，不得为空
     * <p>
     * MIME 一律小写；支持 {@code type/*} 通配，精确键优先于通配键；未在请求档位注册时回落到全局
     * 兜底档 {@link ParseProfile#FAST}，故只在该档位有专属解析器时才需声明，如 Excel 的 FAST 档
     * 走 POI 快速 key-val、FIDELITY 档才交给 MinerU 做版面解析
     */
    Map<ParseProfile, Set<String>> supportedMimeTypes();
}
