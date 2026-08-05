package com.caobolun.business.rag.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.caobolun.business.rag.request.SampleQuestionCreateRequest;
import com.caobolun.business.rag.request.SampleQuestionPageRequest;
import com.caobolun.business.rag.request.SampleQuestionUpdateRequest;
import com.caobolun.business.rag.service.SampleQuestionService;
import com.caobolun.business.rag.vo.SampleQuestionVO;
import com.caobolun.framework.convention.Result;
import com.caobolun.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 示例问题控制器（欢迎页展示）
 */
@RestController
@RequiredArgsConstructor
public class SampleQuestionController {

    private final SampleQuestionService sampleQuestionService;

    /**
     * 随机获取示例问题列表
     */
    @GetMapping("/mindflow/v1/rag/sample-questions")
    public Result<List<SampleQuestionVO>> listSampleQuestions() {
        return Results.success(sampleQuestionService.listRandomQuestions());
    }

    /**
     * 分页查询示例问题列表
     */
    @GetMapping("/mindflow/v1/rag/sample-questions")
    public Result<IPage<SampleQuestionVO>> pageQuery(SampleQuestionPageRequest requestParam) {
        return Results.success(sampleQuestionService.pageQuery(requestParam));
    }

    /**
     * 查询示例问题详情
     */
    @GetMapping("/mindflow/v1/rag/sample-questions/{id}")
    public Result<SampleQuestionVO> queryById(@PathVariable String id) {
        return Results.success(sampleQuestionService.queryById(id));
    }

    /**
     * 创建示例问题
     */
    @PostMapping("/mindflow/v1/rag/sample-questions")
    public Result<String> create(@RequestBody SampleQuestionCreateRequest requestParam) {
        return Results.success(sampleQuestionService.create(requestParam));
    }

    /**
     * 更新示例问题
     */
    @PutMapping("/mindflow/v1/rag/sample-questions/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody SampleQuestionUpdateRequest requestParam) {
        sampleQuestionService.update(id, requestParam);
        return Results.success();
    }

    /**
     * 删除示例问题
     */
    @DeleteMapping("/mindflow/v1/rag/sample-questions/{id}")
    public Result<Void> delete(@PathVariable String id) {
        sampleQuestionService.delete(id);
        return Results.success();
    }
}