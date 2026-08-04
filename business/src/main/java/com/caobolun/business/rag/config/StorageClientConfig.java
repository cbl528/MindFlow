package com.caobolun.business.rag.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * 对象存储客户端配置
 * <p>
 * MinIO 为 S3 兼容存储，直接用 AWS SDK 的 {@link S3Client} + {@link S3Presigner} 指向 MinIO 端点，
 * 由 {@code rag.storage.type=s3}（默认）激活。阿里云 OSS 路径未移植
 */
@Configuration
public class StorageClientConfig {

    @Bean
    @ConditionalOnProperty(name = "rag.storage.type", havingValue = "s3", matchIfMissing = true)
    public S3Client s3Client(RagStorageProperties properties) {
        RagStorageProperties.S3 s3 = properties.getS3();
        return S3Client.builder()
                .endpointOverride(URI.create(s3.getEndpoint()))
                .region(Region.of(s3.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(s3.getAccessKey(), s3.getSecretKey())))
                .forcePathStyle(s3.isPathStyle())
                .build();
    }

    /**
     * S3 预签名器：签名在 URL query 参数中完成，配合 HttpURLConnection 实现零堆内存的流式上传
     */
    @Bean
    @ConditionalOnProperty(name = "rag.storage.type", havingValue = "s3", matchIfMissing = true)
    public S3Presigner s3Presigner(RagStorageProperties properties) {
        RagStorageProperties.S3 s3 = properties.getS3();
        return S3Presigner.builder()
                .endpointOverride(URI.create(s3.getEndpoint()))
                .region(Region.of(s3.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(s3.getAccessKey(), s3.getSecretKey())))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(s3.isPathStyle())
                        .build())
                .build();
    }
}
