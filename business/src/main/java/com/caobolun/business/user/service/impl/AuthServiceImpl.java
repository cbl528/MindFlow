package com.caobolun.business.user.service.impl;

import com.caobolun.business.user.request.LoginRequest;
import com.caobolun.business.user.service.AuthService;
import com.caobolun.business.user.vo.LoginVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    @Override
    public LoginVO login(LoginRequest requestParam) {
        return null;
    }

    @Override
    public void logout() {

    }
}
