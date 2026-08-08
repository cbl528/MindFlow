import { request } from './api'
import type { ConversationMessageVO, ConversationVO } from '@/types'

/**
 * 会话相关接口
 * 对应后端 ConversationController：
 * - GET    /conversations                    会话列表
 * - PUT    /conversations/{conversationId}   重命名
 * - DELETE /conversations/{conversationId}   删除
 * - GET    /conversations/{conversationId}/messages  会话消息列表（升序）
 */

/** 获取当前用户的会话列表 */
export function listConversations() {
  return request<ConversationVO[]>({ url: '/conversations', method: 'get' })
}

/** 重命名会话 */
export function renameConversation(conversationId: string, title: string) {
  return request<void>({ url: `/conversations/${conversationId}`, method: 'put', data: { title } })
}

/** 删除会话 */
export function deleteConversation(conversationId: string) {
  return request<void>({ url: `/conversations/${conversationId}`, method: 'delete' })
}

/** 获取会话消息列表（按时间升序） */
export function listConversationMessages(conversationId: string) {
  return request<ConversationMessageVO[]>({
    url: `/conversations/${conversationId}/messages`,
    method: 'get',
  })
}
