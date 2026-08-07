package com.caobolun.business.user.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserBatchRequest {

    /**
     * 用户 ID 列表
     */
    private List<String> ids;
}
