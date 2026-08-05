package com.caobolun.business.user.controller;

import com.caobolun.business.user.request.LoginRequest;
import com.caobolun.business.user.service.AuthService;
import com.caobolun.business.user.vo.LoginVO;
import com.caobolun.framework.convention.Result;
import com.caobolun.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证控制器
 * 处理用户登录和登出相关的请求
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/mindflow/v1/auth")
public class AuthController {

    private final AuthService authService;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result<LoginVO> login(@RequestBody LoginRequest requestParam) {
        return Results.success(authService.login(requestParam));
    }

    /**
     * 用户登出
     */
    @PostMapping("/logout")
    public Result<Void> logout() {
        authService.logout();
        return Results.success();
    }
}
