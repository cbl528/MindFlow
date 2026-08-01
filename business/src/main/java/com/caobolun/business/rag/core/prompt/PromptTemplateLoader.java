package com.caobolun.business.rag.core.prompt;

import cn.hutool.core.util.StrUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.checkerframework.checker.units.qual.C;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 提示模板加载器
 * 负责从类路径下加载提示模板文件，并支持模板变量填充功能
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PromptTemplateLoader {

    private final ResourceLoader resourceLoader;
    private final Map<String, String> cache = new ConcurrentHashMap<>();
    private final Map<String, Map<String, String>> sectionCache = new ConcurrentHashMap<>();

    /**
     * 加载指定路径的提示模板
     *
     * @param path 模板文件路径，支持classpath:前缀
     * @return 模板内容字符串
     * @throws IllegalArgumentException 当路径为空时抛出
     * @throws IllegalStateException    当模板文件不存在或读取失败时抛出
     */
    public String load(String path) {
        if(StrUtil.isBlank(path)){
            throw new IllegalArgumentException("提示词模板为空");
        }
        return cache.computeIfAbsent(path, this::readResource);
    }

    /**
     * 渲染提示模板，将模板中的占位符替换为实际值
     *
     * @param path  模板文件路径
     * @param slots 占位符映射表，键为占位符名称，值为替换内容
     * @return 渲染后的完整提示文本
     */
    public String render(String path, Map<String, String> slots) {
        String template = load(path);
        String filled = PromptTemplateUtils.fillSlots(template, slots);
        return PromptTemplateUtils.cleanupPrompt(filled);
    }

}