package com.caobolun.business.rag.core.storage;

import software.amazon.awssdk.core.interceptor.Context;
import software.amazon.awssdk.core.interceptor.ExecutionAttributes;
import software.amazon.awssdk.core.interceptor.ExecutionInterceptor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.http.ContentStreamProvider;
import software.amazon.awssdk.http.SdkHttpFullRequest;
import software.amazon.awssdk.http.SdkHttpRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectsRequest;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * 为 {@link DeleteObjectsRequest}（Multi-Object Delete，POST /?delete）补齐强制要求的 Content-Md5 请求头
 * <p>
 * AWS S3 官方规定 Multi-Object Delete 必须携带 Content-Md5。AWS SDK v2 默认依赖新的 flexible-checksum
 * 体系（x-amz-checksum-crc32），不再自动计算 Content-Md5，真实 S3 接受该替代方案；但 MinIO / 华为 OBS /
 * 腾讯 COS / 自建 S3 网关等兼容存储仍强制校验 Content-Md5，缺失即返回 400
 * "Missing required header for this request: Content-Md5"。
 * <p>
 * 该 400 属持久性客户端错误，SDK 重试与 RocketMQ 消费重试均无法自愈，表现为删除知识库时持续报错。
 * 本拦截器在 marshall 之后（{@code modifyHttpRequest}）读取序列化请求体 XML，计算 MD5 并回填
 * Content-Md5；同时将 body 替换为可重复读的字节流（签名/发送阶段需再次读取），从根本上消除该 400。
 * <p>
 * 线程安全：拦截器无实例状态，随 {@code S3Client} 全局注册一次即可
 */
public class DeleteObjectsContentMd5Interceptor implements ExecutionInterceptor {

    @Override
    public SdkHttpRequest modifyHttpRequest(Context.ModifyHttpRequest context, ExecutionAttributes executionAttributes) {
        // 只处理批量删除；单对象 deleteObject（DELETE 无请求体）不需要 Content-Md5
        if (!(context.request() instanceof DeleteObjectsRequest)) {
            return context.httpRequest();
        }
        if (!(context.httpRequest() instanceof SdkHttpFullRequest fullRequest)) {
            return context.httpRequest();
        }

        ContentStreamProvider bodyProvider = fullRequest.contentStreamProvider().orElse(null);
        if (bodyProvider == null) {
            return fullRequest;
        }

        byte[] bodyBytes = readAll(bodyProvider.newStream());
        String contentMd5 = Base64.getEncoder().encodeToString(md5(bodyBytes));

        return fullRequest.toBuilder()
                .putHeader("Content-Md5", contentMd5)
                .contentStreamProvider(RequestBody.fromBytes(bodyBytes).contentStreamProvider())
                .build();
    }

    private static byte[] md5(byte[] data) {
        try {
            return MessageDigest.getInstance("MD5").digest(data);
        } catch (NoSuchAlgorithmException e) {
            // JDK 必然提供 MD5，此处仅防御性兜底
            throw new IllegalStateException("MD5 MessageDigest 不可用", e);
        }
    }

    private static byte[] readAll(InputStream in) {
        try (in) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new RuntimeException("读取 DeleteObjects 请求体失败", e);
        }
    }
}
