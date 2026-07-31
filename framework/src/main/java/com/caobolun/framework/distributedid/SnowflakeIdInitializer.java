package com.caobolun.framework.distributedid;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.lang.Singleton;
import cn.hutool.core.lang.Snowflake;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scripting.support.ResourceScriptSource;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * 分布式 Snowflake 初始化器
 * 从 Redis 获取 workerId 和 datacenterId，并注册到 Hutool 的 IdUtil 中
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SnowflakeIdInitializer {

    private final StringRedisTemplate stringRedisTemplate;

    @SuppressWarnings({"rawtypes", "unchecked"})
    @PostConstruct
    public void init() {
        // 加载Lua脚本
        DefaultRedisScript<List> script = new DefaultRedisScript<>();
        script.setScriptSource(new ResourceScriptSource(new ClassPathResource("lua/snowflake_init.lua")));
        script.setResultType(List.class);

        /**
         * if hash不存在:
         *     return (0,0)
         * dc, wid = 当前存储的值
         * if dc==31 and wid==31:
         *     重置 dc=0,wid=0
         *     return (0,0)
         * elif wid <31:
         *     wid +=1
         *     return (wid, dc)
         * elif dc <31:
         *     dc +=1
         *     wid =0
         *     return (0, dc)
         */

        try {
            // 执行 Lua 脚本获取 workerId 和 datacenterId
            List<Long> result = stringRedisTemplate.execute(script, Collections.emptyList());

            if (CollUtil.isEmpty(result) || result.size() != 2) {
                throw new RuntimeException("从Redis获取WorkerId和DataCenterId失败");
            }

            Long workerId = result.get(0);
            Long datacenterId = result.get(1);

            // 注册到 Hutool 的 IdUtil
            Snowflake snowflake = new Snowflake(workerId, datacenterId);
            Singleton.put(snowflake);

            log.info("分布式Snowflake初始化完成, workerId: {}, datacenterId: {}", workerId, datacenterId);
        } catch (Exception e) {
            throw new RuntimeException("分布式Snowflake初始化失败", e);
        }
    }
}