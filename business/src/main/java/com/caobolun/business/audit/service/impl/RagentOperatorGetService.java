package com.caobolun.business.audit.service.impl;

import com.caobolun.framework.context.UserContext;
import com.mzt.logapi.beans.Operator;
import com.mzt.logapi.service.IOperatorGetService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class RagentOperatorGetService implements IOperatorGetService {

    private static final String SYSTEM_OPERATOR = "SYSTEM";

    @Override
    public Operator getUser() {
        String userId = UserContext.getUserId();
        if (StringUtils.hasText(userId)) {
            return new Operator(userId);
        }
        String username = UserContext.getUsername();
        return new Operator(StringUtils.hasText(username) ? username : SYSTEM_OPERATOR);
    }
}
