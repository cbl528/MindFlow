package com.caobolun.business.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.caobolun.business.user.entity.UserDO;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<UserDO> {
}