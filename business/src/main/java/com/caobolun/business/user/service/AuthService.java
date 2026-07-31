package com.caobolun.business.user.service;

public interface AuthService {

    LoginVO login(LoginRequest requestParam);

    void logout();
}
