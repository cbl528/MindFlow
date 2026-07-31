package com.caobolun.business.user.service;

import com.caobolun.business.user.request.LoginRequest;
import com.caobolun.business.user.vo.LoginVO;

public interface AuthService {

    LoginVO login(LoginRequest requestParam);

    void logout();
}
