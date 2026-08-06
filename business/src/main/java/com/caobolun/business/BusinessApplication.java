package com.caobolun.business;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {
        "com.caobolun.business",
        "com.caobolun.framework",
        "com.caobolun.infraai"
})
@MapperScan(basePackages = {
        "com.caobolun.business.rag.mapper",
        "com.caobolun.business.knowledge.mapper",
        "com.caobolun.business.audit.mapper",
        "com.caobolun.business.ingestion.mapper",
        "com.caobolun.business.user.mapper"
})
public class BusinessApplication {

    public static void main(String[] args) {
        SpringApplication.run(BusinessApplication.class, args);
        System.out.println("业务模块启动成功");
    }

}
