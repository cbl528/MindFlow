package com.caobolun.business.audit.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.caobolun.business.audit.request.BizChangeLogPageRequest;
import com.caobolun.business.audit.vo.BizChangeLogVO;

public interface BizChangeLogService {

    IPage<BizChangeLogVO> page(BizChangeLogPageRequest requestParam);

    BizChangeLogVO get(String id);
}
