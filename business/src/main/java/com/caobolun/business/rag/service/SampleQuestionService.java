package com.caobolun.business.rag.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.caobolun.business.rag.request.SampleQuestionCreateRequest;
import com.caobolun.business.rag.request.SampleQuestionPageRequest;
import com.caobolun.business.rag.request.SampleQuestionUpdateRequest;
import com.caobolun.business.rag.vo.SampleQuestionVO;

import java.util.List;

public interface SampleQuestionService {

    /**
     * 创建示例问题
     */
    String create(SampleQuestionCreateRequest requestParam);

    /**
     * 更新示例问题
     */
    void update(String id, SampleQuestionUpdateRequest requestParam);

    /**
     * 删除示例问题
     */
    void delete(String id);

    /**
     * 查询示例问题详情
     */
    SampleQuestionVO queryById(String id);

    /**
     * 分页查询示例问题列表
     */
    IPage<SampleQuestionVO> pageQuery(SampleQuestionPageRequest requestParam);

    /**
     * 随机获取示例问题列表
     */
    List<SampleQuestionVO> listRandomQuestions();
}
