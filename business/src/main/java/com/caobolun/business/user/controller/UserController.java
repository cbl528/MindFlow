package com.caobolun.business.user.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.caobolun.business.user.request.ChangePasswordRequest;
import com.caobolun.business.user.request.UserCreateRequest;
import com.caobolun.business.user.request.UserPageRequest;
import com.caobolun.business.user.request.UserUpdateRequest;
import com.caobolun.business.user.service.UserService;
import com.caobolun.business.user.vo.CurrentUserVO;
import com.caobolun.business.user.vo.UserVO;
import com.caobolun.framework.context.LoginUser;
import com.caobolun.framework.context.UserContext;
import com.caobolun.framework.convention.Result;
import com.caobolun.framework.web.Results;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器
 * 提供当前登录用户信息查询接口
 */
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 获取当前登录用户信息
     */
    @GetMapping("/mindflow/v1/user/me")
    public Result<CurrentUserVO> currentUser() {
        LoginUser user = UserContext.requireUser();
        return Results.success(new CurrentUserVO(
                user.getUserId(),
                user.getUsername(),
                user.getRole(),
                user.getAvatar()
        ));
    }

    /**
     * 分页查询用户列表
     */
    @GetMapping("/mindflow/v1/user")
    public Result<IPage<UserVO>> pageQuery(UserPageRequest requestParam) {
        StpUtil.checkRole("admin");
        return Results.success(userService.pageQuery(requestParam));
    }

    /**
     * 创建用户
     */
    @PostMapping("/mindflow/v1/user")
    public Result<String> create(@RequestBody UserCreateRequest requestParam) {
        StpUtil.checkRole("admin");
        return Results.success(userService.create(requestParam));
    }

    /**
     * 更新用户
     */
    @PutMapping("/mindflow/v1/user/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody UserUpdateRequest requestParam) {
        StpUtil.checkRole("admin");
        userService.update(id, requestParam);
        return Results.success();
    }

    /**
     * 删除用户
     */
    @DeleteMapping("/mindflow/v1/user/{id}")
    public Result<Void> delete(@PathVariable String id) {
        StpUtil.checkRole("admin");
        userService.delete(id);
        return Results.success();
    }

    /**
     * 修改当前用户密码
     */
    @PutMapping("/mindflow/v1/user/password")
    public Result<Void> changePassword(@RequestBody ChangePasswordRequest requestParam) {
        userService.changePassword(requestParam);
        return Results.success();
    }

}
