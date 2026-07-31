package com.caobolun.business.user.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.caobolun.business.user.request.ChangePasswordRequest;
import com.caobolun.business.user.request.UserCreateRequest;
import com.caobolun.business.user.request.UserPageRequest;
import com.caobolun.business.user.request.UserUpdateRequest;
import com.caobolun.business.user.service.UserService;
import com.caobolun.business.user.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    @Override
    public IPage<UserVO> pageQuery(UserPageRequest requestParam) {
        return null;
    }

    @Override
    public String create(UserCreateRequest requestParam) {
        return "";
    }

    @Override
    public void update(String id, UserUpdateRequest requestParam) {

    }

    @Override
    public void delete(String id) {

    }

    @Override
    public void changePassword(ChangePasswordRequest requestParam) {

    }
}
