import { request } from './api'
import type { ConversationMessageVO, ConversationVO } from '@/types'

/**
 * 会话相关接口
 * 对应后端 ConversationController（统一 /mindflow 前缀）：
 * - GET    /mindflow/conversations                    会话列表
 * - PUT    /mindflow/conversations/{conversationId}   重命名
 * - DELETE /mindflow/conversations/{conversationId}   删除
 * - GET    /mindflow/conversations/{conversationId}/messages  会话消息列表（升序）
 */

/** 获取当前用户的会话列表 */
export function listConversations() {
  return request<ConversationVO[]>({ url: '/mindflow/conversations', method: 'get' })
}

/** 重命名会话 */
export function renameConversation(conversationId: string, title: string) {
  return request<void>({ url: `/mindflow/conversations/${conversationId}`, method: 'put', data: { title } })
}

/** 删除会话 */
export function deleteConversation(conversationId: string) {
  return request<void>({ url: `/mindflow/conversations/${conversationId}`, method: 'delete' })
}

/** 获取会话消息列表（按时间升序） */
export function listConversationMessages(conversationId: string) {
  return request<ConversationMessageVO[]>({
    url: `/mindflow/conversations/${conversationId}/messages`,
    method: 'get',
  })
}
