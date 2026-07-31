package com.caobolun.business.user.controller;

import com.caobolun.business.user.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证控制器
 * 处理用户登录和登出相关的请求
 */
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;


}
