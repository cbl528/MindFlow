import { request } from './api'
import { USE_BACKEND } from '@/config'
import { delay, seed } from '@/data/seed'
import type { IntentNodeTreeVO } from '@/types'

export interface IntentNodePayload {
  kbId?: string
  collectionName?: string
  collectionNames?: string[]
  intentCode?: string
  name: string
  level?: number
  parentCode?: string
  description?: string
  examples?: string[]
  mcpToolId?: string
  topK?: number
  kind?: number
  sortOrder?: number
  enabled?: boolean
  promptSnippet?: string
  promptTemplate?: string
  paramPromptTemplate?: string
}

// 对应后端 IntentTreeController，统一 /mindflow/intent-tree 前缀（部分端点返回裸 204）
export const intentService = {
  async trees() {
    if (!USE_BACKEND) {
      await delay(300)
      return seed.intentTree
    }
    return request<IntentNodeTreeVO[]>({ url: '/mindflow/intent-tree/trees', method: 'get' })
  },
  async create(data: IntentNodePayload) {
    if (!USE_BACKEND) {
      await delay(300)
      return `demo-intent-${Date.now()}`
    }
    return request<string>({ url: '/mindflow/intent-tree', method: 'post', data })
  },
  async update(id: string, data: IntentNodePayload) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/intent-tree/${id}`, method: 'put', data })
  },
  async remove(id: string) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: `/mindflow/intent-tree/${id}`, method: 'delete' })
  },
  async batchEnable(ids: string[]) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: '/mindflow/intent-tree/batch/enable', method: 'post', data: { ids } })
  },
  async batchDisable(ids: string[]) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: '/mindflow/intent-tree/batch/disable', method: 'post', data: { ids } })
  },
  async batchDelete(ids: string[]) {
    if (!USE_BACKEND) {
      await delay(300)
      return undefined
    }
    return request<void>({ url: '/mindflow/intent-tree/batch/delete', method: 'post', data: { ids } })
  },
}
