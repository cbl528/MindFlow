package com.caobolun.business.rag.config;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.util.Arrays;

/**
 * Elasticsearch 客户端配置
 * <p>
 * 仅当 rag.keyword.type=es 且 classpath 存在 ES 客户端时才装配，
 * 是「关键词模态」可插拔三层条件门中的依赖层 + 配置层
 */
@Slf4j
@Configuration
@ConditionalOnClass(ElasticsearchClient.class)
@ConditionalOnProperty(name = "rag.keyword.type", havingValue = "es")
public class EsClientConfig {

    @Bean
    public ElasticsearchClient elasticsearchClient(KeywordProperties keywordProperties) {
        String uris = keywordProperties.getEs().getUris();
        HttpHost[] hosts = Arrays.stream(StringUtils.commaDelimitedListToStringArray(uris))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .map(HttpHost::create)
                .toArray(HttpHost[]::new);

        RestClient restClient = RestClient.builder(hosts).build();
        RestClientTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
        log.info("Elasticsearch 关键词检索客户端已初始化, uris={}", uris);
        return new ElasticsearchClient(transport);
    }
}