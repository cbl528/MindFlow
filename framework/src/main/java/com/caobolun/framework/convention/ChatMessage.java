package com.caobolun.framework.convention;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    /**
     * 消息角色类型
     */
    public enum Role {
        /**
         * 系统角色，一般用于设定对话规则、身份设定、风格约束等
         */
        SYSTEM,

        /**
         * 用户角色，表示真实用户的提问或输入内容
         */
        USER,

        /**
         * 助手机器人角色，表示大模型返回的回复内容
         */
        ASSISTANT;

        /**
         * 根据字符串值匹配对应的角色枚举
         *
         * @param value 角色字符串值，不区分大小写
         * @return 匹配到的 {@link Role} 枚举值
         * @throws IllegalArgumentException 当传入的字符串无法匹配任何角色时抛出异常
         */
        public static Role fromString(String value) {
            for (Role role : Role.values()) {
                if (role.name().equalsIgnoreCase(value)) {
                    return role;
                }
            }
            throw new IllegalArgumentException("无效的角色类型: " + value);
        }
    }

    /**
     * 消息结束状态
     */
    public enum MessageStatus {
        NORMAL,
        INTERRUPTED,
        REJECTED
    }

    /**
     * 当前消息的角色（系统 / 用户 / 助手）
     */
    private Role role;

    /**
     * 消息的具体文本内容
     */
    private String content;

    /**
     * 深度思考内容（仅 ASSISTANT 角色可能携带）
     */
    private String thinkingContent;

    /**
     * 深度思考耗时（秒，仅 ASSISTANT 角色可能携带）
     */
    private Integer thinkingDuration;

    /**
     * 回答来源（文档级来源列表，仅 ASSISTANT 角色可能携带）
     */
    private List<SourceRef> sources;

    /**
     * 推荐问题 grounding 片段（仅 ASSISTANT 角色可能携带，随消息落库供推荐追问生成 grounding，不参与模型上下文）
     */
    private List<GroundingChunk> retrievedChunks;

    /**
     * 当前助手消息对应的用户消息 ID
     */
    private String replyToMessageId;

    /**
     * 消息结束状态
     */
    private MessageStatus messageStatus = MessageStatus.NORMAL;

    public ChatMessage(Role role, String content) {
        this.role = role;
        this.content = content;
    }

    /**
     * 创建一条系统消息
     *
     * @param content 系统提示词内容
     * @return 封装好的 {@link ChatMessage} 对象，角色为 {@link Role#SYSTEM}
     */
    public static ChatMessage system(String content) {
        return new ChatMessage(Role.SYSTEM, content);
    }

    /**
     * 创建一条用户消息
     *
     * @param content 用户输入内容
     * @return 封装好的 {@link ChatMessage} 对象，角色为 {@link Role#USER}
     */
    public static ChatMessage user(String content) {
        return new ChatMessage(Role.USER, content);
    }

    /**
     * 创建一条助手消息
     *
     * @param content 助手回复内容
     * @return 封装好的 {@link ChatMessage} 对象，角色为 {@link Role#ASSISTANT}
     */
    public static ChatMessage assistant(String content) {
        return new ChatMessage(Role.ASSISTANT, content);
    }

    /**
     * 创建一条带思考内容的助手消息
     *
     * @param content         助手回复内容
     * @param thinkingContent 深度思考内容
     * @return 封装好的 {@link ChatMessage} 对象，角色为 {@link Role#ASSISTANT}
     */
    public static ChatMessage assistant(String content, String thinkingContent) {
        return assistant(content, thinkingContent, null);
    }

    /**
     * 创建一条带思考内容和思考耗时的助手消息
     *
     * @param content          助手回复内容
     * @param thinkingContent  深度思考内容
     * @param thinkingDuration 深度思考耗时（秒）
     * @return 封装好的 {@link ChatMessage} 对象，角色为 {@link Role#ASSISTANT}
     */
    public static ChatMessage assistant(String content, String thinkingContent, Integer thinkingDuration) {
        ChatMessage message = new ChatMessage(Role.ASSISTANT, content);
        message.setThinkingContent(thinkingContent);
        message.setThinkingDuration(thinkingDuration);
        return message;
    }
}